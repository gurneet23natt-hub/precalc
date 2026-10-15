(() => {
  const $ = (s) => document.querySelector(s);
  const LETTERS = ["A", "B", "C", "D"];
  const LOCK_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor"/><path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const UNLOCK_SVG = '<svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M5 7V5a3 3 0 0 1 5.8-1" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
  const MASTER_MIN = 5, MASTER_ACC = 0.8;   // a topic is mastered after 5+ answers at 80%+ correct

  // Stable ids, so saved progress survives edits to the bank's order.
  function hash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) | 0;
    return "q" + (h >>> 0).toString(36);
  }
  BANK.forEach((q) => { q.id = hash(q.q); q.key = q.t; });
  const TOPIC_NAME = {};
  Object.values(TOPICS).forEach((list) => list.forEach(([id, name]) => { TOPIC_NAME[id] = name; }));
  const allKeys = Object.values(TOPICS).flatMap((list) => list.map(([id]) => id));
  const unitOf = (id) => parseInt(id, 10);

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
  // Browser storage (falls back to memory when storage is blocked)
  // =====================================================================
  const mem = {};
  const lsGet = (k) => { try { const v = localStorage.getItem(k); return v === null ? (mem[k] ?? null) : v; } catch { return mem[k] ?? null; } };
  const lsSet = (k, v) => { mem[k] = v; try { localStorage.setItem(k, v); } catch {} };
  const lsDel = (k) => { delete mem[k]; try { localStorage.removeItem(k); } catch {} };
  const readJSON = (k, fallback) => { try { return JSON.parse(lsGet(k)) || fallback; } catch { return fallback; } };

  // =====================================================================
  // Accounts.
  // Cloud mode (firebase-config.js filled in): Firebase Authentication + Firestore,
  // so an account and its progress work on any device.
  // Local mode (no config, or Firebase unreachable): accounts live in this browser,
  // with passwords stored only as salted PBKDF2 hashes.
  // =====================================================================
  const USERS_KEY = "precalc-accounts-v1", SESSION_KEY = "precalc-session-v1";
  const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  async function hashPassword(password, saltHex) {
    if (!(window.crypto && crypto.subtle)) throw new Error("no-crypto");
    const salt = new Uint8Array(saltHex.match(/../g).map((h) => parseInt(h, 16)));
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    return toHex(await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" }, key, 256));
  }
  const newSalt = () => toHex(crypto.getRandomValues(new Uint8Array(16)));
  const normEmail = (e) => e.trim().toLowerCase();
  const users = () => readJSON(USERS_KEY, {});

  // ---- Firebase (cloud mode) ----
  const FB_VERSION = "10.12.2";
  let cloud = null, progressRef = null, signingUp = false;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  async function initCloud() {
    const cfg = window.FIREBASE_CONFIG;
    if (!cfg || !cfg.apiKey || !cfg.projectId) return null;
    const base = `https://www.gstatic.com/firebasejs/${FB_VERSION}/`;
    const load = (async () => {
      await loadScript(base + "firebase-app-compat.js");
      await Promise.all([loadScript(base + "firebase-auth-compat.js"), loadScript(base + "firebase-firestore-compat.js")]);
      const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(cfg);
      return { auth: app.auth(), db: app.firestore() };
    })();
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 10000));
    try { return await Promise.race([load, timeout]); } catch { return null; }
  }
  const SAME = "That email and password don't match an account. Check them and try again.";
  const FB_ERR = {
    "auth/email-already-in-use": "An account with this email already exists. Log in instead.",
    "auth/invalid-email": "Enter a valid email address, like name@school.org.",
    "auth/weak-password": "Choose a stronger password with at least 8 characters.",
    "auth/invalid-credential": SAME, "auth/invalid-login-credentials": SAME, "auth/wrong-password": SAME, "auth/user-not-found": SAME,
    "auth/missing-password": "Enter your password.",
    "auth/too-many-requests": "Too many attempts. Wait a few minutes, then try again.",
    "auth/network-request-failed": "Can't reach the server. Check your internet connection and try again.",
    "auth/operation-not-allowed": "Email sign-in isn't turned on for this site yet. The site owner needs to enable it in Firebase.",
    "permission-denied": "Your account works, but the progress database refused access. The site owner needs to publish the Firestore rules."
  };
  const fbMsg = (e) => FB_ERR[e && e.code] || "Something went wrong. Try again in a moment.";

  function setBusy(form, busy) {
    const b = form.querySelector("button[type=submit]");
    if (!b) return;
    if (busy) { b.dataset.label = b.textContent; b.textContent = "Please wait…"; b.disabled = true; }
    else { b.textContent = b.dataset.label || b.textContent; b.disabled = false; }
  }

  async function enterCloud(user, profile) {
    try {
      const uref = cloud.db.collection("users").doc(user.uid);
      progressRef = cloud.db.collection("progress").doc(user.uid);
      let prof = profile;
      if (!prof) { const snap = await uref.get(); prof = snap.exists ? snap.data() : null; }
      if (!prof) {
        const [first, ...rest] = (user.displayName || "Student").split(" ");
        prof = { first, last: rest.join(" "), email: user.email };
      }
      const ps = await progressRef.get();
      // First cloud login: carry over progress from a browser-only account with the same email.
      const data = ps.exists ? ps.data() : readJSON("precalc-progress-v3:" + normEmail(user.email), {});
      startApp(user.email, prof, data);
      if (!ps.exists) saveStore();
    } catch (e) {
      progressRef = null;
      showAuth("login");
      authError(fbMsg(e));
      try { await cloud.auth.signOut(); } catch {}
    }
  }

  // ---- Auth screen ----
  function showAuth(mode) {
    $("#booting").hidden = true;
    $("#auth").hidden = false; $("#app").hidden = true;
    const signup = mode !== "login";
    $("#signupForm").hidden = !signup; $("#loginForm").hidden = signup;
    $("#tabSignup").setAttribute("aria-selected", signup); $("#tabLogin").setAttribute("aria-selected", !signup);
    $("#authMsg").textContent = "";
    const first = signup ? $("#suFirst") : $("#liEmail");
    if (first) first.focus();
  }
  function authError(msg) { const el = $("#authMsg"); el.textContent = msg; el.className = "auth-msg bad"; }
  function authNote(msg) { const el = $("#authMsg"); el.textContent = msg; el.className = "auth-msg good"; }

  $("#tabSignup").addEventListener("click", () => showAuth("signup"));
  $("#tabLogin").addEventListener("click", () => showAuth("login"));
  $("#toLogin").addEventListener("click", () => showAuth("login"));
  $("#toSignup").addEventListener("click", () => showAuth("signup"));

  $("#signupForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const first = $("#suFirst").value.trim(), last = $("#suLast").value.trim(), email = normEmail($("#suEmail").value), pw = $("#suPass").value;
    if (!first || !last) return authError("Enter your first and last name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return authError("Enter a valid email address, like name@school.org.");
    if (pw.length < 8) return authError("Use a password with at least 8 characters.");

    if (cloud) {
      setBusy(form, true); signingUp = true;
      try {
        const cred = await cloud.auth.createUserWithEmailAndPassword(email, pw);
        await cred.user.updateProfile({ displayName: `${first} ${last}` });
        const profile = { first, last, email, created: Date.now() };
        await cloud.db.collection("users").doc(cred.user.uid).set(profile);
        await enterCloud(cred.user, profile);
      } catch (err) { authError(fbMsg(err)); }
      signingUp = false; setBusy(form, false);
      return;
    }

    const all = users();
    if (all[email]) return authError("An account with this email already exists on this device. Log in instead.");
    try {
      const salt = newSalt();
      all[email] = { first, last, salt, hash: await hashPassword(pw, salt), created: Date.now() };
    } catch { return authError("This browser can't create secure accounts. Open the site over https in an up-to-date browser."); }
    lsSet(USERS_KEY, JSON.stringify(all));
    lsSet(SESSION_KEY, email);
    startApp(email, all[email]);
  });

  $("#loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const email = normEmail($("#liEmail").value), pw = $("#liPass").value;
    if (cloud) {
      setBusy(form, true);
      try { await cloud.auth.signInWithEmailAndPassword(email, pw); }   // onAuthStateChanged takes it from here
      catch (err) { authError(fbMsg(err)); }
      setBusy(form, false);
      return;
    }
    const u = users()[email];
    if (!u) return authError("No account with that email on this device. Check the spelling or sign up.");
    let ok = false;
    try { ok = (await hashPassword(pw, u.salt)) === u.hash; } catch { return authError("This browser can't check passwords. Open the site over https in an up-to-date browser."); }
    if (!ok) return authError("That password doesn't match. Try again.");
    lsSet(SESSION_KEY, email);
    startApp(email, u);
  });

  $("#forgotBtn").addEventListener("click", async () => {
    const email = normEmail($("#liEmail").value);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return authError("Type your email above, then choose “Forgot password?” again.");
    try { await cloud.auth.sendPasswordResetEmail(email); authNote("If there's an account for that email, a password reset link is on its way. Check your inbox and spam folder."); }
    catch (err) { authError(err && err.code === "auth/user-not-found" ? "If there's an account for that email, a password reset link is on its way." : fbMsg(err)); }
  });

  async function logOut() {
    await flushCloud();
    lsDel(SESSION_KEY);
    if (cloud) { try { await cloud.auth.signOut(); } catch {} }
    try { location.reload(); } catch { showAuth("login"); }
  }

  // =====================================================================
  // App state
  // =====================================================================
  let store, STORE_KEY, account;
  const state = { units: new Set(), calc: "all", len: 10, locked: new Set(), focus: new Set(), view: "mastery",
    set: [], idx: 0, picked: null, order: [], results: [], steps: null };

  // Progress is cached in this browser and, in cloud mode, synced to Firestore shortly after each change.
  let syncTimer = null;
  function saveStore() {
    lsSet(STORE_KEY, JSON.stringify(store));
    if (progressRef) { clearTimeout(syncTimer); syncTimer = setTimeout(flushCloud, 1500); }
  }
  async function flushCloud() {
    clearTimeout(syncTimer); syncTimer = null;
    if (!progressRef || !store) return;
    try { await progressRef.set({ stats: store.stats, topics: store.topics, prefs: store.prefs, updatedAt: Date.now() }); } catch {}
  }
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden" && syncTimer) flushCloud(); });
  function persistPrefs() {
    store.prefs = { ...store.prefs, units: [...state.units], calc: state.calc, len: state.len, locked: [...state.locked], focus: [...state.focus], view: state.view };
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
    const open = allKeys.filter((k) => state.units.has(unitOf(k)) && !state.locked.has(k));
    const focused = open.filter((k) => state.focus.has(k));
    return { open, focused, use: new Set(focused.length ? focused : open) };
  }
  function pool() {
    const { use } = activeTopics();
    return BANK.filter((q) => use.has(q.key) && (state.calc === "all" || (state.calc === "yes") === q.calc));
  }

  function topicStats(key) {
    const t = store.topics[key] || { a: 0, c: 0 };
    return { a: t.a, c: t.c, pct: t.a ? Math.round((t.c / t.a) * 100) : null, mastered: t.a >= MASTER_MIN && t.c / t.a >= MASTER_ACC };
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
    chipRow($("#unitChips"), Object.keys(UNITS).map((k) => [+k, `Unit ${k}`]),
      (v) => state.units.has(v),
      (v) => {
        if (state.units.has(v) && state.units.size > 1) state.units.delete(v); else state.units.add(v);
        persistPrefs(); renderControls();
      });
    chipRow($("#calcChips"), [["all", "Both"], ["no", "No calculator"], ["yes", "Calculator"]],
      (v) => state.calc === v, (v) => { state.calc = v; persistPrefs(); renderControls(); });
    chipRow($("#lenChips"), [[10, "10"], [20, "20"], [40, "40"]],
      (v) => state.len === v, (v) => { state.len = v; persistPrefs(); renderControls(); });
    renderTopics();
    $("#startBtn").disabled = pool().length === 0;
  }

  function renderTopics() {
    const { open, focused } = activeTopics();
    const shown = allKeys.filter((k) => state.units.has(unitOf(k)));
    const lockedShown = shown.filter((k) => state.locked.has(k)).length;
    $("#topicStatus").textContent = focused.length
      ? `Focusing on ${focused.length} topic${focused.length === 1 ? "" : "s"}`
      : `All topics in the selected units` + (lockedShown ? ` except ${lockedShown} locked` : "");
    $("#clearFocus").hidden = !focused.length;
    $("#unlockAll").hidden = !state.locked.size;
    void open;

    const grid = $("#topicGrid");
    grid.innerHTML = [...state.units].sort().map((u) => `
      <div class="tcol">
        <h3>Unit ${u} · ${UNITS[u]}</h3>
        ${TOPICS[u].map(([id, name]) => {
          const locked = state.locked.has(id), st = topicStats(id), domId = "focus-" + id.replace(".", "-");
          const meta = locked ? "Locked" : st.mastered ? `<span class="tag-mastered">Mastered</span> · ${st.pct}% correct` : st.pct != null ? `${st.pct}% correct` : "Not started";
          return `<div class="trow${locked ? " locked" : ""}">
            <input type="checkbox" id="${domId}" data-key="${id}" ${state.focus.has(id) && !locked ? "checked" : ""} ${locked ? "disabled" : ""}>
            <label for="${domId}"><span class="tname"><span class="tnum">${id}</span> ${name}</span>
              <span class="tmeta">${meta}</span></label>
            <button type="button" class="lockbtn" data-key="${id}" aria-pressed="${locked}" aria-label="${locked ? "Unlock" : "Lock"} topic ${id}" title="${locked ? "Unlock topic" : "Lock topic"}">${locked ? LOCK_SVG : UNLOCK_SVG}</button>
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
      const again = grid.querySelector(`.lockbtn[data-key="${k}"]`); if (again) again.focus();
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
          <span class="badge">${q.t} ${TOPIC_NAME[q.t]}</span>
          <span class="badge calc">${q.calc ? "Calculator" : "No calculator"}</span>
        </div>
        <span class="counter">Question ${state.idx + 1} of ${n}</span>
      </div>
      <div class="bar" aria-hidden="true"><span style="width:${(state.idx / n) * 100}%"></span></div>
      <div class="question">${q.q}</div>
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
    const bump = (obj, key) => { const s = obj[key] || { a: 0, c: 0, h: 0 }; s.a++; if (ok) s.c++; if (hinted) s.h++; obj[key] = s; };
    bump(store.stats, q.id);
    bump(store.topics, q.t);
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
    renderScore(); renderProgress(); renderTopics();
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
        <span class="label">Set complete</span>
        <h2>${right} of ${r.length} correct (${pct}%)</h2>
        <p class="small">${verdict}${hinted ? ` You used the step-by-step hint on ${hinted} question${hinted === 1 ? "" : "s"}.` : ""}</p>
        ${missed.length ? `
          <div class="review">
            <strong>Questions to review</strong>
            <ol class="missed-list">${missed.map((m) => `
              <li><div class="question-sm">${m.q.q}</div><span class="ans">Answer: <span class="m">${m.q.c[0]}</span></span></li>`).join("")}
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

  function unitStats(u) {
    const ids = TOPICS[u].map(([id]) => id);
    let a = 0, c = 0, mastered = 0;
    ids.forEach((id) => { const t = topicStats(id); a += t.a; c += t.c; if (t.mastered) mastered++; });
    return { a, c, pct: a ? Math.round((c / a) * 100) : null, mastered, topics: ids.length };
  }
  function totals() {
    let a = 0, c = 0, h = 0;
    Object.values(store.topics).forEach((t) => { a += t.a; c += t.c; h += t.h; });
    const mastered = allKeys.filter((k) => topicStats(k).mastered).length;
    return { answered: a, correct: c, hinted: h, mastered, topics: allKeys.length };
  }

  function renderProgress() {
    const mastery = state.view === "mastery";
    chipRow($("#viewChips"), [["mastery", "Mastery"], ["accuracy", "Accuracy"]], (v) => state.view === v,
      (v) => { state.view = v; persistPrefs(); renderProgress(); });
    $("#progressHelp").textContent = mastery
      ? `A topic is mastered once you've answered at least ${MASTER_MIN} of its questions with ${MASTER_ACC * 100}% or more correct.`
      : "The share of your answers in each unit that were correct.";
    $("#mastery").innerHTML = Object.entries(UNITS).map(([u, name]) => {
      const s = unitStats(u);
      const right = mastery ? `${s.mastered} of ${s.topics} topics` : s.pct == null ? "Not started" : `${s.pct}%`;
      const width = mastery ? (s.mastered / s.topics) * 100 : s.pct || 0;
      const sub = mastery ? "" : s.a ? `<span class="usub">${s.c} correct of ${s.a} answered</span>` : "";
      return `<div class="unit-row">
        <div class="top"><span>Unit ${u}: ${name.replace(" Functions", "")}</span><span class="num">${right}</span></div>
        <div class="meter ${mastery ? "" : "acc"}"><span style="width:${width}%"></span></div>${sub}
      </div>`;
    }).join("");
    const t = totals();
    $("#topSolved").textContent = `${t.answered} answered`;
    renderReset(false);
    renderShare();
  }

  function renderReset(confirming) {
    const area = $("#resetArea");
    if (!confirming) {
      area.innerHTML = `<button class="linkbtn" type="button" id="resetBtn">Reset progress</button>`;
      $("#resetBtn").addEventListener("click", () => renderReset(true));
    } else {
      area.innerHTML = `<div class="confirm"><span>Clear all of your saved progress?</span>
        <button class="btn small-btn" type="button" id="yesReset">Clear</button>
        <button class="btn ghost small-btn" type="button" id="noReset">Cancel</button></div>`;
      $("#yesReset").addEventListener("click", () => { store.stats = {}; store.topics = {}; saveStore(); renderProgress(); renderTopics(); });
      $("#noReset").addEventListener("click", () => renderReset(false));
    }
  }

  function buildReport() {
    const t = totals();
    const now = new Date();
    const date = now.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
    const line = "-".repeat(56);
    const lines = [
      "PRECALC PRACTICE ROOM - PROGRESS REPORT",
      line,
      `Student:   ${account.first} ${account.last}`,
      `Email:     ${account.email}`,
      `Date:      ${date}`,
      line,
      "",
      "OVERALL",
      `  Questions answered:   ${t.answered}`,
      `  Accuracy:             ${t.answered ? Math.round((t.correct / t.answered) * 100) + "%" : "-"}`,
      `  Topics mastered:      ${t.mastered} of ${t.topics}`,
      `  Answers using hints:  ${t.hinted}`,
      "",
      "BY UNIT"
    ];
    Object.entries(UNITS).forEach(([u, name]) => {
      const s = unitStats(u);
      lines.push(`  Unit ${u}: ${name}`);
      lines.push(`    Accuracy: ${s.pct == null ? "not started" : s.pct + "% (" + s.c + " of " + s.a + ")"}    Mastered: ${s.mastered} of ${s.topics} topics`);
    });
    lines.push("", "BY TOPIC (topics practiced so far)");
    const practiced = allKeys.filter((k) => topicStats(k).a > 0);
    if (!practiced.length) lines.push("  None yet.");
    practiced.forEach((k) => {
      const s = topicStats(k);
      lines.push(`  ${(k + " " + TOPIC_NAME[k]).padEnd(58).slice(0, 58)} ${String(s.pct + "%").padStart(4)}  (${s.c}/${s.a})${s.mastered ? "  MASTERED" : ""}`);
    });
    const weak = practiced.map((k) => ({ k, ...topicStats(k) })).filter((x) => x.a >= 3 && x.pct < 70).sort((a, b) => a.pct - b.pct).slice(0, 5);
    if (weak.length) {
      lines.push("", "NEEDS PRACTICE");
      weak.forEach((x) => lines.push(`  ${x.k} ${TOPIC_NAME[x.k]} (${x.pct}%)`));
    }
    if (state.focus.size) lines.push("", "Currently focusing on: " + [...state.focus].join(", "));
    if (state.locked.size) lines.push("Locked topics: " + [...state.locked].join(", "));
    lines.push("", line, "Generated by Precalc Practice Room");
    return lines.join("\n");
  }

  function renderShare() {
    const t = totals();
    $("#shareSummary").textContent = t.answered
      ? `${t.answered} answered, ${Math.round((t.correct / t.answered) * 100)}% correct, ${t.mastered} topic${t.mastered === 1 ? "" : "s"} mastered.`
      : "Answer a few questions and your report will fill in.";
  }

  async function downloadText(filename, text) {
    if (window.claude && typeof window.claude.use === "function") {
      try {
        const dl = await window.claude.use("downloads");
        if (dl) { await dl.save({ filename, data: text }); return "saved"; }
      } catch (e) { if (e && /declin|cancel|abort/i.test(String(e.code || e.message))) return "declined"; }
    }
    try {
      const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      return "saved";
    } catch { return "failed"; }
  }

  $("#downloadReport").addEventListener("click", async () => {
    const text = buildReport();
    const slug = `${account.first}-${account.last}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "student";
    const res = await downloadText(`precalc-progress-${slug}.txt`, text);
    $("#copyMsg").textContent = res === "saved" ? "Report downloaded. Attach the .txt file to an email or upload it to your class page."
      : res === "declined" ? "Download canceled." : "The download didn't start. Use “Show report text” and copy it instead.";
  });
  $("#showReport").addEventListener("click", () => {
    const box = $("#reportBox");
    box.value = buildReport(); box.hidden = !box.hidden;
    $("#showReport").textContent = box.hidden ? "Show report text" : "Hide report text";
    if (!box.hidden) { box.focus(); box.select(); }
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

    let rows = [], mine = null;
    db.collection("board").orderBy("correct", "desc").limit(200).onSnapshot((snap) => {
      rows = snap.docs.filter((d) => d.exists).map((d) => ({ id: d.id, ...d.data() }));
      mine = rows.find((r) => r.id === uid) || null;
      drawBoard();
    }, () => { msg.textContent = "The class board couldn't load. Reload the page to try again."; });

    async function drawBoard() {
      postBtn.textContent = mine ? "Update my post" : "Post my progress";
      removeBtn.hidden = !mine;
      const list = $("#boardList");
      if (!rows.length) { list.innerHTML = `<p class="small">No one has posted yet. Post your progress to start the board.</p>`; return; }
      const ps = user ? await user.profiles(rows.map((r) => r.id)) : {};
      list.innerHTML = "";
      rows.forEach((r, i) => {
        const p = ps[r.id] || {};
        const row = document.createElement("div");
        row.className = "brow" + (r.id === uid ? " me" : "");
        const acc = r.answered ? Math.round((r.correct / r.answered) * 100) : 0;
        const tot = r.topics || allKeys.length;
        row.innerHTML = `<span class="brank">${i + 1}</span>
          <img class="bav" alt="" src="">
          <div class="bmain"><div class="btop"><span class="bname"></span><span class="num">${r.correct || 0} correct</span></div>
            <div class="meter"><span style="width:${Math.min(100, ((r.mastered || 0) / tot) * 100)}%"></span></div>
            <span class="bsub">${acc}% accuracy · ${r.mastered || 0} topics mastered · updated ${ago(r.updatedAt)}</span></div>`;
        row.querySelector(".bav").src = p.avatarUrl || "";
        row.querySelector(".bname").textContent = (p.name || "Someone") + (r.id === uid ? " (you)" : "");
        list.appendChild(row);
      });
    }

    postBtn.addEventListener("click", async () => {
      const t = totals();
      postBtn.disabled = true;
      try {
        await db.doc("board/" + uid).set({ answered: t.answered, correct: t.correct, mastered: t.mastered, topics: t.topics, updatedAt: Date.now() });
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
    if (e.metaKey || e.ctrlKey || e.altKey || $("#app").hidden) return;
    const tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
    if (!document.querySelector(".choice")) return;
    const k = LETTERS.indexOf(e.key.toUpperCase());
    if (k >= 0 && state.picked === null) { answer(k); e.preventDefault(); }
    else if (e.key === "Enter" && state.picked !== null && tag !== "BUTTON") { next(); e.preventDefault(); }
  });

  let started = false;
  function startApp(email, u, data) {
    if (started) return;
    started = true;
    lsSet("precalc-returning", "1");
    account = { email, first: u.first, last: u.last };
    STORE_KEY = "precalc-progress-v3:" + normEmail(email);
    store = data || readJSON(STORE_KEY, {});
    store.stats = store.stats || {};
    store.topics = store.topics || {};
    store.prefs = store.prefs || {};
    const p = store.prefs;
    state.units = new Set((p.units || [1, 2, 3]).filter((x) => UNITS[x]));
    if (!state.units.size) [1, 2, 3].forEach((x) => state.units.add(x));
    state.calc = p.calc || "all";
    state.len = [10, 20, 40].includes(p.len) ? p.len : 10;
    state.locked = new Set((p.locked || []).filter((k) => allKeys.includes(k)));
    state.focus = new Set((p.focus || []).filter((k) => allKeys.includes(k)));
    state.view = p.view === "accuracy" ? "accuracy" : "mastery";

    $("#booting").hidden = true; $("#auth").hidden = true; $("#app").hidden = false; $("#userArea").hidden = false;
    $("#userName").textContent = `${u.first} ${u.last}`;
    $("#welcomeName").textContent = u.first;

    const box = $("#topicsBox");
    box.open = !!p.topicsOpen;
    box.addEventListener("toggle", () => { store.prefs.topicsOpen = box.open; saveStore(); });
    $("#clearFocus").addEventListener("click", () => { state.focus.clear(); persistPrefs(); renderControls(); });
    $("#unlockAll").addEventListener("click", () => { state.locked.clear(); persistPrefs(); renderControls(); });
    $("#startBtn").addEventListener("click", () => startSet());
    $("#logoutBtn").addEventListener("click", logOut);

    renderControls();
    renderProgress();
    startSet();
    initBoard();
    window.scrollTo(0, 0);
  }

  // Boot: use Firebase when it's configured and reachable, otherwise browser-only accounts.
  (async () => {
    cloud = await initCloud();
    if (cloud) {
      $("#forgotBtn").hidden = false;
      $("#authNote").textContent = "Your account works on any device. Log in with the same email and password.";
      cloud.auth.onAuthStateChanged((user) => {
        if (started || signingUp) return;
        if (user) enterCloud(user);
        else showAuth(lsGet("precalc-returning") ? "login" : "signup");
      });
      return;
    }
    const sessionEmail = lsGet(SESSION_KEY), sessionUser = sessionEmail && users()[sessionEmail];
    if (sessionUser) startApp(sessionEmail, sessionUser);
    else showAuth(Object.keys(users()).length ? "login" : "signup");
  })();

  window.__precalc = { checkStep, compile, pretty };
})();
