(() => {
  const $ = (s) => document.querySelector(s);
  const LETTERS = ["A", "B", "C", "D"];
  const STORE_KEY = "precalc-practice-v2";
  const LOCK_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const UNLOCK_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 7V5a3 3 0 0 1 5.8-1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';

  // Stable ids, so saved progress survives edits to the bank's order.
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return "q" + (h >>> 0).toString(36);
  }
  BANK.forEach((q) => { q.id = hash(q.q); q.key = q.u + "|" + q.t; });

  // =====================================================================
  // Math answer checking for the step-by-step walkthrough
  // =====================================================================
  const SUPERS = { "⁰":"0","¹":"1","²":"2","³":"3","⁴":"4","⁵":"5","⁶":"6","⁷":"7","⁸":"8","⁹":"9","⁻":"-" };
  const IDENTS = ["arcsin","arccos","arctan","asin","acos","atan","theta","sqrt","sin","cos","tan","sec","csc","cot","abs","log","ln","pi","e","x","t"];
  const FUNCS = {
    sqrt: Math.sqrt, sin: Math.sin, cos: Math.cos, tan: Math.tan, abs: Math.abs,
    sec: (v) => 1 / Math.cos(v), csc: (v) => 1 / Math.sin(v), cot: (v) => 1 / Math.tan(v),
    ln: Math.log, log: Math.log10,
    arcsin: Math.asin, asin: Math.asin, arccos: Math.acos, acos: Math.acos, arctan: Math.atan, atan: Math.atan
  };

  function normalize(s) {
    return s.toLowerCase()
      .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻]+/g, (m) => "^(" + [...m].map((c) => SUPERS[c]).join("") + ")")
      .replace(/[−–—]/g, "-").replace(/[×·∙]/g, "*").replace(/÷/g, "/")
      .replace(/π/g, "pi").replace(/θ/g, "theta").replace(/√/g, "sqrt")
      .replace(/°|degrees?|\$/g, "").replace(/[\[{]/g, "(").replace(/[\]}]/g, ")")
      .replace(/\s+/g, "")
      .replace(/^(?:[a-z]|theta|f\(x\)|y\(x\))=(?!=)/, "");
  }

  function tokenize(s) {
    const out = [];
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (/[0-9.]/.test(ch)) {
        const m = s.slice(i).match(/^\d*\.?\d+|^\d+\./);
        if (!m) throw new Error("bad number");
        out.push({ k: "num", v: parseFloat(m[0]) }); i += m[0].length;
      } else if (/[a-z]/.test(ch)) {
        const id = IDENTS.find((w) => s.startsWith(w, i));
        if (!id) throw new Error("unknown name");
        out.push({ k: "id", v: id }); i += id.length;
      } else if ("+-*/^()".includes(ch)) {
        out.push({ k: ch }); i++;
      } else throw new Error("unexpected " + ch);
    }
    return out;
  }

  // Recursive-descent parser that returns a function of {x}.
  function compile(src) {
    const toks = tokenize(normalize(src));
    let p = 0;
    const peek = () => toks[p];
    const eat = (k) => { if (peek() && peek().k === k) { p++; return true; } return false; };
    const startsPrimary = (t) => t && (t.k === "num" || t.k === "id" || t.k === "(");

    function expr() {
      let left = unary();
      for (;;) {
        if (eat("+")) { const a = left, b = unary(); left = (v) => a(v) + b(v); }
        else if (eat("-")) { const a = left, b = unary(); left = (v) => a(v) - b(v); }
        else return left;
      }
    }
    function unary() {
      if (eat("-")) { const a = unary(); return (v) => -a(v); }
      if (eat("+")) return unary();
      return term();
    }
    function term() {
      let left = power();
      for (;;) {
        if (eat("*")) { const a = left, b = signedPower(); left = (v) => a(v) * b(v); }
        else if (eat("/")) { const a = left, b = signedPower(); left = (v) => a(v) / b(v); }
        else if (startsPrimary(peek())) { const a = left, b = power(); left = (v) => a(v) * b(v); }
        else return left;
      }
    }
    function signedPower() {
      if (eat("-")) { const a = signedPower(); return (v) => -a(v); }
      return power();
    }
    function power() {
      const base = primary();
      if (eat("^")) { const ex = signedPower(); return (v) => Math.pow(base(v), ex(v)); }
      return base;
    }
    function primary() {
      const t = peek();
      if (!t) throw new Error("unexpected end");
      if (t.k === "num") { p++; return () => t.v; }
      if (eat("(")) { const e = expr(); if (!eat(")")) throw new Error("missing )"); return e; }
      if (t.k === "id") {
        p++;
        if (t.v === "pi") return () => Math.PI;
        if (t.v === "e") return () => Math.E;
        if (t.v === "x" || t.v === "t" || t.v === "theta") return (v) => v.x;
        const fn = FUNCS[t.v];
        const arg = peek() && peek().k === "(" ? primary() : power();
        return (v) => fn(arg(v));
      }
      throw new Error("unexpected symbol");
    }
    const f = expr();
    if (p !== toks.length) throw new Error("extra input");
    return f;
  }

  const SAMPLE_X = [0.7, 1.3, 2.9, -1.6, 3.7];
  function sameValue(inputSrc, expectSrc, tol) {
    const f = compile(inputSrc), g = compile(expectSrc);
    let checked = 0;
    for (const x of SAMPLE_X) {
      const want = g({ x });
      if (!Number.isFinite(want)) continue;
      const got = f({ x });
      if (!Number.isFinite(got)) return false;
      const ok = tol != null ? Math.abs(got - want) <= tol + 1e-9 : Math.abs(got - want) <= 1e-6 * Math.max(1, Math.abs(want));
      if (!ok) return false;
      checked++;
    }
    return checked > 0;
  }

  function isFactored(src) {
    const s = normalize(src).replace(/^-/, "");
    let depth = 0;
    for (const ch of s) {
      if (ch === "(") depth++;
      else if (ch === ")") depth--;
      else if ((ch === "+" || ch === "-") && depth === 0) return false;
    }
    return s.includes("(");
  }

  // Returns "ok", "wrong", or a message explaining why the input could not be read.
  function checkStep(step, raw) {
    let input = raw.trim();
    if (!input) return "Type an answer first.";
    const expected = step.a.split(",");
    if (expected.length === 1 && /^\$?-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(input)) input = input.replace(/,/g, "");
    const parts = input.split(/,|;|\bor\b|\band\b/i).map((x) => x.trim()).filter(Boolean);
    try { parts.forEach(compile); } catch {
      return "I couldn't read that. Use forms like 6/5, -sqrt(2)/2, 5pi/4, or x^2+1.";
    }
    if (parts.length !== expected.length) {
      return expected.length > 1 ? `This step has ${expected.length} answers. Separate them with commas.` : "This step needs one answer.";
    }
    if (step.factored && !isFactored(input)) return "Write it in factored form, as a product of factors in parentheses.";
    if (step.set) {
      const left = expected.slice();
      for (const part of parts) {
        const i = left.findIndex((e) => sameValue(part, e, step.tol));
        if (i < 0) return "wrong";
        left.splice(i, 1);
      }
      return "ok";
    }
    return parts.every((part, i) => sameValue(part, expected[i], step.tol)) ? "ok" : "wrong";
  }

  function pretty(a) {
    return a.replace(/sqrt\((\d+)\)/g, "√$1").replace(/sqrt/g, "√").replace(/pi/g, "π")
      .replace(/\^2/g, "²").replace(/\^3/g, "³").replace(/\^5/g, "⁵")
      .replace(/\*/g, "·").replace(/-/g, "−").replace(/,/g, ", ")
      .replace(/([+−])/g, (m, op, i) => (i === 0 ? op : " " + op + " ")).replace(/\(\s/g, "(").replace(/ {2,}/g, " ");
  }

  // =====================================================================
  // Saved state (this browser only)
  // =====================================================================
  function loadStore() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
  }
  function saveStore() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {}
  }
  const store = loadStore();
  store.solved = store.solved || {};
  store.stats = store.stats || {};   // id -> {a: answered, c: correct, h: used steps}
  store.prefs = store.prefs || {};

  const allKeys = Object.entries(TOPICS).flatMap(([u, ts]) => ts.map((t) => u + "|" + t));
  const state = {
    units: new Set((store.prefs.units || [1, 2, 3]).filter((u) => UNITS[u])),
    calc: store.prefs.calc || "all",
    len: store.prefs.len ?? 10,
    locked: new Set((store.prefs.locked || []).filter((k) => allKeys.includes(k))),
    focus: new Set((store.prefs.focus || []).filter((k) => allKeys.includes(k))),
    set: [], idx: 0, picked: null, order: [], results: [],
    steps: null
  };
  if (!state.units.size) [1, 2, 3].forEach((u) => state.units.add(u));

  function persistPrefs() {
    store.prefs = { topicsOpen: store.prefs.topicsOpen, units: [...state.units], calc: state.calc, len: state.len, locked: [...state.locked], focus: [...state.focus] };
    saveStore();
  }

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));

  // =====================================================================
  // Practice pool: units, calculator filter, topic focus and locks
  // =====================================================================
  function activeTopics() {
    const open = allKeys.filter((k) => state.units.has(+k.split("|")[0]) && !state.locked.has(k));
    const focused = open.filter((k) => state.focus.has(k));
    return { open, focused, use: new Set(focused.length ? focused : open) };
  }
  function pool() {
    const { use } = activeTopics();
    return BANK.filter((q) => use.has(q.key) && (state.calc === "all" || (state.calc === "yes") === q.calc));
  }

  function topicAccuracy(key) {
    let a = 0, c = 0;
    BANK.forEach((q) => { if (q.key === key && store.stats[q.id]) { a += store.stats[q.id].a; c += store.stats[q.id].c; } });
    return { a, c, pct: a ? Math.round((c / a) * 100) : null };
  }

  function chipRow(el, items, isOn, onClick) {
    el.innerHTML = "";
    items.forEach(([val, label]) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = label;
      b.setAttribute("aria-pressed", isOn(val) ? "true" : "false");
      b.addEventListener("click", () => onClick(val));
      el.appendChild(b);
    });
  }

  function renderControls() {
    chipRow($("#unitChips"), Object.entries(UNITS).map(([k, v]) => [+k, `Unit ${k} · ${v.replace(" Functions", "")}`]),
      (v) => state.units.has(v),
      (v) => {
        if (state.units.has(v) && state.units.size > 1) state.units.delete(v); else state.units.add(v);
        persistPrefs(); renderControls();
      });
    chipRow($("#calcChips"), [["all", "Both"], ["no", "No calculator"], ["yes", "Calculator"]],
      (v) => state.calc === v, (v) => { state.calc = v; persistPrefs(); renderControls(); });
    chipRow($("#lenChips"), [[10, "10"], [20, "20"], [0, "All"]],
      (v) => state.len === v, (v) => { state.len = v; persistPrefs(); renderControls(); });
    renderTopics();
    const n = pool().length;
    $("#startBtn").textContent = `Start new set (${n} question${n === 1 ? "" : "s"})`;
    $("#startBtn").disabled = n === 0;
  }

  function renderTopics() {
    const { open, focused } = activeTopics();
    const shown = allKeys.filter((k) => state.units.has(+k.split("|")[0]));
    const lockedShown = shown.filter((k) => state.locked.has(k)).length;
    $("#topicStatus").textContent = focused.length
      ? `Focusing on ${focused.length} topic${focused.length === 1 ? "" : "s"}`
      : `Practicing all ${open.length} unlocked topic${open.length === 1 ? "" : "s"}` + (lockedShown ? `, ${lockedShown} locked` : "");
    $("#clearFocus").hidden = !focused.length;
    $("#unlockAll").hidden = !state.locked.size;

    const grid = $("#topicGrid");
    grid.innerHTML = [...state.units].sort().map((u) => `
      <div class="tcol">
        <h3>Unit ${u} · ${UNITS[u]}</h3>
        ${TOPICS[u].map((t, i) => {
          const key = u + "|" + t, locked = state.locked.has(key);
          const count = BANK.filter((q) => q.key === key).length;
          const acc = topicAccuracy(key);
          return `<div class="trow${locked ? " locked" : ""}">
            <input type="checkbox" id="focus-${u}-${i}" data-key="${esc(key)}" ${state.focus.has(key) && !locked ? "checked" : ""} ${locked ? "disabled" : ""}>
            <label for="focus-${u}-${i}"><span class="tname">${t}</span>
              <span class="tmeta">${locked ? "Locked" : `${count} questions${acc.pct != null ? ` · ${acc.pct}% correct` : ""}`}</span></label>
            <button type="button" class="lockbtn" data-key="${esc(key)}" aria-pressed="${locked}" aria-label="${locked ? "Unlock" : "Lock"} ${esc(t)}" title="${locked ? "Unlock topic" : "Lock topic"}">${locked ? LOCK_SVG : UNLOCK_SVG}</button>
          </div>`;
        }).join("")}
      </div>`).join("");

    grid.querySelectorAll("input[type=checkbox]").forEach((cb) => cb.addEventListener("change", () => {
      if (cb.checked) state.focus.add(cb.dataset.key); else state.focus.delete(cb.dataset.key);
      persistPrefs(); renderControls();
      const again = document.getElementById(cb.id); if (again) again.focus();
    }));
    grid.querySelectorAll(".lockbtn").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.key;
      if (state.locked.has(k)) state.locked.delete(k); else { state.locked.add(k); state.focus.delete(k); }
      persistPrefs(); renderControls();
      const again = grid.querySelector(`.lockbtn[data-key="${CSS.escape(k)}"]`); if (again) again.focus();
    }));
  }

  // =====================================================================
  // Question flow
  // =====================================================================
  function startSet(questions) {
    const list = questions || shuffle(pool());
    state.set = state.len && !questions ? list.slice(0, state.len) : list;
    state.idx = 0; state.results = [];
    if (!state.set.length) {
      $("#stage").innerHTML = `<p>No questions match these settings. Turn on another unit, unlock a topic, or set Calculator to “Both”.</p>`;
      renderScore();
      return;
    }
    showQuestion();
    renderScore();
  }

  function showQuestion() {
    const q = state.set[state.idx];
    state.picked = null;
    state.order = shuffle(q.c.map((_, i) => i));
    state.steps = { open: false, idx: 0, tries: 0, used: false, log: [], optOrder: null, msg: "", showHint: false };
    const n = state.set.length;
    $("#stage").innerHTML = `
      <div class="qmeta">
        <div class="badges">
          <span class="badge">Unit ${q.u} · ${q.t}</span>
          <span class="badge calc">${q.calc ? "Calculator" : "No calculator"}</span>
        </div>
        <span class="counter">Question ${state.idx + 1} of ${n}</span>
      </div>
      <div class="bar" aria-hidden="true"><span style="width:${(state.idx / n) * 100}%"></span></div>
      <p class="question">${q.q}</p>
      <div class="choices" role="group" aria-label="Answer choices">
        ${state.order.map((ci, k) => `
          <button class="choice" type="button" data-k="${k}">
            <span class="key">${LETTERS[k]}</span><span class="txt">${q.c[ci]}</span>
          </button>`).join("")}
      </div>
      <div id="feedback"></div>
      <div id="steps"></div>
      <div class="actions">
        <span class="hint">Keys: <kbd>A</kbd>–<kbd>D</kbd> to answer, <kbd>Enter</kbd> for next</span>
        <button class="btn" id="nextBtn" type="button" disabled>${state.idx + 1 === n ? "See results" : "Next question"}</button>
      </div>`;
    document.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => answer(+b.dataset.k)));
    $("#nextBtn").addEventListener("click", next);
    renderSteps();
  }

  // ---- Step-by-step hint walkthrough ----
  function renderSteps() {
    const q = state.set[state.idx], st = state.steps, box = $("#steps");
    if (!q.s || !q.s.length) { box.innerHTML = ""; return; }
    if (!st.open) {
      box.innerHTML = `<button class="btn ghost hintbtn" type="button" id="hintBtn">
        <span aria-hidden="true">?</span> Hint: work it out step by step</button>`;
      $("#hintBtn").addEventListener("click", () => { st.open = true; st.used = true; renderSteps(); focusStep(); });
      return;
    }
    const total = q.s.length, done = st.idx >= total;
    const step = q.s[Math.min(st.idx, total - 1)];
    if (!done && step.o && !st.optOrder) st.optOrder = shuffle(step.o.map((_, i) => i));

    const past = st.log.map((l, i) => `
      <li class="step done">
        <span class="snum">${i + 1}</span>
        <div><p>${q.s[i].p}</p>
          <p class="sans ${l.shown ? "shown" : ""}">${l.shown ? "Answer" : "✓ You got"}: <span class="m">${l.text}</span></p></div>
      </li>`).join("");

    let current = "";
    if (!done) {
      const input = step.o
        ? `<div class="sopts">${st.optOrder.map((oi) => `<button type="button" class="sopt" data-oi="${oi}">${step.o[oi]}</button>`).join("")}</div>`
        : `<form class="sform" id="stepForm" autocomplete="off">
            <input type="text" id="stepInput" inputmode="text" spellcheck="false" aria-label="Your answer for step ${st.idx + 1}" placeholder="e.g. 6/5, -sqrt(3)/2, 5pi/4, x^2+1">
            <button class="btn" type="submit">Check</button>
          </form>`;
      current = `
        <li class="step now">
          <span class="snum">${st.idx + 1}</span>
          <div>
            <p>${step.p}</p>
            ${input}
            ${st.msg ? `<p class="smsg ${st.msgKind}" role="status">${st.msg}</p>` : ""}
            ${st.showHint && step.h ? `<p class="shint"><strong>Hint:</strong> ${step.h}</p>` : ""}
            ${st.tries >= 1 ? `<div class="srow">
              ${step.h && !st.showHint ? `<button type="button" class="linkbtn" id="showHint">Show a hint</button>` : ""}
              ${st.tries >= 2 || (st.tries >= 1 && !step.h) ? `<button type="button" class="linkbtn" id="showAns">Show this step's answer</button>` : ""}
            </div>` : ""}
          </div>
        </li>`;
    }

    box.innerHTML = `
      <div class="stepper">
        <div class="stephead">
          <strong>Step by step</strong>
          <span class="counter">${done ? `All ${total} steps done` : `Step ${st.idx + 1} of ${total}`}</span>
        </div>
        <ol class="steplist">${past}${current}</ol>
        ${done ? `<p class="small">${state.picked === null ? "Now pick the matching answer above." : "Compare your steps with the explanation above."}</p>` : ""}
      </div>`;

    if (!done) {
      if (step.o) {
        box.querySelectorAll(".sopt").forEach((b) => b.addEventListener("click", () => {
          const oi = +b.dataset.oi;
          if (oi === 0) advanceStep(step.o[0], false);
          else { st.tries++; st.msg = "Not quite. Try another option."; st.msgKind = "bad"; renderSteps(); }
        }));
      } else {
        $("#stepForm").addEventListener("submit", (e) => {
          e.preventDefault();
          const val = $("#stepInput").value;
          const res = checkStep(step, val);
          if (res === "ok") advanceStep(esc(val.trim()), false);
          else if (res === "wrong") { st.tries++; st.msg = "Not yet. Check your work and try again."; st.msgKind = "bad"; renderSteps(); restoreInput(val); }
          else { st.msg = res; st.msgKind = "info"; renderSteps(); restoreInput(val); }
        });
      }
      const sh = $("#showHint");
      if (sh) sh.addEventListener("click", () => { st.showHint = true; renderSteps(); focusStep(); });
      const sa = $("#showAns");
      if (sa) sa.addEventListener("click", () => advanceStep(step.o ? step.o[0] : pretty(step.a), true));
    }
  }
  function restoreInput(val) {
    const inp = $("#stepInput");
    if (inp) { inp.value = val; inp.focus(); inp.select(); }
  }
  function focusStep() {
    const el = $("#stepInput") || document.querySelector(".sopt");
    if (el) el.focus({ preventScroll: false });
  }
  function advanceStep(text, shown) {
    const st = state.steps;
    st.log.push({ text, shown });
    st.idx++; st.tries = 0; st.msg = ""; st.optOrder = null; st.showHint = false;
    renderSteps(); focusStep();
  }

  function answer(k) {
    if (state.picked !== null) return;
    const q = state.set[state.idx];
    state.picked = k;
    const correctK = state.order.indexOf(0);
    const ok = k === correctK;
    const hinted = state.steps.used;
    state.results.push({ q, ok, hinted });
    const s = store.stats[q.id] || { a: 0, c: 0, h: 0 };
    s.a++; if (ok) s.c++; if (hinted) s.h++;
    store.stats[q.id] = s;
    if (ok) store.solved[q.id] = true;
    saveStore();

    document.querySelectorAll(".choice").forEach((b) => {
      const bk = +b.dataset.k;
      b.disabled = true;
      if (bk === correctK) b.classList.add("correct");
      else if (bk === k) b.classList.add("wrong");
    });
    $("#feedback").innerHTML = `
      <div class="explain ${ok ? "" : "missed"}">
        <strong>${ok ? (hinted ? "Correct, with the step-by-step hint." : "Correct.") : `Not quite. The answer is ${LETTERS[correctK]}.`}</strong>
        <p>${q.e}</p>
      </div>`;
    const nb = $("#nextBtn");
    nb.disabled = false;
    if (!state.steps.open || state.steps.idx >= (q.s || []).length) nb.focus();
    renderSteps();
    renderScore(); renderMastery(); renderTopics();
  }

  function next() {
    if (state.picked === null) return;
    if (state.idx + 1 < state.set.length) { state.idx++; showQuestion(); }
    else showSummary();
  }

  function showSummary() {
    const r = state.results;
    const right = r.filter((x) => x.ok).length;
    const hinted = r.filter((x) => x.hinted).length;
    const missed = r.filter((x) => !x.ok);
    const pct = Math.round((right / r.length) * 100);
    const verdict = pct >= 90 ? "You're ready for the exam on this material." :
                    pct >= 70 ? "Solid work. Review the questions you missed below." :
                    "Keep going. Read each explanation, then retry the ones you missed.";
    state.picked = null;
    $("#stage").innerHTML = `
      <div class="summary">
        <span class="eyebrow">Set complete</span>
        <h2>${right} of ${r.length} correct (${pct}%)</h2>
        <p class="small">${verdict}${hinted ? ` You used the step-by-step hint on ${hinted} question${hinted === 1 ? "" : "s"}.` : ""}</p>
        ${missed.length ? `
          <div class="review">
            <strong>Questions to review</strong>
            <ol class="missed-list">${missed.map((m) => `
              <li>${m.q.q}<span class="ans">Answer: <span class="m">${m.q.c[0]}</span></span></li>`).join("")}
            </ol>
          </div>` : ""}
        <div class="actions">
          ${missed.length ? `<button class="btn" id="retryBtn" type="button">Retry the ${missed.length} missed</button>` : ""}
          <button class="btn ghost" id="againBtn" type="button">New set</button>
        </div>
      </div>`;
    if (missed.length) $("#retryBtn").addEventListener("click", () => startSet(shuffle(missed.map((m) => m.q))));
    $("#againBtn").addEventListener("click", () => startSet());
  }

  // =====================================================================
  // Side panels: score, progress, sharing
  // =====================================================================
  function renderScore() {
    const r = state.results;
    const right = r.filter((x) => x.ok).length;
    $("#sessScore").textContent = `${right} / ${r.length}`;
    $("#sessNote").textContent = r.length
      ? `${Math.round((right / r.length) * 100)}% correct so far, ${state.set.length - r.length} left in this set.`
      : "Answer a question to start scoring.";
  }

  function unitSolved(u) {
    const qs = BANK.filter((q) => q.u === +u);
    return { done: qs.filter((q) => store.solved[q.id]).length, total: qs.length };
  }

  function renderMastery() {
    $("#mastery").innerHTML = Object.entries(UNITS).map(([u, name]) => {
      const { done, total } = unitSolved(u);
      return `<div class="unit-row">
        <div class="top"><span>Unit ${u}: ${name.replace(" Functions", "")}</span><span class="num">${done}/${total}</span></div>
        <div class="meter"><span style="width:${(done / total) * 100}%"></span></div>
      </div>`;
    }).join("");
    renderReset(false);
    renderShare();
  }

  function renderReset(confirming) {
    const area = $("#resetArea");
    if (!confirming) {
      area.innerHTML = `<button class="linkbtn" type="button" id="resetBtn">Reset progress</button>`;
      $("#resetBtn").addEventListener("click", () => renderReset(true));
    } else {
      area.innerHTML = `<div class="confirm"><span>Clear all saved progress?</span>
        <button class="btn small-btn" type="button" id="yesReset">Clear</button>
        <button class="btn ghost small-btn" type="button" id="noReset">Cancel</button></div>`;
      $("#yesReset").addEventListener("click", () => { store.solved = {}; store.stats = {}; saveStore(); renderMastery(); renderTopics(); });
      $("#noReset").addEventListener("click", () => renderReset(false));
    }
  }

  function totals() {
    let answered = 0, correct = 0, hinted = 0;
    Object.values(store.stats).forEach((s) => { answered += s.a; correct += s.c; hinted += s.h; });
    const solved = BANK.filter((q) => store.solved[q.id]).length;
    return { answered, correct, hinted, solved, total: BANK.length };
  }

  function buildReport() {
    const t = totals();
    const date = new Date().toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    const lines = [
      "AP Precalculus practice report",
      `Date: ${date}`,
      `Questions solved: ${t.solved} of ${t.total} (${Math.round((t.solved / t.total) * 100)}%)`,
      t.answered
        ? `Answers given: ${t.answered}, ${Math.round((t.correct / t.answered) * 100)}% correct` + (t.hinted ? `, ${t.hinted} with step-by-step hints` : "")
        : "Answers given: none yet",
      ""
    ];
    Object.entries(UNITS).forEach(([u, name]) => {
      const { done, total } = unitSolved(u);
      lines.push(`Unit ${u}, ${name}: ${done}/${total} solved`);
    });
    const rated = allKeys.map((k) => ({ k, ...topicAccuracy(k) })).filter((x) => x.a >= 2);
    if (rated.length) {
      const name = (x) => `${x.k.split("|")[1]} (${x.pct}%)`;
      const byPct = rated.slice().sort((a, b) => b.pct - a.pct);
      lines.push("", "Strongest topics: " + byPct.slice(0, 3).map(name).join(", "));
      const weak = byPct.filter((x) => x.pct < 80).reverse().slice(0, 3);
      if (weak.length) lines.push("Needs practice: " + weak.map(name).join(", "));
    }
    if (state.focus.size) lines.push("Focusing on: " + [...state.focus].map((k) => k.split("|")[1]).join(", "));
    if (state.locked.size) lines.push("Locked topics: " + [...state.locked].map((k) => k.split("|")[1]).join(", "));
    return lines.join("\n");
  }

  function renderShare() {
    const t = totals();
    $("#shareSummary").textContent = t.answered
      ? `${t.solved} of ${t.total} questions solved, ${Math.round((t.correct / t.answered) * 100)}% of answers correct.`
      : "Answer a few questions and your report will fill in.";
  }

  $("#copyReport").addEventListener("click", () => {
    const text = buildReport();
    const box = $("#reportBox");
    box.value = text;
    const fallback = () => {
      box.hidden = false; box.focus(); box.select();
      $("#copyMsg").textContent = "Copying isn't available here. The report is selected, so copy it yourself.";
    };
    try {
      navigator.clipboard.writeText(text).then(() => {
        box.hidden = false;
        $("#copyMsg").textContent = "Copied. Paste it into a message, email, or your class's assignment.";
      }, fallback);
    } catch { fallback(); }
  });

  // ---- Class board (only where the page runs as a shared Claude artifact) ----
  async function initBoard() {
    if (!window.claude || typeof window.claude.use !== "function") return;
    let db, user;
    try { [db, user] = await Promise.all([window.claude.use("db"), window.claude.use("user")]); } catch { return; }
    if (!db) return;
    const uid = user ? await user.id() : null;
    $("#board").hidden = false;
    const postBtn = $("#postBtn"), removeBtn = $("#removePost"), msg = $("#boardMsg");
    if (!uid) { postBtn.hidden = true; msg.textContent = "Sign in to Claude to post your own progress."; }

    let rows = [];
    let mine = null;
    db.collection("board").orderBy("solved", "desc").limit(200).onSnapshot((snap) => {
      rows = snap.docs.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }));
      mine = rows.find((r) => r.id === uid) || null;
      drawBoard();
    }, () => { msg.textContent = "The class board couldn't load. Reload the page to try again."; });

    async function drawBoard() {
      postBtn.textContent = mine ? "Update my post" : "Post my progress";
      removeBtn.hidden = !mine;
      const list = $("#boardList");
      if (!rows.length) {
        list.innerHTML = `<p class="small">No one has posted yet. Post your progress to start the board.</p>`;
        return;
      }
      const ps = user ? await user.profiles(rows.map((r) => r.id)) : {};
      list.innerHTML = "";
      rows.forEach((r, i) => {
        const p = ps[r.id] || {};
        const row = document.createElement("div");
        row.className = "brow" + (r.id === uid ? " me" : "");
        const total = r.total || BANK.length;
        const acc = r.answered ? Math.round((r.correct / r.answered) * 100) : 0;
        row.innerHTML = `<span class="brank">${i + 1}</span>
          <img class="bav" alt="" src="">
          <div class="bmain"><div class="btop"><span class="bname"></span><span class="num">${r.solved}/${total}</span></div>
            <div class="meter"><span style="width:${Math.min(100, (r.solved / total) * 100)}%"></span></div>
            <span class="bsub">${acc}% correct · updated ${ago(r.updatedAt)}</span></div>`;
        row.querySelector(".bav").src = p.avatarUrl || "";
        row.querySelector(".bname").textContent = (p.name || "Someone") + (r.id === uid ? " (you)" : "");
        list.appendChild(row);
      });
    }

    postBtn.addEventListener("click", async () => {
      const t = totals();
      const units = {};
      Object.keys(UNITS).forEach((u) => { units[u] = unitSolved(u).done; });
      postBtn.disabled = true;
      try {
        await db.doc("board/" + uid).set({ solved: t.solved, total: t.total, answered: t.answered, correct: t.correct, units, updatedAt: Date.now() });
        msg.textContent = "Posted. Everyone who opens this page can see it.";
      } catch (e) {
        msg.textContent = e && e.code === "invalid_argument"
          ? "You can see the board but can't post to it. Ask the page owner to give you Contributor access."
          : "Your post didn't save. Try again in a moment.";
      }
      postBtn.disabled = false;
    });
    removeBtn.addEventListener("click", async () => {
      try { await db.doc("board/" + uid).delete(); msg.textContent = "Your post was removed."; }
      catch { msg.textContent = "Your post couldn't be removed. Try again in a moment."; }
    });
  }
  function ago(ts) {
    if (!ts) return "recently";
    const m = Math.round((Date.now() - ts) / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m} min ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h} hr ago`;
    const d = Math.round(h / 24);
    return `${d} day${d === 1 ? "" : "s"} ago`;
  }

  // =====================================================================
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (!document.querySelector(".choice")) return;
    const k = LETTERS.indexOf(e.key.toUpperCase());
    if (k >= 0 && state.picked === null) { answer(k); e.preventDefault(); }
    else if (e.key === "Enter" && state.picked !== null && tag !== "BUTTON") { next(); e.preventDefault(); }
  });

  $("#clearFocus").addEventListener("click", () => { state.focus.clear(); persistPrefs(); renderControls(); });
  $("#unlockAll").addEventListener("click", () => { state.locked.clear(); persistPrefs(); renderControls(); });
  $("#startBtn").addEventListener("click", () => startSet());

  try {
    const saved = store.prefs.topicsOpen;
    $("#topicsBox").open = saved != null ? saved : !window.matchMedia("(max-width: 640px)").matches;
  } catch {}
  $("#topicsBox").addEventListener("toggle", () => { store.prefs.topicsOpen = $("#topicsBox").open; saveStore(); });

  renderControls();
  renderMastery();
  startSet();
  initBoard();

  window.__precalc = { checkStep, compile, pretty };
})();
