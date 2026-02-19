/* Motion + reveal system (no GSAP).
   - Supports elements marked with [data-reveal]
   - Exposes window.Animations.refresh() and window.Animations.stagger()
*/
(function () {
  const observed = new WeakSet();
  let io = null;

  function reducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function ensureObserver() {
    if (io || reducedMotion()) return;
    io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            io.unobserve(e.target);
          }
        });
      },
      { root: null, threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
  }

  function refresh(root = document) {
    const items = Array.from(root.querySelectorAll("[data-reveal]"));
    if (!items.length) return;

    // Fallback for older browsers: if IntersectionObserver isn't available,
    // just show everything immediately.
    if (typeof IntersectionObserver === "undefined") {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }

    if (reducedMotion()) {
      items.forEach((el) => el.classList.add("in-view"));
      return;
    }

    ensureObserver();
    items.forEach((el) => {
      if (observed.has(el)) return;
      observed.add(el);
      io.observe(el);
    });
  }

  // Adds [data-reveal] + transition delays to a list of elements, then refreshes observer.
  function stagger(container, selector, opts = {}) {
    const { step = 70, start = 0, max = 420 } = opts || {};
    if (!container) return;

    const items = Array.from(container.querySelectorAll(selector));
    items.forEach((el, idx) => {
      el.setAttribute("data-reveal", "");
      const delay = Math.min(start + idx * step, max);
      el.style.transitionDelay = `${delay}ms`;
    });

    refresh(container);
  }

  // Hero headline micro-animation (type-in feel) – wraps only between words (important on mobile)
  function headlinePop() {
    const h = document.querySelector("[data-content='headline']");
    if (!h) return;
    if (reducedMotion()) return;

    // Guard: avoid hiding the headline on browsers that don't fully support
    // the Web Animations API.
    const canAnimate = !!(Element.prototype && Element.prototype.animate);
    if (!canAnimate) return;

    const text = (h.textContent || "").trim();
    if (!text) return;

    // Fail-safe: if anything goes wrong, keep the plain text visible.
    try {
      h.textContent = "";

      const frag = document.createDocumentFragment();
      const words = text.split(/\s+/);

      const letterSpans = [];
      words.forEach((word, wIndex) => {
        const wordWrap = document.createElement("span");
        wordWrap.className = "headline-word";
        wordWrap.style.display = "inline-block";
        wordWrap.style.whiteSpace = "nowrap";

        [...word].forEach((ch) => {
          const s = document.createElement("span");
          s.textContent = ch;
          s.style.display = "inline-block";
          // Default visible (fail-safe)
          s.style.opacity = "1";
          s.style.transform = "translateY(0px) rotate(0deg)";
          wordWrap.appendChild(s);
          letterSpans.push(s);
        });

        frag.appendChild(wordWrap);
        if (wIndex < words.length - 1) frag.appendChild(document.createTextNode(" "));
      });

      h.appendChild(frag);

      // Animate (now safe because canAnimate is true)
      letterSpans.forEach((s, i) => {
        // Set initial state only when animating
        s.style.opacity = "0";
        s.style.transform = "translateY(10px) rotate(-1deg)";
        s.animate(
          [
            { opacity: 0, transform: "translateY(10px) rotate(-1deg)" },
            { opacity: 1, transform: "translateY(0px) rotate(0deg)" }
          ],
          { duration: 520, delay: i * 18, easing: "cubic-bezier(.2,.8,.2,1)", fill: "forwards" }
        );
      });
    } catch (e) {
      // restore plain headline
      h.textContent = text;
    }
  }

  // expose for app.js (dynamic content injected after DOMContentLoaded)
  window.Animations = { refresh, stagger };

  document.addEventListener("DOMContentLoaded", () => {
    refresh(document);
    // run after hydrate
    setTimeout(headlinePop, 80);
  });
})();
