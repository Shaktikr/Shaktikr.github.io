/* Shakti Kumar Engineering: free engineering calculators and learning tools.
   Uses the helpers defined in site.js. */

/* ---------------- Chart helpers (SVG, theme tokens via CSS classes) ---------------- */
function niceStep(range, n) { const raw = range / n; const p = Math.pow(10, Math.floor(Math.log10(raw))); const f = raw / p; return (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) * p; }
function ticksLin(min, max, n = 5) { const s = niceStep(max - min, n); const out = []; for (let v = Math.ceil(min / s - 1e-9) * s; v <= max + s * 1e-9; v += s) out.push(Math.abs(v) < s * 1e-9 ? 0 : v); return out; }
function ticksLog(min, max) { const out = []; for (let k = Math.ceil(Math.log10(min) - 1e-9); k <= Math.floor(Math.log10(max) + 1e-9); k++) out.push(Math.pow(10, k)); return out; }
const compact = (v) => Math.abs(v) >= 1e4 ? v.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 }) : fmt(v, 3);
function logTick(v) { const e = Math.round(Math.log10(v)); return (e >= -1 && e <= 3) ? String(v) : `10${sup(e)}`; }
function makeChart(svg, o) {
  const W = o.w || 560, H = o.h || 320;
  const m = Object.assign({ l: 58, r: 18, t: 14, b: 44 }, o.m || {});
  const pw = W - m.l - m.r, ph = H - m.t - m.b, L = Math.log10;
  const sx = o.x.log ? (v) => m.l + (L(v) - L(o.x.min)) / (L(o.x.max) - L(o.x.min)) * pw : (v) => m.l + (v - o.x.min) / (o.x.max - o.x.min) * pw;
  const sy = o.y.log ? (v) => m.t + ph - (L(v) - L(o.y.min)) / (L(o.y.max) - L(o.y.min)) * ph : (v) => m.t + ph - (v - o.y.min) / (o.y.max - o.y.min) * ph;
  const ix = (px) => o.x.log ? Math.pow(10, L(o.x.min) + (px - m.l) / pw * (L(o.x.max) - L(o.x.min))) : o.x.min + (px - m.l) / pw * (o.x.max - o.x.min);
  const xt = o.x.ticks || (o.x.log ? ticksLog(o.x.min, o.x.max) : ticksLin(o.x.min, o.x.max, o.x.n || 6));
  const yt = o.y.ticks || (o.y.log ? ticksLog(o.y.min, o.y.max) : ticksLin(o.y.min, o.y.max, o.y.n || 5));
  const xf = o.x.tf || (o.x.log ? logTick : compact), yf = o.y.tf || (o.y.log ? logTick : compact);
  let g = "";
  yt.forEach((v) => { const y = sy(v).toFixed(1); g += `<line class="gl" x1="${m.l}" x2="${W - m.r}" y1="${y}" y2="${y}"/><text class="tk" x="${m.l - 8}" y="${+y + 4}" text-anchor="end">${yf(v)}</text>`; });
  xt.forEach((v) => { const x = sx(v).toFixed(1); g += `<line class="gl" x1="${x}" x2="${x}" y1="${m.t}" y2="${m.t + ph}"/><text class="tk" x="${x}" y="${m.t + ph + 17}" text-anchor="middle">${xf(v)}</text>`; });
  g += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${m.t + ph}" y2="${m.t + ph}"/><line class="ax" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${m.t + ph}"/>`;
  if (o.x.label) g += `<text class="al" x="${m.l + pw / 2}" y="${H - 6}" text-anchor="middle">${o.x.label}</text>`;
  if (o.y.label) g += `<text class="al" transform="translate(14 ${m.t + ph / 2}) rotate(-90)" text-anchor="middle">${o.y.label}</text>`;
  svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
  return { sx, sy, ix, W, H, m, pw, ph, grid: g };
}
const pathOf = (pts, c) => "M" + pts.map(([x, y]) => `${c.sx(x).toFixed(1)},${c.sy(y).toFixed(1)}`).join("L");
function hover(svg, c, fn) {
  const wrap = svg.parentElement;
  let tip = wrap.querySelector(".tip");
  if (!tip) { tip = document.createElement("div"); tip.className = "tip"; tip.hidden = true; wrap.appendChild(tip); }
  const clear = () => { const g = svg.querySelector("g.hov"); if (g) g.innerHTML = ""; tip.hidden = true; };
  const move = (e) => {
    const r = svg.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width * c.W, py = (e.clientY - r.top) / r.height * c.H;
    const res = (px >= c.m.l - 6 && px <= c.W - c.m.r + 6 && py >= c.m.t - 6 && py <= c.m.t + c.ph + 6) ? fn(px, py) : null;
    if (!res) { clear(); return; }
    let g = svg.querySelector("g.hov");
    if (!g) { g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("class", "hov"); svg.appendChild(g); }
    const dots = res.dots || [{ x: res.x, y: res.y, cls: res.cls || "pa" }];
    g.innerHTML = (res.line ? `<line class="xh" x1="${res.x}" x2="${res.x}" y1="${c.m.t}" y2="${c.m.t + c.ph}"/>` : "") + dots.map((d) => `<circle class="${d.cls}" cx="${d.x}" cy="${d.y}" r="5"/>`).join("");
    tip.innerHTML = res.html; tip.hidden = false;
    const tw = tip.offsetWidth, left = Math.min(Math.max(res.x / c.W * r.width, tw / 2 + 2), r.width - tw / 2 - 2);
    const topY = dots.length ? Math.min(...dots.map((d) => d.y)) : res.y;
    tip.style.left = left + "px"; tip.style.top = (topY / c.H * r.height) + "px";
  };
  svg.onpointermove = move; svg.onpointerdown = move; svg.onpointerleave = clear;
}

function initTools() {
/* ---------------- Tool 1: Mohr's circle ---------------- */
function mohr() {
  const sx = num("m-sx") || 0, sy = num("m-sy") || 0, t = num("m-txy") || 0, thd = num("m-th") || 0;
  $("#m-th-val").textContent = `${thd}°`;
  const C = (sx + sy) / 2, a = (sx - sy) / 2, R = Math.hypot(a, t);
  const s1 = C + R, s2 = C - R, th = thd * Math.PI / 180;
  const tp = 0.5 * Math.atan2(2 * t, sx - sy) * 180 / Math.PI;
  const sxp = C + a * Math.cos(2 * th) + t * Math.sin(2 * th);
  const syp = C - a * Math.cos(2 * th) - t * Math.sin(2 * th);
  const txyp = -a * Math.sin(2 * th) + t * Math.cos(2 * th);
  const vm = Math.sqrt(sx * sx - sx * sy + sy * sy + 3 * t * t);
  const tabs = Math.max(Math.abs(s1 - s2), Math.abs(s1), Math.abs(s2)) / 2;
  const set = (id, v) => { $("#" + id).textContent = fmt(v, 4); };
  set("m-s1", s1); set("m-s2", s2); set("m-tmax", R); set("m-tabs", tabs); set("m-vm", vm);
  set("m-sxp", sxp); set("m-syp", syp); set("m-txyp", txyp);
  $("#m-tp").textContent = `${fmt(tp, 3)}°`;
  // Equal-aspect chart
  const svg = $("#m-svg"), W = 560, H = 340, m = { l: 54, r: 20, t: 18, b: 42 }, pw = W - m.l - m.r, ph = H - m.t - m.b;
  const Rr = Math.max(R, Math.max(Math.abs(C), 1) * 0.05);
  let lo = Math.min(0, C - 1.3 * Rr), hi = Math.max(0, C + 1.3 * Rr), s = pw / (hi - lo);
  if (ph / 2 / s < 1.3 * Rr) { s = ph / (2.6 * Rr); const mid = (lo + hi) / 2, half = pw / 2 / s; lo = mid - half; hi = mid + half; }
  const tm = ph / 2 / s;
  const c = makeChart(svg, { w: W, h: H, m, x: { min: lo, max: hi, label: "normal stress σ (MPa)" }, y: { min: -tm, max: tm, label: "shear stress τ (MPa)" } });
  const P = (x, y) => [c.sx(x).toFixed(1), c.sy(y).toFixed(1)];
  let g = c.grid;
  g += `<line class="ax" x1="${m.l}" x2="${W - m.r}" y1="${c.sy(0)}" y2="${c.sy(0)}"/>`;
  if (lo < 0 && hi > 0) g += `<line class="ax" x1="${c.sx(0)}" x2="${c.sx(0)}" y1="${m.t}" y2="${m.t + ph}"/>`;
  g += `<circle cx="${c.sx(C)}" cy="${c.sy(0)}" r="${(R * s).toFixed(1)}" class="inks" style="fill:var(--accent-soft);fill-opacity:.45"/>`;
  const [Xx, Xy] = P(sx, t), [Yx, Yy] = P(sy, -t), [Xpx, Xpy] = P(sxp, txyp), [Ypx, Ypy] = P(syp, -txyp);
  g += `<line class="l1" x1="${Xx}" y1="${Xy}" x2="${Yx}" y2="${Yy}"/><line class="l2" x1="${Xpx}" y1="${Xpy}" x2="${Ypx}" y2="${Ypy}" stroke-dasharray="6 4"/>`;
  const cxp = c.sx(C), cyp = c.sy(0);
  const pt = (x, y, cls, label, ttl, dx, dy) => {
    if (dx === undefined) { const vx = x - cxp, vy = y - cyp, len = Math.hypot(vx, vy) || 1; dx = vx / len * 15 - 5; dy = vy / len * 15 + 4; }
    return `<g><title>${ttl}</title><circle class="${cls}" cx="${x}" cy="${y}" r="5.5"/><text class="lbl" x="${+x + dx}" y="${+y + dy}">${label}</text></g>`;
  };
  const [S1x, S1y] = P(s1, 0), [S2x, S2y] = P(s2, 0);
  g += pt(S1x, S1y, "pa", "σ₁", `σ1 = ${fmt(s1, 4)} MPa`, 9, 20) + pt(S2x, S2y, "pa", "σ₂", `σ2 = ${fmt(s2, 4)} MPa`, -24, 20);
  g += pt(Xx, Xy, "p1", "X", `X: σx = ${fmt(sx, 4)}, τxy = ${fmt(t, 4)} MPa`) + pt(Yx, Yy, "p1", "Y", `Y: σy = ${fmt(sy, 4)}, −τxy = ${fmt(-t, 4)} MPa`);
  g += pt(Xpx, Xpy, "p2", "X′", `X′: σx′ = ${fmt(sxp, 4)}, τx′y′ = ${fmt(txyp, 4)} MPa`) + pt(Ypx, Ypy, "p2", "Y′", `Y′: σy′ = ${fmt(syp, 4)} MPa`);
  svg.innerHTML = g;
}

/* ---------------- Tool 2: Beam ---------------- */
const BMAT = { steel: { E: 200, sy: 250, rho: 7850 }, ss304: { E: 193, sy: 215, rho: 8000 }, al: { E: 69, sy: 276, rho: 2700 }, ti: { E: 114, sy: 880, rho: 4430 } };
function beamSchem(sup, load) {
  const svg = $("#b-schem");
  let s = "";
  const x0 = sup === "cant" ? 34 : 30, x1 = sup === "cant" ? 314 : 330, y = 52;
  if (sup === "cant") s += `<rect class="wall" x="20" y="24" width="14" height="62"/>`;
  s += `<rect class="beam" x="${x0}" y="${y - 8}" width="${x1 - x0}" height="16" rx="1"/>`;
  if (sup === "ss") s += `<path class="ink" d="M${x0} ${y + 8} l-9 14 h18 z"/><path class="ink" d="M${x1} ${y + 8} l-9 14 h18 z"/><circle class="ink" cx="${x1 - 9}" cy="${y + 26}" r="2.5"/><circle class="ink" cx="${x1 + 9}" cy="${y + 26}" r="2.5"/>`;
  if (load === "point") {
    const xp = sup === "cant" ? x1 : (x0 + x1) / 2;
    s += `<path class="inks" d="M${xp} 8 V${y - 12}"/><path class="ink" d="M${xp} ${y - 10} l-5 -9 h10 z"/><text class="tk" x="${xp + 7}" y="16">P</text>`;
  } else {
    for (let x = x0 + 10; x <= x1 - 4; x += 22) s += `<path class="inks" d="M${x} 20 V${y - 12}"/><path class="ink" d="M${x} ${y - 10} l-4 -7 h8 z"/>`;
    s += `<path class="inks" d="M${x0 + 10} 20 H${x1 - 4}"/><text class="tk" x="${x1 - 2}" y="14" text-anchor="end">w</text>`;
  }
  s += `<text class="tk" x="${(x0 + x1) / 2}" y="96" text-anchor="middle">L</text>`;
  svg.innerHTML = s;
}
function beam() {
  const sup = radio("bsup"), load = radio("bload"), sec = $("#b-sec").value, matk = $("#b-mat").value;
  $("#b-P-f").hidden = load !== "point"; $("#b-w-f").hidden = load === "point";
  $("#b-rect-f").hidden = sec !== "rect"; $("#b-circ-f").hidden = sec !== "circ"; $("#b-tube-f").hidden = sec !== "tube";
  $("#b-cust-f").hidden = matk !== "custom";
  $("#b-pt-sub").textContent = sup === "cant" ? "At the free end" : "At midspan";
  beamSchem(sup, load);
  const L = num("b-L"), P = num("b-P"), w = num("b-w");
  let I, c, A, ok = true;
  if (sec === "rect") { const b = num("b-b"), h = num("b-h"); ok = b > 0 && h > 0; I = b * h ** 3 / 12; c = h / 2; A = b * h; }
  else if (sec === "circ") { const d = num("b-d"); ok = d > 0; I = Math.PI * d ** 4 / 64; c = d / 2; A = Math.PI * d * d / 4; }
  else { const D = num("b-D"), t = num("b-t"), di = D - 2 * t; ok = D > 0 && t > 0 && di >= 0; I = Math.PI * (D ** 4 - di ** 4) / 64; c = D / 2; A = Math.PI * (D * D - di * di) / 4; }
  const mt = matk === "custom" ? { E: num("b-E"), sy: num("b-sy"), rho: num("b-rho") } : BMAT[matk];
  const load0 = load === "point" ? P : w;
  const v = $("#b-verdict");
  ok = ok && L > 0 && load0 >= 0 && mt.E > 0 && mt.sy > 0 && mt.rho > 0;
  if (!ok) { ["b-oD", "b-oS", "b-oF", "b-oI", "b-oMm", "b-oM"].forEach((id) => $("#" + id).textContent = "—"); v.className = "verdict warn"; v.textContent = sec === "tube" ? "Enter positive values. The wall thickness must be less than half the outer diameter." : "Enter positive values for every input."; $("#b-svg").innerHTML = ""; return; }
  const E = mt.E * 1000, EI = E * I;
  let y, Mmax, dmax;
  if (sup === "cant" && load === "point") { y = (x) => P * x * x * (3 * L - x) / (6 * EI); Mmax = P * L; dmax = P * L ** 3 / (3 * EI); }
  else if (sup === "cant") { y = (x) => w * x * x * (6 * L * L - 4 * L * x + x * x) / (24 * EI); Mmax = w * L * L / 2; dmax = w * L ** 4 / (8 * EI); }
  else if (load === "point") { y = (x) => { const u = x <= L / 2 ? x : L - x; return P * u * (3 * L * L - 4 * u * u) / (48 * EI); }; Mmax = P * L / 4; dmax = P * L ** 3 / (48 * EI); }
  else { y = (x) => w * x * (L ** 3 - 2 * L * x * x + x ** 3) / (24 * EI); Mmax = w * L * L / 8; dmax = 5 * w * L ** 4 / (384 * EI); }
  const sig = Mmax * c / I, sf = sig > 0 ? mt.sy / sig : Infinity, mass = mt.rho * A * L * 1e-9;
  $("#b-oD").textContent = fmt(dmax, 3); $("#b-oS").textContent = fmt(sig, 3); $("#b-oF").textContent = isFinite(sf) ? fmt(sf, 3) : "—";
  $("#b-oI").textContent = fmt(I, 3); $("#b-oMm").textContent = fmt(Mmax / 1000, 3); $("#b-oM").textContent = fmt(mass, 3);
  const ratio = dmax > 0 ? `Deflection is L/${Math.round(L / dmax).toLocaleString("en-US")}.` : "";
  if (!isFinite(sf)) { v.className = "verdict"; v.textContent = "No load applied."; }
  else if (sf < 1) { v.className = "verdict bad"; v.textContent = `The beam yields (stress ${Math.round(100 / sf)}% of yield). Increase the section or choose a stronger material.`; }
  else if (sf < 1.5) { v.className = "verdict warn"; v.textContent = `Safety factor below 1.5. Worth a closer look. ${ratio}`; }
  else { v.className = "verdict"; v.textContent = `Stress is ${Math.round(100 / sf)}% of yield. ${ratio}`; }
  const svg = $("#b-svg"), dm = Math.max(dmax, 1e-12);
  const ch = makeChart(svg, { h: 250, m: { l: 62 }, x: { min: 0, max: L, label: "position along span (mm)" }, y: { min: -dm * 1.18, max: dm * 0.12, label: "deflection (mm)", tf: (t) => fmt(-t, 3) === "-0" ? "0" : fmt(-t, 3) } });
  const pts = []; for (let i = 0; i <= 80; i++) { const x = L * i / 80; pts.push([x, -y(x)]); }
  const xm = sup === "cant" ? L : L / 2;
  svg.innerHTML = ch.grid + `<path class="lm" d="${pathOf([[0, 0], [L, 0]], ch)}"/><path class="l1" d="${pathOf(pts, ch)}"/>` +
    `<circle class="pa" cx="${ch.sx(xm)}" cy="${ch.sy(-dmax)}" r="5"/><text class="lbl" x="${ch.sx(xm) + (sup === "cant" ? -8 : 8)}" y="${ch.sy(-dmax) + 18}" text-anchor="${sup === "cant" ? "end" : "start"}">δmax = ${fmt(dmax, 3)} mm</text>`;
  hover(svg, ch, (px) => { const x = Math.min(L, Math.max(0, ch.ix(px))); const d = y(x); return { x: ch.sx(x), y: ch.sy(-d), line: true, cls: "p1", html: `x = ${fmt(x, 3)} mm · δ = ${fmt(d, 3)} mm` }; });
}

/* ---------------- Tool 3: FEM demo ---------------- */
function femDemo() {
  const n = parseInt($("#f-n").value, 10), q = num("f-q") > 0 ? num("f-q") : 10;
  $("#f-n-val").textContent = n;
  const L = 1000, A = 100, E = 200000, h = L / n, k = E * A / h;
  // Reduced system for u1..un (u0 = 0): tridiagonal K = k·[2 −1 …; … −1 1], F = q·h (last node q·h/2)
  const a = new Array(n).fill(-k), b = new Array(n).fill(2 * k), cc = new Array(n).fill(-k), F = new Array(n).fill(q * h);
  b[n - 1] = k; F[n - 1] = q * h / 2;
  for (let i = 1; i < n; i++) { const mlt = a[i] / b[i - 1]; b[i] -= mlt * cc[i - 1]; F[i] -= mlt * F[i - 1]; }
  const u = new Array(n + 1).fill(0);
  u[n] = F[n - 1] / b[n - 1];
  for (let i = n - 2; i >= 0; i--) u[i + 1] = (F[i] - cc[i] * u[i + 2]) / b[i];
  const sig = []; for (let e = 0; e < n; e++) sig.push(E * (u[e + 1] - u[e]) / h);
  const uex = (x) => q / (E * A) * (L * x - x * x / 2), sex = (x) => q * (L - x) / A;
  const tipEx = uex(L), sMaxEx = sex(0);
  $("#f-u").textContent = fmt(u[n], 4); $("#f-uex").textContent = fmt(tipEx, 4);
  $("#f-uerr").textContent = `${(Math.abs(u[n] - tipEx) / tipEx * 100).toFixed(2)}%`;
  $("#f-s").textContent = fmt(sig[0], 4); $("#f-sex").textContent = fmt(sMaxEx, 4);
  $("#f-err").textContent = `${((sMaxEx - sig[0]) / sMaxEx * 100).toFixed(1)}%`;
  // Matrix
  const mx = $("#f-matrix");
  if (n <= 8) {
    let t = '<table class="matrix"><tbody>';
    for (let i = 0; i < n; i++) { t += "<tr>"; for (let j = 0; j < n; j++) { const vv = i === j ? (i === n - 1 ? 1 : 2) : (Math.abs(i - j) === 1 ? -1 : 0); t += `<td class="${vv ? "d" : ""}">${vv === -1 ? "−1" : vv}</td>`; } t += "</tr>"; }
    mx.innerHTML = t + "</tbody></table>";
  } else mx.innerHTML = `<p class="small muted">${n} × ${n} matrix with the same pattern: 2 on the diagonal, −1 next to it, and 1 in the last corner. Real FEM models have millions of rows.</p>`;
  // Stress chart
  const s1 = $("#f-svg-s"), c1 = makeChart(s1, { h: 220, x: { min: 0, max: L, label: "position from support x (mm)" }, y: { min: 0, max: sMaxEx * 1.1, label: "stress (MPa)" } });
  let step = ""; for (let e = 0; e < n; e++) { step += `${e ? "L" : "M"}${c1.sx(e * h).toFixed(1)},${c1.sy(sig[e]).toFixed(1)}L${c1.sx((e + 1) * h).toFixed(1)},${c1.sy(sig[e]).toFixed(1)}`; }
  s1.innerHTML = c1.grid + `<path class="lm" d="${pathOf([[0, sMaxEx], [L, 0]], c1)}"/><path class="l1" d="${step}"/>`;
  hover(s1, c1, (px) => { const x = Math.min(L, Math.max(0, c1.ix(px))); const e = Math.min(n - 1, Math.floor(x / h)); return { x: c1.sx(x), line: true, dots: [{ x: c1.sx(x), y: c1.sy(sig[e]), cls: "p1" }], html: `x = ${fmt(x, 3)} mm · FEM ${fmt(sig[e], 3)} · exact ${fmt(sex(x), 3)} MPa` }; });
  // Displacement chart
  const s2 = $("#f-svg-u"), c2 = makeChart(s2, { h: 220, x: { min: 0, max: L, label: "position from support x (mm)" }, y: { min: 0, max: tipEx * 1.1, label: "displacement (mm)" } });
  const ex = []; for (let i = 0; i <= 60; i++) { const x = L * i / 60; ex.push([x, uex(x)]); }
  const nodes = u.map((uu, i) => [i * h, uu]);
  s2.innerHTML = c2.grid + `<path class="lm" d="${pathOf(ex, c2)}"/><path class="l1" d="${pathOf(nodes, c2)}"/>` + nodes.map(([x, uu]) => `<circle class="p1" cx="${c2.sx(x).toFixed(1)}" cy="${c2.sy(uu).toFixed(1)}" r="4.5"/>`).join("");
}

/* ---------------- Tool 4: Fatigue (Paris law) ---------------- */
const PARIS = { fp: { C: 6.9e-12, m: 3 }, mart: { C: 1.35e-10, m: 2.25 }, aus: { C: 5.6e-12, m: 3.25 } };
function fatigue() {
  const C = num("p-C"), m = num("p-m"), smax = num("p-smax"), smin = num("p-smin") || 0, a0 = num("p-a0") / 1000, Y = num("p-Y"), KIC = num("p-KIC");
  const ds = smax - Math.max(smin, 0), note = $("#p-note"), svg = $("#p-svg");
  const clear = (msg, cls = "warn") => { ["p-N", "p-ac", "p-ds", "p-dk0", "p-dkc", "p-half"].forEach((id) => $("#" + id).textContent = "—"); note.className = "verdict " + cls; note.textContent = msg; svg.innerHTML = ""; };
  if (!(C > 0 && m > 0 && smax > 0 && a0 > 0 && Y > 0 && KIC > 0)) return clear("Enter positive values for C, m, σmax, a₀, Y and K_IC.");
  if (ds <= 0) return clear("σmin must be lower than σmax for the load to cycle.");
  const ac = (1 / Math.PI) * Math.pow(KIC / (Y * smax), 2);
  $("#p-ds").textContent = fmt(ds, 4); $("#p-ac").textContent = fmt(ac * 1000, 3);
  const dk0 = Y * ds * Math.sqrt(Math.PI * a0), dkc = Y * ds * Math.sqrt(Math.PI * ac);
  $("#p-dk0").textContent = fmt(dk0, 3); $("#p-dkc").textContent = fmt(dkc, 3);
  if (ac <= a0) { $("#p-N").textContent = "0"; $("#p-half").textContent = "—"; note.className = "verdict bad"; note.textContent = "The initial crack is already at or above the critical size, so the part would fracture at the first peak load."; svg.innerHTML = ""; return; }
  const K = C * Math.pow(Y * ds * Math.sqrt(Math.PI), m), p = 1 - m / 2;
  const Nof = (a) => Math.abs(p) < 1e-9 ? Math.log(a / a0) / K : (Math.pow(a, p) - Math.pow(a0, p)) / (K * p);
  const aof = (N) => Math.abs(p) < 1e-9 ? a0 * Math.exp(K * N) : Math.pow(Math.pow(a0, p) + N * K * p, 1 / p);
  const Nf = Nof(ac), Nd = Nof(Math.min(2 * a0, ac));
  $("#p-N").textContent = fmt(Nf, 3); $("#p-half").textContent = 2 * a0 < ac ? fmt(Nd, 3) : "—";
  let msg = 2 * a0 < ac ? `${Math.round(Nd / Nf * 100)}% of the life is spent growing the crack from ${fmt(a0 * 1000, 3)} to ${fmt(2 * a0 * 1000, 3)} mm. Finding cracks early matters.` : "The crack is close to critical from the start.";
  let cls = "verdict";
  if (dk0 < 5) { msg = `ΔK at the start (${fmt(dk0, 3)} MPa√m) is near typical steel thresholds of about 2–8 MPa√m, so the crack may not grow at all. ` + msg; cls = "verdict warn"; }
  note.className = cls; note.textContent = msg;
  const ch = makeChart(svg, { h: 300, x: { min: 0, max: Nf, label: "load cycles N" }, y: { min: 0, max: ac * 1000 * 1.08, label: "crack length a (mm)" } });
  const pts = []; for (let i = 0; i <= 90; i++) { const a = a0 * Math.pow(ac / a0, i / 90); pts.push([Nof(a), a * 1000]); }
  svg.innerHTML = ch.grid + `<line class="lm" x1="${ch.m.l}" x2="${ch.W - ch.m.r}" y1="${ch.sy(ac * 1000)}" y2="${ch.sy(ac * 1000)}"/><text class="tk" x="${ch.m.l + 6}" y="${ch.sy(ac * 1000) - 6}">critical size ${fmt(ac * 1000, 3)} mm</text>` +
    `<path class="l1" d="${pathOf(pts, ch)}"/><circle class="pa" cx="${ch.sx(Nf)}" cy="${ch.sy(ac * 1000)}" r="5"/>`;
  hover(svg, ch, (px) => { const N = Math.min(Nf, Math.max(0, ch.ix(px))); const a = aof(N) * 1000; return { x: ch.sx(N), y: ch.sy(a), line: true, cls: "p1", html: `N = ${fmt(N, 3)} · a = ${fmt(a, 3)} mm` }; });
}

/* ---------------- Tool 5: Composites ---------------- */
const FIB = { carbon: { E1: 230, E2: 15, r: 1.76 }, glass: { E1: 73, E2: 73, r: 2.54 } };
function composite() {
  const Ef1 = num("c-Ef1"), Ef2 = num("c-Ef2"), rf = num("c-rf"), Em = num("c-Em"), rm = num("c-rm"), Vf = parseInt($("#c-vf").value, 10) / 100;
  $("#c-vf-val").textContent = `${Math.round(Vf * 100)}%`;
  if (!(Ef1 > 0 && Ef2 > 0 && rf > 0 && Em > 0 && rm > 0)) { ["c-E1", "c-E2h", "c-E2r", "c-rho", "c-spec", "c-x"].forEach((id) => $("#" + id).textContent = "—"); $("#c-svg").innerHTML = ""; return; }
  const E1 = (v) => v * Ef1 + (1 - v) * Em;
  const E2r = (v) => 1 / (v / Ef2 + (1 - v) / Em);
  const ratio = Ef2 / Em, eta = (ratio - 1) / (ratio + 2);
  const E2h = (v) => Em * (1 + 2 * eta * v) / (1 - eta * v);
  const rho = Vf * rf + (1 - Vf) * rm, spec = E1(Vf) / rho;
  $("#c-E1").textContent = fmt(E1(Vf), 3); $("#c-E2h").textContent = fmt(E2h(Vf), 3); $("#c-E2r").textContent = fmt(E2r(Vf), 3);
  $("#c-rho").textContent = fmt(rho, 3); $("#c-spec").textContent = fmt(spec, 3); $("#c-x").textContent = `${fmt(spec / (69 / 2.70), 2)}×`;
  const svg = $("#c-svg"), ymax = Math.max(E1(0.8), E2h(0.8)) * 1.1;
  const ch = makeChart(svg, { h: 320, x: { min: 0, max: 80, label: "fibre volume fraction Vf (%)" }, y: { min: 0, max: ymax, label: "modulus (GPa)" } });
  const l1 = [], l2 = []; for (let i = 0; i <= 80; i += 2) { l1.push([i, E1(i / 100)]); l2.push([i, E2h(i / 100)]); }
  const vx = Vf * 100;
  svg.innerHTML = ch.grid + `<line class="xh" x1="${ch.sx(vx)}" x2="${ch.sx(vx)}" y1="${ch.m.t}" y2="${ch.m.t + ch.ph}"/>` +
    `<path class="l1" d="${pathOf(l1, ch)}"/><path class="l2" d="${pathOf(l2, ch)}"/>` +
    `<circle class="p1" cx="${ch.sx(vx)}" cy="${ch.sy(E1(Vf))}" r="5"/><circle class="p2" cx="${ch.sx(vx)}" cy="${ch.sy(E2h(Vf))}" r="5"/>` +
    `<text class="lbl" x="${ch.sx(80) - 4}" y="${ch.sy(E1(0.8)) - 8}" text-anchor="end">E₁</text><text class="lbl" x="${ch.sx(80) - 4}" y="${ch.sy(E2h(0.8)) - 8}" text-anchor="end">E₂</text>`;
  hover(svg, ch, (px) => { const v = Math.min(80, Math.max(0, ch.ix(px))); return { x: ch.sx(v), line: true, dots: [{ x: ch.sx(v), y: ch.sy(E1(v / 100)), cls: "p1" }, { x: ch.sx(v), y: ch.sy(E2h(v / 100)), cls: "p2" }], html: `Vf = ${Math.round(v)}% · E₁ ${fmt(E1(v / 100), 3)} · E₂ ${fmt(E2h(v / 100), 3)} GPa` }; });
}

/* ---------------- Tool 6: Material selector ---------------- */
const FAM = {
  metal: { label: "Metals", cls: "p1", color: "var(--s1)", shape: "circle" },
  polymer: { label: "Polymers", cls: "p2", color: "var(--s2)", shape: "square" },
  ceramic: { label: "Ceramics and glass", cls: "p3", color: "var(--s3)", shape: "triangle" },
  composite: { label: "Composites and natural", cls: "p4", color: "var(--muted)", shape: "diamond" }
};
// name, family, E (GPa), density (g/cm3), strength (MPa), k (W/m.K), CTE (um/m.K), Tmax (C)
const MATS = [
  ["Structural steel (S275)", "metal", 200, 7.85, 275, 50, 12, 1500],
  ["Stainless steel 304", "metal", 193, 8.0, 215, 16, 17.3, 1400],
  ["Aluminium 6061-T6", "metal", 69, 2.7, 276, 167, 23.6, 582],
  ["Aluminium 7075-T6", "metal", 72, 2.81, 503, 130, 23.4, 477],
  ["Aluminium 2024-T3", "metal", 73, 2.78, 345, 121, 23.2, 502],
  ["Titanium Ti-6Al-4V", "metal", 114, 4.43, 880, 6.7, 8.6, 1604],
  ["Copper (annealed)", "metal", 115, 8.96, 69, 390, 17, 1085],
  ["Inconel 718", "metal", 200, 8.19, 1034, 11.4, 13, 1260],
  ["Magnesium AZ31B", "metal", 45, 1.77, 220, 96, 26, 605],
  ["Alumina (99.5%)", "ceramic", 370, 3.89, 380, 30, 8.1, 2072],
  ["Silicon carbide", "ceramic", 410, 3.1, 450, 120, 4, 2700],
  ["Zirconia (3Y-TZP)", "ceramic", 205, 6.05, 1000, 2.5, 10.5, 2715],
  ["Soda-lime glass", "ceramic", 70, 2.5, 50, 1, 9, 720],
  ["Epoxy", "polymer", 3.5, 1.2, 70, 0.2, 60, 120],
  ["Nylon 6,6", "polymer", 2.8, 1.14, 80, 0.25, 80, 265],
  ["PEEK", "polymer", 3.6, 1.3, 100, 0.25, 47, 343],
  ["HDPE", "polymer", 1.0, 0.95, 26, 0.48, 120, 130],
  ["PLA (3D printing)", "polymer", 3.5, 1.24, 55, 0.13, 68, 160],
  ["ABS", "polymer", 2.3, 1.05, 40, 0.17, 90, 105],
  ["CFRP, unidirectional (along fibres)", "composite", 135, 1.6, 1500, 5, 0, 120],
  ["GFRP, unidirectional (along fibres)", "composite", 43, 2.0, 1000, 1, 6, 120],
  ["Spruce wood (along grain)", "composite", 10, 0.45, 70, 0.12, 4, null],
  ["Concrete", "composite", 30, 2.4, 30, 1.7, 12, null]
].map(([n, f, E, rho, s, k, a, T]) => ({ n, f, E, rho, s, k, a, T }));
const IDX = {
  tie: { f: (m) => m.E / m.rho, slope: 1, label: "E/ρ" },
  beam: { f: (m) => Math.sqrt(m.E) / m.rho, slope: 2, label: "E^½/ρ" },
  plate: { f: (m) => Math.cbrt(m.E) / m.rho, slope: 3, label: "E^⅓/ρ" },
  strength: { f: (m) => m.s / m.rho, slope: 0, label: "σ/ρ" }
};
const selState = { sort: "name", dir: 1 };
function shape(x, y, f, cls, r = 5.5) {
  x = +x; y = +y;
  const s = FAM[f].shape;
  if (s === "circle") return `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;
  if (s === "square") return `<rect class="${cls}" x="${x - r + 0.5}" y="${y - r + 0.5}" width="${2 * r - 1}" height="${2 * r - 1}" rx="1.5"/>`;
  if (s === "triangle") return `<path class="${cls}" d="M${x} ${y - r - 1}L${x + r + 0.5} ${y + r - 1}L${x - r - 0.5} ${y + r - 1}Z"/>`;
  return `<path class="${cls}" d="M${x} ${y - r - 1}L${x + r + 1} ${y}L${x} ${y + r + 1}L${x - r - 1} ${y}Z"/>`;
}
function selector() {
  const key = $("#s-index").value, ix = IDX[key], qy = $("#s-search").value.trim().toLowerCase();
  const ranked = MATS.slice().sort((a, b) => ix.f(b) - ix.f(a));
  const best = ranked[0], steel = MATS[0];
  // Rank list
  const top = ranked.slice(0, 8), maxv = ix.f(best);
  $("#s-rank-title").textContent = `Best for this goal (index ${ix.label}, relative to steel)`;
  $("#s-rank").innerHTML = top.map((m, i) => `<div class="rank-row"><span class="mono muted">${i + 1}</span><div style="display:grid;gap:3px;min-width:0"><span class="nm">${esc(m.n)}</span><div class="rank-bar" style="width:${Math.max(4, ix.f(m) / maxv * 100).toFixed(1)}%"></div></div><span class="mono" style="text-align:right">${fmt(ix.f(m) / ix.f(steel), 3)}×</span></div>`).join("");
  // Chart
  const svg = $("#s-svg");
  const ch = makeChart(svg, { h: 380, x: { min: 0.3, max: 30, log: true, ticks: [0.3, 1, 3, 10, 30], tf: (v) => String(v), label: "density ρ (g/cm³)" }, y: { min: 0.5, max: 1000, log: true, ticks: [1, 10, 100, 1000], tf: (v) => String(v), label: "Young's modulus E (GPa)" } });
  let g = ch.grid + `<defs><clipPath id="s-clip"><rect x="${ch.m.l}" y="${ch.m.t}" width="${ch.pw}" height="${ch.ph}"/></clipPath></defs>`;
  if (ix.slope) {
    const M = ix.f(best), Eof = (r) => Math.pow(M * r, ix.slope);
    g += `<path class="lm" clip-path="url(#s-clip)" d="${pathOf([[0.3, Eof(0.3)], [30, Eof(30)]], ch)}"/>`;
    g += `<text class="tk" x="${ch.m.l + 8}" y="${ch.m.t + 14}">↖ above the line beats ${esc(best.n.split(/ \(|,/)[0])}</text>`;
  } else g += `<text class="tk" x="${ch.m.l + 8}" y="${ch.m.t + 14}">Strength goal: chart shows stiffness for context</text>`;
  const topSet = new Set(ranked.slice(0, 3).map((m) => m.n));
  MATS.forEach((m) => {
    const x = ch.sx(m.rho), y = ch.sy(m.E), hit = qy && m.n.toLowerCase().includes(qy);
    g += `<g opacity="${qy && !hit ? 0.3 : 1}">${shape(x.toFixed(1), y.toFixed(1), m.f, FAM[m.f].cls, hit ? 7.5 : 5.5)}</g>`;
    if (hit || topSet.has(m.n)) g += `<text class="lbl" x="${(x + 9).toFixed(1)}" y="${(y + 4).toFixed(1)}">${esc(m.n.split(/ \(|,/)[0])}</text>`;
  });
  svg.innerHTML = g;
  hover(svg, ch, (px, py) => {
    let bestD = 14, hit = null;
    MATS.forEach((m) => { const d = Math.hypot(ch.sx(m.rho) - px, ch.sy(m.E) - py); if (d < bestD) { bestD = d; hit = m; } });
    if (!hit) return null;
    return { x: ch.sx(hit.rho), y: ch.sy(hit.E), dots: [], html: `${esc(hit.n)} · E ${hit.E} GPa · ρ ${hit.rho} g/cm³` };
  });
  $("#s-legend").innerHTML = Object.values(FAM).map((f) => `<span><svg width="14" height="14" viewBox="0 0 14 14" style="vertical-align:middle;margin-right:6px">${shape(7, 7, Object.keys(FAM).find((k) => FAM[k] === f), f.cls, 5)}</svg>${f.label}</span>`).join("");
  // Table
  const rows = MATS.filter((m) => !qy || m.n.toLowerCase().includes(qy) || FAM[m.f].label.toLowerCase().includes(qy));
  const sk = selState.sort, dir = selState.dir;
  rows.sort((a, b) => { const va = sk === "name" ? a.n : sk === "fam" ? FAM[a.f].label : a[sk], vb = sk === "name" ? b.n : sk === "fam" ? FAM[b.f].label : b[sk]; if (va === null) return 1; if (vb === null) return -1; return (va > vb ? 1 : va < vb ? -1 : 0) * dir; });
  $("#s-tbody").innerHTML = rows.length ? rows.map((m) => `<tr><td>${esc(m.n)}</td><td><span class="fam"><i style="background:${FAM[m.f].color}"></i>${FAM[m.f].label}</span></td><td class="n">${m.E}</td><td class="n">${m.rho}</td><td class="n">${m.s}</td><td class="n">${m.k}</td><td class="n">${m.a === 0 ? "≈0" : m.a}</td><td class="n">${m.T === null ? "—" : m.T}</td></tr>`).join("") : `<tr><td colspan="8" class="muted">No material matches “${esc(qy)}”.</td></tr>`;
}

/* ---------------- Tool 7: XRD ---------------- */
const XMAT = { al: ["fcc", 4.0495], cu: ["fcc", 3.6149], ni: ["fcc", 3.524], fe: ["bcc", 2.8665], w: ["bcc", 3.1652], si: ["dia", 5.4309] };
function allowed(h, k, l, st) {
  const allOdd = h % 2 && k % 2 && l % 2, allEven = !(h % 2) && !(k % 2) && !(l % 2);
  if (st === "sc") return true;
  if (st === "bcc") return (h + k + l) % 2 === 0;
  if (st === "fcc") return allOdd || allEven;
  return allOdd || (allEven && (h + k + l) % 4 === 0);
}
function xrd() {
  const st = $("#x-struct").value, a = num("x-a"), lam = num("x-lam"), tb = $("#x-tbody"), svg = $("#x-svg");
  if (!(a > 0 && lam > 0)) { tb.innerHTML = `<tr><td colspan="4" class="muted">Enter a positive lattice parameter and wavelength.</td></tr>`; svg.innerHTML = ""; return; }
  const byN = new Map();
  for (let h = 1; h <= 12; h++) for (let k = 0; k <= h; k++) for (let l = 0; l <= k; l++) {
    if (!allowed(h, k, l, st)) continue;
    const N = h * h + k * k + l * l, d = a / Math.sqrt(N), s = lam / (2 * d);
    if (s >= 1) continue;
    const tt = 2 * Math.asin(s) * 180 / Math.PI;
    if (tt > 150) continue;
    if (!byN.has(N)) byN.set(N, { N, d, tt, hkl: [] });
    byN.get(N).hkl.push(`${h}${k}${l}`);
  }
  const peaks = Array.from(byN.values()).sort((p, q) => p.tt - q.tt);
  tb.innerHTML = peaks.length ? peaks.map((p) => `<tr><td class="mono">(${p.hkl.join("), (")})</td><td class="n">${p.N}</td><td class="n">${p.d.toFixed(4)}</td><td class="n">${p.tt.toFixed(2)}</td></tr>`).join("") : `<tr><td colspan="4" class="muted">No reflections below 2θ = 150°. Try a shorter wavelength or larger lattice parameter.</td></tr>`;
  const ch = makeChart(svg, { h: 280, m: { l: 30, t: 30 }, x: { min: 10, max: 150, ticks: [10, 30, 50, 70, 90, 110, 130, 150], label: "2θ (degrees)" }, y: { min: 0, max: 1.25, ticks: [0], tf: () => "" } });
  let g = ch.grid, lastX = -1e9;
  peaks.forEach((p) => {
    const x = ch.sx(p.tt).toFixed(1);
    g += `<line class="stick" x1="${x}" x2="${x}" y1="${ch.sy(0)}" y2="${ch.sy(1)}"/>`;
    if (x - lastX > 15) { g += `<text class="tk" transform="translate(${+x + 4} ${ch.sy(1) - 4}) rotate(-60)">${p.hkl[0]}</text>`; lastX = +x; }
  });
  svg.innerHTML = g;
  hover(svg, ch, (px) => {
    let bestD = 12, hit = null;
    peaks.forEach((p) => { const d = Math.abs(ch.sx(p.tt) - px); if (d < bestD) { bestD = d; hit = p; } });
    if (!hit) return null;
    return { x: ch.sx(hit.tt), y: ch.sy(1), cls: "p1", html: `(${hit.hkl.join("), (")}) · 2θ ${hit.tt.toFixed(2)}° · d ${hit.d.toFixed(4)} Å` };
  });
}

/* ---------------- Tool 8: Diffusion and creep ---------------- */
const DIFF = { cg: [2.3e-5, 148], ca: [1.1e-6, 87.4], fg: [5.0e-5, 284], fa: [2.8e-4, 251], cucu: [7.8e-5, 211], alal: [2.3e-4, 144], mgal: [1.2e-4, 130], zncu: [2.4e-5, 189] };
function creep() {
  const R = 8.314, D0 = num("d-D0"), Q = num("d-Q") * 1000, T = num("d-T"), th = num("d-t"), svg = $("#d-svg");
  const Dof = (Tc) => D0 * Math.exp(-Q / (R * (Tc + 273.15)));
  if (D0 > 0 && Q > 0 && T > -273.15 && th >= 0) {
    const D = Dof(T);
    $("#d-D").textContent = fmt(D, 3); $("#d-x").textContent = fmt(Math.sqrt(D * th * 3600) * 1e6, 3);
    const lo = Math.max(T - 300, 20), hi = T + 300;
    const yl = Math.pow(10, Math.floor(Math.log10(Dof(lo)))), yh = Math.pow(10, Math.ceil(Math.log10(Dof(hi))));
    const ch = makeChart(svg, { h: 300, m: { l: 64 }, x: { min: lo, max: hi, label: "temperature (°C)" }, y: { min: yl, max: yh === yl ? yl * 10 : yh, log: true, label: "D (m²/s)" } });
    const pts = []; for (let i = 0; i <= 80; i++) { const t = lo + (hi - lo) * i / 80; pts.push([t, Dof(t)]); }
    svg.innerHTML = ch.grid + `<path class="l1" d="${pathOf(pts, ch)}"/><circle class="pa" cx="${ch.sx(T)}" cy="${ch.sy(D)}" r="5.5"/><text class="lbl" x="${ch.sx(T) + 9}" y="${ch.sy(D) + 16}">${fmt(T, 4)} °C</text>`;
    hover(svg, ch, (px) => { const t = Math.min(hi, Math.max(lo, ch.ix(px))); const d = Dof(t); return { x: ch.sx(t), y: ch.sy(d), line: true, cls: "p1", html: `${fmt(t, 4)} °C · D = ${fmt(d, 3)} m²/s` }; });
  } else { $("#d-D").textContent = "—"; $("#d-x").textContent = "—"; svg.innerHTML = ""; }
  const C = num("l-C"), T1 = num("l-T1") + 273.15, t1 = num("l-t1"), T2 = num("l-T2") + 273.15;
  if (T1 > 0 && T2 > 0 && t1 > 0 && isFinite(C)) {
    const P = T1 * (C + Math.log10(t1)), t2 = Math.pow(10, P / T2 - C);
    $("#l-P").textContent = Math.round(P).toLocaleString("en-US"); $("#l-t2").textContent = fmt(t2, 3); $("#l-t2y").textContent = fmt(t2 / 8766, 3);
  } else ["l-P", "l-t2", "l-t2y"].forEach((id) => $("#" + id).textContent = "—");
}

/* ---------------- Tool 9: Units ---------------- */
const UNITS = {
  stress: { label: "Stress and pressure", u: [["Pa", 1], ["kPa", 1e3], ["MPa (N/mm²)", 1e6], ["GPa", 1e9], ["psi", 6894.757293], ["ksi", 6894757.293], ["bar", 1e5], ["atm", 101325], ["kgf/mm²", 9.80665e6]] },
  force: { label: "Force", u: [["N", 1], ["kN", 1e3], ["MN", 1e6], ["lbf", 4.4482216153], ["kip", 4448.2216153], ["kgf", 9.80665]] },
  length: { label: "Length", u: [["m", 1], ["mm", 1e-3], ["µm", 1e-6], ["nm", 1e-9], ["Å", 1e-10], ["in", 0.0254], ["ft", 0.3048], ["mil (thou)", 2.54e-5]] },
  energy: { label: "Energy", u: [["J", 1], ["kJ", 1e3], ["eV", 1.602176634e-19], ["cal", 4.184], ["kcal", 4184], ["kWh", 3.6e6], ["BTU", 1055.05585], ["ft·lbf", 1.3558179483]] },
  molar: { label: "Energy per mole or per atom", u: [["kJ/mol", 1], ["J/mol", 1e-3], ["kcal/mol", 4.184], ["eV per atom", 96.48533212], ["meV per atom", 0.09648533212], ["K (as E/k_B)", 0.008314462618]] },
  temp: { label: "Temperature", u: [["°C"], ["K"], ["°F"]] },
  density: { label: "Density", u: [["kg/m³", 1], ["g/cm³", 1000], ["lb/in³", 27679.9047], ["lb/ft³", 16.0184634]] },
  tough: { label: "Fracture toughness", u: [["MPa√m", 1], ["kPa√m", 1e-3], ["ksi√in", 1.0988427]] },
  torque: { label: "Torque", u: [["N·m", 1], ["N·mm", 1e-3], ["kN·m", 1e3], ["lbf·ft", 1.3558179483], ["lbf·in", 0.112984829]] },
  cond: { label: "Thermal conductivity", u: [["W/m·K", 1], ["W/cm·K", 100], ["BTU/(h·ft·°F)", 1.730734666], ["cal/(s·cm·°C)", 418.4]] }
};
function unitsInit() {
  const cat = $("#u-cat");
  cat.innerHTML = Object.entries(UNITS).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("");
  const fill = () => { const c = UNITS[cat.value]; $("#u-from").innerHTML = c.u.map((u, i) => `<option value="${i}">${u[0]}</option>`).join(""); if (cat.value === "stress") $("#u-from").value = "2"; };
  cat.addEventListener("change", () => { fill(); units(); });
  fill();
}
function units() {
  const c = UNITS[$("#u-cat").value], v = num("u-val"), from = parseInt($("#u-from").value, 10), tb = $("#u-tbody");
  if (!isFinite(v)) { tb.innerHTML = `<tr><td colspan="3" class="muted">Enter a number.</td></tr>`; return; }
  let out;
  if ($("#u-cat").value === "temp") {
    const toK = [(x) => x + 273.15, (x) => x, (x) => (x - 32) * 5 / 9 + 273.15][from](v);
    out = [toK - 273.15, toK, (toK - 273.15) * 9 / 5 + 32];
  } else { const base = v * c.u[from][1]; out = c.u.map((u) => base / u[1]); }
  tb.innerHTML = c.u.map((u, i) => `<tr><td>${u[0]}</td><td class="n mono" id="u-r${i}">${fmt(out[i], 6)}</td><td style="width:1%"><button class="linkbtn small" type="button" data-u="${i}">Copy</button></td></tr>`).join("");
  $$("#u-tbody [data-u]").forEach((b) => b.addEventListener("click", () => { const i = +b.dataset.u; copyText(`${fmt(out[i], 6)} ${c.u[i][0]}`, $("#u-r" + i)); }));
}

/* ---------------- Toolbox router ---------------- */
const TOOLS = { mohr: "mohrs-circle-calculator", beam: "beam-deflection-calculator", fem: "finite-element-method-demo", fatigue: "paris-law-fatigue-calculator", composite: "composite-stiffness-calculator", select: "material-selection-ashby-chart", xrd: "xrd-peak-calculator", creep: "diffusion-creep-life-calculator", units: "engineering-unit-converter" };
function openTool(id, scroll, setHash = true) {
  if (!TOOLS[id]) return;
  $$("#toolNav [role=tab]").forEach((b) => { const on = b.dataset.tool === id; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; });
  Object.keys(TOOLS).forEach((t) => { $("#tool-" + t).hidden = t !== id; });
  if (setHash) { try { history.replaceState(null, "", "#tool-" + id); } catch (e) {} }
  if (scroll) $("#tools").scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
}
$$("#toolNav [role=tab]").forEach((b) => b.addEventListener("click", () => openTool(b.dataset.tool, false)));
$("#toolNav").addEventListener("keydown", (e) => {
  const tabs = $$("#toolNav [role=tab]"), i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  const nxt = ["ArrowDown", "ArrowRight"].includes(e.key) ? 1 : ["ArrowUp", "ArrowLeft"].includes(e.key) ? -1 : 0;
  if (!nxt) return;
  e.preventDefault(); const t = tabs[(i + nxt + tabs.length) % tabs.length]; t.focus(); openTool(t.dataset.tool, false);
});
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#tool-"]');
  if (!a) return;
  const id = a.getAttribute("href").slice(6);
  if (TOOLS[id]) { e.preventDefault(); openTool(id, true); }
});
$$("[data-copy-tool]").forEach((b) => b.addEventListener("click", () => {
  const id = b.dataset.copyTool;
  let url;
  try { url = (CONFIG.siteUrl && location.hostname === new URL(CONFIG.siteUrl).hostname) ? `${CONFIG.siteUrl}tools/${TOOLS[id]}/` : `${location.href.split("#")[0]}#tool-${id}`; }
  catch (e) { url = `#tool-${id}`; }
  copyText(url, null);
}));

/* Wire inputs */
const wire = (panel, fn) => { const p = $("#tool-" + panel); p.addEventListener("input", () => safe(fn)); p.addEventListener("change", () => safe(fn)); safe(fn); };
wire("mohr", mohr);
wire("beam", beam);
wire("fem", femDemo);
$("#p-mat").addEventListener("change", () => { const v = $("#p-mat").value; if (PARIS[v]) { $("#p-C").value = PARIS[v].C; $("#p-m").value = PARIS[v].m; } });
["p-C", "p-m"].forEach((id) => $("#" + id).addEventListener("input", () => { $("#p-mat").value = "custom"; }));
wire("fatigue", fatigue);
$("#c-fib").addEventListener("change", () => { const f = FIB[$("#c-fib").value]; if (f) { $("#c-Ef1").value = f.E1; $("#c-Ef2").value = f.E2; $("#c-rf").value = f.r; } });
["c-Ef1", "c-Ef2", "c-rf"].forEach((id) => $("#" + id).addEventListener("input", () => { $("#c-fib").value = "custom"; }));
wire("composite", composite);
$$("#s-table [data-sort]").forEach((b) => b.addEventListener("click", () => { const k = b.dataset.sort; selState.dir = selState.sort === k ? -selState.dir : (k === "name" || k === "fam" ? 1 : -1); selState.sort = k; safe(selector); }));
wire("select", selector);
$("#x-mat").addEventListener("change", () => { const m = XMAT[$("#x-mat").value]; if (m) { $("#x-struct").value = m[0]; $("#x-a").value = m[1]; } });
["x-struct", "x-a"].forEach((id) => $("#" + id).addEventListener("input", () => { $("#x-mat").value = "custom"; }));
$("#x-struct").addEventListener("change", () => { $("#x-mat").value = "custom"; });
$("#x-rad").addEventListener("change", () => { const v = $("#x-rad").value; if (v !== "custom") $("#x-lam").value = v; });
$("#x-lam").addEventListener("input", () => { $("#x-rad").value = "custom"; });
wire("xrd", xrd);
$("#d-sys").addEventListener("change", () => { const d = DIFF[$("#d-sys").value]; if (d) { $("#d-D0").value = d[0]; $("#d-Q").value = d[1]; } });
["d-D0", "d-Q"].forEach((id) => $("#" + id).addEventListener("input", () => { $("#d-sys").value = "custom"; }));
wire("creep", creep);
safe(unitsInit);
wire("units", units);


/* Initial tool: from the link (#tool-…) or from a tool landing page */
safe(() => {
  const h = location.hash.replace("#tool-", "");
  if (TOOLS[h]) openTool(h, true);
  else if (window.INITIAL_TOOL && TOOLS[window.INITIAL_TOOL]) openTool(window.INITIAL_TOOL, false, false);
});

}

function initLearn() {
/* ---------------- Learn tabs + quiz ---------------- */
$$("#learnTabs [role=tab]").forEach((b) => b.addEventListener("click", () => {
  $$("#learnTabs [role=tab]").forEach((x) => x.setAttribute("aria-selected", x === b));
  ["concepts", "software", "apps", "quiz"].forEach((p) => { $("#lp-" + p).hidden = p !== b.dataset.lp; });
}));
const QUIZ = [
  ["Which material has the highest stiffness per unit weight (E/ρ)?", ["Steel", "Aluminium 6061", "Titanium Ti-6Al-4V", "Carbon-fibre composite along the fibres"], 3, "CFRP is about 135/1.6 ≈ 84 GPa per g/cm³, more than three times steel, aluminium or titanium (all about 25)."],
  ["A cantilever's length doubles. Under the same end load, its tip deflection becomes…", ["2× larger", "4× larger", "8× larger", "16× larger"], 2, "δ = PL³/3EI, so doubling L multiplies δ by 2³ = 8."],
  ["A wide plate with a small round hole is pulled in tension. The peak stress at the hole is…", ["the same as far away", "2× the far-field stress", "3× the far-field stress", "infinite"], 2, "The Kirsch solution gives a stress concentration factor of 3 at the top and bottom of the hole. The plot at the top of this page shows it."],
  ["Principal planes are the planes where…", ["shear stress is largest", "shear stress is zero", "normal stress is zero", "the material yields first"], 1, "Principal stresses act on planes with zero shear stress. Maximum shear acts on planes at 45° to them."],
  ["Which reflection appears in the XRD pattern of an FCC metal?", ["(100)", "(110)", "(111)", "(210)"], 2, "FCC reflections need h, k, l all odd or all even: (111), (200), (220), (311)…"],
  ["Creep usually becomes important above about…", ["0.1 Tm", "0.4 Tm", "0.8 Tm", "the melting point"], 1, "Above roughly 0.4 of the absolute melting temperature, diffusion is fast enough for slow deformation under constant load."],
  ["With Paris exponent m = 3, doubling the stress range shortens crack-growth life by…", ["2×", "3×", "6×", "8×"], 3, "Life scales as Δσ^−m, so 2³ = 8 times shorter."],
  ["Why do FEM engineers run a mesh convergence study?", ["To make the model run faster", "To check the answer stops changing as elements get smaller", "Because software requires it", "To reduce the number of nodes"], 1, "Results depend on mesh size. Refining until key values stop changing shows the answer is from the physics, not the mesh. Try the FEM tool above."]
];
function quizInit() {
  const box = $("#quiz"); let score = 0, done = 0;
  const head = document.createElement("div"); head.style.cssText = "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap";
  head.innerHTML = `<p class="muted">Eight questions on the ideas behind the tools.</p><span class="score" id="qScore">0 / ${QUIZ.length}</span>`;
  box.appendChild(head);
  QUIZ.forEach(([q, opts, ans, why], qi) => {
    const card = document.createElement("article"); card.className = "q";
    card.innerHTML = `<h3>${qi + 1}. ${esc(q)}</h3><div class="opts">${opts.map((o, i) => `<button type="button" data-i="${i}">${esc(o)}</button>`).join("")}</div><p class="why" hidden></p>`;
    card.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      const i = +b.dataset.i;
      card.querySelectorAll("button").forEach((x) => { x.disabled = true; if (+x.dataset.i === ans) x.classList.add("right"); });
      if (i !== ans) b.classList.add("wrong"); else score++;
      done++;
      const w = card.querySelector(".why"); w.textContent = (i === ans ? "Correct. " : "Not quite. ") + why; w.hidden = false;
      $("#qScore").textContent = `${score} / ${QUIZ.length}`;
      if (done === QUIZ.length) { const r = document.createElement("div"); r.className = "verdict"; r.innerHTML = `You scored ${score} out of ${QUIZ.length}. <button class="linkbtn" type="button" id="qAgain">Try again</button>`; box.appendChild(r); $("#qAgain").addEventListener("click", () => { box.innerHTML = ""; quizInit(); }); }
    }));
    box.appendChild(card);
  });
}
safe(quizInit);


}

if (document.getElementById("toolNav")) safe(initTools);
if (document.getElementById("learnTabs")) safe(initLearn);
