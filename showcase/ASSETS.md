# Showcase source and assets

The showcase is a separate client presentation at `/showcase/`. The LMS continues to use the root `dist/index.html` and its own application state.

- `src/Scene.jsx`: original procedural Three.js models for the stylised school bus, student card/reader, tablet, pupil's books and uniform shirt. These are illustrative objects, not manufacturer or official Sussex uniform models.
- Sri Lanka: existing `dist/sri-lanka-land.js` Natural Earth 1:10m coastline, public domain. https://www.naturalearthdata.com/about/terms-of-use/
- School locations: the existing 20-branch `dist/network-data.js` directory and approximate coordinates verified in the LMS project. The showcase does not claim a new directory verification.
- Academic results: existing `dist/network-analytics.js` and `school-sample.js` illustrative models. No real Sussex performance data.
- Logo: the user-provided Sussex College Network logo, reused from the LMS.
- Font: DM Sans from the existing project. Its OFL licence is included in `public/assets/DM-Sans-OFL.txt`.
- `public/assets/screens/`: 38 unaltered PNG screenshots captured from the actual LMS in an isolated local Chrome demo context on 23 November 2026. They cover all 13 roles, parent identity/subjects/homework/notices/reservations, Class Teacher subject selection/notices, separate teaching classes/homework, bus/boarding, NFC/student cards, attendance, leadership and store views. Desktop originals are 1440×960; the parent bus and boarding originals are 390×844. Demo boarding and collection states were prepared using the existing prototype APIs; no production records or user browser state were used. `captures.json` records the base source commit, current prototype source SHA-256, route, dimensions and capture time. Presentation frames are rendered separately; the PNGs retain the original prototype UI and map attribution.
- `public/assets/showcase-walkthrough.mp4`: 39-second silent H264 screen recording at 1440×900, refreshed for Subjects, homework, notices and separate teaching classes. `walkthrough-poster.jpg` is a frame from that recording. This is a meeting backup, not live GPS/NFC footage.
- `licenses/`: licence files and source/licence notices for bundled React, React DOM, React Three Fiber, Three.js and GSAP. Exact dependency versions are pinned in `package-lock.json`.

The build uses relative local asset URLs. `generate-sw.mjs` writes a content-versioned service worker into the built presentation only. It caches the showcase, all screenshots and the video after a successful online load. Prototype links open the LMS on the current host while retaining the repository prefix. They require connectivity; the original private Site also requires its existing access. Re-capture screens when the corresponding LMS views change; do not replace them with fabricated mockups.
