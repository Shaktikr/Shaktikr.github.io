/* Shakti Kumar Engineering — shared site script.
   Contact details and prices are set in CONFIG (generated from build.py). */
const CONFIG = {
  "siteUrl": "https://shaktikr.github.io/",
  "email": "shaktikumarrasra@gmail.com",
  "whatsapp": "918837708287",
  "whatsappDisplay": "+91 88377 08287",
  "linkedin": "https://www.linkedin.com/in/shaktikumar1310/",
  "github": "https://github.com/Shaktikr",
  "formEndpoint": "",
  "rates": {
    "EUR": 0.92,
    "GBP": 0.79
  }
};

/* ---------- Utilities (also used by tools.js) ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const num = (id) => parseFloat($("#" + id).value);
const radio = (name) => (document.querySelector(`input[name="${name}"]:checked`) || {}).value;
const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const SUP = { "-": "⁻", "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹" };
const sup = (n) => String(n).split("").map((c) => SUP[c] || c).join("");
function fmt(v, sig = 3) {
  if (v === null || v === undefined || !isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) {
    let e = Math.floor(Math.log10(a));
    let ms = (v / Math.pow(10, e)).toPrecision(sig);
    if (Math.abs(parseFloat(ms)) >= 10) { e += 1; ms = (v / Math.pow(10, e)).toPrecision(sig); }
    return `${parseFloat(ms)} × 10${sup(e)}`;
  }
  const d = a === 0 ? 0 : Math.min(6, Math.max(0, sig - 1 - Math.floor(Math.log10(a))));
  const out = v.toLocaleString("en-US", { maximumFractionDigits: d });
  return out === "-0" ? "0" : out;
}
function toast(m) { const t = $("#toast"); if (!t) return; t.textContent = m; t.classList.add("show"); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("show"), 1800); }
async function copyText(text, node) {
  try { await navigator.clipboard.writeText(text); toast("Copied"); }
  catch (e) { if (node) { const r = document.createRange(); r.selectNodeContents(node); const s = getSelection(); s.removeAllRanges(); s.addRange(r); } toast("Selected. Press Ctrl+C to copy"); }
}
const safe = (fn) => { try { fn(); } catch (e) { console.error(e); } };
const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} } };

/* ---------- Mobile navigation ---------- */
safe(() => {
  const btn = $(".nav-toggle"), nav = $("#site-nav");
  if (!btn || !nav) return;
  btn.addEventListener("click", () => { const open = nav.classList.toggle("open"); btn.setAttribute("aria-expanded", open); });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); } });
});

/* ---------- Prices in the visitor's currency ---------- */
const CUR = { USD: "$", EUR: "€", GBP: "£", INR: "₹" };
function guessCurrency() {
  const saved = store.get("currency");
  if (saved && CUR[saved]) return saved;
  let tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
  if (tz === "Asia/Kolkata" || tz === "Asia/Calcutta") return "INR";
  if (tz === "Europe/London" || tz === "Europe/Dublin") return "GBP";
  if (tz.startsWith("Europe/")) return "EUR";
  return "USD";
}
function priceText(usd, inr, cur) {
  if (cur === "INR") return "₹" + Math.round(inr).toLocaleString("en-IN");
  if (cur === "USD") return "$" + Math.round(usd).toLocaleString("en-US");
  const raw = usd * CONFIG.rates[cur], step = raw < 60 ? 1 : 5;
  return CUR[cur] + (Math.round(raw / step) * step).toLocaleString("en-US");
}
let currency = "USD";
function applyCurrency(cur) {
  currency = cur;
  $$("[data-usd]").forEach((el) => { el.textContent = priceText(+el.dataset.usd, +el.dataset.inr, cur); });
  $$(".cur-switch button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.cur === cur));
  $$("[data-cur-note]").forEach((el) => { el.hidden = cur !== el.dataset.curNote; });
  document.dispatchEvent(new CustomEvent("currencychange"));
}
safe(() => {
  $$(".cur-switch button").forEach((b) => b.addEventListener("click", () => { store.set("currency", b.dataset.cur); applyCurrency(b.dataset.cur); }));
  applyCurrency(guessCurrency());
});

/* ---------- Quote form (contact page) ---------- */
safe(() => {
  const form = $("#quote-form");
  if (!form) return;
  const sel = $("#q-service"), hint = $("#q-hint");
  const params = new URLSearchParams(location.search);
  if (params.get("service") && sel.querySelector(`option[value="${params.get("service")}"]`)) sel.value = params.get("service");
  const showHint = () => {
    const o = sel.selectedOptions[0];
    hint.textContent = o && o.dataset.usd ? `Typical starting price: ${priceText(+o.dataset.usd, +o.dataset.inr, currency)}${o.dataset.unit || ""}. You get a fixed quote before any payment.` : "You get a fixed quote before any payment.";
  };
  sel.addEventListener("change", showHint);
  document.addEventListener("currencychange", showHint);
  showHint();
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("#q-err"); err.hidden = true;
    const f = (id) => ($("#" + id).value || "").trim();
    const missing = [];
    if (!f("q-name")) missing.push("your name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f("q-email"))) missing.push("a valid email address");
    if (f("q-details").length < 20) missing.push("a short description of the work");
    if (missing.length) { err.textContent = `Please add ${missing.join(", ")}.`; err.hidden = false; return; }
    const lines = [
      `Quote request: ${sel.selectedOptions[0].textContent}`,
      `Name: ${f("q-name")}`, `Email: ${f("q-email")}`,
      f("q-org") ? `Organisation: ${f("q-org")}` : null,
      f("q-country") ? `Country: ${f("q-country")}` : null,
      f("q-budget") ? `Budget: ${f("q-budget")}` : null,
      f("q-deadline") ? `Deadline: ${f("q-deadline")}` : null,
      "", f("q-details"),
      f("q-files") ? "" : null, f("q-files") ? `Files: ${f("q-files")}` : null
    ].filter((l) => l !== null).join("\n");
    const res = $("#q-result"), btn = $("#q-send");
    if (CONFIG.formEndpoint) {
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const r = await fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name: f("q-name"), email: f("q-email"), _subject: `Quote request: ${sel.selectedOptions[0].textContent}`, message: lines }) });
        if (!r.ok) throw new Error(r.status);
        res.innerHTML = `<strong>Thank you, ${esc(f("q-name"))}.</strong><p>Your request has been sent. I'll reply to ${esc(f("q-email"))} within 24 hours.</p>`;
        res.hidden = false; form.reset(); showHint();
        btn.textContent = "Send request"; btn.disabled = false;
        return;
      } catch (x) {
        btn.textContent = "Send request"; btn.disabled = false;
        err.textContent = "The form couldn't send automatically. Please use one of the buttons below instead."; err.hidden = false;
      }
    }
    const acts = [
      `<a class="btn btn-primary btn-sm" href="mailto:${esc(CONFIG.email)}?subject=${encodeURIComponent("Quote request: " + sel.selectedOptions[0].textContent)}&body=${encodeURIComponent(lines)}">Send by email</a>`,
      `<a class="btn btn-outline btn-sm" href="https://wa.me/${esc(CONFIG.whatsapp)}?text=${encodeURIComponent(lines)}" target="_blank" rel="noopener">Send on WhatsApp</a>`,
      `<button class="btn btn-outline btn-sm" type="button" id="q-copy">Copy text</button>`
    ];
    res.innerHTML = `<strong>Your request is ready to send.</strong><p class="small muted">Choose how you'd like to send it. Your email or WhatsApp app opens with the message filled in.</p><pre id="q-text">${esc(lines)}</pre><div class="acts">${acts.join("")}</div>`;
    res.hidden = false;
    $("#q-copy").addEventListener("click", () => copyText(lines, $("#q-text")));
    res.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "nearest" });
  });
});

safe(() => { $$(".js-year").forEach((el) => { el.textContent = new Date().getFullYear(); }); });
