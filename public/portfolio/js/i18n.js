/* i18n (JSON-based)
   - Loads translations from assets/i18n/{lang}.json
   - Falls back to inline JSON <script id="i18n-it|en" type="application/json"> (useful on file://)
   - Applies translations via:
     data-i18n                -> textContent
     data-i18n-placeholder    -> placeholder attribute
     data-i18n-aria-label     -> aria-label attribute
     data-i18n-title          -> title attribute
*/
(function () {
  const STORAGE_KEY = "portfolio_lang";
  const LANGS = ["it", "en"];

  let dict = {};
  let loadedLang = null;

  const lsGet = (k) => {
    try { return localStorage.getItem(k) || ""; } catch (_) { return ""; }
  };
  const lsSet = (k, v) => {
    try { localStorage.setItem(k, v); } catch (_) {}
  };

  function getLang() {
    const stored = lsGet(STORAGE_KEY);
    if (LANGS.includes(stored)) return stored;
    // Default requested: Italian
    return "it";
  }

  function setLangLocal(lang) {
    if (!LANGS.includes(lang)) return;
    lsSet(STORAGE_KEY, lang);
  }

  function safeParseJSON(text) {
    try { return JSON.parse(text); } catch (_) { return {}; }
  }

  async function load(lang = getLang()) {
    if (!LANGS.includes(lang)) lang = "it";
    if (loadedLang === lang && dict && Object.keys(dict).length) return dict;

    // 1) Try fetching JSON (works on http(s))
    if (window.location.protocol !== "file:") {
      try {
        const res = await fetch(`assets/i18n/${lang}.json`, { cache: "no-store" });
        if (res.ok) {
          dict = await res.json();
          loadedLang = lang;
          return dict;
        }
      } catch (_) {}
    }

    // 2) Fallback to inline JSON for file://
    const inline = document.getElementById(`i18n-${lang}`);
    if (inline) {
      dict = safeParseJSON(inline.textContent || "{}");
      loadedLang = lang;
      return dict;
    }

    dict = {};
    loadedLang = lang;
    return dict;
  }

  function t(key, fallback) {
    if (!key) return fallback || "";
    const v = dict && Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : undefined;
    return (v !== undefined && v !== null && v !== "") ? String(v) : (fallback !== undefined ? fallback : key);
  }

  function apply(root = document) {
    // text
    root.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n") || "";
      if (!key) return;
      el.textContent = t(key, el.textContent);
    });

    // placeholder
    root.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder") || "";
      if (!key) return;
      const current = el.getAttribute("placeholder") || "";
      el.setAttribute("placeholder", t(key, current));
    });

    // aria-label
    root.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const key = el.getAttribute("data-i18n-aria-label") || "";
      if (!key) return;
      const current = el.getAttribute("aria-label") || "";
      el.setAttribute("aria-label", t(key, current));
    });

    // title
    root.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const key = el.getAttribute("data-i18n-title") || "";
      if (!key) return;
      const current = el.getAttribute("title") || "";
      el.setAttribute("title", t(key, current));
    });
  }

  async function setLang(lang) {
    if (!LANGS.includes(lang)) return;
    setLangLocal(lang);
    await load(lang);
    document.documentElement.setAttribute("lang", lang);
    apply();
    try { window.dispatchEvent(new Event("portfolio-langchange")); } catch (_) {}
  }

  // Expose
  window.I18N = { getLang, setLang, load, apply, t, LANGS };

  // Initial load (non-blocking)
  load(getLang()).then(() => {
    document.documentElement.setAttribute("lang", getLang());
    apply();
  });
})();
