/* Current Home.astro gallery and scene editor. Local source media only. */
(() => {
  function pauseHomeMediaExcept(keep) {
    for (const video of document.querySelectorAll("[data-managed-media]"))
      if (video !== keep) video.pause();
  }
  const root = document.querySelector(".home-revamp");
  if (root) {
    const scenes = Array.from(root.querySelectorAll("[data-scene]"));
    const panels = Array.from(root.querySelectorAll("[data-edit-panel]"));
    const kept = root.querySelector("[data-kept]");
    const keptHost = root.querySelector("#editor-kept");
    const formatKept = (active) => {
      const nums = [1, 2, 3, 4]
        .filter((n) => n !== active + 1)
        .map((n) => String(n).padStart(2, "0"));
      const andWord = keptHost?.dataset.andWord ?? "";
      const sceneWord = keptHost?.dataset.sceneWord ?? "";
      const list = andWord
        ? `${nums.slice(0, -1).join(", ")} ${andWord} ${nums[nums.length - 1]}`
        : nums.join(", ");
      return sceneWord ? `${sceneWord} ${list}` : list;
    };
    scenes.forEach((button, index) =>
      button.addEventListener("click", () => {
        scenes.forEach((scene, i) =>
          scene.setAttribute("aria-pressed", String(i === index)),
        );
        panels.forEach((panel, i) => {
          panel.hidden = i !== index;
        });
        if (kept) kept.textContent = formatKept(index);
      }),
    );
    scenes.forEach((button, index) =>
      button.addEventListener("keydown", (event) => {
        const rtl = document.documentElement.dir === "rtl";
        let destination;
        if (event.key === "Home") destination = 0;
        if (event.key === "End") destination = scenes.length - 1;
        if (event.key === "ArrowRight")
          destination =
            (index + (rtl ? -1 : 1) + scenes.length) % scenes.length;
        if (event.key === "ArrowLeft")
          destination =
            (index + (rtl ? 1 : -1) + scenes.length) % scenes.length;
        if (destination !== void 0) {
          event.preventDefault();
          scenes[destination]?.focus();
          scenes[destination]?.click();
        }
      }),
    );
    const track = root.querySelector(".home-gallery-track");
    const prev = root.querySelector("[data-gallery-prev]");
    const next = root.querySelector("[data-gallery-next]");
    if (track && prev && next) {
      const clips = Array.from(track.querySelectorAll("[data-gallery-card]"));
      let index = 0;
      track.parentElement?.setAttribute("data-gallery-enhanced", "true");
      const clock = (seconds) => {
        const value = Number.isFinite(seconds)
          ? Math.max(0, Math.floor(seconds))
          : 0;
        return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
      };
      const paintClip = (clip) => {
        const video = clip.querySelector("video");
        const play = clip.querySelector("[data-media-play]");
        const sound = clip.querySelector("[data-media-sound]");
        const time = clip.querySelector("[data-media-time]");
        const done = clip.querySelector("[data-media-done]");
        const knob = clip.querySelector("[data-media-knob]");
        const seek = clip.querySelector("[data-media-seek]");
        if (!video || !play || !sound || !time || !done || !knob || !seek)
          return;
        const playing = !video.paused && !video.ended;
        clip.classList.toggle("is-playing", playing);
        play.setAttribute(
          "aria-label",
          playing
            ? (clip.dataset.labelPause ?? "Pause")
            : (clip.dataset.labelPlay ?? "Play"),
        );
        play.innerHTML = playing
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5v13M15 5.5v13" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>'
          : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 L18.5 12 L8 18.5 Z" fill="currentColor"/></svg>';
        sound.setAttribute("aria-pressed", String(!video.muted));
        sound.setAttribute(
          "aria-label",
          video.muted
            ? (clip.dataset.labelSoundOn ?? "Unmute")
            : (clip.dataset.labelSoundOff ?? "Mute"),
        );
        const duration = Number.isFinite(video.duration) ? video.duration : 0;
        const ratio = duration > 0 ? video.currentTime / duration : 0;
        done.style.width = `${ratio * 100}%`;
        knob.style.left = `${ratio * 100}%`;
        seek.setAttribute("aria-valuenow", String(Math.round(ratio * 100)));
        time.textContent =
          duration > 0
            ? `${clock(video.currentTime)} / ${clock(duration)}`
            : clock(video.currentTime);
      };
      const paint = () => {
        clips.forEach((clip, i) => {
          const active = i === index;
          clip.classList.toggle("is-active", active);
          clip
            .querySelectorAll("button, [data-media-seek], video")
            .forEach((control) => {
              if (active) control.removeAttribute("tabindex");
              else control.tabIndex = -1;
            });
          if (!active) {
            clip.classList.remove("is-playing");
            const video = clip.querySelector("video");
            video?.pause();
          }
        });
        prev.hidden = index === 0;
        next.hidden = index === clips.length - 1;
      };
      const select = (value, scroll = true) => {
        const selected = Math.max(0, Math.min(clips.length - 1, value));
        if (selected !== index) pauseHomeMediaExcept();
        index = selected;
        paint();
        if (scroll)
          clips[index]?.scrollIntoView({
            block: "nearest",
            inline: "center",
            behavior: matchMedia("(prefers-reduced-motion: reduce)").matches
              ? "instant"
              : "smooth",
          });
      };
      const playClip = async (clip) => {
        const video = clip.querySelector("video");
        if (!video) return;
        pauseHomeMediaExcept(video);
        video.controls = false;
        try {
          await video.play();
        } catch {}
        paintClip(clip);
      };
      clips.forEach((clip) => {
        const video = clip.querySelector("video");
        const controls = clip.querySelector("[data-clip-controls]");
        if (video) video.controls = false;
        if (controls) controls.hidden = false;
        clip
          .querySelector("[data-media-play]")
          ?.addEventListener("click", () => {
            const current = clip.querySelector("video");
            if (!current) return;
            if (current.paused || current.ended) void playClip(clip);
            else current.pause();
          });
        clip
          .querySelector("[data-media-sound]")
          ?.addEventListener("click", () => {
            const current = clip.querySelector("video");
            if (!current) return;
            current.muted = !current.muted;
            paintClip(clip);
          });
        clip
          .querySelector("[data-media-fullscreen]")
          ?.addEventListener("click", (event) => {
            event.stopPropagation();
            const opener = event.currentTarget;
            if (opener instanceof HTMLElement) void openLightbox(clip, opener);
          });
        const seek = clip.querySelector("[data-media-seek]");
        const seekTo = (clientX) => {
          const current = clip.querySelector("video");
          if (
            !current ||
            !seek ||
            !Number.isFinite(current.duration) ||
            current.duration <= 0
          )
            return;
          const rect = seek.getBoundingClientRect();
          current.currentTime =
            Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) *
            current.duration;
          paintClip(clip);
        };
        seek?.addEventListener("pointerdown", (event) => {
          seek.setPointerCapture(event.pointerId);
          seekTo(event.clientX);
        });
        seek?.addEventListener("pointermove", (event) => {
          if (seek.hasPointerCapture(event.pointerId)) seekTo(event.clientX);
        });
        video?.addEventListener("play", () => paintClip(clip));
        video?.addEventListener("pause", () => paintClip(clip));
        video?.addEventListener("ended", () => paintClip(clip));
        video?.addEventListener("timeupdate", () => paintClip(clip));
        video?.addEventListener("loadedmetadata", () => paintClip(clip));
      });
      const lightbox = root.querySelector("#home-player-lightbox");
      const lightboxVideo = lightbox?.querySelector("[data-lightbox-video]");
      const lightboxTitle = lightbox?.querySelector("#home-lightbox-title");
      const lightboxNote = lightbox?.querySelector("[data-lightbox-note]");
      const lightboxPlay = lightbox?.querySelector("[data-lightbox-play]");
      const lightboxSound = lightbox?.querySelector("[data-lightbox-sound]");
      const lightboxTime = lightbox?.querySelector("[data-lightbox-time]");
      const lightboxDone = lightbox?.querySelector("[data-lightbox-done]");
      const lightboxKnob = lightbox?.querySelector("[data-lightbox-knob]");
      const lightboxSeek = lightbox?.querySelector("[data-lightbox-seek]");
      let lightboxSource = null;
      let lightboxOpener = null;
      let resumeCard = false;
      const paintLightbox = () => {
        if (
          !lightboxVideo ||
          !lightboxPlay ||
          !lightboxSound ||
          !lightboxTime ||
          !lightboxDone ||
          !lightboxKnob ||
          !lightboxSeek
        )
          return;
        const playing = !lightboxVideo.paused && !lightboxVideo.ended;
        lightboxPlay.setAttribute("aria-label", playing ? "Pause" : "Play");
        lightboxPlay.innerHTML = playing
          ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5v13M15 5.5v13" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/></svg>'
          : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5 L18.5 12 L8 18.5 Z" fill="currentColor"/></svg>';
        lightboxSound.setAttribute(
          "aria-pressed",
          String(!lightboxVideo.muted),
        );
        lightboxSound.setAttribute(
          "aria-label",
          lightboxVideo.muted ? "Sound on" : "Sound off",
        );
        const duration = Number.isFinite(lightboxVideo.duration)
          ? lightboxVideo.duration
          : 0;
        const ratio = duration > 0 ? lightboxVideo.currentTime / duration : 0;
        lightboxDone.style.width = `${ratio * 100}%`;
        lightboxKnob.style.left = `${ratio * 100}%`;
        lightboxSeek.setAttribute(
          "aria-valuenow",
          String(Math.round(ratio * 100)),
        );
        lightboxTime.textContent =
          duration > 0
            ? `${clock(lightboxVideo.currentTime)} / ${clock(duration)}`
            : clock(lightboxVideo.currentTime);
      };
      const openLightbox = (clip, opener) => {
        const source = clip.querySelector("video");
        if (!lightbox || !lightboxVideo || !source) return;
        lightboxSource = source;
        lightboxOpener = opener;
        resumeCard = !source.paused && !source.ended;
        if (lightboxTitle)
          lightboxTitle.textContent =
            clip.querySelector(".home-player-title")?.textContent?.trim() ?? "";
        if (lightboxNote)
          lightboxNote.textContent =
            clip.querySelector("figcaption")?.textContent?.trim() ?? "";
        const time = source.currentTime;
        lightboxVideo.muted = source.muted;
        source.pause();
        lightboxVideo.src =
          source.currentSrc || source.getAttribute("src") || "";
        lightbox.hidden = false;
        document.body.classList.add("home-lightbox-open");
        const start = () => {
          if (Number.isFinite(time) && time > 0)
            lightboxVideo.currentTime = time;
          void lightboxVideo.play().catch(() => {});
          paintLightbox();
        };
        if (lightboxVideo.readyState >= 1) start();
        else
          lightboxVideo.addEventListener("loadedmetadata", start, {
            once: true,
          });
        lightbox.querySelector(".home-lightbox-close")?.focus();
      };
      const closeLightbox = () => {
        if (!lightbox || lightbox.hidden || !lightboxVideo) return;
        const time = lightboxVideo.currentTime;
        const muted = lightboxVideo.muted;
        lightboxVideo.pause();
        lightbox.hidden = true;
        document.body.classList.remove("home-lightbox-open");
        if (lightboxSource) {
          lightboxSource.muted = muted;
          if (resumeCard && Number.isFinite(time))
            lightboxSource.currentTime = time;
          const clip = lightboxSource.closest("[data-gallery-card]");
          if (resumeCard) void lightboxSource.play().catch(() => {});
          if (clip) paintClip(clip);
        }
        resumeCard = false;
        lightboxVideo.removeAttribute("src");
        lightboxVideo.load();
        lightboxOpener?.focus();
        lightboxSource = null;
        lightboxOpener = null;
      };
      lightbox?.querySelectorAll("[data-lightbox-close]").forEach((button) => {
        button.addEventListener("click", closeLightbox);
      });
      lightboxPlay?.addEventListener("click", () => {
        if (!lightboxVideo) return;
        if (lightboxVideo.paused || lightboxVideo.ended)
          void lightboxVideo.play().catch(() => {});
        else lightboxVideo.pause();
      });
      lightboxSound?.addEventListener("click", () => {
        if (!lightboxVideo) return;
        lightboxVideo.muted = !lightboxVideo.muted;
        paintLightbox();
      });
      lightbox
        ?.querySelector("[data-lightbox-fullscreen]")
        ?.addEventListener("click", () => {
          if (!lightboxVideo) return;
          const native = lightboxVideo;
          if (document.fullscreenElement) void document.exitFullscreen();
          else if (lightboxVideo.requestFullscreen)
            void lightboxVideo.requestFullscreen();
          else native.webkitEnterFullscreen?.();
        });
      const seekLightbox = (clientX) => {
        if (
          !lightboxVideo ||
          !lightboxSeek ||
          !Number.isFinite(lightboxVideo.duration) ||
          lightboxVideo.duration <= 0
        )
          return;
        const rect = lightboxSeek.getBoundingClientRect();
        lightboxVideo.currentTime =
          Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) *
          lightboxVideo.duration;
        paintLightbox();
      };
      lightboxSeek?.addEventListener("pointerdown", (event) => {
        lightboxSeek.setPointerCapture(event.pointerId);
        seekLightbox(event.clientX);
      });
      lightboxSeek?.addEventListener("pointermove", (event) => {
        if (lightboxSeek.hasPointerCapture(event.pointerId))
          seekLightbox(event.clientX);
      });
      lightboxVideo?.addEventListener("play", paintLightbox);
      lightboxVideo?.addEventListener("pause", paintLightbox);
      lightboxVideo?.addEventListener("timeupdate", paintLightbox);
      lightboxVideo?.addEventListener("loadedmetadata", paintLightbox);
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && lightbox && !lightbox.hidden) {
          event.preventDefault();
          closeLightbox();
        } else if (
          event.key === "Escape" &&
          document.fullscreenElement instanceof HTMLVideoElement
        ) {
          void document.exitFullscreen();
        }
      });
      document.addEventListener("fullscreenchange", () => {
        clips.forEach((clip) => {
          const current = clip.querySelector("video");
          clip
            .querySelector("[data-media-fullscreen]")
            ?.setAttribute(
              "aria-pressed",
              String(document.fullscreenElement === current),
            );
        });
      });
      prev.addEventListener("click", () => select(index - 1));
      next.addEventListener("click", () => select(index + 1));
      clips.forEach((clip, i) =>
        clip
          .querySelector("[data-gallery-select]")
          ?.addEventListener("click", (event) => {
            if (i !== index) {
              select(i);
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            const opener = event.currentTarget;
            if (opener instanceof HTMLElement) openLightbox(clip, opener);
          }),
      );
      track.addEventListener("keydown", (event) => {
        if (event.target !== track) return;
        const rtl = document.documentElement.dir === "rtl";
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          select(index + ((event.key === "ArrowRight") !== rtl ? 1 : -1));
        }
      });
      let settle;
      const syncScroll = () => {
        const center =
          track.getBoundingClientRect().left + track.clientWidth / 2;
        const nearest = clips.reduce((best, clip, i) => {
          const rect = clip.getBoundingClientRect();
          const bestRect = clips[best].getBoundingClientRect();
          return Math.abs(rect.left + rect.width / 2 - center) <
            Math.abs(bestRect.left + bestRect.width / 2 - center)
            ? i
            : best;
        }, 0);
        select(nearest, false);
      };
      track.addEventListener(
        "scroll",
        () => {
          clearTimeout(settle);
          settle = setTimeout(syncScroll, 120);
        },
        { passive: true },
      );
      paint();
    }
  }
})();

/* Local-only chrome adapters. No persistence or account navigation. */
(() => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("#site-navigation");
  const closeNav = (focus = false) => {
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", navToggle.dataset.labelOpen);
    nav.classList.remove("is-open");
    if (focus) navToggle.focus();
  };
  navToggle.addEventListener("click", () => {
    const open = navToggle.getAttribute("aria-expanded") !== "true";
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute(
      "aria-label",
      open ? navToggle.dataset.labelClose : navToggle.dataset.labelOpen,
    );
    nav.classList.toggle("is-open", open);
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeNav();
  });
  matchMedia("(min-width: 901px)").addEventListener("change", (e) => {
    if (e.matches) closeNav();
  });
  const toggle = document.querySelector("#themeToggle");
  toggle.addEventListener("click", () => {
    const night = document.documentElement.dataset.theme !== "night";
    document.documentElement.dataset.theme = night ? "night" : "day";
    toggle.setAttribute("aria-checked", String(night));
    toggle.setAttribute(
      "aria-label",
      night ? toggle.dataset.labelLight : toggle.dataset.labelDark,
    );
  });
  const group = document.querySelector(".home-plan-grid.is-four");
  const syncPlans = () => {
    for (const card of group.querySelectorAll(".home-plan-choice")) {
      const input = card.querySelector(".home-plan-radio"),
        cta = card.querySelector(".home-plan-cta");
      cta.classList.toggle("primary", input.checked);
      cta.classList.toggle("ghost", !input.checked);
      if (input.checked) cta.dataset.selectedPlan = input.value;
      else delete cta.dataset.selectedPlan;
    }
  };
  group.addEventListener("change", syncPlans);
  syncPlans();
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    if (a.matches("[data-account]")) {
      e.preventDefault();
      const dialog = document.querySelector("#account-dialog");
      let receipt = dialog.querySelector("[data-plan-receipt]");
      if (!receipt) {
        receipt = document.createElement("p");
        receipt.dataset.planReceipt = "";
        dialog.insertBefore(receipt, dialog.lastElementChild);
      }
      receipt.textContent = a.dataset.selectedPlan
        ? "Selected plan: " +
          a.dataset.selectedPlan +
          ". Account flow stays closed."
        : "";
      dialog.showModal();
    }
    if (a.matches("[data-local-page]")) {
      e.preventDefault();
      document.querySelector("[data-local-page-feedback]").textContent =
        a.dataset.localPage +
        " is a separate page in Sketchie. Only this landing is included in the local artifact.";
      document.querySelector("#local-page-dialog").showModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.key === "Escape" &&
      navToggle.getAttribute("aria-expanded") === "true"
    )
      closeNav(true);
  });
  for (const d of document.querySelectorAll("[data-langsw]")) {
    d.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        d.open = false;
        d.querySelector("summary").focus();
      }
    });
  }
})();
