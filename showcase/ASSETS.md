# Connected Transport source and assets

The client presentation is at `/showcase/`; the LMS keeps the root `dist/index.html`, all roles and its own browser state.

- `src/Scene.jsx`: original procedural Three.js country, school bus, bus-mounted GPS device, NFC card and reader. Classroom/tablet/book/uniform scenes have been removed from the transport story. Objects illustrate concepts, not a specified manufacturer’s hardware.
- Sri Lanka coastline: existing `dist/sri-lanka-land.js`, Natural Earth 1:10m, public domain. https://www.naturalearthdata.com/about/terms-of-use/
- Branches: existing 20-school `dist/network-data.js` directory and approximate coordinates; this change performs no new address verification. Transport routes, signal and timings are illustrative.
- Sussex College Network logo: provided by the user, reused from the LMS.
- DM Sans: existing project font; OFL in `public/assets/DM-Sans-OFL.txt`.
- `public/assets/screens/`: **18 actual transport-only PNG captures**. Four captured on 26 November 2026 show real Routes & Stops, Student allocations, Issues & Coordination and a generated Transport coordination brief. Existing management, tracker, privacy, inbox, boarding and Parent images retain their original source dates. JPEG browser captures were converted to PNG without changing content. Commit/hash, dates, dimensions and routes are in `captures.json`. Non-transport presentation captures have been removed; the full LMS remains intact.
- `public/assets/showcase-walkthrough.mp4`: refreshed **45-second silent H264, 1440×900** backup, using eight actual transport presentation frames. 1280×720 browser captures are scaled with preserved proportions and letterboxed. `walkthrough-poster.jpg` is the opening frame. It is a static screenshot walkthrough, not live GPS/NFC footage.
- `src/RoleMindMap.jsx`, `src/mind-map-data.js`, `src/mind-map.css`: unchanged full 12-role system architecture/capability explorer. Semantic HTML/SVG, existing icons/font/logo; no added graph service or raster graph assets. Non-transport capabilities remain only in this full system map and linked LMS, outside the transport narrative.
- `licenses/`: bundled React, React DOM, React Three Fiber, Three.js and GSAP licences/notices. Exact dependencies are pinned in `package-lock.json`; no new dependency added.

The Vite build replaces only `dist/showcase/`. `generate-sw.mjs` versions all local presentation assets and creates the showcase-only offline cache, including screenshots/manifest, poster/video and map code. Workspace links retain the current host and repository prefix; they require connectivity. The original private Site keeps its existing audience.

Presentation examples live in memory and do not read/write LMS data or send notifications. GPS/NFC/device/mobile-data/backend/external delivery integrations remain future implementation and pilot work. Parent default weekday windows are 06:00–08:30 and 13:00–16:00 Asia/Colombo; management visibility remains 24/7 inside assigned scope. Re-capture affected real screens and re-record the video whenever the transport story or portal changes.

Parent map correction (26 November 2026): replaced the malformed 375×211 image with a real 390×844 portrait browser capture, scrolled to show the child/bus details and complete map. The registry supplies actual intrinsic dimensions; validation rejects landscape assets labelled as mobile. Parent boarding remains the original verified portrait capture. The backup video’s Parent journey frame was refreshed.

Parent alerts correction (27 November 2026): replaced a blacked-out Parent inbox source image with an actual 1280×720 desktop capture, Transport filter selected. `parent-inbox-complete.png` avoids cached damaged-image reuse. The PNG quality check decodes the 18 light portal captures and rejects images with more than 25% near-black pixels; the old image failed at about 79%. The backup’s alert frame and offline cache were refreshed. Role scope and the full system map are unchanged.

## Separate common product presentation — 28 November 2026

`build-product.mjs` generates `/product/` from the same presentation source with neutral text/icons. The original architecture catalogue, graph geometry, role features and client-specific build are retained. Bus/card/reader textures are regenerated from neutral strings. No client logo, favicon, screenshots or video are copied into this presentation.

`product-public/assets/screens/` contains 18 actual neutral portal captures, taken through the browser and converted from JPEG to PNG without changing their content. The manifest records actual route, dimensions, capture times, source commit and neutral portal source hash. All existing screenshot quality checks apply. `product-public/assets/showcase-walkthrough.mp4` is a separate 45-second 1440×900 silent H264 recording of the generic chapters; its poster is the opening frame.

The companion `/product/portal/` reuses existing public frontend code, ordinary map/cover/font/vendor assets and licences. It uses a generated code-native school icon, neutral sample school names, no client street-address/source/embed records and separate browser state/session keys. These are illustrative campuses and devices, not claims of actual school customers. The common cache/version namespace is separate from the client presentation. All live-integration limitations remain.
