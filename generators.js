// Question templates. Each template fills in different numbers to produce many distinct questions,
// each with choices, an explanation, and hint steps (same format as questions.js).
// A fixed seed per template means the generated bank is identical on every visit.

(() => {
  // ---------------------------------------------------------------- helpers
  const X = "<i>x</i>", TH = "θ", M = "−";
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const sgn = (n) => (n < 0 ? M + Math.abs(n) : String(n));
  const par = (n) => (n < 0 ? `(${sgn(n)})` : String(n));
  const fnum = (n) => { const r = Math.round(n * 10000) / 10000; return sgn(r); };
  const anum = (n) => String(Math.round(n * 10000) / 10000);
  const big = (n) => (n < 0 ? M : "") + Math.abs(n).toLocaleString("en-US");
  const SUPS = { 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const pw = (v, n) => (n === 1 ? v : v + (SUPS[n] || `<sup>${n}</sup>`));
  const sup = (b, e) => `${b}<sup>${e}</sup>`;
  function fr(n, d) {
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1; n /= g; d /= g;
    const body = Math.abs(n) + (d !== 1 ? "/" + d : "");
    return { n, d, v: n / d, h: (n < 0 ? M : "") + body, a: (n < 0 ? "-" : "") + body };
  }
  // polynomial from [coef, power] pairs, in the order given
  function polyT(pairs, v = X) {
    const terms = pairs.filter(([c]) => c !== 0).map(([c, p]) => {
      const abs = Math.abs(c);
      return { neg: c < 0, body: p === 0 ? String(abs) : (abs === 1 ? "" : abs) + pw(v, p) };
    });
    if (!terms.length) return "0";
    return terms.map((t, i) => (i === 0 ? (t.neg ? M : "") + t.body : (t.neg ? " − " : " + ") + t.body)).join("");
  }
  function polyTA(pairs, v = "x") {
    const terms = pairs.filter(([c]) => c !== 0).map(([c, p]) => {
      const abs = Math.abs(c);
      return { neg: c < 0, body: p === 0 ? String(abs) : (abs === 1 ? "" : abs) + v + (p > 1 ? "^" + p : "") };
    });
    if (!terms.length) return "0";
    return terms.map((t, i) => (i === 0 ? (t.neg ? "-" : "") + t.body : (t.neg ? "-" : "+") + t.body)).join("");
  }
  const toPairs = (cs) => cs.map((c, i) => [c, cs.length - 1 - i]);
  const poly = (cs, v) => polyT(toPairs(cs), v);
  const polyA = (cs, v) => polyTA(toPairs(cs), v);
  const fac = (a) => (a === 0 ? X : `(${X} ${a > 0 ? "−" : "+"} ${Math.abs(a)})`);
  const facA = (a) => (a === 0 ? "x" : `(x${a > 0 ? "-" : "+"}${Math.abs(a)})`);
  const pt = (x, y) => `(${x}, ${y})`;
  const xeq = (v) => `${X} = ${v}`;
  const yeq = (v) => `<i>y</i> = ${v}`;
  const coefH = (a) => (a === 1 ? "" : a === -1 ? M : sgn(a));
  const plusK = (k) => (k === 0 ? "" : ` ${k > 0 ? "+" : "−"} ${Math.abs(k)}`);
  const binom = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i; return r; };
  const table = (r1, r2) => `<div class="vt-wrap"><table class="vt">${[r1, r2].map((r) =>
    `<tr>${r.map((c, i) => (i ? `<td>${c}</td>` : `<th>${c}</th>`)).join("")}</tr>`).join("")}</table></div>`;
  const diffs = (a) => a.slice(1).map((v, i) => v - a[i]);
  const sub = (n) => `<i>a</i><sub>${n}</sub>`;
  const logb = (b) => (b === 10 ? "log" : `log<sub>${b}</sub>`);

  // multiples of π
  function pf(n, d = 1) {
    if (d < 0) { n = -n; d = -d; }
    if (n === 0) return { n: 0, d: 1, v: 0, h: "0", a: "0" };
    const g = gcd(n, d); n /= g; d /= g;
    const c = Math.abs(n) === 1 ? "" : Math.abs(n);
    return { n, d, v: (n * Math.PI) / d, h: (n < 0 ? M : "") + c + "π" + (d !== 1 ? "/" + d : ""), a: (n < 0 ? "-" : "") + c + "pi" + (d !== 1 ? "/" + d : "") };
  }
  const fromRad = (t) => pf(Math.round(t / (Math.PI / 12)), 12);
  const wrap2pi = (t) => { const k = Math.round(t / (Math.PI / 12)); return pf(((k % 24) + 24) % 24, 12); };
  const SPECIAL = (() => {
    const seen = new Set(), out = [];
    [6, 4, 3, 2, 1].forEach((d) => { for (let n = 0; n < 2 * d; n++) { const p = pf(n, d); if (!seen.has(p.h)) { seen.add(p.h); out.push(p); } } });
    return out.sort((a, b) => a.v - b.v);
  })();
  // exact values n·√m/d
  const EX = [[0, 0, 1, 1], [0.5, 1, 1, 2], [Math.SQRT2 / 2, 1, 2, 2], [Math.sqrt(3) / 2, 1, 3, 2], [1, 1, 1, 1], [Math.sqrt(3) / 3, 1, 3, 3],
    [Math.sqrt(3), 1, 3, 1], [2, 2, 1, 1], [(2 * Math.sqrt(3)) / 3, 2, 3, 3], [Math.SQRT2, 1, 2, 1]];
  function radStr(sign, n, m, d) {
    if (n === 0) return { h: "0", a: "0", v: 0 };
    const g = gcd(n, d); n /= g; d /= g;
    const hb = m === 1 ? String(n) : (n === 1 ? "" : n) + "√" + m;
    const ab = m === 1 ? String(n) : (n === 1 ? "" : n) + "sqrt(" + m + ")";
    return { h: (sign < 0 ? M : "") + hb + (d !== 1 ? "/" + d : ""), a: (sign < 0 ? "-" : "") + ab + (d !== 1 ? "/" + d : ""), v: sign * n * Math.sqrt(m) / d };
  }
  function exact(v, k = 1) {
    if (!Number.isFinite(v) || Math.abs(v) > 1e6) return null;
    const e = EX.find(([val]) => Math.abs(Math.abs(v) - val) < 1e-9);
    if (!e) return null;
    const s = v * k < 0 ? -1 : 1;
    return radStr(s, Math.abs(k) * e[1], e[2], e[3]);
  }
  const TRIG = {
    sin: Math.sin, cos: Math.cos,
    tan: (t) => (Math.abs(Math.cos(t)) < 1e-12 ? NaN : Math.tan(t)),
    sec: (t) => (Math.abs(Math.cos(t)) < 1e-12 ? NaN : 1 / Math.cos(t)),
    csc: (t) => (Math.abs(Math.sin(t)) < 1e-12 ? NaN : 1 / Math.sin(t)),
    cot: (t) => (Math.abs(Math.sin(t)) < 1e-12 ? NaN : Math.cos(t) / Math.sin(t))
  };
  const tv = (f, t) => { const v = TRIG[f](t); return Math.abs(v) < 1e-12 ? 0 : v; };
  const VALS = ["0", "1/2", "−1/2", "√2/2", "−√2/2", "√3/2", "−√3/2", "1", "−1", "√3", "−√3", "√3/3", "−√3/3", "2", "−2", "√2", "−√2", "2√3/3", "−2√3/3"];
  const quadrantOf = (p) => { const t = ((p.v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); return t < Math.PI / 2 ? 1 : t < Math.PI ? 2 : t < 1.5 * Math.PI ? 3 : 4; };
  const isQuadrantal = (p) => Math.abs(Math.sin(2 * p.v)) < 1e-9;
  const refAngle = (p) => { const t = ((p.v % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI); const r = t <= Math.PI / 2 ? t : t <= Math.PI ? Math.PI - t : t <= 1.5 * Math.PI ? t - Math.PI : 2 * Math.PI - t; return fromRad(r); };
  const fnH = (f, arg) => `${f}(${arg})`;

  // ---------------------------------------------------------------- framework
  function rng(seed) {
    let a = seed >>> 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function strHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function makeR(f) {
    const int = (a, b) => a + Math.floor(f() * (b - a + 1));
    const R = {
      f, int, bool: () => f() < 0.5,
      pick: (arr) => arr[Math.floor(f() * arr.length)],
      nz: (a, b) => { let v; do v = int(a, b); while (v === 0); return v; },
      shuffle: (arr) => { const c = arr.slice(); for (let i = c.length - 1; i > 0; i--) { const j = Math.floor(f() * (i + 1)); [c[i], c[j]] = [c[j], c[i]]; } return c; },
      distinct: (n, a, b) => { const s = new Set(); while (s.size < n) s.add(int(a, b)); return [...s]; }
    };
    return R;
  }
  const GENS = [];
  const G = (t, count, fn) => GENS.push({ t, count, fn });

  // ================================================================ UNIT 1
  G("1.1", 25, (R) => {
    const incr = R.bool(), up = R.bool();
    const d0 = R.int(1, 6), dd = R.int(1, 3), start = R.int(-10, 20);
    let mags = [0, 1, 2, 3].map((i) => d0 + i * dd);
    if (incr !== up) mags = mags.reverse();
    const ds = mags.map((m) => (incr ? m : -m));
    const vals = [start]; ds.forEach((d) => vals.push(vals[vals.length - 1] + d));
    const lab = (i, u) => `${i ? "Increasing" : "Decreasing"} and concave ${u ? "up" : "down"}`;
    return {
      q: `The table gives values of <i>f</i> at equally spaced inputs. Which best describes <i>f</i> on the interval [0, 4]?${table([X, 0, 1, 2, 3, 4], ["<i>f</i>(<i>x</i>)", ...vals.map(sgn)])}`,
      c: [lab(incr, up), lab(incr, !up), lab(!incr, up), lab(!incr, !up)],
      e: `The differences between consecutive outputs are ${ds.map(sgn).join(", ")}. They are all ${incr ? "positive" : "negative"}, so <i>f</i> is ${incr ? "increasing" : "decreasing"}. The differences are ${up ? "increasing" : "decreasing"}, so the graph is concave ${up ? "up" : "down"}.`,
      s: [{ p: "Find the differences between consecutive outputs. Enter them separated by commas.", a: ds.join(",") },
        { p: "Are the outputs increasing or decreasing?", o: incr ? ["Increasing", "Decreasing"] : ["Decreasing", "Increasing"] },
        { p: "Are the differences increasing or decreasing?", o: up ? ["Increasing, so concave up", "Decreasing, so concave down"] : ["Decreasing, so concave down", "Increasing, so concave up"] }]
    };
  });

  G("1.2", 25, (R) => {
    const p = R.nz(-3, 3), q = R.int(-6, 6), r = R.int(-9, 9), a = R.int(-3, 3), b = a + R.int(2, 4);
    const f = (x) => p * x * x + q * x + r, fa = f(a), fb = f(b), m = (fb - fa) / (b - a);
    return {
      q: `What is the average rate of change of <span class="m"><i>f</i>(<i>x</i>) = ${poly([p, q, r])}</span> on the interval [${sgn(a)}, ${sgn(b)}]?`,
      c: [m, fb - fa, m + p, m - (b - a), -m].map(sgn),
      e: `<i>f</i>(${sgn(b)}) = ${sgn(fb)} and <i>f</i>(${sgn(a)}) = ${sgn(fa)}. Average rate of change = (${sgn(fb)} − ${par(fa)}) / (${sgn(b)} − ${par(a)}) = ${sgn(fb - fa)}/${b - a} = ${sgn(m)}.`,
      s: [{ p: `Find <i>f</i>(${sgn(b)}).`, a: String(fb) }, { p: `Find <i>f</i>(${sgn(a)}).`, a: String(fa) },
        { p: `Divide the change in <i>f</i> by the change in <i>x</i>, which is ${b - a}.`, a: String(m) }]
    };
  });

  G("1.3", 13, (R) => {
    const m = R.nz(-5, 5), b = R.int(-10, 10), x1 = R.int(-3, 2), x2 = x1 + R.int(1, 4), x3 = x2 + R.int(1, 5);
    const f = (x) => m * x + b, y3 = f(x3), n = x3 - x2;
    return {
      q: `A linear function <i>f</i> has <i>f</i>(${sgn(x1)}) = ${sgn(f(x1))} and <i>f</i>(${sgn(x2)}) = ${sgn(f(x2))}. What is <i>f</i>(${sgn(x3)})?`,
      c: [y3, y3 + m, y3 - m, f(x2) + n, -y3].map(sgn),
      e: `A linear function has a constant rate of change: (${sgn(f(x2))} − ${par(f(x1))}) / (${sgn(x2)} − ${par(x1)}) = ${sgn(m)}. Moving ${n} unit${n > 1 ? "s" : ""} from <i>x</i> = ${sgn(x2)} gives <i>f</i>(${sgn(x3)}) = ${sgn(f(x2))} + ${n}·${par(m)} = ${sgn(y3)}.`,
      s: [{ p: "Find the rate of change (slope).", a: String(m) }, { p: `Find <i>f</i>(${sgn(x3)}).`, a: String(y3) }]
    };
  });
  G("1.3", 13, (R) => {
    const a = R.nz(-4, 4), b = R.int(-6, 6), c = R.int(-9, 9);
    return {
      q: `For <span class="m"><i>f</i>(<i>x</i>) = ${poly([a, b, c])}</span>, the average rate of change is found over [0, 1], [1, 2], [2, 3], and so on. By how much does it change from each interval to the next?`,
      c: [2 * a, a, 4 * a, -2 * a, b].map(sgn),
      e: `Over [0, 1] the average rate of change is <i>f</i>(1) − <i>f</i>(0) = ${sgn(a + b)}. Over [1, 2] it is <i>f</i>(2) − <i>f</i>(1) = ${sgn(3 * a + b)}. For a quadratic, these change by the constant 2<i>a</i> = ${sgn(2 * a)}.`,
      s: [{ p: "Find the average rate of change over [0, 1].", a: String(a + b) }, { p: "Find the average rate of change over [1, 2].", a: String(3 * a + b) },
        { p: "Subtract to find the change.", a: String(2 * a) }]
    };
  });

  G("1.4", 16, (R) => {
    const [r1, r2, r3] = R.distinct(3, -6, 6).sort((x, y) => x - y);
    const s = R.bool() ? 1 : -1, askNeg = R.bool();
    const A = `${X} &lt; ${sgn(r1)} or ${sgn(r2)} &lt; ${X} &lt; ${sgn(r3)}`;
    const B = `${sgn(r1)} &lt; ${X} &lt; ${sgn(r2)} or ${X} &gt; ${sgn(r3)}`;
    const C = `${sgn(r1)} &lt; ${X} &lt; ${sgn(r3)}`;
    const D = `${X} &lt; ${sgn(r1)} or ${X} &gt; ${sgn(r3)}`;
    const neg = s > 0 ? A : B, pos = s > 0 ? B : A;
    return {
      q: `Let <span class="m"><i>f</i>(<i>x</i>) = ${s < 0 ? M : ""}${fac(r1)}${fac(r2)}${fac(r3)}</span>. On which interval(s) is <i>f</i>(<i>x</i>) ${askNeg ? "&lt;" : "&gt;"} 0?`,
      c: [askNeg ? neg : pos, askNeg ? pos : neg, C, D],
      e: `The zeros are ${sgn(r1)}, ${sgn(r2)}, and ${sgn(r3)}, each of multiplicity 1, so the sign changes at each one. For large <i>x</i>, <i>f</i>(<i>x</i>) is ${s > 0 ? "positive" : "negative"}. So <i>f</i> is negative on ${neg} and positive on ${pos}.`,
      s: [{ p: "Enter the zeros of <i>f</i>, separated by commas.", a: [r1, r2, r3].join(","), set: true },
        { p: `For <i>x</i> &gt; ${sgn(r3)}, is <i>f</i>(<i>x</i>) positive or negative?`, o: s > 0 ? ["Positive", "Negative"] : ["Negative", "Positive"] },
        { p: "Each zero has odd multiplicity. What happens to the sign at each zero?", o: ["It changes", "It stays the same"] }]
    };
  });
  G("1.4", 12, (R) => {
    const n = R.int(3, 9), type = R.int(0, 3);
    if (type < 3) {
      const [what, ans] = [["relative extrema", n - 1], ["real zeros", n], ["points of inflection", n - 2]][type];
      return {
        q: `A polynomial function has degree ${n}. What is the greatest number of ${what} its graph can have?`,
        c: [ans, n + 1, n, n - 1, n - 2, n - 3].map(String),
        e: `A degree-${n} polynomial has at most ${n} real zeros, at most ${n - 1} relative extrema, and at most ${n - 2} points of inflection.`,
        s: [{ p: `At most how many real zeros can a degree-${n} polynomial have?`, a: String(n) }, { p: `So at most how many ${what}?`, a: String(ans) }]
      };
    }
    const odd = n % 2 === 1;
    return {
      q: `A polynomial function with real coefficients has degree ${n}. What is the least number of real zeros it can have?`,
      c: odd ? ["1", "0", String(n), String(n - 1)] : ["0", "1", "2", String(n)],
      e: odd ? `An odd-degree polynomial goes to opposite infinities at its two ends, so it must cross the <i>x</i>-axis at least once.` : `An even-degree polynomial can stay entirely above or below the <i>x</i>-axis (like <i>x</i>${SUPS[n] || ""} + 1), so it may have no real zeros.`,
      s: [{ p: "Is the degree odd or even?", o: odd ? ["Odd", "Even"] : ["Even", "Odd"] },
        { p: "Do the two ends of the graph go in opposite directions?", o: odd ? ["Yes, so it must cross the x-axis", "No"] : ["No, so it can avoid the x-axis", "Yes"] }]
    };
  });

  const cx = (a, b) => {
    const ib = (Math.abs(b) === 1 ? "" : Math.abs(b)) + "<i>i</i>";
    if (a === 0) return (b < 0 ? M : "") + ib;
    return `${sgn(a)} ${b < 0 ? "−" : "+"} ${ib}`;
  };
  G("1.5", 9, (R) => {
    const a = R.int(-5, 5), b = R.int(1, 6), r = R.int(-6, 6);
    return {
      q: `A polynomial with real coefficients has zeros <span class="m"><i>x</i> = ${sgn(r)}</span> and <span class="m"><i>x</i> = ${cx(a, b)}</span>. Which must also be a zero?`,
      c: [cx(a, -b), cx(-a, b), cx(-a, -b), sgn(-r), cx(b, a)],
      e: `Non-real zeros of a polynomial with real coefficients come in conjugate pairs. The conjugate of ${cx(a, b)} is ${cx(a, -b)}.`,
      s: [{ p: "Non-real zeros of a polynomial with real coefficients always come in…", o: ["Conjugate pairs", "Opposite pairs", "Reciprocal pairs"] },
        { p: `What is the conjugate of ${cx(a, b)}?`, o: [cx(a, -b), a === 0 ? String(b) : cx(-a, b)] }]
    };
  });
  G("1.5", 8, (R) => {
    const [r1, r2] = R.distinct(2, -6, 6), m1 = R.int(1, 3), m2 = R.int(1, 3), a = R.int(-4, 4), b = R.int(1, 5), deg = m1 + m2 + 2;
    return {
      q: `A polynomial with real coefficients has a zero at <i>x</i> = ${sgn(r1)} of multiplicity ${m1}, a zero at <i>x</i> = ${sgn(r2)} of multiplicity ${m2}, and a zero at <i>x</i> = ${cx(a, b)}. What is the least possible degree of the polynomial?`,
      c: [deg, deg - 1, deg - 2, deg + 1].map(String),
      e: `The conjugate ${cx(a, -b)} must also be a zero. Adding multiplicities: ${m1} + ${m2} + 1 + 1 = ${deg}.`,
      s: [{ p: "Which other zero is guaranteed?", o: [cx(a, -b), sgn(-r1)] }, { p: "Add the multiplicities of all the zeros.", a: String(deg) }]
    };
  });
  G("1.5", 9, (R) => {
    const [r1, r2] = R.distinct(2, -6, 6), m1 = R.int(1, 4), m2 = R.int(1, 3);
    const beh = m1 === 1 ? 0 : m1 % 2 === 0 ? 1 : 2;
    const opts = ["Crosses the <i>x</i>-axis", "Touches the <i>x</i>-axis and turns around", "Crosses the <i>x</i>-axis and flattens out there", "Has a vertical asymptote"];
    const why = ["A zero of multiplicity 1 changes sign, so the graph crosses the axis.",
      `An even multiplicity (${m1}) means the factor never changes sign, so the graph touches the axis and turns around.`,
      `An odd multiplicity greater than 1 (${m1}) changes sign, but the graph flattens out as it crosses, like <i>y</i> = <i>x</i>³.`][beh];
    return {
      q: `Let <span class="m"><i>p</i>(<i>x</i>) = ${pw(fac(r1), m1)}${pw(fac(r2), m2)}</span>. What does the graph of <i>p</i> do at <i>x</i> = ${sgn(r1)}?`,
      c: [opts[beh], ...opts.filter((_, i) => i !== beh)],
      e: why,
      s: [{ p: `What is the multiplicity of the zero at <i>x</i> = ${sgn(r1)}?`, a: String(m1) },
        { p: `Does ${pw(fac(r1), m1)} change sign as <i>x</i> passes ${sgn(r1)}?`, o: m1 % 2 ? ["Yes", "No"] : ["No", "Yes"] }]
    };
  });

  G("1.6", 25, (R) => {
    const a = R.nz(-5, 5), n = R.int(2, 7), pairs = [[a, n]], used = new Set([n]);
    for (let i = 0; i < R.int(1, 2); i++) { const p = R.int(0, n - 1); if (!used.has(p)) { used.add(p); pairs.push([R.nz(-9, 9), p]); } }
    const shown = R.f() < 0.4 ? R.shuffle(pairs) : pairs.slice().sort((x, y) => y[1] - x[1]);
    const right = a > 0, left = (a > 0) === (n % 2 === 0);
    const E = (l, r) => `As <i>x</i> → −∞, <i>f</i>(<i>x</i>) → ${l ? "∞" : "−∞"}; as <i>x</i> → ∞, <i>f</i>(<i>x</i>) → ${r ? "∞" : "−∞"}`;
    return {
      q: `Which describes the end behavior of <span class="m"><i>f</i>(<i>x</i>) = ${polyT(shown)}</span>?`,
      c: [E(left, right), E(!left, right), E(left, !right), E(!left, !right)],
      e: `The leading term ${polyT([[a, n]])} controls end behavior. Its degree, ${n}, is ${n % 2 ? "odd" : "even"} and its coefficient is ${a > 0 ? "positive" : "negative"}, so the graph ${right ? "rises" : "falls"} on the right and ${left ? "rises" : "falls"} on the left.`,
      s: [{ p: "What is the leading term? (Type powers with ^, like 3x^4.)", a: polyTA([[a, n]]) },
        { p: "As <i>x</i> → ∞, where does <i>f</i>(<i>x</i>) go?", o: right ? ["∞", "−∞"] : ["−∞", "∞"] },
        { p: "As <i>x</i> → −∞, where does <i>f</i>(<i>x</i>) go?", o: left ? ["∞", "−∞"] : ["−∞", "∞"] }]
    };
  });

  G("1.7", 25, (R) => {
    const n = R.int(1, 3), cse = R.int(0, 2), m = cse === 0 ? R.int(0, n - 1) : cse === 1 ? n : n + 1;
    const a = R.nz(-6, 6), b = R.nz(-6, 6), num = [[a, m]], den = [[b, n], [R.nz(-9, 9), R.int(0, n - 1)]];
    if (m > 0) num.push([R.nz(-9, 9), R.int(0, m - 1)]);
    const flip = R.f() < 0.3, show = (p) => polyT(flip ? p.slice().reverse() : p);
    const ratio = fr(a, b), inv = fr(b, a);
    const O = { zero: yeq("0"), r: yeq(ratio.h), inv: yeq(inv.h), none: "There is no horizontal asymptote" };
    const correct = cse === 0 ? O.zero : cse === 1 ? O.r : O.none;
    const e = cse === 0 ? `The numerator's degree (${m}) is less than the denominator's (${n}), so <i>f</i>(<i>x</i>) → 0: the asymptote is <i>y</i> = 0.`
      : cse === 1 ? `The degrees are equal (${n}), so the asymptote is the ratio of leading coefficients: ${sgn(a)}/${par(b)} = ${ratio.h}.`
        : `The numerator's degree (${m}) is greater than the denominator's (${n}), so |<i>f</i>(<i>x</i>)| grows without bound and there is no horizontal asymptote.`;
    return {
      q: `Which describes the horizontal asymptote of <span class="m"><i>f</i>(<i>x</i>) = (${show(num)}) / (${show(den)})</span>?`,
      c: [correct, O.zero, O.r, O.inv, O.none],
      e,
      s: [{ p: "What is the degree of the numerator?", a: String(m) }, { p: "What is the degree of the denominator?", a: String(n) },
        { p: "So the horizontal asymptote is…", o: [correct, ...[O.zero, O.r, O.none].filter((x) => x !== correct)] }]
    };
  });

  const setH = (arr, only = true) => {
    const s = arr.slice().sort((x, y) => x - y);
    if (s.length === 1) return xeq(sgn(s[0])) + (only ? " only" : "");
    return s.map((v) => xeq(sgn(v))).join(s.length === 2 ? " and " : ", ");
  };
  G("1.8", 25, (R) => {
    const [a, b, c, d] = R.distinct(4, -7, 7), cancel = R.bool();
    const den = cancel ? [a, d] : [c, d], zs = cancel ? [b] : [a, b];
    const ds = cancel ? [setH([a, b]), setH([d]), setH([a, d])] : [setH([c, d]), setH([-a, -b]), setH([a, b, c, d])];
    return {
      q: `What are the zeros of <span class="m"><i>f</i>(<i>x</i>) = ${fac(a)}${fac(b)} / [${fac(den[0])}${fac(den[1])}]</span>?`,
      c: [setH(zs), ...ds],
      e: cancel ? `The numerator is zero at <i>x</i> = ${sgn(a)} and <i>x</i> = ${sgn(b)}, but <i>x</i> = ${sgn(a)} also makes the denominator zero, so it is a hole, not a zero. The only zero is <i>x</i> = ${sgn(b)}.`
        : `A rational function is zero where its numerator is zero and its denominator is not: <i>x</i> = ${sgn(a)} and <i>x</i> = ${sgn(b)}.`,
      s: [{ p: "Find the zeros of the numerator. Enter them separated by commas.", a: `${a},${b}`, set: true },
        { p: "Do any of those also make the denominator zero?", o: cancel ? [`Yes, <i>x</i> = ${sgn(a)}`, "No"] : ["No", `Yes, <i>x</i> = ${sgn(a)}`] }]
    };
  });

  G("1.9", 25, (R) => {
    const [a, c, d] = R.distinct(3, -6, 6), cancel = R.f() < 0.35, top = cancel ? c : a;
    const vas = cancel ? [d] : [c, d];
    const ds = cancel ? [setH([c, d]), setH([c]), setH([-d])] : [setH([-c, -d]), setH([top]), setH([c])];
    return {
      q: `What are the vertical asymptotes of <span class="m"><i>f</i>(<i>x</i>) = ${fac(top)} / (${poly([1, -(c + d), c * d])})</span>?`,
      c: [setH(vas), ...ds],
      e: `The denominator factors as ${fac(c)}${fac(d)}. ${cancel ? `The factor ${fac(c)} cancels with the numerator, which makes a hole at <i>x</i> = ${sgn(c)}. The only vertical asymptote is <i>x</i> = ${sgn(d)}.` : `Neither factor cancels with the numerator, so the vertical asymptotes are <i>x</i> = ${sgn(c)} and <i>x</i> = ${sgn(d)}.`}`,
      s: [{ p: "Factor the denominator.", a: facA(c) + facA(d), factored: true },
        { p: "Does a factor cancel with the numerator?", o: cancel ? [`Yes, ${fac(c)}`, "No"] : ["No", `Yes, ${fac(c)}`] }]
    };
  });

  G("1.10", 25, (R) => {
    const [a, b, c] = R.distinct(3, -6, 6), y = fr(a - b, a - c), yi = fr(a - c, a - b);
    return {
      q: `Let <span class="m"><i>f</i>(<i>x</i>) = (${poly([1, -(a + b), a * b])}) / (${poly([1, -(a + c), a * c])})</span>. Where is the hole in the graph of <i>f</i>?`,
      c: [pt(sgn(a), y.h), pt(sgn(a), yi.h), pt(sgn(a), "0"), pt(sgn(c), y.h), pt(sgn(b), "0")],
      e: `Factor: ${fac(a)}${fac(b)} / [${fac(a)}${fac(c)}]. The common factor ${fac(a)} cancels, which makes a hole at <i>x</i> = ${sgn(a)}. The simplified function ${fac(b)}/${fac(c)} equals ${y.h} there.`,
      s: [{ p: "Factor the numerator.", a: facA(a) + facA(b), factored: true }, { p: "Factor the denominator.", a: facA(a) + facA(c), factored: true },
        { p: `Evaluate the simplified function ${fac(b)}/${fac(c)} at <i>x</i> = ${sgn(a)}.`, a: y.a }]
    };
  });

  G("1.11", 9, (R) => {
    const b = R.int(-5, 5), c = R.int(-9, 9), d = R.int(-9, 9), r = R.nz(-3, 3), p = (x) => x ** 3 + b * x * x + c * x + d;
    return {
      q: `What is the remainder when <span class="m">${poly([1, b, c, d])}</span> is divided by <span class="m">${fac(r)}</span>?`,
      c: [p(r), p(-r), d, p(r) + r, -p(r)].map(sgn),
      e: `By the Remainder Theorem, the remainder is <i>p</i>(${sgn(r)}) = ${sgn(p(r))}.`,
      s: [{ p: `By the Remainder Theorem, dividing by ${fac(r)} leaves remainder <i>p</i>(?). Enter the input.`, a: String(r) }, { p: `Compute <i>p</i>(${sgn(r)}).`, a: String(p(r)) }]
    };
  });
  G("1.11", 9, (R) => {
    const n = R.int(3, 6), k = R.int(1, n - 1), a = R.nz(-3, 3), C = binom(n, k), coef = C * a ** (n - k);
    return {
      q: `What is the coefficient of ${pw(X, k)} in the expansion of <span class="m">${pw(`(${X} ${a > 0 ? "+" : "−"} ${Math.abs(a)})`, n)}</span>?`,
      c: [coef, C, C * a ** k, C * a, a ** (n - k)].map(sgn),
      e: `The ${pw(X, k)} term is C(${n}, ${k}) · ${pw(X, k)} · (${sgn(a)})${n - k > 1 ? SUPS[n - k] : ""} = ${C} · ${par(a ** (n - k))} · ${pw(X, k)} = ${sgn(coef)}${pw(X, k)}.`,
      s: [{ p: `Find C(${n}, ${k}).`, a: String(C) }, { p: `Find (${sgn(a)})${n - k > 1 ? SUPS[n - k] : ""}.`, a: String(a ** (n - k)) }, { p: "Multiply them.", a: String(coef) }]
    };
  });
  G("1.11", 9, (R) => {
    const p = R.int(-6, 6), q = R.int(-9, 9), r = R.nz(-4, 4), k = p + r, rem = r * r + p * r + q;
    const L = (m) => (m === 0 ? X : `${X} ${m > 0 ? "+" : "−"} ${Math.abs(m)}`);
    return {
      q: `When <span class="m">${poly([1, p, q])}</span> is divided by <span class="m">${fac(r)}</span>, what is the quotient?`,
      c: [L(k), L(p - r), L(p), L(-k), L(q)],
      e: `Dividing by ${fac(r)} gives ${L(k)} with remainder ${sgn(rem)}, so ${poly([1, p, q])} = ${fac(r)}(${L(k)}) ${rem < 0 ? "−" : "+"} ${Math.abs(rem)}.`,
      s: [{ p: "Find the quotient.", a: polyA([1, k]) }, { p: "Find the remainder.", a: String(rem) }]
    };
  });

  G("1.12", 9, (R) => {
    const p = R.int(-5, 5), q = R.int(-5, 5), A = R.pick([2, 3, -1, -2, 4]), h = R.nz(-4, 4), k = R.nz(-5, 5);
    const P = (x, y) => pt(sgn(x), sgn(y));
    return {
      q: `The point (${sgn(p)}, ${sgn(q)}) is on the graph of <i>f</i>. Which point must be on the graph of <span class="m"><i>g</i>(<i>x</i>) = ${coefH(A)}<i>f</i>(${X} ${h > 0 ? "−" : "+"} ${Math.abs(h)})${plusK(k)}</span>?`,
      c: [P(p + h, A * q + k), P(p - h, A * q + k), P(p + h, A * (q + k)), P(p + h, q + k), P(p - h, A * q - k)],
      e: `The input shift moves the point ${h > 0 ? "right" : "left"} ${Math.abs(h)}: <i>x</i> = ${sgn(p)} + ${par(h)} = ${sgn(p + h)}. The output is multiplied by ${sgn(A)}, then ${sgn(k)} is added: ${sgn(A)}·${par(q)} + ${par(k)} = ${sgn(A * q + k)}.`,
      s: [{ p: "What is the new <i>x</i>-coordinate?", a: String(p + h) }, { p: "What is the new <i>y</i>-coordinate?", a: String(A * q + k) }]
    };
  });
  G("1.12", 9, (R) => {
    const B = R.pick([2, 3, -2, 4]), j = R.nz(-4, 4), p = B * j, q = R.int(-6, 6);
    const P = (x, y) => pt(sgn(x), sgn(y));
    return {
      q: `The point (${sgn(p)}, ${sgn(q)}) is on the graph of <i>f</i>. Which point must be on the graph of <span class="m"><i>g</i>(<i>x</i>) = <i>f</i>(${sgn(B)}${X})</span>?`,
      c: [P(j, q), P(p * B, q), P(p, B * q), P(p - B, q), P(-j, q)],
      e: `<i>g</i>(<i>x</i>) = <i>f</i>(${sgn(B)}<i>x</i>) equals <i>f</i>(${sgn(p)}) when ${sgn(B)}<i>x</i> = ${sgn(p)}, so <i>x</i> = ${sgn(j)}. The output stays ${sgn(q)}.`,
      s: [{ p: `Solve ${sgn(B)}<i>x</i> = ${sgn(p)}.`, a: String(j) }, { p: "What is the <i>y</i>-coordinate?", a: String(q) }]
    };
  });
  G("1.12", 9, (R) => {
    const h = R.nz(-6, 6), k = R.nz(-6, 6);
    const base = R.pick([
      [`${X}²`, (u) => `(${u})²`], [`|${X}|`, (u) => `|${u}|`], [`√${X}`, (u) => `√(${u})`], [`${X}³`, (u) => `(${u})³`]]);
    const u = `${X} ${h > 0 ? "−" : "+"} ${Math.abs(h)}`;
    const D = (H, K) => `${H > 0 ? "Right" : "Left"} ${Math.abs(h)} and ${K > 0 ? "up" : "down"} ${Math.abs(k)}`;
    return {
      q: `The graph of <span class="m"><i>g</i>(<i>x</i>) = ${base[1](u)}${plusK(k)}</span> is a transformation of the graph of <span class="m"><i>y</i> = ${base[0]}</span>. Which describes it?`,
      c: [D(h, k), D(-h, k), D(h, -k), D(-h, -k)],
      e: `Replacing <i>x</i> with ${u} shifts the graph ${h > 0 ? "right" : "left"} ${Math.abs(h)}. ${k > 0 ? "Adding" : "Subtracting"} ${Math.abs(k)} outside shifts it ${k > 0 ? "up" : "down"} ${Math.abs(k)}.`,
      s: [{ p: `Replacing <i>x</i> with ${u} shifts the graph…`, o: [`${h > 0 ? "Right" : "Left"} ${Math.abs(h)}`, `${h > 0 ? "Left" : "Right"} ${Math.abs(h)}`] },
        { p: `${k > 0 ? "Adding" : "Subtracting"} ${Math.abs(k)} outside the function shifts the graph…`, o: [`${k > 0 ? "Up" : "Down"} ${Math.abs(k)}`, `${k > 0 ? "Down" : "Up"} ${Math.abs(k)}`] }]
    };
  });

  G("1.13", 25, (R) => {
    const type = R.int(0, 2), xs = [0, 1, 2, 3, 4];
    let ys, r = 0;
    if (type === 0) { const m = R.nz(-6, 6), b = R.int(-10, 20); ys = xs.map((x) => m * x + b); }
    else if (type === 1) { const a = R.nz(-3, 3), b = R.int(-5, 5), c = R.int(-9, 9); ys = xs.map((x) => a * x * x + b * x + c); }
    else { r = R.pick([2, 3, 0.5]); const a = r === 0.5 ? 16 * R.int(1, 4) : R.int(1, 5); ys = xs.map((x) => a * r ** x); }
    const d1 = diffs(ys), d2 = diffs(d1), names = ["Linear", "Quadratic", "Exponential"];
    const e = type === 0 ? `The first differences are all ${sgn(d1[0])}. Constant differences over equal steps mean a linear model.`
      : type === 1 ? `The first differences (${d1.map(sgn).join(", ")}) change, but the second differences are all ${sgn(d2[0])}. Constant second differences mean a quadratic model.`
        : `Each output is ${r === 0.5 ? "half" : r + " times"} the one before. A constant ratio over equal steps means an exponential model.`;
    const s = type === 0 ? [{ p: "Find the first differences. Enter them separated by commas.", a: d1.join(",") }, { p: "Are they constant?", o: ["Yes", "No"] }]
      : type === 1 ? [{ p: "Find the first differences. Enter them separated by commas.", a: d1.join(",") }, { p: "Find the second differences. What constant value do you get?", a: String(d2[0]) }]
        : [{ p: "Divide each output by the one before it. What ratio do you get?", a: r === 0.5 ? "1/2" : String(r) }];
    return {
      q: `A function has the values below at equally spaced inputs. Which type of function best models the data?${table([X, ...xs], ["<i>y</i>", ...ys.map(sgn)])}`,
      c: [names[type], ...names.filter((_, i) => i !== type), "Logarithmic"], e, s
    };
  });

  G("1.14", 13, (R) => {
    const a = R.nz(-3, 3), h = R.int(-4, 4), k = R.int(-6, 6), d = R.nz(-3, 3), x1 = h + d, y1 = k + a * d * d;
    const V = (A, H, K) => `${coefH(A)}${pw(fac(H), 2)}${plusK(K)}`;
    return {
      q: `A quadratic function has its vertex at (${sgn(h)}, ${sgn(k)}) and passes through (${sgn(x1)}, ${sgn(y1)}). Which is the function?`,
      c: [V(a, h, k), V(a, -h, k), V(-a, h, k), V(a, h, -k), V(2 * a, h, k)].map((v) => `<i>f</i>(<i>x</i>) = ${v}`),
      e: `Vertex form is <i>f</i>(<i>x</i>) = <i>a</i>${pw(fac(h), 2)}${plusK(k)}. Substituting (${sgn(x1)}, ${sgn(y1)}): ${sgn(y1)} = <i>a</i>(${sgn(d)})² ${k < 0 ? "−" : "+"} ${Math.abs(k)}, so <i>a</i> = ${sgn(a)}.`,
      s: [{ p: `Write <i>f</i>(<i>x</i>) = <i>a</i>${pw(fac(h), 2)}${plusK(k)}. Substitute (${sgn(x1)}, ${sgn(y1)}) and solve. What is <i>a</i>?`, a: String(a) }]
    };
  });
  G("1.14", 12, (R) => {
    const P = 4 * R.int(3, 25), L = P / 2, w = P / 4, A = w * w;
    const thing = R.pick(["garden", "dog run", "play area", "pen"]);
    return {
      q: `A rectangular ${thing} is enclosed by ${P} meters of fencing. What is the largest area it can have, in square meters?`,
      c: [A, 2 * A, L * L, A + L, A / 2].map(fnum),
      e: `If the width is <i>x</i>, the length is ${L} − <i>x</i>, so <i>A</i>(<i>x</i>) = <i>x</i>(${L} − <i>x</i>). This parabola has its maximum halfway between its zeros 0 and ${L}, at <i>x</i> = ${w}. The area is ${w} · ${w} = ${A} m².`,
      s: [{ p: "If the width is <i>x</i> meters, what is the length? (Type it in terms of x.)", a: `${L}-x` },
        { p: "Which width gives the largest area?", a: String(w) }, { p: "What is that area?", a: String(A) }]
    };
  });

  // ================================================================ UNIT 2
  G("2.1", 13, (R) => {
    const a1 = R.int(-20, 30), d = R.nz(-9, 9), n = R.int(8, 30), an = a1 + (n - 1) * d;
    if (R.bool()) {
      return {
        q: `An arithmetic sequence has ${sub(1)} = ${sgn(a1)} and common difference ${sgn(d)}. What is ${sub(n)}?`,
        c: [an, an + d, an - d, -an, an + 2 * d].map(sgn),
        e: `${sub("<i>n</i>")} = ${sub(1)} + (<i>n</i> − 1)<i>d</i> = ${sgn(a1)} + ${n - 1}·${par(d)} = ${sgn(an)}.`,
        s: [{ p: `What is <i>n</i> − 1 for the ${n}th term?`, a: String(n - 1) }, { p: `Compute ${sgn(a1)} + ${n - 1}·${par(d)}.`, a: String(an) }]
      };
    }
    const j = R.int(2, 4), k = j + R.int(2, 5), aj = a1 + (j - 1) * d, ak = a1 + (k - 1) * d;
    return {
      q: `An arithmetic sequence has ${sub(j)} = ${sgn(aj)} and ${sub(k)} = ${sgn(ak)}. What is ${sub(n)}?`,
      c: [an, an + d, an - d, -an, an + 2 * d].map(sgn),
      e: `The common difference is (${sgn(ak)} − ${par(aj)}) / (${k} − ${j}) = ${sgn(d)}. Then ${sub(n)} = ${sub(k)} + (${n} − ${k})<i>d</i> = ${sgn(ak)} + ${n - k}·${par(d)} = ${sgn(an)}.`,
      s: [{ p: "Find the common difference.", a: String(d) }, { p: `Find ${sub(n)}.`, a: String(an) }]
    };
  });
  G("2.1", 13, (R) => {
    const r = R.pick([2, 3, -2, -3, 4, 0.5]), n = R.int(4, 7), a1 = r === 0.5 ? 2 ** (n - 1) * R.int(1, 3) : R.nz(-5, 5), an = a1 * r ** (n - 1);
    const rh = r === 0.5 ? "1/2" : sgn(r);
    return {
      q: `A geometric sequence has ${sub(1)} = ${sgn(a1)} and common ratio ${rh}. What is ${sub(n)}?`,
      c: [an, a1 * r ** n, a1 * r ** (n - 2), a1 + (n - 1) * r, -an].map(fnum),
      e: `${sub("<i>n</i>")} = ${sub(1)} · <i>r</i><sup><i>n</i> − 1</sup> = ${sgn(a1)} · (${rh})<sup>${n - 1}</sup> = ${fnum(an)}.`,
      s: [{ p: `What is the exponent <i>n</i> − 1?`, a: String(n - 1) }, { p: `Compute ${sgn(a1)} · (${rh})<sup>${n - 1}</sup>.`, a: anum(an) }]
    };
  });

  G("2.2", 25, (R) => {
    const a = R.int(1, 6), r = R.int(2, 4), b = a * r, k = R.int(3, 5), askExp = R.bool();
    const lin = a + k * (b - a), ex = a * r ** k;
    return {
      q: `Function <i>f</i> is linear and function <i>g</i> is exponential. Both satisfy <i>f</i>(0) = <i>g</i>(0) = ${a} and <i>f</i>(1) = <i>g</i>(1) = ${b}. What is ${askExp ? "<i>g</i>" : "<i>f</i>"}(${k})?`,
      c: [askExp ? ex : lin, askExp ? lin : ex, askExp ? a * r ** (k - 1) : a + (k - 1) * (b - a), askExp ? a * r ** (k + 1) : a + (k + 1) * (b - a)].map(String),
      e: askExp ? `An exponential function multiplies by the same factor for each step of 1: ${b}/${a} = ${r}. So <i>g</i>(${k}) = ${a} · ${r}<sup>${k}</sup> = ${ex}.`
        : `A linear function adds the same amount for each step of 1: ${b} − ${a} = ${b - a}. So <i>f</i>(${k}) = ${a} + ${k}·${b - a} = ${lin}.`,
      s: askExp ? [{ p: "What does <i>g</i> multiply by for each increase of 1 in <i>x</i>?", a: String(r) }, { p: `Compute <i>g</i>(${k}).`, a: String(ex) }]
        : [{ p: "What does <i>f</i> add for each increase of 1 in <i>x</i>?", a: String(b - a) }, { p: `Compute <i>f</i>(${k}).`, a: String(lin) }]
    };
  });

  G("2.3", 13, (R) => {
    const a = R.nz(-5, 5), [bh, bv] = R.pick([["2", 2], ["3", 3], ["4", 4], ["5", 5], ["(1/2)", 0.5], ["(1/3)", 1 / 3]]), k = R.nz(-6, 6), ask = R.int(0, 2);
    const f = `${a === 1 ? "" : a === -1 ? M : sgn(a) + " · "}${sup(bh, X)}${plusK(k)}`;
    const q0 = `Let <span class="m"><i>f</i>(<i>x</i>) = ${f}</span>. `;
    if (ask === 0) return {
      q: q0 + "What is the horizontal asymptote of the graph of <i>f</i>?",
      c: [yeq(sgn(k)), yeq(sgn(a)), yeq(sgn(a + k)), yeq("0"), yeq(sgn(-k))],
      e: `As <i>x</i> → ${bv > 1 ? "−∞" : "∞"}, ${sup(bh, X)} → 0, so <i>f</i>(<i>x</i>) → ${sgn(k)}. The asymptote is <i>y</i> = ${sgn(k)}.`,
      s: [{ p: `As <i>x</i> → ${bv > 1 ? "−∞" : "∞"}, what does ${sup(bh, X)} approach?`, a: "0" }, { p: "So <i>f</i>(<i>x</i>) approaches what value?", a: String(k) }]
    };
    if (ask === 1) return {
      q: q0 + "What is the <i>y</i>-intercept of the graph of <i>f</i>?",
      c: [pt(0, sgn(a + k)), pt(0, sgn(a)), pt(0, sgn(k)), pt(sgn(a + k), 0), pt(0, sgn(a * k))],
      e: `<i>f</i>(0) = ${sgn(a)} · 1 ${k < 0 ? "−" : "+"} ${Math.abs(k)} = ${sgn(a + k)}, since any nonzero base to the power 0 is 1.`,
      s: [{ p: `What is ${sup(bh, "0")}?`, a: "1" }, { p: "Compute <i>f</i>(0).", a: String(a + k) }]
    };
    const inc = (a > 0) === (bv > 1);
    return {
      q: q0 + "Which describes <i>f</i>?",
      c: [inc ? "Increasing for all <i>x</i>" : "Decreasing for all <i>x</i>", inc ? "Decreasing for all <i>x</i>" : "Increasing for all <i>x</i>", "Increasing, then decreasing", "Decreasing, then increasing"],
      e: `The base ${bh} is ${bv > 1 ? "greater than 1 (growth)" : "between 0 and 1 (decay)"}, and the coefficient ${sgn(a)} is ${a > 0 ? "positive" : "negative, which flips the graph"}. So <i>f</i> is ${inc ? "increasing" : "decreasing"} everywhere.`,
      s: [{ p: `Is the base ${bh} greater than 1 or between 0 and 1?`, o: bv > 1 ? ["Greater than 1", "Between 0 and 1"] : ["Between 0 and 1", "Greater than 1"] },
        { p: `Is the coefficient ${sgn(a)} positive or negative?`, o: a > 0 ? ["Positive", "Negative"] : ["Negative", "Positive"] }]
    };
  });
  G("2.3", 13, (R) => {
    const a = R.int(1, 5), b = R.int(2, 4), n = R.int(1, 4);
    return {
      q: `If <span class="m"><i>f</i>(<i>x</i>) = ${a === 1 ? "" : a + " · "}${sup(b, X)}</span>, what is <i>f</i>(${n})?`,
      c: [a * b ** n, (a * b) ** n, a * b * n, a * b ** (n - 1), a + b ** n].map(String),
      e: `<i>f</i>(${n}) = ${a} · ${sup(b, n)} = ${a} · ${b ** n} = ${a * b ** n}. The exponent applies only to the base ${b}.`,
      s: [{ p: `Compute ${sup(b, n)}.`, a: String(b ** n) }, { p: `Multiply by ${a}.`, a: String(a * b ** n) }]
    };
  });

  G("2.4", 26, (R) => {
    const b = R.int(2, 5), t = R.int(0, 2);
    if (t === 0) {
      const h = R.int(1, 3);
      return {
        q: `Which is equivalent to <span class="m">${sup(b, `${X} + ${h}`)}</span>?`,
        c: [`${b ** h} · ${sup(b, X)}`, `${sup(b, X)} + ${b ** h}`, `${h} · ${sup(b, X)}`, sup(b, `${h}${X}`), `${b * h} · ${sup(b, X)}`],
        e: `By the product property, ${sup(b, `${X} + ${h}`)} = ${sup(b, X)} · ${sup(b, h)} = ${b ** h} · ${sup(b, X)}. A horizontal shift of an exponential is a vertical dilation.`,
        s: [{ p: `${sup(b, `${X} + ${h}`)} = ${sup(b, X)} · ${sup(b, h)}. What is ${sup(b, h)}?`, a: String(b ** h) }]
      };
    }
    if (t === 1) {
      const m = R.int(2, 3);
      return {
        q: `Which is equivalent to <span class="m">${sup(b, `${m}${X}`)}</span>?`,
        c: [sup(b ** m, X), sup(b * m, X), `${m} · ${sup(b, X)}`, `${sup(b, X)} + ${m}`, sup(b + m, X)],
        e: `By the power property, ${sup(b, `${m}${X}`)} = (${sup(b, m)})<sup><i>x</i></sup> = ${sup(b ** m, X)}.`,
        s: [{ p: `${sup(b, `${m}${X}`)} = (${sup(b, m)})<sup><i>x</i></sup>. What is ${sup(b, m)}?`, a: String(b ** m) }]
      };
    }
    const h = R.int(1, 3);
    return {
      q: `Which is equivalent to <span class="m">${sup(b, `${X} − ${h}`)}</span>?`,
      c: [`${sup(b, X)} / ${b ** h}`, `${sup(b, X)} − ${b ** h}`, `${b ** h} · ${sup(b, X)}`, `${sup(b, X)} / ${h}`, `${sup(b, X)} − ${h}`],
      e: `By the quotient property, ${sup(b, `${X} − ${h}`)} = ${sup(b, X)} / ${sup(b, h)} = ${sup(b, X)} / ${b ** h}.`,
      s: [{ p: `${sup(b, `${X} − ${h}`)} = ${sup(b, X)} / ${sup(b, h)}. What is ${sup(b, h)}?`, a: String(b ** h) }]
    };
  });

  G("2.5", 9, (R) => {
    const P0 = R.int(1, 90) * 100, r = R.int(2, 25), grow = R.bool(), unit = R.pick(["year", "month", "hour", "decade"]);
    const f = grow ? 1 + r / 100 : 1 - r / 100, of = grow ? 1 - r / 100 : 1 + r / 100;
    const thing = grow ? R.pick(["A population", "An investment", "A bacteria culture", "The number of app users"]) : R.pick(["A car's value", "The amount of a medication in the body", "A population", "The number of active accounts"]);
    const P = (b) => `<i>P</i>(<i>t</i>) = ${P0.toLocaleString("en-US")}(${b})<sup><i>t</i></sup>`;
    return {
      q: `${thing} starts at ${P0.toLocaleString("en-US")} and ${grow ? "grows" : "decreases"} by ${r}% each ${unit}. Which models the amount after <i>t</i> ${unit}s?`,
      c: [P(anum(f)), P(anum(r / 100)), P(anum(of)), P(1 + r), `<i>P</i>(<i>t</i>) = ${P0.toLocaleString("en-US")} ${grow ? "+" : "−"} ${r}<i>t</i>`],
      e: `${grow ? "Growing" : "Decreasing"} by ${r}% means each ${unit} is 100% ${grow ? "+" : "−"} ${r}% = ${anum(f * 100)}% of the previous amount, so the factor is ${anum(f)}.`,
      s: [{ p: `Write ${r}% as a decimal.`, a: anum(r / 100) }, { p: `What is the ${grow ? "growth" : "decay"} factor?`, a: anum(f) }]
    };
  });
  G("2.5", 9, (R) => {
    const P0 = R.int(2, 60) * 50, r = R.int(3, 12), grow = R.bool(), t = R.int(4, 15), f = grow ? 1 + r / 100 : 1 - r / 100;
    const val = Math.round(P0 * f ** t);
    return {
      calc: true,
      q: `A quantity starts at ${P0.toLocaleString("en-US")} and ${grow ? "increases" : "decreases"} by ${r}% per year. To the nearest whole number, what is it after ${t} years?`,
      c: [val, Math.round(P0 * (1 + (grow ? 1 : -1) * (r / 100) * t)), Math.round(P0 * f ** (t - 1)), Math.round(P0 * (grow ? 1 - r / 100 : 1 + r / 100) ** t)].map(big),
      e: `Use <i>P</i>(<i>t</i>) = ${P0.toLocaleString("en-US")}(${anum(f)})<sup><i>t</i></sup>. At <i>t</i> = ${t}: ${P0.toLocaleString("en-US")}(${anum(f)})<sup>${t}</sup> ≈ ${val.toLocaleString("en-US")}.`,
      s: [{ p: "What is the yearly factor?", a: anum(f) }, { p: `Compute ${P0}(${anum(f)})<sup>${t}</sup> to the nearest whole number.`, a: String(val), tol: 1 }]
    };
  });
  G("2.5", 9, (R) => {
    const n = R.int(2, 5), A0 = R.int(1, 15) * 2 ** n, h = R.pick([3, 5, 8, 10, 12, 20, 30]), t = n * h;
    const sub0 = R.pick(["A radioactive sample", "A sample of an isotope", "A dose of medicine"]);
    return {
      q: `${sub0} has a half-life of ${h} ${h === 1 ? "hour" : "hours"}. If there are ${A0} mg now, how much remains after ${t} hours?`,
      c: [A0 / 2 ** n, A0 / (2 * n), A0 / 2 ** (n - 1), A0 / 2 ** (n + 1), A0 - A0 / 2 ** n].map((v) => fnum(v) + " mg"),
      e: `${t} hours is ${t}/${h} = ${n} half-lives. Halving ${n} times: ${A0} / 2<sup>${n}</sup> = ${fnum(A0 / 2 ** n)} mg.`,
      s: [{ p: "How many half-lives is that?", a: String(n) }, { p: `Divide ${A0} by 2 that many times.`, a: anum(A0 / 2 ** n) }]
    };
  });

  G("2.6", 13, (R) => {
    const m = R.nz(-8, 8) / 2, b = R.int(0, 20), x0 = R.int(1, 10), yhat = m * x0 + b, res = R.nz(-6, 6), y0 = yhat + res;
    return {
      q: `A linear model <span class="m"><i>ŷ</i> = ${fnum(m)}${X}${plusK(b)}</span> is fit to data that include the point (${x0}, ${fnum(y0)}). What is the residual at <i>x</i> = ${x0}?`,
      c: [res, -res, yhat, y0, res * 2].map(fnum),
      e: `The model predicts <i>ŷ</i> = ${fnum(m)}·${x0}${plusK(b)} = ${fnum(yhat)}. Residual = actual − predicted = ${fnum(y0)} − ${fnum(yhat)} = ${fnum(res)}.`,
      s: [{ p: `What does the model predict at <i>x</i> = ${x0}?`, a: anum(yhat) }, { p: "Residual = actual − predicted. Compute it.", a: anum(res) }]
    };
  });
  G("2.6", 12, (R) => {
    const x0 = R.int(1, 30), r = R.nz(-25, 25) / 2, under = r > 0;
    return {
      q: `A model is used to predict data. At <i>x</i> = ${x0}, the residual is ${fnum(r)}. Which is true?`,
      c: [under ? "The model underestimates the actual value at that point" : "The model overestimates the actual value at that point",
        under ? "The model overestimates the actual value at that point" : "The model underestimates the actual value at that point",
        "The model matches the actual value at that point", "The model must be exponential"],
      e: `Residual = actual − predicted. A ${under ? "positive" : "negative"} residual means the actual value is ${under ? "above" : "below"} the prediction, so the model ${under ? "underestimates" : "overestimates"}.`,
      s: [{ p: "Residual = actual − predicted. If it is " + (under ? "positive" : "negative") + ", is the actual value above or below the prediction?", o: under ? ["Above", "Below"] : ["Below", "Above"] }]
    };
  });

  G("2.7", 13, (R) => {
    const a = R.nz(-4, 4), b = R.int(-6, 6), c = R.nz(-3, 3), d = R.int(-5, 5), k = R.int(-3, 3), askFG = R.bool();
    const f = (x) => a * x + b, g = (x) => c * x * x + d, fg = f(g(k)), gf = g(f(k));
    return {
      q: `Let <span class="m"><i>f</i>(<i>x</i>) = ${poly([a, b])}</span> and <span class="m"><i>g</i>(<i>x</i>) = ${poly([c, 0, d])}</span>. What is ${askFG ? `<i>f</i>(<i>g</i>(${sgn(k)}))` : `<i>g</i>(<i>f</i>(${sgn(k)}))`}?`,
      c: [askFG ? fg : gf, askFG ? gf : fg, f(k) * g(k), f(k) + g(k), -(askFG ? fg : gf)].map(sgn),
      e: askFG ? `Work inside out: <i>g</i>(${sgn(k)}) = ${sgn(g(k))}, then <i>f</i>(${sgn(g(k))}) = ${sgn(fg)}.` : `Work inside out: <i>f</i>(${sgn(k)}) = ${sgn(f(k))}, then <i>g</i>(${sgn(f(k))}) = ${sgn(gf)}.`,
      s: askFG ? [{ p: `Find <i>g</i>(${sgn(k)}).`, a: String(g(k)) }, { p: `Find <i>f</i>(${sgn(g(k))}).`, a: String(fg) }]
        : [{ p: `Find <i>f</i>(${sgn(k)}).`, a: String(f(k)) }, { p: `Find <i>g</i>(${sgn(f(k))}).`, a: String(gf) }]
    };
  });
  G("2.7", 13, (R) => {
    const a = R.nz(-5, 5), b = R.int(-6, 6), c = R.nz(-5, 5), d = R.int(-6, 6);
    const L = (m, k) => poly([m, k]);
    return {
      q: `Let <span class="m"><i>f</i>(<i>x</i>) = ${poly([a, b])}</span> and <span class="m"><i>g</i>(<i>x</i>) = ${poly([c, d])}</span>. Which is <i>f</i>(<i>g</i>(<i>x</i>))?`,
      c: [L(a * c, a * d + b), L(a * c, c * b + d), L(a * c, b + d), L(a + c, b * d), L(a * c, a * d)],
      e: `Substitute <i>g</i>(<i>x</i>) into <i>f</i>: ${sgn(a)}(${poly([c, d])})${plusK(b)} = ${L(a * c, a * d + b)}.`,
      s: [{ p: `Substitute: <i>f</i>(<i>g</i>(<i>x</i>)) = ${sgn(a)}(${poly([c, d])})${plusK(b)}. Simplify.`, a: polyA([a * c, a * d + b]) }]
    };
  });

  G("2.8", 13, (R) => {
    const a = R.pick([2, 3, 4, 5, -2, -3]), b = R.nz(-9, 9);
    const I = (num, den) => `<i>f</i>⁻¹(<i>x</i>) = (${num}) / ${den < 0 ? `(${sgn(den)})` : den}`;
    return {
      q: `If <span class="m"><i>f</i>(<i>x</i>) = ${poly([a, b])}</span>, what is <i>f</i>⁻¹(<i>x</i>)?`,
      c: [I(poly([1, -b]), a), I(poly([1, b]), a), `<i>f</i>⁻¹(<i>x</i>) = ${poly([a, -b])}`, `<i>f</i>⁻¹(<i>x</i>) = 1 / (${poly([a, b])})`],
      e: `Swap <i>x</i> and <i>y</i>: <i>x</i> = ${sgn(a)}<i>y</i>${plusK(b)}. Solve: <i>y</i> = (${poly([1, -b])}) / ${par(a)}.`,
      s: [{ p: `Swap <i>x</i> and <i>y</i>: <i>x</i> = ${sgn(a)}<i>y</i>${plusK(b)}. Solve for <i>y</i>.`, a: `(${polyA([1, -b])})/(${a})` }]
    };
  });
  G("2.8", 12, (R) => {
    const cube = R.bool(), a = cube ? 1 : R.nz(-5, 5), b = R.int(-9, 9), k = R.nz(-4, 4);
    const f = (x) => (cube ? x ** 3 : a * x) + b, c0 = f(k);
    return {
      q: `Let <span class="m"><i>f</i>(<i>x</i>) = ${cube ? polyT([[1, 3], [b, 0]]) : poly([a, b])}</span>. What is <i>f</i>⁻¹(${sgn(c0)})?`,
      c: [k, f(c0), -k, c0, k + 1].map(sgn),
      e: `<i>f</i>⁻¹(${sgn(c0)}) is the input that gives output ${sgn(c0)}. Solving <i>f</i>(<i>x</i>) = ${sgn(c0)} gives <i>x</i> = ${sgn(k)}.`,
      s: [{ p: `Solve <i>f</i>(<i>x</i>) = ${sgn(c0)} for <i>x</i>.`, a: String(k) }]
    };
  });

  G("2.9", 26, (R) => {
    const b = R.pick([2, 3, 4, 5, 10]), t = R.int(0, 3);
    let N, v;
    if (t === 0) { const max = Math.floor(Math.log(1000) / Math.log(b) + 1e-9), n = R.int(1, max); N = String(b ** n); v = fr(n, 1); }
    else if (t === 1) { const n = R.int(1, b === 10 ? 3 : 2); N = `1/${b ** n}`; v = fr(-n, 1); }
    else if (t === 2) { N = `√${b}`; v = fr(1, 2); }
    else { N = `${b}√${b}`; v = fr(3, 2); }
    const cands = [v.v + 1, v.v - 1, -v.v, 2 * v.v, v.v + 2, 1 / v.v].map((x) => fr(Math.round(x * 6), 6).h);
    return {
      q: `What is the value of <span class="m">${logb(b)} ${N}</span>?`,
      c: [v.h, ...cands],
      e: `${logb(b)} ${N} asks: ${b} to what power gives ${N}? Since ${N} = ${sup(b, v.h)}, the answer is ${v.h}.`,
      s: [{ p: `Write ${N} as a power of ${b}. What is the exponent?`, a: v.a }]
    };
  });

  G("2.10", 13, (R) => {
    const b = R.pick([2, 3, 4, 5, 10]), k = R.nz(-6, 6), mult = R.bool(), a = R.int(2, 6);
    const L = (arg) => `<i>f</i>⁻¹(<i>x</i>) = ${logb(b)}(${arg})`;
    if (mult) return {
      q: `What is the inverse of <span class="m"><i>f</i>(<i>x</i>) = ${a} · ${sup(b, X)}</span>?`,
      c: [L(`${X}/${a}`), `<i>f</i>⁻¹(<i>x</i>) = ${logb(b)}(${X}) / ${a}`, `<i>f</i>⁻¹(<i>x</i>) = ${a} ${logb(b)}(${X})`, L(`${a}${X}`)],
      e: `Swap: <i>x</i> = ${a} · ${sup(b, "<i>y</i>")}, so ${sup(b, "<i>y</i>")} = <i>x</i>/${a} and <i>y</i> = ${logb(b)}(<i>x</i>/${a}).`,
      s: [{ p: `Swap <i>x</i> and <i>y</i>, then solve for ${sup(b, "<i>y</i>")}.`, a: `x/${a}` }, { p: "Rewrite in log form.", o: [L(`${X}/${a}`), `${logb(b)}(${X}) / ${a}`] }]
    };
    return {
      q: `What is the inverse of <span class="m"><i>f</i>(<i>x</i>) = ${sup(b, X)}${plusK(k)}</span>?`,
      c: [L(poly([1, -k])), `<i>f</i>⁻¹(<i>x</i>) = ${logb(b)}(${X})${plusK(-k)}`, L(poly([1, k])), `<i>f</i>⁻¹(<i>x</i>) = ${sup(b, poly([1, -k]))}`],
      e: `Swap: <i>x</i> = ${sup(b, "<i>y</i>")}${plusK(k)}, so ${sup(b, "<i>y</i>")} = ${poly([1, -k])} and <i>y</i> = ${logb(b)}(${poly([1, -k])}).`,
      s: [{ p: `Swap <i>x</i> and <i>y</i>, then solve for ${sup(b, "<i>y</i>")}.`, a: polyA([1, -k]) }, { p: "Rewrite in log form.", o: [L(poly([1, -k])), `${logb(b)}(${X})${plusK(-k)}`] }]
    };
  });
  G("2.10", 13, (R) => {
    const b = R.pick([2, 3, 4, 5]), n = R.int(1, b === 2 ? 6 : 4), N = b ** n;
    return {
      q: `Let <span class="m"><i>f</i>(<i>x</i>) = ${sup(b, X)}</span>. What is <i>f</i>⁻¹(${N})?`,
      c: [n, N / b, n + 1, b * n, n - 1].map(String),
      e: `<i>f</i>⁻¹ is ${logb(b)} <i>x</i>. <i>f</i>⁻¹(${N}) = ${logb(b)} ${N} = ${n}, because ${sup(b, n)} = ${N}.`,
      s: [{ p: `${b} to what power gives ${N}?`, a: String(n) }]
    };
  });

  G("2.11", 26, (R) => {
    const b = R.pick([2, 3, 5, 10, "e"]), h = R.nz(-6, 6), k = R.int(-2, 0), ask = R.int(0, 2);
    const L = b === "e" ? "ln" : logb(b), bv = b === "e" ? Math.E : b;
    const f = `${L}(${poly([1, -h])})${plusK(k)}`;
    if (ask === 0) return {
      q: `What is the domain of <span class="m"><i>f</i>(<i>x</i>) = ${f}</span>?`,
      c: [`${X} &gt; ${sgn(h)}`, `${X} ≥ ${sgn(h)}`, `${X} &gt; ${sgn(-h)}`, `${X} &lt; ${sgn(h)}`],
      e: `The input of a logarithm must be positive: ${poly([1, -h])} &gt; 0, so <i>x</i> &gt; ${sgn(h)}.`,
      s: [{ p: "The input of a log must be…", o: ["Positive", "Nonnegative", "Nonzero"] }, { p: `Solve ${poly([1, -h])} &gt; 0. <i>x</i> &gt; ?`, a: String(h) }]
    };
    if (ask === 1) return {
      q: `What is the vertical asymptote of the graph of <span class="m"><i>f</i>(<i>x</i>) = ${f}</span>?`,
      c: [xeq(sgn(h)), xeq(sgn(-h)), yeq(sgn(k)), xeq("0"), yeq(sgn(h))],
      e: `The log's input ${poly([1, -h])} approaches 0 as <i>x</i> → ${sgn(h)}<sup>+</sup>, so the vertical asymptote is <i>x</i> = ${sgn(h)}.`,
      s: [{ p: `Where does the input ${poly([1, -h])} equal 0? <i>x</i> = ?`, a: String(h) }]
    };
    if (b === "e") return null;
    const xi = h + bv ** -k;
    return {
      q: `What is the <i>x</i>-intercept of the graph of <span class="m"><i>f</i>(<i>x</i>) = ${f}</span>?`,
      c: [pt(sgn(xi), 0), pt(sgn(h + 1), 0), pt(sgn(h), 0), pt(sgn(h - bv ** -k), 0), pt(0, sgn(xi))],
      e: `Set <i>f</i>(<i>x</i>) = 0: ${L}(${poly([1, -h])}) = ${-k}, so ${poly([1, -h])} = ${b}<sup>${-k}</sup> = ${bv ** -k} and <i>x</i> = ${sgn(xi)}.`,
      s: [{ p: `Set <i>f</i>(<i>x</i>) = 0 and rewrite in exponential form. ${poly([1, -h])} = ?`, a: String(bv ** -k) }, { p: "Solve for <i>x</i>.", a: String(xi) }]
    };
  });

  G("2.12", 8, (R) => {
    const b = R.pick([2, 3, 5, 6, 10]), k = R.int(2, 3), T = b ** k;
    const divs = []; for (let d = 2; d < T; d++) if (T % d === 0) divs.push(d);
    const A = R.pick(divs), B = T / A;
    return {
      q: `What is the value of <span class="m">${logb(b)} ${A} + ${logb(b)} ${B}</span>?`,
      c: [k, k + 1, k - 1, 2 * k, A + B].map(String),
      e: `By the product property, ${logb(b)} ${A} + ${logb(b)} ${B} = ${logb(b)} ${T} = ${k}, since ${sup(b, k)} = ${T}.`,
      s: [{ p: `${logb(b)} ${A} + ${logb(b)} ${B} = ${logb(b)}(?). Enter the product.`, a: String(T) }, { p: `${b} to what power gives ${T}?`, a: String(k) }]
    };
  });
  G("2.12", 8, (R) => {
    const b = R.pick([2, 3, 5, 10]), k = R.int(1, 2), B = R.int(2, 9), A = B * b ** k;
    return {
      q: `What is the value of <span class="m">${logb(b)} ${A} − ${logb(b)} ${B}</span>?`,
      c: [k, k + 1, A - B, 2 * k, k + 2].map(String),
      e: `By the quotient property, ${logb(b)} ${A} − ${logb(b)} ${B} = ${logb(b)} (${A}/${B}) = ${logb(b)} ${b ** k} = ${k}.`,
      s: [{ p: `${logb(b)} ${A} − ${logb(b)} ${B} = ${logb(b)}(?). Enter the quotient.`, a: String(b ** k) }, { p: "Evaluate.", a: String(k) }]
    };
  });
  G("2.12", 8, (R) => {
    const m = R.int(2, 5), n = R.int(1, 4), p = R.int(2, 5);
    const T = (c, v) => `${c === 1 ? "" : c} log <i>${v}</i>`;
    const E = (s1, s2) => `${T(m, "x")} ${s1} ${T(n, "y")} ${s2} ${T(p, "z")}`;
    return {
      q: `Which is equivalent to <span class="m">log(${pw(X, m)}${pw("<i>y</i>", n)} / ${pw("<i>z</i>", p)})</span>?`,
      c: [E("+", "−"), E("−", "+"), E("+", "+"), E("−", "−"), `log(${m}${X}) + log(${n}<i>y</i>) − log(${p}<i>z</i>)`],
      e: `Product property adds, quotient property subtracts, and the power property moves exponents in front: ${E("+", "−")}.`,
      s: [{ p: "By the quotient property, which piece is subtracted?", o: [`log ${pw("<i>z</i>", p)}`, `log ${pw(X, m)}`, `log ${pw("<i>y</i>", n)}`] },
        { p: `By the power property, log ${pw("<i>z</i>", p)} = ? · log <i>z</i>`, a: String(p) }]
    };
  });
  G("2.12", 8, (R) => {
    const i = R.int(0, 3), j = R.int(0, 3); if (i + j === 0) return null;
    const N = 2 ** i * 3 ** j;
    const T = (c, v) => (c === 0 ? "" : `${c === 1 ? "" : c}<i>${v}</i>`);
    const S = (ci, cj) => [T(ci, "u"), T(cj, "w")].filter(Boolean).join(" + ") || "0";
    return {
      q: `If <span class="m">log<sub><i>b</i></sub> 2 = <i>u</i></span> and <span class="m">log<sub><i>b</i></sub> 3 = <i>w</i></span>, which equals <span class="m">log<sub><i>b</i></sub> ${N}</span>?`,
      c: [S(i, j), S(j, i), S(i + 1, j), S(i, j + 1), `${i + j}<i>uw</i>`],
      e: `${N} = ${[i ? pw("2", i) : "", j ? pw("3", j) : ""].filter(Boolean).join(" · ")}, so log<sub><i>b</i></sub> ${N} = ${S(i, j)}.`,
      s: [{ p: `Write ${N} as 2<sup><i>i</i></sup> · 3<sup><i>j</i></sup>. What is <i>i</i>?`, a: String(i) }, { p: "What is <i>j</i>?", a: String(j) }]
    };
  });

  G("2.13", 8, (R) => {
    const b = R.pick([2, 3, 5]), k = R.int(1, b === 2 ? 6 : 4), N = b ** k, m = R.nz(-4, 4), n = R.int(-6, 6), x = fr(k - n, m);
    return {
      q: `Solve <span class="m">${sup(b, poly([m, n]))} = ${N}</span>.`,
      c: [x.h, fr(k + n, m).h, fr(N - n, m).h, fr((k - n) * m, 1).h, fr(k, m).h].map((v) => xeq(v)),
      e: `${N} = ${sup(b, k)}, so ${poly([m, n])} = ${k} and <i>x</i> = ${x.h}.`,
      s: [{ p: `Write ${N} as a power of ${b}. What is the exponent?`, a: String(k) }, { p: `Solve ${poly([m, n])} = ${k}.`, a: x.a }]
    };
  });
  G("2.13", 8, (R) => {
    const b = R.pick([2, 3, 4, 5, 10]), k = R.int(1, b === 10 ? 3 : b === 2 ? 5 : 3), h = R.nz(-9, 9), x = b ** k - h;
    return {
      q: `Solve <span class="m">${logb(b)}(${poly([1, h])}) = ${k}</span>.`,
      c: [x, b ** k + h, k * b - h, b ** k, k - h].map((v) => xeq(sgn(v))),
      e: `Rewrite in exponential form: ${poly([1, h])} = ${sup(b, k)} = ${b ** k}, so <i>x</i> = ${sgn(x)}.`,
      s: [{ p: `Rewrite in exponential form. ${poly([1, h])} = ?`, a: String(b ** k) }, { p: "Solve for <i>x</i>.", a: String(x) }]
    };
  });
  G("2.13", 8, (R) => {
    const a = R.int(2, 9), r = R.pick([0.02, 0.05, 0.1, 0.25, 0.5, 1.5, 2, 3]), c = a + R.int(1, 60), x = Math.log(c / a) / r;
    const f3 = (v) => (Math.round(v * 1000) / 1000).toFixed(3);
    return {
      calc: true,
      q: `Solve <span class="m">${a}<i>e</i><sup>${anum(r)}<i>x</i></sup> = ${c}</span>. Round to the nearest thousandth.`,
      c: [x, Math.log(c) / (a * r), Math.log(c - a) / r, Math.log(c / a) * r, c / a / r].map((v) => xeq(f3(v))),
      e: `Divide by ${a}: <i>e</i><sup>${anum(r)}<i>x</i></sup> = ${c}/${a}. Take ln: ${anum(r)}<i>x</i> = ln(${c}/${a}), so <i>x</i> = ln(${c}/${a}) / ${anum(r)} ≈ ${f3(x)}.`,
      s: [{ p: `Divide both sides by ${a}. <i>e</i><sup>${anum(r)}<i>x</i></sup> = ?`, a: fr(c, a).a }, { p: "Take ln of both sides and solve. <i>x</i> ≈ ?", a: f3(x), tol: 0.0006 }]
    };
  });
  G("2.13", 8, (R) => {
    const [bh, bv, ba] = R.pick([["2", 2, "2"], ["3", 3, "3"], ["(1/2)", 0.5, "1/2"], ["(1/3)", 1 / 3, "1/3"]]), k = R.int(2, 4), gt = R.bool();
    const N = bv > 1 ? String(bv ** k) : `1/${Math.round(1 / bv ** k)}`;
    const keep = bv > 1, ans = (gt === keep) ? "&gt;" : "&lt;", other = ans === "&gt;" ? "&lt;" : "&gt;";
    return {
      q: `Solve <span class="m">${sup(bh, X)} ${gt ? "&gt;" : "&lt;"} ${N}</span>.`,
      c: [`${X} ${ans} ${k}`, `${X} ${other} ${k}`, `${X} ${ans} ${N}`, `${X} ${other} ${N}`],
      e: `${N} = ${sup(bh, k)}. ${keep ? `The base is greater than 1, so ${sup(bh, X)} is increasing and the inequality keeps its direction` : `The base is between 0 and 1, so ${sup(bh, X)} is decreasing and the inequality reverses`}: <i>x</i> ${ans} ${k}.`,
      s: [{ p: `Write ${N} as a power of ${ba}. What is the exponent?`, a: String(k) },
        { p: "When you compare the exponents, the inequality…", o: keep ? ["Keeps its direction", "Reverses"] : ["Reverses", "Keeps its direction"] }]
    };
  });

  G("2.14", 9, (R) => {
    const t = R.int(0, 2);
    if (t === 0) {
      const n = R.int(1, 13);
      return {
        q: `pH is defined as pH = −log[H<sup>+</sup>]. What is the pH of a solution with [H<sup>+</sup>] = 10<sup>−${n}</sup> moles per liter?`,
        c: [n, -n, n + 1, n - 1, 14 - n].map(sgn),
        e: `pH = −log(10<sup>−${n}</sup>) = −(−${n}) = ${n}.`,
        s: [{ p: `What is log(10<sup>−${n}</sup>)?`, a: String(-n) }, { p: "Take the opposite.", a: String(n) }]
      };
    }
    if (t === 1) {
      const p = R.int(1, 13);
      return {
        q: `pH is defined as pH = −log[H<sup>+</sup>]. A solution has pH ${p}. What is [H<sup>+</sup>], in moles per liter?`,
        c: [`10<sup>−${p}</sup>`, `10<sup>${p}</sup>`, `−${p}`, `10<sup>−${p + 1}</sup>`, `${p}<sup>−10</sup>`],
        e: `${p} = −log[H<sup>+</sup>] means log[H<sup>+</sup>] = −${p}, so [H<sup>+</sup>] = 10<sup>−${p}</sup>.`,
        s: [{ p: "log[H<sup>+</sup>] = ?", a: String(-p) }, { p: "Rewrite in exponential form.", o: [`10<sup>−${p}</sup>`, `10<sup>${p}</sup>`] }]
      };
    }
    const p1 = R.int(1, 6), d = R.int(1, 4), p2 = p1 + d;
    return {
      q: `pH = −log[H<sup>+</sup>]. Solution A has pH ${p1} and solution B has pH ${p2}. How many times greater is [H<sup>+</sup>] in solution A?`,
      c: [10 ** d, d, 10 * d, 10 ** (d + 1), 2 ** d].map(big),
      e: `Each drop of 1 in pH multiplies [H<sup>+</sup>] by 10. A difference of ${d} gives 10<sup>${d}</sup> = ${big(10 ** d)}.`,
      s: [{ p: "What is the difference in pH?", a: String(d) }, { p: `Compute 10<sup>${d}</sup>.`, a: String(10 ** d) }]
    };
  });
  G("2.14", 9, (R) => {
    const M2 = R.int(3, 6), d = R.int(1, 4), M1 = M2 + d;
    return {
      q: `The magnitude of an earthquake is <i>M</i> = log(<i>A</i>/<i>A</i><sub>0</sub>), where <i>A</i> is the wave amplitude. How many times larger is the amplitude of a magnitude ${M1} earthquake than a magnitude ${M2} earthquake?`,
      c: [10 ** d, d, 10 * d, 10 ** (d + 1), 2 ** d].map(big),
      e: `<i>M</i><sub>1</sub> − <i>M</i><sub>2</sub> = log(<i>A</i><sub>1</sub>/<i>A</i><sub>2</sub>) = ${d}, so <i>A</i><sub>1</sub>/<i>A</i><sub>2</sub> = 10<sup>${d}</sup> = ${big(10 ** d)}.`,
      s: [{ p: "What is the difference in magnitudes?", a: String(d) }, { p: `Compute 10<sup>${d}</sup>.`, a: String(10 ** d) }]
    };
  });
  G("2.14", 9, (R) => {
    const n = R.int(1, 5), L1 = R.int(3, 8) * 10, L2 = L1 + 10 * n;
    return {
      q: `Sound level in decibels is <i>L</i> = 10 log(<i>I</i>/<i>I</i><sub>0</sub>). A sound of ${L2} dB is how many times as intense as a sound of ${L1} dB?`,
      c: [10 ** n, 10 * n, n, 2 ** n, 10 ** (n + 1)].map(big),
      e: `<i>L</i><sub>2</sub> − <i>L</i><sub>1</sub> = 10 log(<i>I</i><sub>2</sub>/<i>I</i><sub>1</sub>) = ${10 * n}, so log(<i>I</i><sub>2</sub>/<i>I</i><sub>1</sub>) = ${n} and the ratio is 10<sup>${n}</sup> = ${big(10 ** n)}.`,
      s: [{ p: `${10 * n} = 10 log(ratio). What is log(ratio)?`, a: String(n) }, { p: `Compute 10<sup>${n}</sup>.`, a: String(10 ** n) }]
    };
  });

  G("2.15", 13, (R) => {
    const [a, b] = R.distinct(2, 2, 9), askSlope = R.bool();
    return {
      q: `Data modeled by <span class="m"><i>y</i> = ${a} · ${sup(b, X)}</span> are graphed on a semi-log plot (log <i>y</i> versus <i>x</i>). What is the ${askSlope ? "slope" : "vertical intercept"} of the resulting line?`,
      c: askSlope ? [`log ${b}`, `log ${a}`, String(b), String(a)] : [`log ${a}`, `log ${b}`, String(a), String(b)],
      e: `log <i>y</i> = log ${a} + <i>x</i> · log ${b}. This line has slope log ${b} and vertical intercept log ${a}.`,
      s: [{ p: `Take log of both sides: log <i>y</i> = log ${a} + <i>x</i> · log ${b}. Which number is the ${askSlope ? "slope (multiplies x)" : "intercept (constant)"}?`, o: askSlope ? [`log ${b}`, `log ${a}`] : [`log ${a}`, `log ${b}`] }]
    };
  });
  G("2.15", 13, (R) => {
    const c0 = R.int(0, 2), B = R.int(2, 7), m = Math.log10(B).toFixed(3), A = 10 ** c0;
    const Y = (a, b) => `<i>y</i> = ${a === 1 ? "" : a + " · "}${sup(b, X)}`;
    return {
      q: `On a semi-log plot, data lie on the line <span class="m">log<sub>10</sub> <i>y</i> = ${c0 === 0 ? "" : c0 + " + "}${m}<i>x</i></span>. Which model best fits the original data?`,
      c: [Y(A, B), Y(B, A), `<i>y</i> = ${c0} + ${B}<i>x</i>`, Y(A, m), Y(A * B, B)],
      e: `Exponentiate: <i>y</i> = 10<sup>${c0}</sup> · (10<sup>${m}</sup>)<sup><i>x</i></sup> ≈ ${A} · ${sup(B, X)}.`,
      s: [{ p: `What is 10<sup>${c0}</sup>?`, a: String(A) }, { p: `What is 10<sup>${m}</sup>, to the nearest whole number?`, a: String(B), tol: 0.05 }]
    };
  });

  // ================================================================ UNIT 3
  G("3.1", 13, (R) => {
    const P = R.int(4, 8), vals = R.distinct(P, -9, 9), N = R.int(20, 90), r = N % P;
    return {
      q: `<i>f</i> is periodic with period ${P}. The table shows <i>f</i>(<i>x</i>) for one period. What is <i>f</i>(${N})?${table([X, ...vals.map((_, i) => i)], ["<i>f</i>(<i>x</i>)", ...vals.map(sgn)])}`,
      c: [vals[r], ...vals.filter((_, i) => i !== r)].map(sgn),
      e: `Since the period is ${P}, <i>f</i>(${N}) = <i>f</i>(${N} − ${P}·${Math.floor(N / P)}) = <i>f</i>(${r}) = ${sgn(vals[r])}.`,
      s: [{ p: `What is the remainder when ${N} is divided by ${P}?`, a: String(r) }, { p: `So <i>f</i>(${N}) = <i>f</i>(${r}). What is it?`, a: String(vals[r]) }]
    };
  });
  G("3.1", 13, (R) => {
    const Mx = R.int(5, 30), amp = R.int(1, 10), mn = Mx - 2 * amp, mid = Mx - amp, t1 = R.int(0, 5), h = R.int(1, 8), t2 = t1 + h, ask = R.int(0, 2);
    const q0 = `A sinusoidal function has a maximum of ${Mx} at <i>x</i> = ${t1} and its next minimum of ${sgn(mn)} at <i>x</i> = ${t2}. `;
    if (ask === 0) return {
      q: q0 + "What is its period?", c: [2 * h, h, 4 * h, h / 2].map(fnum),
      e: `From a maximum to the next minimum is half a period: ${t2} − ${t1} = ${h}. The period is 2 · ${h} = ${2 * h}.`,
      s: [{ p: "Max to the next min is what part of a period?", o: ["Half", "A quarter", "A full period"] }, { p: "What is the period?", a: String(2 * h) }]
    };
    if (ask === 1) return {
      q: q0 + "What is its amplitude?", c: [amp, 2 * amp, Mx, mid].map(sgn),
      e: `Amplitude = (max − min)/2 = (${Mx} − ${par(mn)})/2 = ${amp}.`,
      s: [{ p: "Compute (max − min)/2.", a: String(amp) }]
    };
    return {
      q: q0 + "What is its midline?", c: [yeq(sgn(mid)), yeq(sgn(amp)), yeq(sgn(Mx)), yeq(sgn((t1 + t2) / 2))],
      e: `Midline = (max + min)/2 = (${Mx} + ${par(mn)})/2 = ${sgn(mid)}.`,
      s: [{ p: "Compute (max + min)/2.", a: String(mid) }]
    };
  });

  const TRIPLES = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [6, 8, 10], [9, 12, 15], [20, 21, 29]];
  const QS = { 1: [1, 1], 2: [-1, 1], 3: [-1, -1], 4: [1, -1] };
  G("3.2", 25, (R) => {
    let [p, q, r] = R.pick(TRIPLES); if (R.bool()) [p, q] = [q, p];
    const Q = R.int(1, 4), x = p * QS[Q][0], y = q * QS[Q][1], fn = R.pick(["sin", "cos", "tan"]);
    const V = { sin: fr(y, r), cos: fr(x, r), tan: fr(y, x) };
    const v = V[fn], others = Object.keys(V).filter((k) => k !== fn);
    return {
      q: `The terminal side of angle θ in standard position passes through (${sgn(x)}, ${sgn(y)}). What is ${fn} θ?`,
      c: [v.h, V[others[0]].h, V[others[1]].h, fr(-v.n, v.d).h, fr(v.d, v.n).h],
      e: `<i>r</i> = √(${par(x)}² + ${par(y)}²) = ${r}. sin θ = <i>y</i>/<i>r</i>, cos θ = <i>x</i>/<i>r</i>, tan θ = <i>y</i>/<i>x</i>. So ${fn} θ = ${v.h}.`,
      s: [{ p: "Find <i>r</i> = √(<i>x</i>² + <i>y</i>²).", a: String(r) }, { p: `Compute ${fn} θ.`, a: v.a }]
    };
  });

  G("3.3", 30, (R) => {
    const p = R.pick(SPECIAL), fn = R.pick(["sin", "cos"]), other = fn === "sin" ? "cos" : "sin";
    const v = exact(tv(fn, p.v)), ov = exact(tv(other, p.v)), nv = exact(-tv(fn, p.v));
    const ref = refAngle(p), Q = quadrantOf(p), quad = isQuadrantal(p);
    return {
      q: `What is the exact value of <span class="m">${fnH(fn, p.h)}</span>?`,
      c: [v.h, nv.h, ov.h, exact(-tv(other, p.v)).h, ...R.shuffle(VALS.slice(0, 9))],
      e: quad ? `${p.h} lies on an axis. On the unit circle it is the point (${exact(Math.cos(p.v)).h}, ${exact(Math.sin(p.v)).h}), so ${fn}(${p.h}) = ${v.h}.`
        : `${p.h} is in Quadrant ${["I", "II", "III", "IV"][Q - 1]} with reference angle ${ref.h}. ${fn}(${ref.h}) = ${exact(tv(fn, ref.v)).h}, and ${fn} is ${tv(fn, p.v) > 0 ? "positive" : "negative"} there, so ${fn}(${p.h}) = ${v.h}.`,
      s: quad ? [{ p: `Find the point on the unit circle at angle ${p.h}. What is its ${fn === "cos" ? "x" : "y"}-coordinate?`, a: v.a }]
        : [{ p: "What is the reference angle? (type pi for π)", a: ref.a }, { p: `Is ${fn} positive or negative in Quadrant ${["I", "II", "III", "IV"][Q - 1]}?`, o: tv(fn, p.v) > 0 ? ["Positive", "Negative"] : ["Negative", "Positive"] },
          { p: `What is ${fn}(${p.h})? (type sqrt(3) for √3)`, a: v.a }]
    };
  });
  G("3.3", 14, (R) => {
    const k = R.int(1, 24), deg = 15 * k, rad = pf(k, 12), toRad = R.bool();
    if (toRad) return {
      q: `What is ${deg}° in radians?`,
      c: [rad.h, pf(k, 6).h, pf(k, 24).h, pf(24 - k, 12).h, pf(k + 6, 12).h],
      e: `Multiply by π/180: ${deg} · π/180 = ${rad.h}.`,
      s: [{ p: `Compute ${deg} · π/180. (type pi for π)`, a: rad.a }]
    };
    return {
      q: `What is <span class="m">${rad.h}</span> radians in degrees?`,
      c: [deg, deg * 2, deg / 2, 360 - deg, deg + 90].map((v) => fnum(v) + "°"),
      e: `Multiply by 180/π: ${rad.h} · 180/π = ${deg}°.`,
      s: [{ p: `Compute ${rad.h} · 180/π.`, a: String(deg) }]
    };
  });

  G("3.4", 8, (R) => {
    const fn = R.pick(["sin", "cos"]), q = R.int(0, 3), iv = [pf(q, 2), pf(q + 1, 2)];
    const mid = (q + 0.5) * Math.PI / 2;
    const inc = fn === "sin" ? Math.cos(mid) > 0 : -Math.sin(mid) > 0, up = -tv(fn, mid) > 0;
    const lab = (i, u) => `${i ? "Increasing" : "Decreasing"} and concave ${u ? "up" : "down"}`;
    return {
      q: `Which describes the graph of <span class="m"><i>y</i> = ${fn} <i>x</i></span> on the interval (${iv[0].h}, ${iv[1].h})?`,
      c: [lab(inc, up), lab(!inc, up), lab(inc, !up), lab(!inc, !up)],
      e: `On (${iv[0].h}, ${iv[1].h}), ${fn} <i>x</i> goes from ${exact(tv(fn, iv[0].v)).h} to ${exact(tv(fn, iv[1].v)).h}, so it is ${inc ? "increasing" : "decreasing"}. The graph is ${up ? "below" : "above"} its midline there, so it is concave ${up ? "up" : "down"}.`,
      s: [{ p: `What are ${fn}(${iv[0].h}) and ${fn}(${iv[1].h})? Enter both, separated by a comma.`, a: `${exact(tv(fn, iv[0].v)).a},${exact(tv(fn, iv[1].v)).a}` },
        { p: "Is the graph above or below the midline <i>y</i> = 0 there?", o: up ? ["Below, so concave up", "Above, so concave down"] : ["Above, so concave down", "Below, so concave up"] }]
    };
  });
  G("3.4", 18, (R) => {
    const fn = R.pick(["sin", "cos"]), a = R.nz(-6, 6), d = R.int(-6, 6), ask = R.int(0, 2), A = Math.abs(a);
    const f = `${coefH(a)}${fn} <i>x</i>${plusK(d)}`;
    if (ask === 0) return {
      q: `What is the maximum value of <span class="m"><i>f</i>(<i>x</i>) = ${f}</span>?`, c: [A + d, a + d, d, A, d - A, A - d].map(sgn),
      e: `${fn} <i>x</i> ranges from −1 to 1, so ${coefH(a)}${fn} <i>x</i> ranges from −${A} to ${A}. The maximum is ${A}${plusK(d)} = ${sgn(A + d)}.`,
      s: [{ p: `What is the largest value of ${coefH(a)}${fn} <i>x</i>?`, a: String(A) }, { p: `Add ${sgn(d)}.`, a: String(A + d) }]
    };
    if (ask === 1) return {
      q: `What is the minimum value of <span class="m"><i>f</i>(<i>x</i>) = ${f}</span>?`, c: [d - A, d - a, d, -A, A + d, A - d].map(sgn),
      e: `${coefH(a)}${fn} <i>x</i> ranges from −${A} to ${A}. The minimum is −${A}${plusK(d)} = ${sgn(d - A)}.`,
      s: [{ p: `What is the smallest value of ${coefH(a)}${fn} <i>x</i>?`, a: String(-A) }, { p: `Add ${sgn(d)}.`, a: String(d - A) }]
    };
    return {
      q: `What is the range of <span class="m"><i>f</i>(<i>x</i>) = ${f}</span>?`,
      c: [`[${sgn(d - A)}, ${sgn(d + A)}]`, `[${sgn(-A)}, ${A}]`, `[${sgn(d - 1)}, ${sgn(d + 1)}]`, `[${sgn(-A - d)}, ${sgn(A - d)}]`, `[${sgn(d)}, ${sgn(d + 2 * A)}]`],
      e: `The midline is <i>y</i> = ${sgn(d)} and the amplitude is ${A}, so <i>f</i> ranges from ${sgn(d - A)} to ${sgn(d + A)}.`,
      s: [{ p: "What is the amplitude?", a: String(A) }, { p: "What is the midline value?", a: String(d) }]
    };
  });

  const BS = [
    { bx: `2${X}`, per: pf(2, 2), alt: [pf(1, 2), pf(4, 1), pf(1, 1)], b: "2" },
    { bx: `3${X}`, per: pf(2, 3), alt: [pf(1, 3), pf(6, 1), pf(3, 1)], b: "3" },
    { bx: `4${X}`, per: pf(2, 4), alt: [pf(1, 4), pf(8, 1), pf(1, 1)], b: "4" },
    { bx: `${X}/2`, per: pf(4, 1), alt: [pf(1, 1), pf(1, 4), pf(2, 1)], b: "1/2" },
    { bx: `π${X}/2`, per: { h: "4", a: "4" }, alt: [{ h: "2" }, { h: "π" }, { h: "8" }], b: "pi/2" },
    { bx: `π${X}/3`, per: { h: "6", a: "6" }, alt: [{ h: "3" }, { h: "2π/3" }, { h: "12" }], b: "pi/3" },
    { bx: `π${X}/6`, per: { h: "12", a: "12" }, alt: [{ h: "6" }, { h: "π/3" }, { h: "24" }], b: "pi/6" }
  ];
  G("3.5", 26, (R) => {
    const B = R.pick(BS), fn = R.pick(["sin", "cos"]), a = R.nz(-5, 5), d = R.int(-5, 5), ask = R.int(0, 3), A = Math.abs(a);
    const f = `<i>f</i>(<i>x</i>) = ${coefH(a)}${fn}(${B.bx})${plusK(d)}`;
    if (ask === 0) return {
      q: `What is the period of <span class="m">${f}</span>?`, c: [B.per.h, ...B.alt.map((x) => x.h)],
      e: `The period of ${fn}(<i>bx</i>) is 2π/<i>b</i>. Here <i>b</i> = ${B.b.replace("pi", "π")}, so the period is ${B.per.h}.`,
      s: [{ p: "What is <i>b</i>, the coefficient of <i>x</i>? (type pi for π)", a: B.b }, { p: "Compute the period 2π/<i>b</i>.", a: B.per.a }]
    };
    if (ask === 1) return {
      q: `What is the amplitude of <span class="m">${f}</span>?`, c: [A, a, 2 * A, d, A + d].map(sgn),
      e: `Amplitude is |<i>a</i>| = |${sgn(a)}| = ${A}. It is a distance, so it is never negative.`,
      s: [{ p: `What is |${sgn(a)}|?`, a: String(A) }]
    };
    if (ask === 2) return {
      q: `What is the midline of the graph of <span class="m">${f}</span>?`, c: [yeq(sgn(d)), yeq(sgn(a)), yeq(sgn(-d)), yeq(sgn(A + d)), yeq("0")],
      e: `The vertical shift ${sgn(d)} sets the midline at <i>y</i> = ${sgn(d)}.`,
      s: [{ p: "What is the vertical shift?", a: String(d) }]
    };
    return {
      q: `What is the maximum value of <span class="m">${f}</span>?`, c: [A + d, a + d, d, A, d - A].map(sgn),
      e: `The maximum is midline + amplitude = ${sgn(d)} + ${A} = ${sgn(A + d)}.`,
      s: [{ p: "What is the amplitude?", a: String(A) }, { p: "Add the midline value.", a: String(A + d) }]
    };
  });

  G("3.6", 18, (R) => {
    const b = R.int(2, 4), m = R.pick([2, 3, 4, 6, 8, 12]), h = pf(1, m), c = pf(b, m), fn = R.pick(["sin", "cos"]), right = R.bool();
    const D = (dir, v) => `${dir} ${v.h}`;
    const R1 = right ? "Right" : "Left", L1 = right ? "Left" : "Right";
    return {
      q: `The graph of <span class="m"><i>g</i>(<i>x</i>) = ${fn}(${b}${X} ${right ? "−" : "+"} ${c.h})</span> is a horizontal shift of the graph of <span class="m"><i>y</i> = ${fn}(${b}${X})</span>. Which describes the shift?`,
      c: [D(R1, h), D(R1, c), D(L1, h), D(L1, c)],
      e: `Factor out ${b}: ${fn}(${b}${X} ${right ? "−" : "+"} ${c.h}) = ${fn}(${b}(${X} ${right ? "−" : "+"} ${h.h})). That is a shift ${R1.toLowerCase()} ${h.h}, not ${c.h}.`,
      s: [{ p: `Factor ${b} out of ${b}<i>x</i> ${right ? "−" : "+"} ${c.h}. What goes in the blank: ${b}(<i>x</i> ${right ? "−" : "+"} ___)?`, a: h.a },
        { p: "Which direction?", o: [R1, L1] }]
    };
  });
  G("3.6", 9, (R) => {
    const [ah, av] = R.pick([["2", 2], ["3", 3], ["1/2", 0.5]]), [bh, bv, inv] = R.pick([["2", 2, "1/2"], ["3", 3, "1/3"], ["1/2", 0.5, "2"]]), fn = R.pick(["sin", "cos"]);
    const bx = bv === 0.5 ? `${X}/2` : `${bh}${X}`;
    const D = (v, hz) => `Vertical dilation by a factor of ${v} and horizontal dilation by a factor of ${hz}`;
    return {
      q: `The graph of <span class="m"><i>g</i>(<i>x</i>) = ${av === 0.5 ? "(1/2)" : ah}${fn}(${bx})</span> is obtained from <span class="m"><i>y</i> = ${fn} <i>x</i></span> by which transformations?`,
      c: [D(ah, inv), D(ah, bh), D(inv, ah), D(bh, ah)],
      e: `Multiplying the output by ${ah} is a vertical dilation by ${ah}. Multiplying the input by ${bh} is a horizontal dilation by 1/${bh.replace("1/2", "(1/2)")} = ${inv}.`,
      s: [{ p: "Vertical dilation factor?", a: ah }, { p: "Horizontal dilation factor (1 divided by the coefficient of x)?", a: inv }]
    };
  });

  G("3.7", 26, (R) => {
    const ctx = R.pick([["The depth of water at a dock", "feet", "hours"], ["The height of a seat on a Ferris wheel", "meters", "minutes"], ["The temperature in a greenhouse", "°C", "hours"], ["The height of a point on a spinning wheel", "cm", "seconds"]]);
    const T = R.pick([4, 6, 8, 10, 12, 24]), amp = R.int(2, 15), mid = amp + R.int(1, 30), Mx = mid + amp, mn = mid - amp, ask = R.int(0, 2), b = pf(2, T);
    const q0 = `${ctx[0]} varies sinusoidally. It reaches a maximum of ${Mx} ${ctx[1]} at <i>t</i> = 0 and a minimum of ${mn} ${ctx[1]} at <i>t</i> = ${T / 2} ${ctx[2]}. It is modeled by <i>h</i>(<i>t</i>) = <i>a</i> cos(<i>bt</i>) + <i>d</i>. `;
    if (ask === 0) return {
      q: q0 + "What is <i>d</i>?", c: [mid, amp, Mx, mn, T].map(String),
      e: `<i>d</i> is the midline: (${Mx} + ${mn})/2 = ${mid}.`, s: [{ p: "Compute (max + min)/2.", a: String(mid) }]
    };
    if (ask === 1) return {
      q: q0 + "What is <i>a</i>?", c: [amp, -amp, 2 * amp, mid, Mx].map(sgn),
      e: `It starts at a maximum, so <i>a</i> is positive: <i>a</i> = (${Mx} − ${mn})/2 = ${amp}.`, s: [{ p: "Compute (max − min)/2.", a: String(amp) }, { p: "It starts at a maximum. Is <i>a</i> positive or negative?", o: ["Positive", "Negative"] }]
    };
    return {
      q: q0 + "What is <i>b</i>?", c: [b.h, pf(1, T).h, String(T), pf(T, 2).h, pf(4, T).h],
      e: `Max to min takes ${T / 2} ${ctx[2]}, half a period, so the period is ${T}. Then <i>b</i> = 2π/${T} = ${b.h}.`,
      s: [{ p: "What is the period?", a: String(T) }, { p: "Compute <i>b</i> = 2π / period. (type pi for π)", a: b.a }]
    };
  });

  G("3.8", 9, (R) => {
    const b = R.int(2, 6), a = R.nz(-4, 4);
    return {
      q: `What is the period of <span class="m"><i>f</i>(<i>x</i>) = ${coefH(a)}tan(${b}${X})</span>?`,
      c: [pf(1, b).h, pf(2, b).h, pf(b, 1).h, pf(1, 2 * b).h],
      e: `tan <i>x</i> has period π, so tan(<i>bx</i>) has period π/<i>b</i> = ${pf(1, b).h}. The coefficient ${sgn(a)} doesn't change the period.`,
      s: [{ p: "What is the period of tan <i>x</i>? (type pi)", a: "pi" }, { p: `Divide by ${b}.`, a: pf(1, b).a }]
    };
  });
  G("3.8", 9, (R) => {
    const b = R.int(2, 4), j = R.int(0, 2), asym = pf(2 * j + 1, 2 * b);
    return {
      q: `Which is a vertical asymptote of the graph of <span class="m"><i>y</i> = tan(${b}${X})</span>?`,
      c: [xeq(asym.h), xeq(pf(j, b).h), xeq(pf(j + 1, b).h), xeq(pf(2 * j + 1, b).h)],
      e: `tan <i>u</i> has asymptotes where <i>u</i> = π/2 + <i>k</i>π. Solving ${b}<i>x</i> = π/2 + <i>k</i>π gives <i>x</i> = π/${2 * b} + <i>k</i>π/${b}, which includes ${asym.h}.`,
      s: [{ p: `tan <i>u</i> is undefined at <i>u</i> = π/2. Solve ${b}<i>x</i> = π/2. (type pi)`, a: pf(1, 2 * b).a }]
    };
  });
  G("3.8", 9, (R) => {
    const p = R.pick(SPECIAL.filter((s) => Number.isFinite(tv("tan", s.v)))), v = exact(tv("tan", p.v));
    return {
      q: `What is the exact value of <span class="m">tan(${p.h})</span>?`,
      c: [v.h, exact(-tv("tan", p.v)).h, ...R.shuffle(["0", "1", "−1", "√3", "−√3", "√3/3", "−√3/3"])],
      e: `tan θ = sin θ / cos θ = ${exact(Math.sin(p.v)).h} / ${exact(Math.cos(p.v)).h} = ${v.h}.`,
      s: [{ p: `What is sin(${p.h})?`, a: exact(Math.sin(p.v)).a }, { p: `What is cos(${p.h})?`, a: exact(Math.cos(p.v)).a }, { p: "Divide.", a: v.a }]
    };
  });

  const INV = { arcsin: [Math.asin, ["−1", "−√3/2", "−√2/2", "−1/2", "0", "1/2", "√2/2", "√3/2", "1"], "[−π/2, π/2]"], arccos: [Math.acos, ["−1", "−√3/2", "−√2/2", "−1/2", "0", "1/2", "√2/2", "√3/2", "1"], "[0, π]"], arctan: [Math.atan, ["−√3", "−1", "−√3/3", "0", "√3/3", "1", "√3"], "(−π/2, π/2)"] };
  const valOf = (s) => { const neg = s.startsWith("−"), t = neg ? s.slice(1) : s; const m = { "0": 0, "1": 1, "1/2": 0.5, "√2/2": Math.SQRT2 / 2, "√3/2": Math.sqrt(3) / 2, "√3": Math.sqrt(3), "√3/3": Math.sqrt(3) / 3 }[t]; return neg ? -m : m; };
  const asciiVal = (s) => s.replace("−", "-").replace(/√(\d)/g, "sqrt($1)");
  G("3.9", 30, (R) => {
    const fn = R.pick(Object.keys(INV)), [f, vals, range] = INV[fn], vs = R.pick(vals), th = fromRad(f(valOf(vs)));
    const cands = [Math.PI - th.v, -th.v, th.v + Math.PI, Math.PI / 2 - th.v, th.v + 2 * Math.PI, 2 * Math.PI - th.v].map(fromRad).map((x) => x.h);
    return {
      q: `What is <span class="m">${fn}(${vs})</span>?`,
      c: [th.h, ...cands, ...R.shuffle(["π/6", "π/3", "2π/3", "5π/6", "π/4", "3π/4"])],
      e: `The range of ${fn} is ${range}. The angle in that range whose ${fn.slice(3)} is ${vs} is ${th.h}.`,
      s: [{ p: `What is the range of ${fn}?`, o: [range, ...["[−π/2, π/2]", "[0, π]", "(−π/2, π/2)", "[0, 2π)"].filter((x) => x !== range).slice(0, 2)] },
        { p: `Which angle in that range has ${fn.slice(3)} equal to ${vs}? (type pi for π)`, a: th.a }]
    };
  });

  const solve = (fn, v) => { const out = []; for (let k = 0; k < 24; k++) { const t = (k * Math.PI) / 12, y = tv(fn, t); if (Number.isFinite(y) && Math.abs(y - v) < 1e-9) out.push(pf(k, 12)); } return out; };
  const solH = (arr) => (arr.length ? `${X} = ${arr.map((p) => p.h).join(", ")}` : "No solution");
  G("3.10", 30, (R) => {
    const fn = R.pick(["sin", "cos", "tan"]), vs = R.pick(fn === "tan" ? INV.arctan[1] : INV.arcsin[1]), v = valOf(vs), sols = solve(fn, v);
    if (!sols.length) return null;
    const other = fn === "sin" ? "cos" : fn === "cos" ? "sin" : "sin";
    const ref = fromRad(Math.abs(INV["arc" + fn][0](Math.abs(v))));
    return {
      q: `Solve <span class="m">${fn} ${X} = ${vs}</span> for 0 ≤ <i>x</i> &lt; 2π.`,
      c: [solH(sols), solH(solve(fn, -v)), solH(solve(other, v)), solH(sols.slice(0, 1)), solH(sols.map((p) => wrap2pi(p.v + Math.PI / 2)))],
      e: `${fn} <i>x</i> = ${vs} at the reference angle ${ref.h}${sols.length > 1 ? `. ${fn} is ${v > 0 ? "positive" : v < 0 ? "negative" : "zero"} at` : ", giving"} ${sols.map((p) => p.h).join(" and ")} in [0, 2π).`,
      s: [...(v !== 0 && Math.abs(v) !== 1 ? [{ p: `What is the reference angle for ${fn} <i>x</i> = ${vs.replace("−", "")}? (type pi)`, a: ref.a }] : []),
        { p: "Enter every solution in [0, 2π), separated by commas.", a: sols.map((p) => p.a).join(","), set: true }]
    };
  });
  G("3.10", 14, (R) => {
    const k = R.int(2, 5), fn = R.pick(["sin", "cos"]), vs = R.pick(["1/2", "−1/2", "√2/2", "−√2/2", "√3/2", "−√3/2", "1/3", "−2/5"]);
    return {
      q: `How many solutions does <span class="m">${fn}(${k}${X}) = ${vs}</span> have on 0 ≤ <i>x</i> &lt; 2π?`,
      c: [2 * k, k, 4 * k, 2 * k + 1, 2].map(String),
      e: `As <i>x</i> goes from 0 to 2π, ${k}<i>x</i> goes from 0 to ${2 * k}π: ${k} full cycles. ${fn} <i>u</i> = ${vs} has 2 solutions per cycle, so there are ${2 * k}.`,
      s: [{ p: `If 0 ≤ <i>x</i> &lt; 2π, then ${k}<i>x</i> runs from 0 up to? (type pi)`, a: `${2 * k}pi` }, { p: "How many full cycles is that?", a: String(k) }, { p: "Two solutions per cycle. How many in total?", a: String(2 * k) }]
    };
  });

  G("3.11", 30, (R) => {
    const fn = R.pick(["sec", "csc", "cot"]), base = { sec: "cos", csc: "sin", cot: "tan" }[fn];
    const p = R.pick(SPECIAL.filter((s) => { const b = tv(base, s.v); return Number.isFinite(b) && b !== 0; }));
    const v = exact(tv(fn, p.v)), bv = exact(tv(base, p.v));
    return {
      q: `What is the exact value of <span class="m">${fn}(${p.h})</span>?`,
      c: [v.h, exact(-tv(fn, p.v)).h, bv.h, ...R.shuffle(VALS)],
      e: `${fn} θ = 1 / ${base} θ. ${base}(${p.h}) = ${bv.h}, so ${fn}(${p.h}) = ${v.h}.`,
      s: [{ p: `What is ${base}(${p.h})?`, a: bv.a }, { p: "Take the reciprocal.", a: v.a }]
    };
  });

  G("3.12", 10, (R) => {
    let [p, q, r] = R.pick(TRIPLES); if (R.bool()) [p, q] = [q, p];
    const Q = R.int(1, 4), x = p * QS[Q][0], y = q * QS[Q][1], given = R.pick(["sin", "cos"]), find = given === "sin" ? "cos" : "sin";
    const V = { sin: fr(y, r), cos: fr(x, r) }, g = V[given], f = V[find];
    return {
      q: `If <span class="m">${given} θ = ${g.h}</span> and θ is in Quadrant ${["I", "II", "III", "IV"][Q - 1]}, what is ${find} θ?`,
      c: [f.h, fr(-f.n, f.d).h, fr(f.d, f.n).h, fr(g.n, f.n).h, fr(-g.n, g.d).h],
      e: `${find}²θ = 1 − ${given}²θ = 1 − ${Math.abs(g.n) ** 2}/${r * r} = ${Math.abs(f.n) ** 2}/${r * r}, so ${find} θ = ±${Math.abs(f.n)}/${r}. In Quadrant ${["I", "II", "III", "IV"][Q - 1]}, ${find} is ${f.v > 0 ? "positive" : "negative"}: ${f.h}.`,
      s: [{ p: `Use ${find}²θ = 1 − ${given}²θ. What is |${find} θ|?`, a: `${Math.abs(f.n)}/${r}` }, { p: `Is ${find} θ positive or negative in Quadrant ${["I", "II", "III", "IV"][Q - 1]}?`, o: f.v > 0 ? ["Positive", "Negative"] : ["Negative", "Positive"] }]
    };
  });
  G("3.12", 10, (R) => {
    let [p, q, r] = R.pick(TRIPLES); if (R.bool()) [p, q] = [q, p];
    const Q = R.int(1, 4), x = p * QS[Q][0], y = q * QS[Q][1], s = fr(y, r), c = fr(x, r), askSin = R.bool();
    const s2 = fr(2 * y * x, r * r), c2 = fr(x * x - y * y, r * r), ans = askSin ? s2 : c2;
    return {
      q: `If <span class="m">sin θ = ${s.h}</span> and θ is in Quadrant ${["I", "II", "III", "IV"][Q - 1]}, what is ${askSin ? "sin 2θ" : "cos 2θ"}?`,
      c: [ans.h, fr(-ans.n, ans.d).h, (askSin ? c2 : s2).h, fr(2 * y, r).h, fr(2 * x, r).h],
      e: askSin ? `cos θ = ${c.h} (from the Pythagorean identity and the quadrant). sin 2θ = 2 sin θ cos θ = 2(${s.h})(${c.h}) = ${s2.h}.`
        : `cos 2θ = 1 − 2 sin²θ = 1 − 2(${y * y}/${r * r}) = ${c2.h}.`,
      s: askSin ? [{ p: "Find cos θ (use the quadrant for the sign).", a: c.a }, { p: "Compute 2 sin θ cos θ.", a: s2.a }]
        : [{ p: "Compute sin²θ.", a: fr(y * y, r * r).a }, { p: "Compute 1 − 2 sin²θ.", a: c2.a }]
    };
  });
  const IDS = [["sin²θ + cos²θ", "1"], ["1 + tan²θ", "sec²θ"], ["1 + cot²θ", "csc²θ"], ["tan θ · cos θ", "sin θ"], ["sec θ · cos θ", "1"], ["(1 − sin²θ) / cos θ", "cos θ"],
    ["sin θ / tan θ", "cos θ"], ["cot θ · sin θ", "cos θ"], ["csc θ · tan θ", "sec θ"], ["sec²θ − tan²θ", "1"], ["sin(−θ)", "−sin θ"], ["cos(−θ)", "cos θ"], ["sin(π/2 − θ)", "cos θ"], ["cos(π/2 − θ)", "sin θ"], ["tan(−θ)", "−tan θ"], ["(sec²θ − 1) / tan θ", "tan θ"]];
  G("3.12", 8, (R) => {
    const [expr, ans] = R.pick(IDS);
    return {
      q: `Which is equivalent to <span class="m">${expr}</span>?`,
      c: [ans, ...R.shuffle(["1", "sin θ", "cos θ", "tan θ", "sec²θ", "csc²θ", "sec θ", "−sin θ", "0", "−cos θ"])],
      e: `Rewrite in terms of sine and cosine, or use a Pythagorean, reciprocal, or symmetry identity: ${expr} = ${ans}.`,
      s: [{ p: `Simplify ${expr}.`, o: [ans, ...R.shuffle(["1", "sin θ", "cos θ", "tan θ"].filter((x) => x !== ans)).slice(0, 2)] }]
    };
  });

  G("3.13", 13, (R) => {
    const r = R.int(1, 6), p = R.pick(SPECIAL.filter((s) => s.v > 0)), x = exact(Math.cos(p.v), r), y = exact(Math.sin(p.v), r);
    const nx = exact(-Math.cos(p.v), r), ny = exact(-Math.sin(p.v), r);
    return {
      q: `Convert the polar point <span class="m">(<i>r</i>, θ) = (${r}, ${p.h})</span> to rectangular coordinates.`,
      c: [pt(x.h, y.h), pt(y.h, x.h), pt(nx.h, y.h), pt(x.h, ny.h), pt(nx.h, ny.h)],
      e: `<i>x</i> = <i>r</i> cos θ = ${r} cos(${p.h}) = ${x.h} and <i>y</i> = <i>r</i> sin θ = ${r} sin(${p.h}) = ${y.h}.`,
      s: [{ p: `<i>x</i> = ${r} cos(${p.h}). Compute it.`, a: x.a }, { p: `<i>y</i> = ${r} sin(${p.h}). Compute it.`, a: y.a }]
    };
  });
  G("3.13", 13, (R) => {
    const r = R.int(1, 6), p = R.pick(SPECIAL), x = exact(Math.cos(p.v), r), y = exact(Math.sin(p.v), r);
    const P = (rr, q) => `(${rr}, ${q.h})`;
    return {
      q: `Which polar coordinates, with <i>r</i> &gt; 0 and 0 ≤ θ &lt; 2π, represent the rectangular point (${x.h}, ${y.h})?`,
      c: [P(r, p), P(r, wrap2pi(p.v + Math.PI)), P(r, wrap2pi(Math.PI - p.v)), P(r, wrap2pi(-p.v)), P(r, wrap2pi(Math.PI / 2 - p.v)), P(r * 2, p)],
      e: `<i>r</i> = √(<i>x</i>² + <i>y</i>²) = ${r}. The point is ${isQuadrantal(p) ? "on an axis" : `in Quadrant ${["I", "II", "III", "IV"][quadrantOf(p) - 1]}`}, so θ = ${p.h}.`,
      s: [{ p: "Compute <i>r</i> = √(<i>x</i>² + <i>y</i>²).", a: String(r) }, { p: "Find θ in [0, 2π). (type pi)", a: p.a }]
    };
  });

  G("3.14", 7, (R) => {
    const a = R.nz(-8, 8), cosine = R.bool(), half = fr(a, 2), rad = fr(Math.abs(a), 2);
    const C = (cx0, cy0, rr) => `A circle centered at (${cx0}, ${cy0}) with radius ${rr}`;
    const ctr = cosine ? [half.h, "0"] : ["0", half.h];
    return {
      q: `Which describes the polar graph of <span class="m"><i>r</i> = ${sgn(a)} ${cosine ? "cos" : "sin"} θ</span>?`,
      c: [C(ctr[0], ctr[1], rad.h), C(cosine ? sgn(a) : "0", cosine ? "0" : sgn(a), String(Math.abs(a))), C(ctr[1], ctr[0], rad.h), C(ctr[0], ctr[1], String(Math.abs(a))), "A cardioid"],
      e: `Multiply by <i>r</i>: <i>r</i>² = ${sgn(a)}<i>r</i> ${cosine ? "cos" : "sin"} θ, so <i>x</i>² + <i>y</i>² = ${sgn(a)}<i>${cosine ? "x" : "y"}</i>. Completing the square gives a circle centered at (${ctr[0]}, ${ctr[1]}) with radius ${rad.h}.`,
      s: [{ p: `In rectangular form, <i>r</i> ${cosine ? "cos" : "sin"} θ equals…`, o: cosine ? ["<i>x</i>", "<i>y</i>"] : ["<i>y</i>", "<i>x</i>"] }, { p: "What is the radius?", a: rad.a }]
    };
  });
  G("3.14", 7, (R) => {
    const n = R.int(2, 7), a = R.int(1, 6), fn = R.pick(["cos", "sin"]), pet = n % 2 ? n : 2 * n;
    return {
      q: `How many petals does the rose curve <span class="m"><i>r</i> = ${a === 1 ? "" : a} ${fn}(${n}θ)</span> have?`,
      c: [pet, n % 2 ? 2 * n : n, n + 1, a, 2 * pet].map(String),
      e: `For <i>r</i> = <i>a</i> ${fn}(<i>n</i>θ), there are <i>n</i> petals when <i>n</i> is odd and 2<i>n</i> when <i>n</i> is even. Here <i>n</i> = ${n}, so there are ${pet}.`,
      s: [{ p: `Is <i>n</i> = ${n} odd or even?`, o: n % 2 ? ["Odd", "Even"] : ["Even", "Odd"] }, { p: "How many petals?", a: String(pet) }]
    };
  });
  G("3.14", 7, (R) => {
    const a = R.int(1, 8), b = R.int(1, 8), fn = R.pick(["sin", "cos"]);
    const T = ["A cardioid", "A limaçon with an inner loop", "A dimpled limaçon", "A convex limaçon", "A circle"];
    const k = a === b ? 0 : a < b ? 1 : a < 2 * b ? 2 : 3;
    return {
      q: `Which describes the polar graph of <span class="m"><i>r</i> = ${a} + ${b === 1 ? "" : b} ${fn} θ</span>?`,
      c: [T[k], ...T.filter((_, i) => i !== k)],
      e: `For <i>r</i> = <i>a</i> + <i>b</i> ${fn} θ with <i>a</i>, <i>b</i> &gt; 0: <i>a</i> = <i>b</i> is a cardioid, <i>a</i> &lt; <i>b</i> has an inner loop, <i>b</i> &lt; <i>a</i> &lt; 2<i>b</i> is dimpled, and <i>a</i> ≥ 2<i>b</i> is convex. Here <i>a</i>/<i>b</i> = ${fr(a, b).h}.`,
      s: [{ p: "Compute <i>a</i>/<i>b</i>.", a: fr(a, b).a }, { p: "Which type is it?", o: [T[k], ...T.slice(0, 4).filter((_, i) => i !== k)] }]
    };
  });
  G("3.14", 7, (R) => {
    const b = R.int(1, 6), a = b + R.int(1, 6), fn = R.pick(["sin", "cos"]);
    return {
      q: `What is the greatest distance from the origin to a point on the graph of <span class="m"><i>r</i> = ${a} + ${b === 1 ? "" : b} ${fn} θ</span>?`,
      c: [a + b, a, b, a - b, 2 * a].map(String),
      e: `${fn} θ is at most 1, so <i>r</i> is at most ${a} + ${b} = ${a + b}. Since <i>r</i> stays positive, that is the greatest distance.`,
      s: [{ p: `What is the largest value of ${fn} θ?`, a: "1" }, { p: "So what is the largest value of <i>r</i>?", a: String(a + b) }]
    };
  });

  G("3.15", 13, (R) => {
    const fn = R.pick(["sin", "cos"]), b = R.nz(-4, 4), a = Math.abs(b) + R.int(1, 5), q = R.int(0, 3), iv = [pf(q, 2), pf(q + 1, 2)];
    const mid = (q + 0.5) * Math.PI / 2, trigInc = fn === "sin" ? Math.cos(mid) > 0 : -Math.sin(mid) > 0, rInc = (b > 0) === trigInc;
    return {
      q: `For <span class="m"><i>r</i> = ${a} ${b > 0 ? "+" : "−"} ${Math.abs(b) === 1 ? "" : Math.abs(b)} ${fn} θ</span> on the interval ${iv[0].h} &lt; θ &lt; ${iv[1].h}, which is true?`,
      c: [rInc ? "The distance from the origin is increasing" : "The distance from the origin is decreasing", rInc ? "The distance from the origin is decreasing" : "The distance from the origin is increasing", "The distance from the origin is constant", "<i>r</i> is negative on this interval"],
      e: `On that interval ${fn} θ is ${trigInc ? "increasing" : "decreasing"}, so <i>r</i> is ${rInc ? "increasing" : "decreasing"}. Since <i>r</i> &gt; 0 (${a} &gt; ${Math.abs(b)}), the distance from the origin is ${rInc ? "increasing" : "decreasing"}.`,
      s: [{ p: `Is ${fn} θ increasing or decreasing on that interval?`, o: trigInc ? ["Increasing", "Decreasing"] : ["Decreasing", "Increasing"] },
        { p: `The coefficient of ${fn} θ is ${sgn(b)}. Is <i>r</i> increasing or decreasing?`, o: rInc ? ["Increasing", "Decreasing"] : ["Decreasing", "Increasing"] }]
    };
  });
  G("3.15", 13, (R) => {
    const fn = R.pick(["sin", "cos"]), b = R.nz(-5, 5), a = Math.abs(b) + R.int(1, 5), q = R.int(0, 3), t1 = pf(q, 2), t2 = pf(q + 1, 2);
    const r = (t) => a + b * tv(fn, t), r1 = r(t1.v), r2 = r(t2.v), ch = Math.round(r2 - r1);
    const A = (n) => (n === 0 ? "0" : `${n < 0 ? M : ""}${Math.abs(n)}/π`);
    return {
      q: `What is the average rate of change of <span class="m"><i>r</i> = ${a} ${b > 0 ? "+" : "−"} ${Math.abs(b) === 1 ? "" : Math.abs(b)} ${fn} θ</span> with respect to θ on the interval [${t1.h}, ${t2.h}]?`,
      c: [A(2 * ch), A(-2 * ch), sgn(ch), `${ch < 0 ? M : ""}${Math.abs(ch) === 1 ? "" : Math.abs(ch)}π/2`, A(ch)],
      e: `<i>r</i>(${t1.h}) = ${Math.round(r1)} and <i>r</i>(${t2.h}) = ${Math.round(r2)}. Average rate of change = (${Math.round(r2)} − ${Math.round(r1)}) / (π/2) = ${A(2 * ch)}.`,
      s: [{ p: `Find <i>r</i>(${t1.h}).`, a: String(Math.round(r1)) }, { p: `Find <i>r</i>(${t2.h}).`, a: String(Math.round(r2)) },
        { p: "Divide the change in <i>r</i> by π/2. (type pi)", a: `${2 * ch}/pi` }]
    };
  });

  // ---------------------------------------------------------------- build
  const seen = new Set(BANK.map((q) => q.q));
  const tally = {};
  GENS.forEach((g, gi) => {
    const R = makeR(rng(strHash(g.t + ":" + gi)));
    let made = 0, tries = 0;
    while (made < g.count && tries < g.count * 80) {
      tries++;
      let o;
      try { o = g.fn(R); } catch (err) { o = null; }
      if (!o || seen.has(o.q)) continue;
      const c = [];
      for (const x of o.c) if (x != null && !/NaN|undefined|Infinity/.test(x) && !c.includes(x)) c.push(x);
      if (c.length < 4) continue;
      seen.add(o.q);
      BANK.push({ u: parseInt(g.t, 10), t: g.t, calc: !!o.calc, q: o.q, c: c.slice(0, 4), e: o.e, s: o.s, gen: true });
      made++;
    }
    tally[g.t] = (tally[g.t] || 0) + made;
  });
  window.__genTally = tally;
})();
