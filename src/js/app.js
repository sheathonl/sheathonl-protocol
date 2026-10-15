(() => {
  var w = () => typeof matchMedia == "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function K(t, n, { stiffness: d = 170, damping: s = 22, mass: p = 1, onUpdate: c, onDone: u } = {}) {
    if (w()) return c && c(n), u && u(), () => {
    };
    let m = t, e = 0, l = performance.now(), f = 0, b = false, y = 1 / 240, x = (C) => {
      if (b) return;
      let k = Math.min(0.05, (C - l) / 1e3);
      for (l = C; k > 0; ) {
        let M = Math.min(y, k), S = (-d * (m - n) - s * e) / p;
        e += S * M, m += e * M, k -= M;
      }
      if (c && c(m), Math.abs(m - n) < 5e-4 && Math.abs(e) < 5e-4) {
        c && c(n), u && u();
        return;
      }
      f = requestAnimationFrame(x);
    };
    return f = requestAnimationFrame(x), () => {
      b = true, cancelAnimationFrame(f);
    };
  }
  function P(t = document) {
    let n = [...t.querySelectorAll("[data-reveal]")];
    if (!n.length) return;
    let d = (c, u) => {
      if (!c.dataset.shown) {
        if (c.dataset.shown = "1", w()) {
          c.classList.add("is-in");
          return;
        }
        setTimeout(() => {
          K(0, 1, { onUpdate: (m) => {
            c.style.opacity = String(Math.max(0, Math.min(1, m * 1.15))), c.style.transform = `translate3d(0,${(1 - m) * 26}px,0) scale(${0.97 + 0.03 * m})`;
          }, onDone: () => {
            c.style.opacity = "", c.style.transform = "", c.classList.add("is-in");
          } });
        }, u);
      }
    };
    if (w() || typeof IntersectionObserver > "u") {
      n.forEach((c) => d(c, 0));
      return;
    }
    let s = /* @__PURE__ */ new Map(), p = new IntersectionObserver((c) => {
      c.filter((u) => u.isIntersecting).forEach((u, m) => {
        let e = u.target.parentElement, l = s.get(e) || 0;
        s.set(e, l + 1), d(u.target, Math.min(m + l, 6) * 70), p.unobserve(u.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    n.forEach((c) => p.observe(c));
  }
  function O(t) {
    if (!t) return;
    let n = false, d = () => {
      n = false;
      let p = document.documentElement.scrollHeight - innerHeight, c = p > 0 ? Math.min(1, Math.max(0, scrollY / p)) : 0;
      t.style.transform = `scaleX(${c})`;
    }, s = () => {
      n || (n = true, requestAnimationFrame(d));
    };
    addEventListener("scroll", s, { passive: true }), addEventListener("resize", s), d();
  }
  function B() {
    w() || document.addEventListener("pointermove", (t) => {
      let n = t.target.closest && t.target.closest(".spot");
      if (!n) return;
      let d = n.getBoundingClientRect();
      n.style.setProperty("--mx", t.clientX - d.left + "px"), n.style.setProperty("--my", t.clientY - d.top + "px");
    }, { passive: true });
  }
  function R(t) {
    if (!t || w()) return;
    let n = [...t.querySelectorAll("[data-depth]")];
    if (!n.length) return;
    let d = { x: 0, y: 0, vx: 0, vy: 0 }, s = { x: 0, y: 0 }, p = 0, c = 0, u = 0, m = (l) => {
      let f = Math.min(0.05, (l - u) / 1e3 || 0.016);
      u = l;
      for (let y of ["x", "y"]) {
        let x = -120 * (d[y] - s[y]) - 18 * d["v" + y];
        d["v" + y] += x * f, d[y] += d["v" + y] * f;
      }
      for (let y of n) {
        let x = parseFloat(y.dataset.depth) || 0;
        y.style.transform = `translate3d(${(d.x * x * 26).toFixed(2)}px,${(d.y * x * 26 - p * x * 0.12).toFixed(2)}px,0)`;
      }
      c = Math.abs(d.x - s.x) + Math.abs(d.y - s.y) + Math.abs(d.vx) + Math.abs(d.vy) < 2e-3 ? 0 : requestAnimationFrame(m);
    }, e = () => {
      c || (u = performance.now(), c = requestAnimationFrame(m));
    };
    t.addEventListener("pointermove", (l) => {
      let f = t.getBoundingClientRect();
      s.x = (l.clientX - f.left) / f.width - 0.5, s.y = (l.clientY - f.top) / f.height - 0.5, e();
    }, { passive: true }), t.addEventListener("pointerleave", () => {
      s.x = 0, s.y = 0, e();
    }), addEventListener("scroll", () => {
      p = Math.min(scrollY, 900), e();
    }, { passive: true });
  }
  var U = 6e4, z = 2e3, D = 6e4, J = 10, W = 30, v = (t, n = document) => n.querySelector(t), L = (t) => t != null && t !== "" && isFinite(Number(t));
  function N(t) {
    if (!isFinite(t)) return "\u2014";
    let n = Math.abs(t);
    return n >= 1e9 ? "$" + (t / 1e9).toFixed(2) + "B" : n >= 1e6 ? "$" + (t / 1e6).toFixed(2) + "M" : n >= 1e3 ? "$" + (t / 1e3).toFixed(1) + "K" : "$" + t.toFixed(2);
  }
  function T(t) {
    if (!isFinite(t)) return "\u2014";
    if (t >= 1e3) return "$" + t.toLocaleString("en-US", { maximumFractionDigits: 2 });
    if (t >= 1) return "$" + t.toFixed(2);
    if (t >= 0.01) return "$" + t.toFixed(4);
    if (t <= 0) return "$0.00";
    let n = Math.min(12, 2 + Math.ceil(-Math.log10(t)) + 2);
    return "$" + t.toFixed(n);
  }
  function q(t) {
    return isFinite(t) ? (t > 0 ? "+" : t < 0 ? "\u2212" : "") + Math.abs(t).toFixed(2) + "%" : "\u2014";
  }
  var j = (t) => t && t.length > 12 ? t.slice(0, 4) + "\u2026" + t.slice(-4) : t || "";
  function I(t, n) {
    let d = Array.isArray(t) ? t : [], s = /* @__PURE__ */ new Map(), p = [];
    for (let e of d) !e || e.chainId !== "solana" || !e.tokenAddress || s.has(e.tokenAddress) || (s.set(e.tokenAddress, e.icon || ""), p.push(e.tokenAddress));
    let c = /* @__PURE__ */ new Map(), u = Array.isArray(n) ? n : [];
    for (let e of u) {
      if (!e || e.chainId !== "solana" || !e.baseToken || !e.baseToken.address) continue;
      let l = e.baseToken.address, f = Number(e.volume && e.volume.h24) || 0, b = c.get(l);
      (!b || f > b._vol) && c.set(l, Object.assign({}, e, { _vol: f }));
    }
    let m = [];
    for (let [e, l] of c) m.push({ addr: e, name: String(l.baseToken.name || l.baseToken.symbol || j(e)), symbol: String(l.baseToken.symbol || "").slice(0, 12), img: l.info && l.info.imageUrl || s.get(e) || "", price: L(l.priceUsd) ? Number(l.priceUsd) : NaN, chg: L(l.priceChange && l.priceChange.h24) ? Number(l.priceChange.h24) : NaN, vol: l._vol, liq: L(l.liquidity && l.liquidity.usd) ? Number(l.liquidity.usd) : NaN });
    return m.sort((e, l) => l.vol - e.vol), { addrs: p.slice(0, W), items: m.slice(0, J) };
  }
  function Q(t) {
    let n = document.createElement("span");
    n.className = "logo-tile", n.dataset.tone = String(t.addr.charCodeAt(0) % 4);
    let d = document.createElement("span");
    if (d.className = "tile-letter", d.textContent = (t.symbol || t.name || "?").trim().charAt(0).toUpperCase() || "?", n.appendChild(d), t.img && /^https:\/\//i.test(t.img)) {
      let s = document.createElement("img");
      s.alt = "", s.loading = "lazy", s.decoding = "async", s.referrerPolicy = "no-referrer", s.addEventListener("load", () => n.classList.add("has-img")), s.addEventListener("error", () => s.remove()), s.src = t.img, n.appendChild(s);
    }
    return n;
  }
  function A(t, n, d) {
    let s = t._val;
    if (t._val = n, t._cancel && t._cancel(), !isFinite(n)) {
      t.textContent = "\u2014";
      return;
    }
    if (s === void 0 || !isFinite(s) || s === n || w()) {
      t.textContent = d(n);
      return;
    }
    let p = performance.now(), c = 700, u = 0, m = (e) => {
      let l = Math.min(1, (e - p) / c), f = 1 - Math.pow(1 - l, 3);
      t.textContent = d(s + (n - s) * f), l < 1 && (u = requestAnimationFrame(m));
    };
    u = requestAnimationFrame(m), t._cancel = () => cancelAnimationFrame(u), t.classList.remove("flash-up", "flash-down"), t.offsetWidth, t.classList.add(n > s ? "flash-up" : "flash-down"), clearTimeout(t._ft), t._ft = setTimeout(() => t.classList.remove("flash-up", "flash-down"), 1e3);
  }
  async function V(t) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) return await navigator.clipboard.writeText(t), true;
    } catch {
    }
    try {
      let n = document.createElement("textarea");
      n.value = t, n.setAttribute("readonly", ""), n.style.cssText = "position:fixed;top:0;left:0;opacity:0", document.body.appendChild(n), n.select();
      let d = document.execCommand("copy");
      return n.remove(), d;
    } catch {
      return false;
    }
  }
  function H() {
    document.addEventListener("click", async (t) => {
      let n = t.target.closest && t.target.closest("[data-copy]");
      if (!n || n.getAttribute("aria-disabled") === "true" || !n.dataset.copy) return;
      let d = await V(n.dataset.copy), s = n.querySelector("[data-ca-act],[data-copy-label]") || n;
      s.dataset.idle === void 0 && (s.dataset.idle = s.textContent), s.textContent = d ? "Copied" : "Copy failed", n.classList.toggle("copied", d), clearTimeout(n._t), n._t = setTimeout(() => {
        s.textContent = s.dataset.idle, n.classList.remove("copied");
      }, 1500);
    });
  }
  function X(t) {
    let n = t.records.find((a) => a.id === "market-source"), d = document.querySelectorAll("[data-live]"), s = v("#rows"), p = v("#tape-list"), c = v("#ticker-track"), u = v("#market-msg"), m = v("#bed-search"), e = { items: [], filter: "all", q: "", failures: 0, timer: 0, ctrl: null, rows: /* @__PURE__ */ new Map(), tick: "" }, l = (a, r) => {
      d.forEach((i) => {
        i.dataset.status = a;
        let o = i.querySelector("[data-live-text]");
        o && (o.textContent = r);
      });
    }, f = () => {
      s && (s.querySelectorAll(".skel").forEach((a) => a.remove()), s.classList.remove("is-loading"));
    };
    if (!n || n.state !== "stated" || !n.url || !n.pairs) {
      l("pending", "Feed pending"), u && (u.hidden = false, u.textContent = "Market feed pending"), f();
      return;
    }
    function b() {
      let a = document.createElement("li");
      return a.className = "mrow spot", a.innerHTML = '<span class="m-id"><span class="m-logo"></span><span class="m-name"><strong></strong><em></em></span></span><span class="m-cell m-price" data-l="Price"></span><span class="m-cell m-chg" data-l="24h"></span><span class="m-cell m-vol" data-l="Volume"></span><span class="m-cell m-liq" data-l="Liquidity"></span><button class="copy-mini" type="button" data-copy="" aria-label=""><span data-copy-label>Copy</span></button>', a;
    }
    function y(a, r, i) {
      if (i) {
        a.querySelector(".m-logo").replaceChildren(Q(r)), a.querySelector("strong").textContent = r.name, a.querySelector("em").textContent = r.symbol ? "$" + r.symbol : j(r.addr);
        let o = a.querySelector(".copy-mini");
        o.dataset.copy = r.addr, o.setAttribute("aria-label", "Copy address of " + r.name);
      }
      A(a.querySelector(".m-price"), r.price, T), A(a.querySelector(".m-chg"), r.chg, q), A(a.querySelector(".m-vol"), r.vol, N), A(a.querySelector(".m-liq"), r.liq, N), a.querySelector(".m-chg").dataset.dir = r.chg > 0 ? "up" : r.chg < 0 ? "down" : "flat";
    }
    function x() {
      if (!s) return;
      f();
      let a = new Set(e.items.map((r) => r.addr));
      for (let [r, i] of e.rows) a.has(r) || (i.remove(), e.rows.delete(r));
      e.items.forEach((r, i) => {
        let o = e.rows.get(r.addr), h = !o;
        o || (o = b(), o.style.setProperty("--i", String(i)), o.classList.add("row-in"), e.rows.set(r.addr, o)), y(o, r, h), s.appendChild(o);
      }), C(), k(), M();
    }
    function C() {
      let a = e.q.trim().toLowerCase(), r = 0;
      for (let o of e.items) {
        let h = e.rows.get(o.addr);
        if (!h) continue;
        let g = e.filter === "all" || e.filter === "up" && o.chg > 0 || e.filter === "down" && o.chg < 0, E = !a || (o.name + " " + o.symbol + " " + o.addr).toLowerCase().includes(a);
        h.hidden = !(g && E), h.hidden || r++;
      }
      let i = v("#rows-empty");
      i && (i.hidden = r > 0 || !e.items.length);
    }
    function k() {
      if (!p) return;
      let a = e.items.filter((r) => isFinite(r.chg)).sort((r, i) => Math.abs(i.chg) - Math.abs(r.chg)).slice(0, 8);
      p.replaceChildren(...a.map((r) => {
        let i = document.createElement("li"), o = document.createElement("button");
        o.type = "button", o.className = "tape-btn spot", o.dataset.copy = r.addr, o.setAttribute("aria-label", "Copy address of " + r.name);
        let h = document.createElement("b");
        h.className = r.chg < 0 ? "down" : "up", h.textContent = r.chg < 0 ? "DOWN" : "UP";
        let g = document.createElement("span");
        return g.className = "tape-tx", g.dataset.copyLabel = "", g.textContent = (r.symbol ? "$" + r.symbol : r.name) + " " + q(r.chg) + " \xB7 " + N(r.vol), o.append(h, g), i.appendChild(o), i;
      }));
    }
    function M() {
      if (!c) return;
      let a = e.items.map((i) => i.addr).join(","), r = (i) => {
        let o = document.createElement("span");
        o.className = "tick", o.dataset.addr = i.addr;
        let h = document.createElement("b");
        h.textContent = i.symbol ? "$" + i.symbol : i.name;
        let g = document.createElement("span");
        g.className = "t-price", g.textContent = T(i.price);
        let E = document.createElement("span");
        return E.className = "t-chg", E.dataset.dir = i.chg > 0 ? "up" : i.chg < 0 ? "down" : "flat", E.textContent = q(i.chg), o.append(h, g, E), o;
      };
      if (a !== e.tick) {
        e.tick = a;
        let i = document.createElement("div");
        i.className = "tick-set", e.items.forEach((h) => i.appendChild(r(h)));
        let o = i.cloneNode(true);
        o.setAttribute("aria-hidden", "true"), c.replaceChildren(i, o), c.parentElement.classList.add("is-ready");
      } else c.querySelectorAll(".tick").forEach((i) => {
        let o = e.items.find((g) => g.addr === i.dataset.addr);
        if (!o) return;
        i.querySelector(".t-price").textContent = T(o.price);
        let h = i.querySelector(".t-chg");
        h.textContent = q(o.chg), h.dataset.dir = o.chg > 0 ? "up" : o.chg < 0 ? "down" : "flat";
      });
    }
    function S() {
      if (c && !e.tick) {
        let a = document.createElement("span");
        a.className = "tick-ph", a.textContent = "\u2014", c.replaceChildren(a);
      }
      if (p && !e.items.length) {
        let a = document.createElement("li");
        a.className = "tape-ph empty", a.textContent = "\u2014", p.replaceChildren(a);
      }
    }
    async function $(a, r) {
      let i = await fetch(a, { signal: r, headers: { accept: "application/json" } });
      if (!i.ok) throw new Error("HTTP " + i.status);
      return i.json();
    }
    function _(a) {
      clearTimeout(e.timer), !document.hidden && (e.timer = setTimeout(F, a));
    }
    async function F() {
      clearTimeout(e.timer), e.ctrl && e.ctrl.abort();
      let a = e.ctrl = new AbortController();
      l(e.items.length ? "live" : "sync", e.items.length ? "Live" : "Syncing");
      try {
        let r = await $(n.url, a.signal), i = I(r, []);
        if (!i.addrs.length) throw new Error("no solana entries");
        let o = await $(n.pairs.replace("{addresses}", i.addrs.join(",")), a.signal), { items: h } = I(r, o);
        if (!h.length) throw new Error("no pairs");
        e.items = h, e.failures = 0, u && (u.hidden = true), l("live", "Live"), x(), _(U);
      } catch {
        if (a.signal.aborted) return;
        e.failures += 1;
        let r = Math.min(D, z * Math.pow(2, e.failures - 1));
        e.items.length ? l("stale", "Retrying") : (l("down", "Offline"), f(), u && (u.hidden = false, u.textContent = "Market feed unreachable \u2014 retrying"), S()), _(r);
      }
    }
    document.addEventListener("visibilitychange", () => {
      document.hidden ? (clearTimeout(e.timer), e.ctrl && e.ctrl.abort()) : F();
    }), document.querySelectorAll("[data-filter]").forEach((a) => {
      a.addEventListener("click", () => {
        e.filter = a.dataset.filter, document.querySelectorAll("[data-filter]").forEach((r) => r.setAttribute("aria-pressed", String(r === a))), C();
      });
    }), m && m.addEventListener("input", () => {
      e.q = m.value, C();
    }), document.hidden || F();
  }
  document.documentElement.classList.add("js");
  var Y = { records: [] };
  try {
    Y = JSON.parse(document.getElementById("register-data").textContent);
  } catch {
  }
  O(document.getElementById("progress"));
  B();
  H();
  R(document.querySelector("[data-stage]"));
  P();
  X(Y);
})();
