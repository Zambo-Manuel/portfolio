# Elite Static Portfolio (HTML + Tailwind + GSAP + Three.js + Lenis)

Zero backend. Drop-in ready for static hosting (Vercel, Netlify, GitHub Pages).

## Quick start
- **Fastest:** open `index.html` in the browser (internet connection recommended to load CDN libs).
- **Best dev experience:** run a tiny local server:
  - Python: `python -m http.server 8080`
  - Node: `npx serve`

Then open http://localhost:8080

## Customize
Edit:
- `js/content.js` (name, tagline, projects, links)
- `index.html` (SEO meta + sections copy)

## Tech
- Tailwind (Play CDN)
- GSAP + ScrollTrigger
- Lenis smooth scrolling
- Three.js WebGL hero background

---

## CV PDF (auto-updated)
This project can **generate the CV PDF automatically at deploy/build time** (no backend), starting from `cv.html` which is hydrated by `js/content.js`.

### Output
- `assets/cv/Manuel_Zambelli_CV.pdf` (default IT)
- `assets/cv/Manuel_Zambelli_CV_IT.pdf`
- `assets/cv/Manuel_Zambelli_CV_EN.pdf`

On `cv.html` there is also a **“PDF (auto)”** button that downloads the latest generated file.

### Local generation (optional)
```bash
npm install
npm run build:pdf
```

### Netlify
`netlify.toml` is already included and will run:
```bash
npm install && npm run build:pdf
```
Then it publishes the static folder.

> NOTE: The generated PDFs will always reflect what you have in `js/content.js` (projects, description, etc.).

---

## Legacy (optional): Python PDF generator
There is also an older generator based on `tools/cv_data.json`:
1. `pip install reportlab`
2. `python3 tools/generate_cv.py` (or `--lang en`)
