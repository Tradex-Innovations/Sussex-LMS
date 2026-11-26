# A Connected School Day

Sussex College Network client presentation. Open `/showcase/` on the existing prototype site, or `http://127.0.0.1:4183/showcase/` when running the static server.

The published [GitHub Pages presentation](https://tradex-innovations.github.io/Sussex-LMS/showcase/) uses the repository prefix: `/Sussex-LMS/showcase/` for this presentation and `/Sussex-LMS/` for the prototype. **Open prototype** stays on the current host. The user approved the repository becoming public to enable Pages; the Pages deployment and live route checks passed on 25 November 2026. The original private Site and localhost remain available. A new host has its own browser-local demo state and offline cache.

## Before the meeting

Open the presentation online once and wait for **Presentation available offline** in the menu. The local assets and backup video are cached in that browser. Opening the actual LMS prototype requires internet and the existing Site access. Prefer a laptop/projector for the cinematic layout; all chapters also support touch and smaller screens.

Choose **Present** for a guided walkthrough. **Explore** additionally supports scrolling over the scene and horizontal swiping to change chapters. Each chapter's mobile content scrolls vertically. The progress bar and chapter menu always allow direct navigation.

Chapters open in **Screens** view with actual prototype captures. Use the screen tabs (or **Prototype view** in The classroom) to show related views; select the image to enlarge it. **Actual size** allows scrolling across the original pixels; **Fit to view** restores the full frame. **Open prototype** opens that captured view's real LMS route. Choose **Try demo** for the presentation's interactive examples. Headlines and functional controls remain visible; supporting narration and limits are in **Notes** instead of small on-screen annotations.

Use the fullscreen button or the menu's fullscreen action when supported by the browser. Load the menu's **Watch the backup walkthrough** before the meeting if a video-only fallback is needed. The downloadable H264 video is 45 seconds at 1440×900, with no audio; it is a short visual summary rather than the full narrated presentation.

## Eight chapters

| Chapter | Suggested discussion | Interaction |
| --- | --- | --- |
| The network | Explain 20 branches and 12 roles. | Show the actual Chairman map. In Try demo, pick a school on the 3D map or selector. |
| The journey | Show school-bus visibility for parents/staff. | Show Parent and GPS tracker screens. In Try demo, advance Bus 01 and try a delayed signal. |
| The tap | Explain card-linked boarding and exceptions. | Show the boarding roster, Parent status and student cards. In Try demo, tap/repeat, reconnect/sync and review a missing scan. |
| The classroom | Connect class teaching with each family. | Show Parent identity/subjects, per-student selections, separate teaching classes, homework, class notices, lecture notes and attendance using Prototype view. In Try demo, publish for Science 8A/8B, select the pupil’s subject, share a common notice and mark homework/notes/attendance separately. |
| The bigger picture | Discuss network/school oversight. | Show Academic, Attendance, Staffing and Reports screens. In Try demo, compare illustrative subjects. |
| School essentials | Explain collection-only reservations. | Show Parent books/uniforms, both store queues and collection. In Try demo, progress a reservation. |
| Your next chapter | Explain role scope and proposed pilot. | Show four three-screen role tours or All roles, then discuss Pilot plan. |

Allow roughly 8–10 minutes for the guided story plus discussion. Chapter notes suggest individual discussion time and explain prototype limits. The example journey follows Nugegoda Bus 01; selecting another branch on the network map does not imply a verified operating route for that school.

## Controls

- **Next chapter / Previous** and the progress segments navigate the story.
- **Left / Right / Page Up / Page Down** navigate; editable controls and role tabs keep their native keys.
- **Space** pauses/resumes animation when focus is outside an interactive button/link.
- **N** opens presenter notes; **M** opens chapters; **Escape** closes an open dialog.
- Menu: notes, chapter jump, fullscreen, reduce motion, simpler 2D graphics, reset examples and backup video.
- OS reduced-motion preferences are respected. Simpler graphics keeps every product interaction usable without WebGL. GPU-context loss also falls back to that view.

## What the client is seeing

The 50 screenshots are unaltered captures of actual prototype views in an isolated demo browser. They are static images, not live data. Try demo interactions are presentation examples held in memory; they do not read or write the LMS's browser database. GPS, NFC, academic results, uniform designs, collection and student records are sample demonstrations. A missed tap means review, not automatic student absence. Lesson completion does not create academic marks. Book/uniform flows have no checkout or online payment.

Role links open the existing LMS in a separate tab with its normal demo account/login behavior. Parent demo admission: **SCN-1001**, password **1234**. Suggested pilot stages are a proposal, not a delivery commitment or an installed hardware claim.

## 26 November 2026 family update

The family chapter covers one guardian login/all linked children, transport inbox alerts, trip consent, teacher letters/email and school fee demo payment. Use FAMILY-1001 / 1234. Parents cannot override GPS hours. Transport Coordinator → Tracking hours & alerts has the presenter clock (07:15 Parent-visible / 18:00 Parent-hidden; management stays visible), school time windows and trip completion. School Administrator owns invoices, unpaid students and fee reminders; Principal/Chairman read scoped fee oversight. Book/uniform reservations remain collection-only without payment. No real email, consent signature verification or payment integration is connected.

50 actual prototype screenshots cover the 12 current roles. The GPS update refreshes affected management, fleet, tracker, privacy, boarding and Parent views using the in-app browser. Desktop GPS captures use the default browser viewport; Parent transport captures use a 390×844 mobile viewport. JPEG captures are converted to PNG without content changes. Exact image dimensions, source dates and source hashes are recorded in `captures.json`. Other unchanged screens retain their original capture dates.

## Interactive system role mind map

Open **System map** in the header, the final chapter’s **Explore the role mind map**, or Presentation menu → **Explore the system role mind map**. The full architecture is `/showcase/#mind-map`.

1. Start with Chairman → Principal → Vice Principal, then follow academic and operational roles. Parents sit separately through linked children. Solid lines show the recommended staff reporting structure; dashed lines illustrate family services. Neither line grants inherited permissions.
2. Click any role to open its capability map. Click a feature branch to explain **Can view / Can do**, constraints and the matching prototype workspace links. The role’s central card explains its exact scope and collaborating roles.
3. Use Full architecture or breadcrumbs to return. Find a role jumps directly between all twelve roles. Browser Back/Forward and copied role/feature URLs work; refreshing a direct link retains the selected content.
4. Drag/pinch or scroll to explore; use +/− and Fit. Focus the map for arrow-key panning and Home/0 to fit. On a phone or with a keyboard, choose Outline for a hierarchy/feature list. Feature details scroll independently.
5. **← Presentation** returns to the active chapter from the same visit. Starting directly at a mind-map URL returns to the network chapter. The eight narrative chapters and their backup video are separate from this additional interactive explorer.

Examples: `#mind-map/parent`, `#mind-map/class_teacher/attendance`, `#mind-map/admin/fees`, `#mind-map/transport/privacy`. All scope descriptions reflect the browser prototype. No real GPS, payment, email, authorization or data mutation is introduced by the map.

GPS update (26 November 2026): Driver is retired. Bus-mounted GPS is the 24/7 source; management sees in-scope buses continuously, Parents only inside coordinator-set windows. The mind map shows GPS as hardware, not an account role. Device signals and locations remain simulated.

Card payment update (26 November 2026): the fee checkout offers Debit/Credit card with Visa/Mastercard badges, fixture card details, demo verification code 123456, processing and a receipt. Bank transfers and receipt uploads are absent. Fees are simulated; book/uniform collection remains payment-free.

System mind map language (26 November 2026): explain this view as the planned product. Role scopes, capabilities and access notes use product language, without demo/prototype labels, sample credentials or simulation instructions. The linked prototype and technical readiness reference remain separate; this wording does not claim that production integrations are already connected.
