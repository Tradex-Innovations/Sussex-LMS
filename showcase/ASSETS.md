# Showcase source and assets

The showcase is a separate client presentation at `/showcase/`. The LMS continues to use the root `dist/index.html` and its own application state.

- `src/Scene.jsx`: original procedural Three.js models for the stylised school bus, student card/reader, tablet, pupil's books and uniform shirt. These are illustrative objects, not manufacturer or official Sussex uniform models.
- Sri Lanka: existing `dist/sri-lanka-land.js` Natural Earth 1:10m coastline, public domain. https://www.naturalearthdata.com/about/terms-of-use/
- School locations: the existing 20-branch `dist/network-data.js` directory and approximate coordinates verified in the LMS project. The showcase does not claim a new directory verification.
- Academic results: existing `dist/network-analytics.js` and `school-sample.js` illustrative models. No real Sussex performance data.
- Logo: the user-provided Sussex College Network logo, reused from the LMS.
- Font: DM Sans from the existing project. Its OFL licence is included in `public/assets/DM-Sans-OFL.txt`.
- `public/assets/showcase-walkthrough.mp4`: approximately 36-second silent screen recording of this seven-chapter presentation and its simulated interactions. `walkthrough-poster.jpg` is a frame from that recording. This is a meeting backup, not live GPS/NFC footage.
- `licenses/`: licence files and source/licence notices for bundled React, React DOM, React Three Fiber, Three.js and GSAP. Exact dependency versions are pinned in `package-lock.json`.

The build uses relative local asset URLs. `generate-sw.mjs` writes a content-versioned service worker into the built presentation only. It caches the showcase after a successful online load. Prototype links open the existing hosted LMS and still require access and internet.
