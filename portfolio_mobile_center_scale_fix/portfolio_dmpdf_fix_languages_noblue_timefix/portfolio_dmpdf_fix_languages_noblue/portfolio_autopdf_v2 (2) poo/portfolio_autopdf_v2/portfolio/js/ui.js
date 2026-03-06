/*
  UI helpers (redesigned).
  Exposes:
   - UI.toast({title,message,variant})
   - UI.openProjectModal(project)
   - UI.initProjectModal()
   - UI.initLegalModal()
   - UI.maybeShowConsent()
   - UI.openLegalModal(tab)
*/
(function () {
  const $ = (s, p = document) => p.querySelector(s);
  const t = (key, fallback) => {
    try { return window.I18N?.t?.(key, fallback) ?? (fallback ?? key); } catch (_) { return fallback ?? key; }
  };

  // Ripple (strong click feedback) – applies to .btn, .chip and legal tabs.
  // Respects prefers-reduced-motion.
  function initRipples() {
    try {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduce) return;
    } catch (_) { }

    // Single delegated handler (covers dynamically injected buttons too)
    document.addEventListener(
      "pointerdown",
      (e) => {
        const target = e.target?.closest?.(".btn, .chip, .legal-tab");
        if (!target) return;
        // Skip if element is disabled
        if (target.matches("button") && target.disabled) return;

        const rect = target.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const size = Math.max(rect.width, rect.height) * 1.35;
        const ripple = document.createElement("span");
        ripple.className = "ripple";
        ripple.style.width = ripple.style.height = `${size}px`;

        // Prefer pointer coordinates; fallback to center
        const clientX = typeof e.clientX === "number" ? e.clientX : rect.left + rect.width / 2;
        const clientY = typeof e.clientY === "number" ? e.clientY : rect.top + rect.height / 2;
        ripple.style.left = `${clientX - rect.left - size / 2}px`;
        ripple.style.top = `${clientY - rect.top - size / 2}px`;

        // Remove any previous ripples quickly to avoid stacking
        target.querySelectorAll(":scope > .ripple").forEach((n) => n.remove());
        target.appendChild(ripple);
        ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
      },
      { passive: true }
    );
  }

  // Page lock for mobile menu / modal
  let lockedY = 0;
  function lockPage() {
    lockedY = window.scrollY || 0;
    document.documentElement.classList.add("is-locked");
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
  }
  function unlockPage() {
    document.documentElement.classList.remove("is-locked");
    document.body.style.position = "";
    document.body.style.top = "";
    document.body.style.left = "";
    document.body.style.right = "";
    document.body.style.width = "";
    window.scrollTo(0, lockedY);
  }

  // Toast
  function toast({ title = "", message = "", variant = "info" } = {}) {
    const root = document.getElementById("toast-root");
    if (!root) return;

    const el = document.createElement("div");
    el.className = `toast-item ${variant === "success" ? "success" : variant === "error" ? "error" : ""}`;
    el.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="mt-1 h-2.5 w-2.5 rounded-full ${variant === "success" ? "bg-emerald-500" : variant === "error" ? "bg-rose-500" : "ui-dot"
      }"></div>
        <div class="min-w-0">
          ${title ? `<p class="font-semibold leading-snug">${title}</p>` : ""}
          ${message ? `<p class="mt-1 text-sm text-subtle leading-snug">${message}</p>` : ""}
        </div>
        <button class="ml-auto -mr-1 rounded-xl px-2 py-1 ui-close" aria-label="${t('toast.closeAria', 'Close')}">✕</button>
      </div>
    `;

    const close = () => {
      el.classList.remove("show");
      setTimeout(() => el.remove(), 180);
    };
    el.querySelector("button")?.addEventListener("click", close);

    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add("show"));
    setTimeout(() => { if (el.isConnected) close(); }, 4200);
  }

  // Project modal
  function initProjectModal() {
    const modal = $("#project-modal");
    if (!modal) return;

    const closeBtn = $("#modal-close", modal);
    const body = $("#modal-body", modal);
    const title = $("#modal-title", modal);
    const sub = $("#modal-sub", modal);
    const link = $("#modal-link", modal);
    const copy = $("#modal-copy", modal);

    function close() {
      modal.classList.add("hidden");
      body.innerHTML = "";
      unlockPage();
    }

    closeBtn?.addEventListener("click", close);
    modal.addEventListener("click", (e) => {
      if (e.target === modal || e.target?.classList?.contains("backdrop")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.classList.contains("hidden")) close();
    });

    window.UI = window.UI || {};
    window.UI.openProjectModal = (p) => {
      if (!p) return;

      title.textContent = p.title || "";
      sub.textContent = p.subtitle || p.category || "";
      if (link) {
        link.href = p.url || "#";
        link.classList.toggle("hidden", !p.url);
      }

      const tags = (Array.isArray(p.tags) ? p.tags : []).map((tx) => `<span class="chip">${tx}</span>`).join("");
      body.innerHTML = `
        ${p.image ? `<img src="${p.image}" alt="" class="w-full rounded-3xl border border-soft" />` : ""}
        <div class="mt-4 grid gap-3">
          ${p.description ? `<p class="text-subtle leading-relaxed">${p.description}</p>` : ""}
          ${tags ? `<div class="flex flex-wrap gap-2">${tags}</div>` : ""}
        </div>
      `;

      copy?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(p.url || window.location.href);
          toast({ title: t('modal.copiedTitle', 'Copied'), message: t('modal.copiedMsg', 'Link copied.'), variant: 'success' });
        } catch (_) {
          toast({ title: t('modal.copyFailTitle', "Couldn't copy"), message: t('modal.copyFailMsg', 'Copy the link manually.'), variant: 'error' });
        }
      }, { once: true });

      modal.classList.remove("hidden");
      lockPage();
    };
  }

  // Legal modal + consent gate
  const CONSENT_KEY = "portfolio_consent_v2";
  const CONSENT_VERSION = 2;

  function getConsent() {
    try { return JSON.parse(localStorage.getItem(CONSENT_KEY) || "{}"); } catch (_) { return {}; }
  }

  // True when user made a choice (accept/decline) for the current version.
  function hasConsent() {
    const c = getConsent();
    if (c && c.v === CONSENT_VERSION && (c.analytics === true || c.analytics === false)) return true;
    return false;
  }

  // Returns true/false when set, otherwise null.
  function getAnalyticsConsent() {
    const c = getConsent();
    if (c && c.v === CONSENT_VERSION && (c.analytics === true || c.analytics === false)) return c.analytics;
    return null;
  }

  function setConsentChoice(analytics) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, analytics: !!analytics, ts: Date.now() }));
    } catch (_) { }
  }

  function resetConsent() {
    try { localStorage.removeItem(CONSENT_KEY); } catch (_) { }
  }

  // Load Umami only after consent (when configured).
  function loadUmamiIfConfigured() {
    // Configure via meta tags (recommended so the site stays static)
    const src = document.querySelector('meta[name="umami-src"]')?.getAttribute("content")?.trim();
    const websiteId = document.querySelector('meta[name="umami-website-id"]')?.getAttribute("content")?.trim();

    // Skip if not configured (placeholders)
    if (!src || !websiteId) return;
    if (src.includes("[") || websiteId.includes("[")) return;

    // Prevent duplicates
    const existing = document.querySelector(`script[src="${src}"][data-website-id="${websiteId}"]`);
    if (existing) return;

    const s = document.createElement("script");
    s.async = true;
    s.defer = true;
    s.src = src;
    s.setAttribute("data-website-id", websiteId);
    document.head.appendChild(s);
  }

  // Enable/disable Umami tracking (used when user declines after having accepted).
  function setUmamiDisabled(disabled) {
    try {
      if (disabled) localStorage.setItem("umami.disabled", 1);
      else localStorage.removeItem("umami.disabled");
    } catch (_) { }
  }

  // Best-effort removal of an already-inserted Umami script tag.
  function removeUmamiScriptIfPresent() {
    const src = document.querySelector('meta[name="umami-src"]')?.getAttribute("content")?.trim();
    const websiteId = document.querySelector('meta[name="umami-website-id"]')?.getAttribute("content")?.trim();
    if (!src || !websiteId) return;
    const el = document.querySelector(`script[src="${src}"][data-website-id="${websiteId}"]`);
    if (el) el.remove();
  }

  function initLegalModal() {
    const legal = $("#legal-modal");
    const consent = $("#consent-modal");
    if (!legal && !consent) return;

    // ---- Legal modal
    const legalClose = $("#legal-close", legal);
    const legalContent = $("#legal-content", legal);
    const tabButtons = Array.from(legal.querySelectorAll("[data-legal-tab]"));

    let currentTab = "privacy";
    let reopenConsentAfterLegal = false;

    function setActiveTab(tab) {
      currentTab = tab === "cookies" ? "cookies" : "privacy";
      tabButtons.forEach((b) => b.classList.toggle("is-active", (b.getAttribute("data-legal-tab") === currentTab)));

      const html = currentTab === "cookies"
        ? t("legal.cookiesHtml", "")
        : t("legal.privacyHtml", "");

      if (legalContent) legalContent.innerHTML = html || "";
    }

    function closeLegal() {
      legal.classList.add("hidden");
      unlockPage();
      // If user opened legal from the consent gate, reopen it afterwards (until accepted)
      if (reopenConsentAfterLegal && !hasConsent()) {
        reopenConsentAfterLegal = false;
        openConsentGate();
      } else {
        reopenConsentAfterLegal = false;
      }
    }

    function openLegal(tab = "privacy", opts = {}) {
      reopenConsentAfterLegal = !!opts.reopenConsentAfter;
      setActiveTab(tab);
      legal.classList.remove("hidden");
      lockPage();
    }

    legalClose?.addEventListener("click", closeLegal);
    legal.addEventListener("click", (e) => {
      if (e.target === legal || e.target?.classList?.contains("backdrop")) closeLegal();
    });

    tabButtons.forEach((b) => b.addEventListener("click", () => setActiveTab(b.getAttribute("data-legal-tab") || "privacy")));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        if (legal && !legal.classList.contains("hidden")) closeLegal();
      }
    });

    // Refresh content when language changes while open
    window.addEventListener("portfolio-langchange", () => {
      if (legal && !legal.classList.contains("hidden")) setActiveTab(currentTab);
    });

    // ---- Consent gate (accept/decline)
    const acceptBtn = $("#consent-accept", consent);
    const declineBtn = $("#consent-decline", consent);
    const readBtn = $("#consent-read", consent);

    function closeConsentGate() {
      consent.classList.add("hidden");
      unlockPage();
    }

    function openConsentGate(force = false) {
      // If already accepted, do nothing.
      if (!force && hasConsent()) return;

      consent.classList.remove("hidden");
      lockPage();

      // Focus accept button for accessibility
      setTimeout(() => { acceptBtn?.focus?.(); }, 40);
    }

    // If user previously accepted analytics, load Umami now
    if (getAnalyticsConsent() === true) {
      setUmamiDisabled(false);
      loadUmamiIfConfigured();
    } else if (getAnalyticsConsent() === false) {
      // Make sure tracking stays off even if the script is present for any reason
      setUmamiDisabled(true);
    }

    acceptBtn?.addEventListener("click", () => {
      setConsentChoice(true);
      setUmamiDisabled(false);
      loadUmamiIfConfigured();
      closeConsentGate();
      toast({ title: t("consent.savedTitle", "Saved ✓"), message: t("consent.acceptedMsg", t("consent.savedMsg", "")), variant: "success" });
    });

    declineBtn?.addEventListener("click", () => {
      setConsentChoice(false);
      // Ensure Umami is disabled for this browser + website.
      setUmamiDisabled(true);
      removeUmamiScriptIfPresent();
      closeConsentGate();
      toast({ title: t("consent.savedTitle", "Saved ✓"), message: t("consent.declinedMsg", t("consent.savedMsg", "")), variant: "info" });
    });

    // "Read policies" from consent: open legal, then reopen consent when closing legal (until accepted)
    readBtn?.addEventListener("click", (e) => {
      e.preventDefault();
      // close consent first to avoid stacking two overlays
      consent.classList.add("hidden");
      unlockPage();
      openLegal("privacy", { reopenConsentAfter: true });
    });

    // Delegation: open legal from any element with data-open-legal
    document.addEventListener("click", (e) => {
      const btn = e.target?.closest?.("[data-open-legal]");
      if (btn) {
        const tab = btn.getAttribute("data-open-legal") || "privacy";
        // If the consent gate is open, reopen it after closing legal
        const consentOpen = consent && !consent.classList.contains("hidden") && !hasConsent();
        if (consentOpen) {
          consent.classList.add("hidden");
          unlockPage();
          openLegal(tab, { reopenConsentAfter: true });
        } else {
          openLegal(tab);
        }
        e.preventDefault();
        return;
      }

      const manage = e.target?.closest?.("[data-open-consent]");
      if (manage) {
        // Let users review policies and (optionally) re-trigger gate
        openConsentGate(true);
        e.preventDefault();
      }
    });

    // Expose
    window.UI = window.UI || {};
    window.UI.openLegalModal = openLegal;
    window.UI.openConsentGate = openConsentGate;
    window.UI.maybeShowConsent = () => {
      if (hasConsent()) return;
      // small delay so i18n/theme are applied first
      setTimeout(openConsentGate, 180);
    };
    window.UI.__resetConsent = resetConsent; // for debugging
  }

  // WIP Pop-up
  function initWIPModal() {
    const modal = document.getElementById("wip-modal");
    if (!modal) return;

    const WIP_SESSION_KEY = "portfolio_wip_dismissed";

    // Show only if not dismissed in this session
    if (!sessionStorage.getItem(WIP_SESSION_KEY)) {
      setTimeout(() => {
        modal.classList.remove("hidden");
      }, 1200);
    }

    modal.querySelector("#wip-close")?.addEventListener("click", () => {
      modal.classList.add("hiding");
      sessionStorage.setItem(WIP_SESSION_KEY, "true");
      setTimeout(() => {
        modal.classList.add("hidden");
        modal.classList.remove("hiding");
      }, 400);
    });
  }

  window.UI = window.UI || {};
  window.UI.toast = toast;
  window.UI.initProjectModal = initProjectModal;
  window.UI.initLegalModal = initLegalModal;
  window.UI.initWIPModal = initWIPModal;
  window.UI.__lockPage = lockPage;
  window.UI.__unlockPage = unlockPage;

  // Init subtle-but-visible interaction effects
  initRipples();
})();
