/* Time + greeting (top-left)
   - Updates every 15s (clock changes each minute)
   - Greetings are translated via I18N JSON keys
   - Keeps the widget from overlapping the fixed header on narrow widths
*/
(function () {
  function pad2(n){ return String(n).padStart(2, "0"); }

  function getGreetingKey(h, m){
    const t = h * 60 + m;

    // 00:00–05:59
    if (t <= 359) return "greetings.night";
    // 06:00–11:45
    if (t >= 360 && t <= (11*60 + 45)) return "greetings.morning";
    // 11:46–12:30
    if (t >= (11*60 + 46) && t <= (12*60 + 30)) return "greetings.lunch";
    // 12:31–17:59
    if (t >= (12*60 + 31) && t <= (17*60 + 59)) return "greetings.afternoon";
    // 18:00–21:59
    if (t >= (18*60) && t <= (21*60 + 59)) return "greetings.evening";
    // 22:00–23:59
    return "greetings.night";
  }

  function setGreetingText(key){
    const textEls = document.querySelectorAll("[data-time-greeting-text]");
    if (!textEls.length) return;

    textEls.forEach((el) => {
      const fallback = el.getAttribute("data-fallback") || el.textContent || "";
      if (!el.getAttribute("data-fallback")) el.setAttribute("data-fallback", fallback);

      // Keep the key on the element so your i18n system can still "see" it if needed
      el.setAttribute("data-i18n", key);

      const translated = (window.I18N && typeof window.I18N.t === "function")
        ? window.I18N.t(key, fallback)
        : fallback;

      el.textContent = translated;
    });
  }

  function updateClock(){
    const clockEls = document.querySelectorAll("[data-time-greeting-clock]");
    if (!clockEls.length) return;

    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes();

    clockEls.forEach(el => { el.textContent = `${pad2(hh)}:${pad2(mm)}`; });

    const key = getGreetingKey(hh, mm);
    setGreetingText(key);
  }

  function updateOffset(){
    // Default (desktop): 16px from top
    const root = document.documentElement;
    const headerCard = document.querySelector("header .card");
    if (!headerCard) {
      root.style.setProperty("--tg-top", "16px");
      return;
    }

    // When the viewport gets narrow, push the widget below the header card
    // so it never overlaps the logo/menu area.
    const isNarrow = window.innerWidth <= 1200;
    if (!isNarrow) {
      root.style.setProperty("--tg-top", "16px");
      return;
    }

    const rect = headerCard.getBoundingClientRect();
    const offset = Math.ceil(rect.bottom + 12); // small breathing room
    root.style.setProperty("--tg-top", `${offset}px`);
  }

  function init(){
    updateOffset();
    updateClock();

    // Update periodically (cheap)
    setInterval(updateClock, 15000);

    // Re-translate on language change (if user switches language)
    window.addEventListener("portfolio-langchange", updateClock);

    // Keep offset correct on resize / rotate
    window.addEventListener("resize", updateOffset, { passive: true });
    window.addEventListener("orientationchange", updateOffset, { passive: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
