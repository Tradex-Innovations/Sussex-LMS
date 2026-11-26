# Showcase source and assets

The showcase is a separate client presentation at `/showcase/`. The LMS continues to use the root `dist/index.html` and its own application state.

- `src/Scene.jsx`: original procedural Three.js models for the stylised school bus, student card/reader, tablet, pupil's books and uniform shirt. These are illustrative objects, not manufacturer or official Sussex uniform models.
- Sri Lanka: existing `dist/sri-lanka-land.js` Natural Earth 1:10m coastline, public domain. https://www.naturalearthdata.com/about/terms-of-use/
- School locations: the existing 20-branch `dist/network-data.js` directory and approximate coordinates verified in the LMS project. The showcase does not claim a new directory verification.
- Academic results: existing `dist/network-analytics.js` and `school-sample.js` illustrative models. No real Sussex performance data.
- Logo: the user-provided Sussex College Network logo, reused from the LMS.
- Font: DM Sans from the existing project. Its OFL licence is included in `public/assets/DM-Sans-OFL.txt`.
- `public/assets/screens/`: 51 actual prototype PNG captures. The family update refreshed 38 files on 26 November 2026 (13 new views and 25 affected existing views). Remaining original store/boarding/class examples retain their 23 November capture dates. All 13 roles remain covered. Refreshed captures use the in-app demo browser and JPEG-to-PNG conversion; exact original dimensions and dates are in `captures.json`. The current source hash records the working tree; no production data or devices were used.
- `public/assets/showcase-walkthrough.mp4`: 45-second silent H264 screenshot walkthrough at 1440×900, refreshed for all eight story chapters including family consent/fees. `walkthrough-poster.jpg` is its opening frame. This is a meeting backup made from actual presentation screenshots, not live GPS/NFC footage.
- `licenses/`: licence files and source/licence notices for bundled React, React DOM, React Three Fiber, Three.js and GSAP. Exact dependency versions are pinned in `package-lock.json`.

The build uses relative local asset URLs. `generate-sw.mjs` writes a content-versioned service worker into the built presentation only. It caches the showcase, all screenshots and the video after a successful online load. Prototype links open the LMS on the current host while retaining the repository prefix. They require connectivity; the original private Site also requires its existing access. Re-capture screens when the corresponding LMS views change; do not replace them with fabricated mockups.

## 26 November 2026 family update

The family chapter covers one guardian login/all linked children, transport inbox alerts, trip consent, teacher letters/email and school fee demo payment. Use FAMILY-1001 / 1234. Parents cannot override GPS hours. Transport Coordinator → Tracking hours & alerts has the presenter clock (07:15 visible / 18:00 hidden), school time windows and trip completion. School Administrator owns invoices, unpaid students and fee reminders; Principal/Chairman read scoped fee oversight. Book/uniform reservations remain collection-only without payment. No real email, consent signature verification or payment integration is connected.

51 actual prototype screenshots include 13 new family/communication/fee/privacy views. Affected existing captures were refreshed on 26 November via the in-app browser; unchanged store/boarding examples retain original capture dates. Browser screenshots were converted from JPEG to PNG without layout/content changes. Desktop refreshes use a requested 1440×900 viewport and parent bus/boarding use 390×844; the browser returns slightly smaller JPEG images. Exact file dimensions are recorded in the manifest. `captures.json` records per-file dimensions, capture dates and source provenance. The source hash covers the working tree used for captures.

## System mind map assets

The drill-through role architecture and capability graphs use code-native SVG connectors and semantic HTML buttons from `src/RoleMindMap.jsx`, the scoped catalogue in `src/mind-map-data.js` and existing project icons/font/logo. No external graph service, new third-party dependency or raster/AI mind-map image is used. The generated showcase service worker caches the new bundle along with existing assets. The 51 prototype screenshots and eight-chapter backup video remain separate historical demonstration assets.
