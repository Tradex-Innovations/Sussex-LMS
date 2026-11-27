# School Management Platform — common presentation

Use [the common product presentation](https://tradex-innovations.github.io/Sussex-LMS/product/) for prospective clients. [Open its system map directly](https://tradex-innovations.github.io/Sussex-LMS/product/#mind-map). This is separate from the existing client-specific `/showcase/` route.

The map retains the same 12 roles, reporting/service connections, features, actions, scope limits, layouts and navigation. Only identity wording and the client logo are replaced with neutral school/network text and ordinary school/network icons. Every feature link opens the neutral `/product/portal/` preview, rather than the client-specific portal.

The eight transport chapters retain Present/Explore, Screens/Explore flow, actual-size enlargement, Notes, fullscreen, keyboard/touch controls, reduced motion/2D fallback and a separate 45-second silent 1440×900 backup video. All 18 screenshots were captured from the neutral portal, including portrait Parent map/boarding views. They are actual UI captures, not retouched client images. School/campus/student/bus data and locations are illustrative. The prototype still requires production GPS/NFC, backend, gateway and external delivery integrations.

The neutral portal uses `school-product-demo-v1` for local records and `school-product-parent-demo-session` for its Parent session. The original portal is separate. Try FAMILY-1001 / 1234; the linked children use NET-1001 and NET-1002. Temporary credentials and simulation labels remain in the interactive portal, not in the planned-system mind map. Payment fixtures remain simulations and school supplies remain reserve-and-collect.

Load the presentation once online and wait for offline readiness in its menu before presenting without connectivity. The common worker caches only `/product/` application/media/preview files, with its own cache/release namespace. Root and `/showcase/` caches/storage are preserved; offline availability does not provide live external feeds.

Build both presentations with `npm run build --prefix showcase`, or only this one with `npm run build:product --prefix showcase`. `build-product.mjs` generates an ignored staging copy of the shared source and writes only `dist/product/`. The original role map source/catalogue is the single reference. Future role changes must update `ROLE_FEATURES_ACCESS.md` and both sets of relevant captures/media. Capture provenance is in `product-public/assets/screens/captures.json`.
