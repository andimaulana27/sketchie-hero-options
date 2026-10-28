/* Standalone product-review concept. All state is held in this closure only. */
(() => {
  "use strict";
  const MAX = 2000;
  const STEP_MS = 1600; // Provisional concept timing, not a generation estimate.
  const copy = {
    a: [
      "Closest to the New Video composer. One card moves from prompt to process to locked preview.",
      "The prompt leaves the input as the process card takes over.",
      "App continuity and a direct first try matter most.",
    ],
    b: [
      "The brief stays visible beside progress and the locked result.",
      "More surface area. Mobile stacks the brief above the output.",
      "Visitors need context and reassurance while they wait.",
    ],
    c: [
      "A topic, audience and learning goal guide a more deliberate brief.",
      "More questions before the first try; the fields are concept proposals.",
      "The audience needs help turning an idea into a useful explanation.",
    ],
    d: [
      "An existing example becomes an editable starting point.",
      "Curated topics can anchor expectations too narrowly.",
      "Showing the product first is the strongest way to invite a first try.",
    ],
  };
  const defaultPrompt = "Explain how the water cycle works";
  const drafts = Object.fromEntries(
    ["a", "b", "c", "d"].map((id) => [
      id,
      {
        prompt: id === "d" ? defaultPrompt : "",
        length: "1",
        aspect: "16:9",
        language: "English",
        source: false,
        audience: "Anyone new to the topic",
        takeaway: "",
      },
    ]),
  );
  const state = { option: "a", phase: "idle", step: 0, held: false, error: "" };
  let timer;
  let attachmentTrigger;
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const panel = () => $(`[data-panel="${state.option}"]`);
  const draft = () => drafts[state.option];
  const live = (message) => {
    $("#live-status").textContent = message;
  };
  function stop() {
    clearTimeout(timer);
    timer = undefined;
  }
  function receipt() {
    const d = draft();
    let prompt =
      d.prompt.trim() || "Explain the water cycle from the sample document";
    if (state.option === "c")
      prompt += ` · For: ${d.audience}${d.takeaway.trim() ? ` · Goal: ${d.takeaway.trim()}` : ""}`;
    return prompt;
  }
  function render() {
    const busy = ["simulating", "locked"].includes(state.phase);
    $$("[data-option]").forEach((tab) => {
      const on = tab.dataset.option === state.option;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
    });
    $$("[data-panel]").forEach((p) => {
      const on = p.dataset.panel === state.option;
      p.hidden = !on;
      p.inert = !on;
    });
    const p = panel(),
      d = draft(),
      f = $("[data-form]", p),
      input = $("[data-input]", p);
    const [strength, tradeoff, best] = copy[state.option];
    $("[data-strength]").textContent = strength;
    $("[data-tradeoff]").textContent = tradeoff;
    $("[data-best]").textContent = best;
    $$("[data-review]").forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.review === state.phase)),
    );
    $("[data-state-note]").textContent =
      state.phase === "simulating"
        ? state.held
          ? "Simulating: held at the drawing step for review. Provisional pacing: four local steps × 1.6 seconds."
          : "Simulating: four local steps × 1.6 seconds. Provisional pacing, not a real generation estimate."
        : state.phase === "locked"
          ? "Locked: illustrative placeholder and account treatment are provisional. Signup and login remain closed."
          : state.phase === "invalid"
            ? "Invalid: empty or over-limit prompts stay in the composer with an announced error."
            : "Idle: type a prompt or use a sample. Direct state controls hold their selected state for review.";
    if (input.value !== d.prompt) input.value = d.prompt;
    f.hidden = busy && state.option !== "b";
    f.dataset.readonly = String(busy);
    $$("textarea, input, select", f).forEach((el) => {
      if (el instanceof HTMLSelectElement) el.disabled = busy;
      else el.readOnly = busy;
    });
    $$("button", f).forEach((b) => (b.disabled = busy));
    input.setAttribute("aria-invalid", String(state.phase === "invalid"));
    const error = $("[data-error]", p);
    error.textContent = state.error;
    error.hidden = !state.error;
    const count = $("[data-count]", p),
      n = d.prompt.trim().length;
    count.hidden = n < 1800;
    count.textContent = `${n} / ${MAX} characters`;
    $("[data-source]", p).hidden = !d.source;
    $$("[data-length]", p).forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.length === d.length)),
    );
    $("[data-aspect]", p).value = d.aspect;
    $("[data-language]", p).value = d.language;
    if ($("[data-audience]", p)) $("[data-audience]", p).value = d.audience;
    if ($("[data-takeaway]", p)) $("[data-takeaway]", p).value = d.takeaway;
    const process = $("[data-process]", p),
      locked = $("[data-locked]", p);
    process.hidden = state.phase !== "simulating";
    locked.hidden = state.phase !== "locked";
    process.setAttribute(
      "aria-busy",
      String(state.phase === "simulating" && !state.held),
    );
    $("[data-receipt]", p).textContent = receipt();
    $("[data-settings-summary]", p).textContent =
      `${d.length} min · ${d.aspect} · ${d.language}${d.source ? " · Sample document" : ""}`;
    $$("[data-step]", p).forEach((el) => {
      const i = Number(el.dataset.step),
        mode = i < state.step ? "done" : i === state.step ? "now" : "wait";
      el.dataset.state = mode;
      $(".ck", el).textContent =
        mode === "done" ? "✓" : mode === "wait" ? "·" : "";
      if (mode === "now") el.setAttribute("aria-current", "step");
      else el.removeAttribute("aria-current");
    });
    const prev = $("[data-preview-idle]", p);
    if (prev) prev.hidden = busy;
    const guidance = $("[data-guidance]", p);
    if (guidance) guidance.hidden = busy;
    $$("[data-example]", p).forEach((b) => {
      if (b.hasAttribute("data-tile"))
        b.setAttribute("aria-pressed", String(b.dataset.example === d.prompt));
      b.disabled = busy;
    });
    const remix = $("[data-remix-title]", p);
    if (remix) {
      const current = $("[data-tile][aria-pressed=true]", p);
      remix.textContent = current
        ? $("span", current).textContent.trim()
        : "Your own explanation";
    }
    const feedback = $("[data-account-feedback]", p);
    feedback.hidden = true;
    feedback.textContent = "";
    document.documentElement.dataset.phase = state.phase;
    document.documentElement.dataset.direction = state.option;
  }
  function queue() {
    stop();
    if (state.held || state.phase !== "simulating") return;
    timer = setTimeout(() => {
      if (state.phase !== "simulating" || state.held) return;
      if (state.step === 3) {
        state.phase = "locked";
        render();
        live(
          "Simulation finished. Illustrative preview locked. Account flow is closed.",
        );
        $("[data-locked] h2", panel()).focus({ preventScroll: true });
      } else {
        state.step++;
        render();
        live(
          `Simulation: ${$$("[data-step]", panel())[state.step].textContent.trim()}`,
        );
        queue();
      }
    }, STEP_MS);
  }
  function submit() {
    if (["simulating", "locked"].includes(state.phase)) return;
    const n = draft().prompt.trim().length;
    if ((n === 0 && !draft().source) || n > MAX) {
      state.phase = "invalid";
      state.error =
        n > MAX
          ? `Your prompt is ${n} characters, over the ${MAX} limit. Shorten it.`
          : "Enter a topic or add the sample document.";
      render();
      $("[data-input]", panel()).focus({ preventScroll: true });
      return;
    }
    state.error = "";
    state.phase = "simulating";
    state.step = 0;
    state.held = false;
    render();
    live("Local simulation started. No video is being generated.");
    $("[data-process] h2", panel()).focus({ preventScroll: true });
    queue();
  }
  function setReview(phase) {
    stop();
    state.phase = phase;
    state.error = "";
    state.held = phase === "simulating";
    state.step = phase === "simulating" ? 2 : 0;
    if (phase === "idle") {
      draft().prompt = state.option === "d" ? defaultPrompt : "";
      draft().source = false;
    }
    if (phase === "invalid") {
      draft().prompt = "";
      draft().source = false;
      state.error = "Enter a topic or add the sample document.";
    }
    if (
      ["simulating", "locked"].includes(phase) &&
      !draft().prompt.trim() &&
      !draft().source
    )
      draft().prompt = defaultPrompt;
    render();
    live(
      `${phase[0].toUpperCase() + phase.slice(1)} preview selected${state.held ? ". Simulation is held for review" : ""}.`,
    );
  }
  function chooseOption(id) {
    state.option = id;
    if (state.phase === "invalid") {
      const n = draft().prompt.trim().length;
      if (n > MAX)
        state.error = `Your prompt is ${n} characters, over the ${MAX} limit. Shorten it.`;
      else if (n === 0 && !draft().source)
        state.error = "Enter a topic or add the sample document.";
      else {
        state.phase = "idle";
        state.error = "";
      }
    }
    render();
  }
  document.addEventListener("submit", (e) => {
    if (e.target.matches("[data-form]")) {
      e.preventDefault();
      submit();
    }
  });
  document.addEventListener("input", (e) => {
    const t = e.target;
    if (t.matches("[data-input]")) {
      draft().prompt = t.value;
      if (state.phase === "invalid") {
        state.phase = "idle";
        state.error = "";
      }
      render();
    }
    if (t.matches("[data-takeaway]")) draft().takeaway = t.value;
  });
  document.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("[data-aspect]")) draft().aspect = t.value;
    if (t.matches("[data-language]")) draft().language = t.value;
    if (t.matches("[data-audience]")) draft().audience = t.value;
  });
  document.addEventListener("keydown", (e) => {
    const t = e.target;
    if (
      t.matches("[data-input]") &&
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.isComposing
    ) {
      e.preventDefault();
      submit();
      return;
    }
    if (t.matches("[role=tab]")) {
      const tabs = $$("[data-option]"),
        i = tabs.indexOf(t);
      const next =
        e.key === "ArrowRight"
          ? tabs[(i + 1) % 4]
          : e.key === "ArrowLeft"
            ? tabs[(i + 3) % 4]
            : e.key === "Home"
              ? tabs[0]
              : e.key === "End"
                ? tabs[3]
                : null;
      if (next) {
        e.preventDefault();
        chooseOption(next.dataset.option);
        next.focus();
      }
    }
  });
  document.addEventListener("click", (e) => {
    const t = e.target instanceof Element ? e.target.closest("button") : null;
    if (!t) return;
    if (t.matches("[data-option]")) {
      chooseOption(t.dataset.option);
      return;
    }
    if (t.matches("[data-review]")) {
      setReview(t.dataset.review);
      return;
    }
    if (t.matches("[data-example]")) {
      draft().prompt = t.dataset.example;
      state.phase = "idle";
      state.error = "";
      render();
      $("[data-input]", panel()).focus({ preventScroll: true });
      return;
    }
    if (t.matches("[data-length]")) {
      draft().length = t.dataset.length;
      render();
      return;
    }
    if (t.matches("[data-attach]")) {
      attachmentTrigger = t;
      $("#document-dialog").showModal();
      return;
    }
    if (t.matches("[data-use-sample]")) {
      draft().source = true;
      $("#document-dialog").close();
      render();
      live("Built-in sample document added locally. No upload took place.");
      attachmentTrigger?.focus({ preventScroll: true });
      return;
    }
    if (t.matches("[data-remove-source]")) {
      draft().source = false;
      render();
      $("[data-attach]", panel()).focus({ preventScroll: true });
      live("Sample document removed.");
      return;
    }
    if (t.matches("[data-account]")) {
      const locked = t.closest("[data-locked]");
      if (locked) {
        const msg = $("[data-account-feedback]", locked);
        msg.hidden = false;
        msg.textContent = `${t.dataset.account} stays closed in this concept. No account was created and no video started.`;
      } else $("#account-dialog").showModal();
      return;
    }
  });
  render();
})();
