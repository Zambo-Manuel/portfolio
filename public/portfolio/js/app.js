// === Dynamic content from Dashboard API (public endpoints) ===
function _mzMonthYear(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  let m = dt.toLocaleString("it-IT", { month: "short" }).replace(".", "").toLowerCase();
  const y = dt.getFullYear();
  return `${m} ${y}`;
}
function _mzRange(start, end, isCurrent) {
  const a = _mzMonthYear(start);
  const b = isCurrent ? "presente" : _mzMonthYear(end);
  if (!a && !b) return "";
  if (!a) return b;
  if (!b) return a;
  return `${a} — ${b}`;
}

async function loadPortfolioFromDashboardApi() {
  try {
    // Projects
    const projRes = await fetch("/api/projects?status=PUBLISHED&limit=100");
    const projJson = await projRes.json();
    const projItems = Array.isArray(projJson) ? projJson : (projJson.data || []);
    const projects = projItems.map((p) => ({
      id: p.slug || p.id,
      title: p.title,
      subtitle: _mzRange(p.startDate, p.endDate, false),
      kicker: "Progetto",
      category: "Progetti",
      year: (p.startDate ? String(new Date(p.startDate).getFullYear()) : ""),
      tags: Array.isArray(p.tags) ? p.tags : [],
      image: (p.coverImage || (p.images?.[0] ?? "")) || "",
      url: p.mainLink || p.repoLink || "#",
      description: p.description || "",
    }));

    // Certifications
    const certRes = await fetch("/api/certifications?status=PUBLISHED&limit=100");
    const certJson = await certRes.json();
    const certItems = Array.isArray(certJson) ? certJson : (certJson.data || []);
    const certifications = certItems.map((c) => ({
      title: c.title,
      issuer: c.issuer,
      date: _mzMonthYear(c.issuedAt),
      note: c.description || "",
    }));

    // Volunteering
    const volRes = await fetch("/api/volunteering?status=PUBLISHED&limit=100");
    const volJson = await volRes.json();
    const volItems = Array.isArray(volJson) ? volJson : (volJson.data || []);
    const volunteering = volItems.map((v) => ({
      role: v.role,
      org: v.organization,
      period: _mzRange(v.startDate, v.endDate, v.isCurrent),
      note: v.description || v.impact || "",
      url: v.link || "",
    }));

    // Awards / recognitions
    const awRes = await fetch("/api/awards?status=PUBLISHED&limit=100");
    const awJson = await awRes.json();
    const awItems = Array.isArray(awJson) ? awJson : (awJson.data || []);
    const awards = awItems.map((a) => ({
      title: a.title,
      issuer: a.issuer,
      date: _mzMonthYear(a.awardedAt),
      note: a.description || "",
      url: a.link || "",
    }));

    // Languages (public uses status=PUBLISHED => visible=true)
    const langRes = await fetch("/api/languages?status=PUBLISHED&limit=100");
    const langJson = await langRes.json();
    const langItems = Array.isArray(langJson) ? langJson : (langJson.data || []);
    const languages = langItems.map((l) => ({
      name: l.name,
      level: l.level,
    }));


    // Global notice + maintenance (site-wide banners)
    try {
      const [noticeRes, maintRes] = await Promise.all([
        fetch("/api/settings/notice"),
        fetch("/api/settings/maintenance"),
      ]);
      const notice = await noticeRes.json();
      const maintenance = await maintRes.json();
      window.__SITE_NOTICE__ = notice;
      window.__SITE_MAINTENANCE__ = maintenance;
    } catch (e) {
      // ignore settings failures (portfolio still works)
    }

    // Apply to both languages (IT/EN share the same structured lists)
    if (window.PORTFOLIO_CONTENT?.it) {
      window.PORTFOLIO_CONTENT.it.projects = projects;
      window.PORTFOLIO_CONTENT.it.certifications = certifications;
      window.PORTFOLIO_CONTENT.it.volunteering = volunteering;
      window.PORTFOLIO_CONTENT.it.awards = awards;

// Expose loader for cv.html and other static pages
window.loadPortfolioFromDashboardApi = loadPortfolioFromDashboardApi;
// Backward-compat alias (older cv.html called this name)
window.loadProjectsFromDashboardApi = loadPortfolioFromDashboardApi;
window.applyGlobalNoticeAndMaintenance = applyGlobalNoticeAndMaintenance;

function applyGlobalNoticeAndMaintenance() {
  const maint = window.__SITE_MAINTENANCE__;
  const notice = window.__SITE_NOTICE__;

  // Maintenance overlay (blocks the site)
  if (maint && maint.enabled) {
    if (!document.getElementById("mz-maintenance-overlay")) {
      const ov = document.createElement("div");
      ov.id = "mz-maintenance-overlay";
      ov.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(10,10,12,.92);display:flex;align-items:center;justify-content:center;padding:24px;text-align:center;";
      const box = document.createElement("div");
      box.style.cssText = "max-width:760px;width:100%;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12);border-radius:16px;padding:22px;color:#fff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;";
      const h = document.createElement("h1");
      h.textContent = maint.title || "Manutenzione in corso";
      h.style.cssText = "font-size:22px;margin:0 0 10px 0;";
      const p = document.createElement("p");
      p.textContent = maint.message || "Stiamo effettuando alcuni aggiornamenti. Torna tra poco.";
      p.style.cssText = "opacity:.9;line-height:1.5;margin:0;";
      box.appendChild(h);
      box.appendChild(p);
      ov.appendChild(box);
      document.body.appendChild(ov);
    }
    return; // don't show notice under maintenance
  } else {
    const old = document.getElementById("mz-maintenance-overlay");
    if (old) old.remove();
  }

  // Global notice banner (top of page)
  const isActive = notice && notice.active;
  if (!isActive) {
    const old = document.getElementById("mz-global-notice");
    if (old) old.remove();
    return;
  }

  // Check schedule (start/end) if present
  try {
    const now = Date.now();
    if (notice.startAt && now < new Date(notice.startAt).getTime()) return;
    if (notice.endAt && now > new Date(notice.endAt).getTime()) return;
  } catch (_) {}

  if (!document.getElementById("mz-global-notice")) {
    const bar = document.createElement("div");
    bar.id = "mz-global-notice";
    const type = (notice.type || "INFO").toUpperCase();
    const bg = type === "ERROR" ? "rgba(220,38,38,.22)" : type === "WARNING" ? "rgba(245,158,11,.22)" : type === "SUCCESS" ? "rgba(34,197,94,.20)" : "rgba(59,130,246,.18)";
    const bd = type === "ERROR" ? "rgba(220,38,38,.45)" : type === "WARNING" ? "rgba(245,158,11,.45)" : type === "SUCCESS" ? "rgba(34,197,94,.40)" : "rgba(59,130,246,.35)";
    bar.style.cssText = `position:sticky;top:0;z-index:5000;background:${bg};border-bottom:1px solid ${bd};backdrop-filter: blur(10px);`;
    const inner = document.createElement("div");
    inner.style.cssText = "max-width:1100px;margin:0 auto;padding:10px 14px;display:flex;gap:10px;align-items:flex-start;justify-content:space-between;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial;";
    const left = document.createElement("div");
    left.style.cssText = "display:flex;flex-direction:column;gap:2px;";
    const t = document.createElement("div");
    t.textContent = notice.title || "Avviso";
    t.style.cssText = "font-weight:700;font-size:13px;letter-spacing:.2px;";
    const m = document.createElement("div");
    m.textContent = notice.message || "";
    m.style.cssText = "font-size:13px;opacity:.95;line-height:1.35;";
    left.appendChild(t);
    left.appendChild(m);
    inner.appendChild(left);

    const right = document.createElement("div");
    right.style.cssText = "display:flex;gap:8px;align-items:center;";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = "Chiudi";
    btn.style.cssText = "border:1px solid rgba(255,255,255,.22);background:rgba(0,0,0,.18);color:inherit;border-radius:999px;padding:6px 10px;font-size:12px;cursor:pointer;";
    btn.addEventListener("click", () => {
      bar.remove();
    });
    right.appendChild(btn);
    inner.appendChild(right);

    bar.appendChild(inner);
    document.body.prepend(bar);
  }
}

      window.PORTFOLIO_CONTENT.it.languages = languages;
    }
    if (window.PORTFOLIO_CONTENT?.en) {
      window.PORTFOLIO_CONTENT.en.projects = projects;
      window.PORTFOLIO_CONTENT.en.certifications = certifications;
      window.PORTFOLIO_CONTENT.en.volunteering = volunteering;
      window.PORTFOLIO_CONTENT.en.awards = awards;
      window.PORTFOLIO_CONTENT.en.languages = languages;
    }

    return true;
  } catch (e) {
    console.warn("Could not load portfolio content from API:", e);
    return false;
  }
}
(function () {
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

  const STORAGE = { lang: "portfolio_lang", theme: "portfolio_theme" };
  const LANGS = ["it", "en"];
  const THEMES = ["system", "light", "dark"]; // stored values

  function lsGet(key) {
    try {
      return localStorage.getItem(key) || "";
    } catch (_) {
      return "";
    }
  }
  function lsSet(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (_) { }
  }

  function systemPrefersDark() {
    try {
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    } catch (_) {
      return false;
    }
  }

  function getTheme() {
    const stored = lsGet(STORAGE.theme);
    return THEMES.includes(stored) ? stored : "system";
  }

  function setTheme(theme) {
    if (!THEMES.includes(theme)) return;
    lsSet(STORAGE.theme, theme);
  }

  function effectiveIsDark(theme = getTheme()) {
    return theme === "dark" || (theme === "system" && systemPrefersDark());
  }

  function applyTheme(theme = getTheme()) {
    const root = document.documentElement;
    const isDark = effectiveIsDark(theme);
    root.classList.toggle("theme-dark", isDark);

    // meta theme-color for browser UI
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", isDark ? "#0b0c0e" : "#f7f4ef");

    syncThemeButtons(theme);

    // Notify components (captcha, etc.)
    try {
      window.dispatchEvent(new Event("portfolio-themechange"));
    } catch (_) { }
  }

  function getLang() {
    const stored = lsGet(STORAGE.lang);
    if (LANGS.includes(stored)) return stored;
    // Default richiesto: Italiano
    return 'it';
  }
  function setLang(lang) {
    if (!LANGS.includes(lang)) return;
    lsSet(STORAGE.lang, lang);
  }

  function t(key, fallback) {
    try {
      return window.I18N?.t?.(key, fallback) ?? (fallback ?? key);
    } catch (_) {
      return fallback ?? key;
    }
  }

  function syncThemeButtons(theme = getTheme()) {
    const isDark = effectiveIsDark(theme);

    const icon = isDark
      ? "☀️"
      : "🌙";

    const aria = isDark ? t("theme.light", "Light") : t("theme.dark", "Dark");

    const btnDesk = document.getElementById("theme-toggle");
    const btnMob = document.getElementById("theme-toggle-mobile");
    const iconDesk = document.getElementById("theme-icon");
    const iconMob = document.getElementById("theme-icon-mobile");

    if (iconDesk) iconDesk.textContent = icon;
    if (iconMob) iconMob.textContent = icon;

    // aria-label indicates the NEXT action
    if (btnDesk) btnDesk.setAttribute("aria-label", `${t("toggle.theme", "Theme")}: ${aria}`);
    if (btnMob) btnMob.setAttribute("aria-label", `${t("toggle.theme", "Theme")}: ${aria}`);
  }

  async function applyI18n() {
    const langNow = getLang();
    try {
      await window.I18N?.load?.(langNow);
      window.I18N?.apply?.(document);
    } catch (_) { }
  }

  function currentContent() {
    const lang = getLang();
    const c = window.PORTFOLIO_CONTENT?.[lang] || window.PORTFOLIO || {};
    window.PORTFOLIO = c;
    return c;
  }

  function initPreferenceButtons({ onChange } = {}) {
    const langBtn = document.getElementById('lang-toggle');
    const langBtnM = document.getElementById('lang-toggle-mobile');

    const themeBtn = document.getElementById('theme-toggle');
    const themeBtnM = document.getElementById('theme-toggle-mobile');

    const toggleLang = async () => {
      const next = getLang() === 'it' ? 'en' : 'it';
      setLang(next);
      try { await window.I18N?.setLang?.(next); } catch (_) { }
      hydrate();
      onChange?.();
    };

    const toggleTheme = () => {
      const current = getTheme();
      const isDark = effectiveIsDark(current);
      const next = isDark ? 'light' : 'dark';
      setTheme(next);
      applyTheme(next);
      onChange?.();
    };

    langBtn?.addEventListener('click', toggleLang);
    langBtnM?.addEventListener('click', toggleLang);

    themeBtn?.addEventListener('click', toggleTheme);
    themeBtnM?.addEventListener('click', toggleTheme);

    // React to system theme changes only if user didn't force light/dark.
    try {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const onMq = () => {
        if (getTheme() === 'system') applyTheme('system');
      };
      mq?.addEventListener?.('change', onMq);
      mq?.addListener?.(onMq); // Safari fallback
    } catch (_) { }

    applyTheme(getTheme());
  }

  async function hydrate() {
    await applyI18n();
    applyTheme(getTheme());

    // Language attribute + flag icon
    const langNow = getLang();
    document.documentElement.setAttribute('lang', langNow);
    const flagSrc = langNow === 'it' ? 'assets/flags/it.png' : 'assets/flags/gb.svg';
    const flagDesk = document.querySelector('#lang-toggle img');
    const flagMob = document.getElementById('lang-flag-mobile');
    if (flagDesk) flagDesk.setAttribute('src', flagSrc);
    if (flagMob) flagMob.setAttribute('src', flagSrc);
    
    await loadPortfolioFromDashboardApi();
    applyGlobalNoticeAndMaintenance();
    const c = currentContent();
    document.title = `${c.name || 'Portfolio'} — ${c.role || ''}`.trim();

    $$('[data-content="name"]').forEach((el) => (el.textContent = c.name || ''));
    const headline = $('[data-content="headline"]');
    if (headline) headline.textContent = c.headline || '';
    const sub = $('[data-content="subheadline"]');
    if (sub) sub.textContent = c.subheadline || '';
    const loc = $('[data-content="location"]');
    if (loc) loc.textContent = c.location || '';
    const avail = $('[data-content="availability"]');
    if (avail) avail.textContent = c.availability || '';

    const roleEls = $$('[data-content="role"]');
    roleEls.forEach((el) => (el.textContent = c.role || ''));

    const mailEls = $$('[data-content="email"]');
    mailEls.forEach((el) => {
      el.textContent = c.email || '';
      el.href = `mailto:${c.email || ''}`;
    });

    const y = String(new Date().getFullYear());
    const yearEl = document.getElementById('year');
    const yearEl2 = document.getElementById('year2');
    if (yearEl) yearEl.textContent = y;
    if (yearEl2) yearEl2.textContent = y;

    const contactLinkedIn = document.getElementById('contact-linkedin');
    if (contactLinkedIn && c.socials?.linkedin) contactLinkedIn.href = c.socials.linkedin;

    // About
    const about = c.about || {};
    const aboutDesc = document.getElementById('about-description');
    if (aboutDesc) aboutDesc.textContent = about.description || '';

    const traitsWrap = document.getElementById('about-traits');
    if (traitsWrap) {
      const traits = Array.isArray(about.traits) ? about.traits : [];
      traitsWrap.innerHTML = traits.map((x) => `<span class="chip">${String(x)}</span>`).join('');
    }

    const statusWrap = document.getElementById('about-status');
    if (statusWrap) {
      const status = Array.isArray(about.status) ? about.status : [];
      statusWrap.innerHTML = status
        .map((s) => {
          const ok = !!s.ok;
          const icon = ok ? '✅' : '❌';
          return `<div class="card p-5" style="box-shadow:none">
            <p class="text-sm text-subtle leading-relaxed"><span class="mr-2">${icon}</span>${s.text || ''}</p>
          </div>`;
        })
        .join('');
    }

    try { window.Animations?.stagger?.(statusWrap, '.card', { step: 80, max: 240 }); } catch (_) { }


    // Education / experience
    const expGrid = document.getElementById('experience-grid');
    if (expGrid) {
      const items = Array.isArray(c.education)
        ? c.education
        : Array.isArray(c.experience)
          ? c.experience
          : [];

      expGrid.innerHTML =
        (items || [])
          .map((e) => {
            const title = e.degree || e.title || '';
            const org = e.school || e.org || e.company || '';
            const period = e.years || e.period || e.year || '';
            const desc = e.note || e.description || '';
            const tags = (Array.isArray(e.tags) ? e.tags : []).map((x) => `<span class="chip">${x}</span>`).join('');
            const bullets =
              Array.isArray(e.bullets) && e.bullets.length
                ? `<ul class="mt-3 grid gap-2 text-sm text-subtle leading-relaxed list-disc pl-5">
                    ${e.bullets.map((b) => `<li>${b}</li>`).join('')}
                  </ul>`
                : '';

            return `<article class="card p-6">
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <p class="text-sm font-bold">${title}</p>
                  <p class="mt-1 text-sm text-muted">${org}</p>
                </div>
                <p class="text-xs text-faint whitespace-nowrap">${period}</p>
              </div>
              ${desc ? `<p class="mt-3 text-sm text-subtle leading-relaxed">${desc}</p>` : ''}
              ${bullets}
              ${tags ? `<div class="mt-4 flex flex-wrap gap-2">${tags}</div>` : ''}
            </article>`;
          })
          .join('') ||
        `<div class="card p-6 text-subtle">${t('fallback.education', 'Add education in js/content.js.')}</div>`;

      try { window.Animations?.stagger?.(expGrid, 'article.card', { step: 90, max: 360 }); } catch (_) { }

    }

    // Skills derived from project stacks
    const skillsGrid = document.getElementById('skills-grid');
    if (skillsGrid) {
      const projects = Array.isArray(c.projects) ? c.projects : [];
      const counts = new Map();
      projects.forEach((p) => (p.stack || []).forEach((s) => {
        const k = String(s || '').trim();
        if (!k) return;
        counts.set(k, (counts.get(k) || 0) + 1);
      }));

      const iconMap = {
        HTML: 'assets/icons/html.svg',
        CSS: 'assets/icons/css.svg',
        JavaScript: 'assets/icons/js.svg',
        Python: 'assets/icons/python.svg',
        'C++': 'assets/icons/cpp.svg',
        Batch: 'assets/icons/batch.svg',
        Canva: 'assets/icons/canva.svg',
        'Graphic Design': 'assets/icons/designdef.svg',
        WordPress: 'assets/icons/wordpress.svg',
        Teamwork: 'assets/icons/teamwork.svg',
        Communication: 'assets/icons/communication.svg',
        Excel: 'assets/icons/excel.svg',
      };

      // Show only the skills listed in the portfolio (fixed set).
      const allowed = ['WordPress', 'Teamwork', 'Communication', 'Canva', 'Graphic Design', 'Excel'];
      const top = allowed.map((name) => ({
        name,
        n: counts.get(name) || 0,
        icon: iconMap[name] || '',
      }));

      skillsGrid.innerHTML =
        top
          .map((s) => `
            <article class="card p-6">
              <div class="flex items-center gap-3">
                ${s.icon ? `<img src="${s.icon}" alt="" class="h-8 w-8" />` : `<div class="h-8 w-8 rounded-2xl bg-soft"></div>`}
                <div class="min-w-0">
                  <p class="font-bold truncate">${s.name}</p>
                  <p class="text-sm text-muted">${s.n} ${s.n === 1 ? t('skills.project', 'project') : t('skills.projects', 'projects')}</p>
                </div>
              </div>
            </article>
          `)
          .join('') ||
        `<div class="card p-6 text-subtle">${t('fallback.skills', '')}</div>`;
    }

    try { window.Animations?.stagger?.(skillsGrid, 'article.card', { step: 80, max: 320 }); } catch (_) { }



    // Projects
    const grid = document.getElementById('projects-grid');
    const filtersWrap = document.getElementById('project-filters');
    const searchInput = document.getElementById('projects-search');
    const toggleBtn = document.getElementById('projects-toggle');
    const countEl = document.getElementById('projects-count');

    const projects = Array.isArray(c.projects) ? c.projects : [];
    const categories = Array.from(new Set(projects.map((p) => p.category).filter(Boolean)));

    let active = '__all';
    let query = (searchInput && typeof searchInput.value === 'string') ? searchInput.value : '';
    let expanded = query.trim().length > 0; // when searching, show all matches

    const normalise = (s) => {
      try {
        return String(s || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
      } catch (_) {
        return String(s || '').toLowerCase();
      }
    };

    const matchesQuery = (p, q) => {
      const needle = normalise(q).trim();
      if (!needle) return true;
      const hay = [
        p.title,
        p.subtitle,
        p.kicker,
        p.year,
        p.category,
        p.description,
        ...(Array.isArray(p.tags) ? p.tags : []),
        ...(Array.isArray(p.stack) ? p.stack : []),
      ]
        .filter(Boolean)
        .join(' ');
      return normalise(hay).includes(needle);
    };

    function filteredProjects() {
      const base = active === '__all' ? projects : projects.filter((p) => p.category === active);
      return base.filter((p) => matchesQuery(p, query));
    }

    function renderFilters() {
      if (!filtersWrap) return;

      const btn = (key, label) =>
        `<button type="button" class="btn ${active === key ? 'btn-primary' : 'btn-ghost'}" data-filter="${key}">${label}</button>`;

      filtersWrap.innerHTML = [
        btn('__all', t('projects.all', 'All')),
        ...categories.map((cat) => btn(cat, cat)),
      ].join('');

      // overwrite handler each hydrate to avoid duplicates
      filtersWrap.onclick = (e) => {
        const b = e.target.closest('[data-filter]');
        if (!b) return;
        active = b.getAttribute('data-filter') || '__all';
        renderFilters();
        renderProjects();
      };
    }

    function syncToggle(listAll, isSearching) {
      if (!toggleBtn) return;
      if (isSearching) {
        toggleBtn.classList.add('hidden');
        return;
      }
      if (listAll.length <= 3) {
        toggleBtn.classList.add('hidden');
        expanded = false;
        return;
      }
      toggleBtn.classList.remove('hidden');
      toggleBtn.textContent = expanded ? t('projects.showLess', 'Show less') : t('projects.showAll', 'Show all');
    }

    function renderProjects() {
      if (!grid) return;

      const listAll = filteredProjects();
      const isSearching = query.trim().length > 0;

      // When searching, always show all matches.
      const shown = (!expanded && !isSearching) ? listAll.slice(0, 3) : listAll;

      // Counter (e.g., "3 di 5" / "Results: 3 of 5")
      if (countEl) {
        const total = listAll.length;
        const shownCount = shown.length;
        if (!total) {
          countEl.textContent = "";
        } else {
          const tplKey = isSearching ? 'projects.countResultsTpl' : 'projects.countTpl';
          const fallbackTpl = isSearching ? 'Results: {shown} of {total}' : '{shown} of {total}';
          const tpl = t(tplKey, fallbackTpl);
          countEl.textContent = String(tpl)
            .replace('{shown}', String(shownCount))
            .replace('{total}', String(total));
        }
      }

      syncToggle(listAll, isSearching);

      grid.innerHTML =
        shown
          .map((p, idx) => {
            const tags = (p.tags || []).slice(0, 4).map((x) => `<span class="chip">${x}</span>`).join('');
            return `<article class="project-card card overflow-hidden p-0">
              ${p.image ? `<img src="${p.image}" alt="" class="w-full h-44 object-cover border-b border-soft" />` : ''}
              <div class="p-6">
                <p class="text-xs text-faint">${p.kicker || p.year || ''}</p>
                <h3 class="mt-1 text-lg font-bold">${p.title || ''}</h3>
                ${p.subtitle ? `<p class="mt-1 text-sm text-soft">${p.subtitle}</p>` : ''}
                ${tags ? `<div class="mt-4 flex flex-wrap gap-2">${tags}</div>` : ''}
                <div class="mt-5 flex items-center gap-2">
                  <button class="btn btn-ghost" type="button" data-open="${idx}">${t('projects.details', 'Details')}</button>
                  ${p.url && p.url !== '#' ? `<a class="btn btn-primary" href="${p.url}" target="_blank" rel="noreferrer">${t('projects.link', 'Link')}</a>` : ''}
                </div>
              </div>
            </article>`;
          })
          .join('') || `<div class="card p-6 text-subtle">${t('projects.none', 'No projects.')}</div>`;

      try { window.Animations?.stagger?.(grid, '.project-card', { step: 85, max: 340 }); } catch (_) { }


      grid.onclick = (e) => {
        const b = e.target.closest('[data-open]');
        if (!b) return;
        const idx = parseInt(b.getAttribute('data-open') || '0', 10);
        const p = shown[idx];
        window.UI?.openProjectModal?.(p);
      };
    }

    // Search input (overwrite handler each hydrate to avoid duplicates)
    if (searchInput) {
      searchInput.oninput = () => {
        query = searchInput.value || '';
        // If user is searching, show everything matching.
        expanded = query.trim().length > 0;
        // If the query is cleared, go back to the 3-project preview.
        if (!query.trim()) expanded = false;
        renderProjects();
      };
    }

    // Show all / show less
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        expanded = !expanded;
        renderProjects();
      };
    }

    renderFilters();
    renderProjects();

    // Extras
    const certGrid = document.getElementById('certifications-grid');
    if (certGrid) {
      const items = Array.isArray(c.certifications) ? c.certifications : [];
      certGrid.innerHTML =
        items
          .map(
            (x) => `
          <article class="card p-5">
            <p class="font-bold">${x.title || ''}</p>
            <p class="mt-1 text-sm text-soft">${[x.issuer, x.date].filter(Boolean).join(' • ')}</p>
            ${x.note ? `<p class="mt-3 text-sm text-subtle leading-relaxed">${x.note}</p>` : ''}
          </article>
        `
          )
          .join('') ||
        `<div class="card p-6 text-subtle">${t('fallback.certifications', '')}</div>`;
    }



    try { window.Animations?.stagger?.(certGrid, 'article.card', { step: 80, max: 300 }); } catch (_) { }

    const volGrid = document.getElementById('volunteering-grid');
    if (volGrid) {
      const items = Array.isArray(c.volunteering) ? c.volunteering : [];
      volGrid.innerHTML =
        items
          .map((x) => {
            const header = [x.role, x.org].filter(Boolean).join(' — ');
            const sub = x.period || '';
            const body = x.note || '';
            const link = x.url
              ? `<a class="mt-3 inline-flex items-center gap-2 text-sm text-subtle underline underline-offset-4 underline-soft" href="${x.url}" target="_blank" rel="noopener">${t('general.openSite', 'Open site')}</a>`
              : '';
            return `
          <article class="card p-5">
            <p class="font-bold">${header}</p>
            ${sub ? `<p class="mt-1 text-sm text-soft">${sub}</p>` : ''}
            ${body ? `<p class="mt-3 text-sm text-subtle leading-relaxed">${body}</p>` : ''}
            ${link}
          </article>`;
          })
          .join('') ||
        `<div class="card p-6 text-subtle">${t('fallback.volunteering', '')}</div>`;
    }



    try { window.Animations?.stagger?.(volGrid, 'article.card', { step: 80, max: 300 }); } catch (_) { }

    const awardsGrid = document.getElementById('awards-grid');
    if (awardsGrid) {
      const items = Array.isArray(c.awards) ? c.awards : [];
      awardsGrid.innerHTML =
        items
          .map(
            (x) => `
          <article class="card p-5">
            <p class="font-bold">${x.title || ''}</p>
            <p class="mt-1 text-sm text-soft">${[x.issuer, x.date].filter(Boolean).join(' • ')}</p>
            ${x.note ? `<p class="mt-3 text-sm text-subtle leading-relaxed">${x.note}</p>` : ''}
          </article>
        `
          )
          .join('') || '';
    }



    try { window.Animations?.stagger?.(awardsGrid, 'article.card', { step: 80, max: 300 }); } catch (_) { }

    const langGrid = document.getElementById('languages-grid');
    if (langGrid) {
      const items = Array.isArray(c.languages) ? c.languages : [];
      langGrid.innerHTML =
        items
          .map(
            (x) => `
          <article class="card p-5">
            <p class="font-bold">${x.name || ''}</p>
            ${x.level ? `<p class="mt-1 text-sm text-soft">${x.level}</p>` : ''}
          </article>
        `
          )
          .join('') || '';
    }

    try { window.Animations?.stagger?.(langGrid, 'article.card', { step: 70, max: 260 }); } catch (_) { }


    // Social
    const socialWrap = document.getElementById('social-links');
    if (socialWrap) {
      const map = {
        linkedin: { label: 'LinkedIn', icon: 'assets/icons/linkedin.svg' },
        instagram: { label: 'Instagram', icon: 'assets/icons/instagram.svg' },
        ITImarconi: { label: 'ITI Marconi', icon: 'assets/icons/web.svg' },
      };
      const socials = c.socials || {};
      const entries = Object.keys(map)
        .filter((k) => !!socials[k])
        .map((k) => ({ key: k, url: socials[k], ...map[k] }));

      socialWrap.innerHTML =
        entries
          .map(
            (s) => `
        <a class="card p-4 flex items-center justify-between gap-3 hover:translate-y-[-1px] transition" href="${s.url}" target="_blank" rel="noreferrer">
          <div class="flex items-center gap-3 min-w-0">
            <img src="${s.icon}" alt="${s.label}" class="h-7 w-7" />
            <p class="font-bold truncate">${s.label}</p>
          </div>
          <span class="text-veryfaint">↗</span>
        </a>
      `
          )
          .join('') ||
        `<div class="card p-6 text-subtle">${t('fallback.social', '')}</div>`;
    }

    try { window.Animations?.stagger?.(socialWrap, 'a.card', { step: 70, max: 260 }); } catch (_) { }


    // FormSubmit (non-AJAX) config: set action and dynamic _next redirect.
    const form = document.getElementById('contact-form');
    if (form) {
      const targetEmail = (c.formsubmitEmail || c.email || '').trim();

      if (targetEmail) {
        form.method = 'POST';
        form.action = `https://formsubmit.co/info@manuelzambelli.it`;
      }

      const subj = form.querySelector('input[name="_subject"]');
      if (subj) subj.value = t('form.subject', subj.value || '');

      const nextInput = form.querySelector('input[name="_next"]');
      if (nextInput) {
        try {
          if (window.location.protocol === 'file:') {
            nextInput.value = 'https://formsubmit.co/thanks';
          } else {
            const url = new URL(window.location.href);
            url.search = '';
            url.searchParams.set('sent', '1');
            url.hash = '#contact';
            nextInput.value = url.toString();
          }
        } catch (_) { }
      }
    }

    // Refresh reveal observer for any new elements injected during hydrate
    try { window.Animations?.refresh?.(); } catch (_) { }

    // Keep theme button icons in sync after language updates.
    syncThemeButtons(getTheme());
  }

  // Background init
  function initBackground() {
    const canvas = document.getElementById('hero-canvas');
    if (!canvas) return;
    try {
      window.__bg?.destroy?.();
    } catch (_) { }
    window.__bg = window.ThreeBG?.init?.(canvas) || null;
  }

  function setFieldError(form, name, message) {
    const el = form.querySelector(`[data-error="${name}"]`);
    if (!el) return;
    el.textContent = message || '';
  }
  function clearAllErrors(form) {
    form.querySelectorAll('[data-error]').forEach((el) => (el.textContent = ''));
  }
  function isValidEmail(v) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || '').trim());
  }

  function initContact() {
    const form = document.getElementById('contact-form');
    if (!form) return;

    form.setAttribute('novalidate', 'novalidate');

    // Smart contact actions (copy/open)
    const copyEmailBtn = document.getElementById('contact-copy-email');
    const copyLinkedInBtn = document.getElementById('contact-copy-linkedin');
    const waBtn = document.getElementById('contact-whatsapp');
    const linkedInA = document.getElementById('contact-linkedin');

    function getContentForLang() {
      const lang = getLang();
      return (window.PORTFOLIO_CONTENT && window.PORTFOLIO_CONTENT[lang]) || (window.PORTFOLIO_CONTENT && window.PORTFOLIO_CONTENT.it) || {};
    }

    function digitsOnly(s) { return String(s || '').replace(/\D+/g, ''); }

    async function copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(String(text || ''));
        window.UI?.toast?.({ title: t('modal.copiedTitle', 'Copied'), message: t('modal.copiedMsg', 'Link copied.'), variant: 'success' });
      } catch (_) {
        window.UI?.toast?.({ title: t('modal.copyFailTitle', "Couldn't copy"), message: t('modal.copyFailMsg', "Please copy manually."), variant: 'danger' });
      }
    }

    function syncContactLinks() {
      const c = getContentForLang();
      const email = c.email || '';
      const linkedin = c.socials?.linkedin || '';
      const phone = document.getElementById('contact-number')?.textContent || '+39 333 867 8617';
      const phoneDigits = digitsOnly(phone || '393338678617');

      // Mailto button (existing)
      const mailtoA = document.querySelector('#contact [data-content="email"]');
      if (mailtoA) mailtoA.setAttribute('href', `mailto:${email}`);

      if (linkedInA && linkedin) linkedInA.setAttribute('href', linkedin);

      if (waBtn) {
        const msg = (getLang() === 'it')
          ? 'Ciao Manuel, ho visto il tuo portfolio e vorrei parlarti di una opportunità.'
          : "Hi Manuel, I saw your portfolio and I'd like to talk about an opportunity.";
        waBtn.setAttribute('href', `https://wa.me/${phoneDigits}?text=${encodeURIComponent(msg)}`);
        waBtn.setAttribute('target', '_blank');
        waBtn.setAttribute('rel', 'noreferrer');
      }

      copyEmailBtn?.addEventListener('click', () => copyToClipboard(email));
      copyLinkedInBtn?.addEventListener('click', () => copyToClipboard(linkedin));
    }

    syncContactLinks();
    window.addEventListener('portfolio-langchange', syncContactLinks);


    // If we were redirected back after a successful submit, show a toast.
    try {
      const u = new URL(window.location.href);
      if (u.searchParams.get('sent') === '1') {
        window.UI?.toast?.({ title: t('form.sentTitle', 'Message sent'), message: t('form.sentMsg', ''), variant: 'success' });
        u.searchParams.delete('sent');
        history.replaceState({}, '', u.toString());
      }
    } catch (_) { }


    // Captcha (code on canvas)
    const captchaCanvas = form.querySelector('#captcha-canvas');
    const captchaRefresh = form.querySelector('#captcha-refresh');
    let captchaAnswer = '';

    function randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    function pick(list) {
      return list[randInt(0, list.length - 1)];
    }

    function newCode() {
      const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let out = '';
      for (let i = 0; i < 5; i++) out += alphabet[randInt(0, alphabet.length - 1)];
      return out;
    }

    function drawCaptcha(code) {
      if (!captchaCanvas) return;
      const ctx = captchaCanvas.getContext && captchaCanvas.getContext('2d');
      if (!ctx) return;
      const w = captchaCanvas.width;
      const h = captchaCanvas.height;

      const dark = document.documentElement.classList.contains('theme-dark');
      const ink = dark ? [245, 245, 246] : [24, 24, 27];

      ctx.clearRect(0, 0, w, h);
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, 'rgba(255,107,107,0.22)');
      g.addColorStop(0.55, 'rgba(99,102,241,0.18)');
      g.addColorStop(1, 'rgba(16,185,129,0.16)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      for (let i = 0; i < 140; i++) {
        ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},${Math.random() * 0.10})`;
        ctx.beginPath();
        ctx.arc(randInt(0, w), randInt(0, h), Math.random() * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},0.12)`;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(randInt(0, w), randInt(0, h));
        for (let k = 0; k < 4; k++) ctx.quadraticCurveTo(randInt(0, w), randInt(0, h), randInt(0, w), randInt(0, h));
        ctx.stroke();
      }

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const fonts = [
        '700 28px ui-sans-serif, system-ui, -apple-system, Segoe UI',
        '800 26px ui-sans-serif, system-ui, -apple-system, Segoe UI',
      ];
      let x = 14;
      for (const ch of code) {
        ctx.save();
        const ang = (Math.random() - 0.5) * 0.35;
        const y = h / 2 + randInt(-4, 4);
        ctx.translate(x, y);
        ctx.rotate(ang);
        ctx.font = pick(fonts);
        ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},0.82)`;
        ctx.fillText(ch, 0, 0);
        ctx.restore();
        x += 28;
      }

      ctx.font = '700 10px ui-sans-serif, system-ui';
      ctx.fillStyle = `rgba(${ink[0]},${ink[1]},${ink[2]},0.50)`;
      ctx.fillText(t('captcha.hint', 'TYPE THE CODE'), w - 112, 12);
    }

    function regenCaptcha() {
      captchaAnswer = newCode();
      drawCaptcha(captchaAnswer);
      const inp = form.elements.namedItem('captcha');
      if (inp) inp.value = '';
      setFieldError(form, 'captcha', '');
    }

    if (captchaCanvas) {
      regenCaptcha();
      captchaRefresh?.addEventListener('click', regenCaptcha);
      // Redraw captcha when theme changes to keep contrast.
      window.addEventListener('portfolio-themechange', () => drawCaptcha(captchaAnswer));
    }

    form.addEventListener('submit', (e) => {
      const honey = (form.querySelector('input[name="_honey"]') || {}).value || '';
      if (String(honey).trim()) {
        e.preventDefault();
        return;
      }

      clearAllErrors(form);

      const name = String(form.elements.namedItem('name')?.value || '').trim();
      const email = String(form.elements.namedItem('email')?.value || '').trim();
      const message = String(form.elements.namedItem('message')?.value || '').trim();
      const consent = !!form.elements.namedItem('consent')?.checked;
      const captchaVal = String(form.elements.namedItem('captcha')?.value || '').trim().toUpperCase();

      let ok = true;
      if (name.length < 2) {
        setFieldError(form, 'name', t('form.err.name', 'Enter a valid name.'));
        ok = false;
      }
      if (!isValidEmail(email)) {
        setFieldError(form, 'email', t('form.err.email', 'Enter a valid email.'));
        ok = false;
      }
      if (message.length < 10) {
        setFieldError(form, 'message', t('form.err.message', 'Write at least 10 characters.'));
        ok = false;
      }
      if (!consent) {
        setFieldError(form, 'consent', t('form.err.consent', 'You must accept the privacy policy.'));
        ok = false;
      }

      if (captchaCanvas) {
        if (!captchaVal) {
          setFieldError(form, 'captcha', t('form.err.captchaMissing', 'Complete the captcha.'));
          ok = false;
        } else if (captchaVal !== String(captchaAnswer).toUpperCase()) {
          setFieldError(form, 'captcha', t('form.err.captchaWrong', 'Wrong code. Try again.'));
          ok = false;
          regenCaptcha();
        }
      }

      if (!ok) {
        e.preventDefault();
        window.UI?.toast?.({ title: t('form.checkTitle', 'Check'), message: t('form.checkMsg', ''), variant: 'error' });
        return;
      }

      const submitBtn = form.querySelector('button[type="submit"]');
      const prev = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = t('form.sending', 'Sending…');
      }

      const replyTo = form.querySelector('input[name="_replyto"]');
      if (replyTo) replyTo.value = email;

      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = prev || t('form.submit', 'Send');
          }
        }
      }, 8000);
    });
  }


  // Small helpers
  function escapeHtml(str) {
    return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // Profile photo modal (tap/click to enlarge)
  function initPhotoModal() {
    const modal = document.getElementById('photo-modal');
    const closeBtn = document.getElementById('photo-close');
    const openers = Array.from(document.querySelectorAll('[data-open-photo]'));
    if (!modal || !openers.length) return;

    function lockPage() {
      try { document.documentElement.classList.add('overflow-hidden'); } catch (_) { }
    }
    function unlockPage() {
      try { document.documentElement.classList.remove('overflow-hidden'); } catch (_) { }
    }

    function open() {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      lockPage();
    }

    function close() {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      unlockPage();
    }

    openers.forEach((el) => el.addEventListener('click', (e) => { e.preventDefault(); open(); }));
    closeBtn?.addEventListener('click', close);
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target?.classList?.contains('photo-backdrop')) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
    });
  }



  function initMobileNav() {
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('mobile-nav');
    const closeBtn = document.getElementById('mobile-close');
    if (!toggle || !menu) return;

    const panel = menu.querySelector('.mobile-nav-panel');
    const setVhVar = () => {
      try {
        document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
      } catch (_) { }
    };
    setVhVar();
    const open = () => {
      setVhVar();
      menu.classList.remove('hidden');
      // Ensure the menu starts at the top and remains scrollable on small viewports
      try { menu.scrollTop = 0; } catch (_) { }
      try { if (panel) panel.scrollTop = 0; } catch (_) { }
      window.UI?.__lockPage?.();
    };
    const close = () => {
      menu.classList.add('hidden');
      window.UI?.__unlockPage?.();
    };

    toggle.addEventListener('click', () => {
      const hidden = menu.classList.contains('hidden');
      hidden ? open() : close();
    });
    closeBtn?.addEventListener('click', close);

    menu.addEventListener('click', (e) => {
      // Close when tapping the backdrop/outside the panel
      if (e.target === menu || e.target.closest('.backdrop')) { close(); return; }
      const a = e.target.closest("a[href^='#']");
      if (a) close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.classList.contains('hidden')) close();
    });

    window.addEventListener('resize', () => {
      setVhVar();
      if (window.innerWidth >= 768) close();
    });
  }

  function boot() {
    initPreferenceButtons({
      onChange: () => {
        if (prefersReduced) return;
        // small feedback toast, but keep it minimal
        try {
          window.UI?.toast?.({ title: '✓', message: 'Modifica avvenuta con successo', variant: 'success' });
        } catch (_) { }
      },
    });
    hydrate();
    initBackground();
    initMobileNav();
    window.UI?.initProjectModal?.();
    window.UI?.initLegalModal?.();
    try { initPhotoModal(); } catch (e) { console.error('Photo modal init failed', e); }
    try { initContact(); } catch (e) { console.error('Contact init failed', e); }
    // Privacy/Cookie consent (first visit)
    window.UI?.maybeShowConsent?.();
    window.UI?.initWIPModal?.();
  }

  document.addEventListener('DOMContentLoaded', boot);
})();