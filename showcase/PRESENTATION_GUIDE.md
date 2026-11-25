# A Connected School Day

Sussex College Network client presentation. Open `/showcase/` on the existing prototype site, or `http://127.0.0.1:4183/showcase/` when running the static server.

The prepared GitHub Pages layout adds the repository prefix: `/Sussex-LMS/showcase/` for this presentation and `/Sussex-LMS/` for the prototype. **Open prototype** stays on the current host. The user approved the repository becoming public to enable Pages; use the hosted Pages link after a successful deployment, or the original private Site/localhost. A new host has its own browser-local demo state and offline cache.

## Before the meeting

Open the presentation online once and wait for **Presentation available offline** in the menu. The local assets and backup video are cached in that browser. Opening the actual LMS prototype requires internet and the existing Site access. Prefer a laptop/projector for the cinematic layout; all chapters also support touch and smaller screens.

Choose **Present** for a guided walkthrough. **Explore** additionally supports scrolling over the scene and horizontal swiping to change chapters. Each chapter's mobile content scrolls vertically. The progress bar and chapter menu always allow direct navigation.

Chapters open in **Screens** view with actual prototype captures. Use the screen tabs (or **Prototype view** in The classroom) to show related views; select the image to enlarge it. **Actual size** allows scrolling across the original pixels; **Fit to view** restores the full frame. **Open prototype** opens that captured view's real LMS route. Choose **Try demo** for the presentation's interactive examples. Headlines and functional controls remain visible; supporting narration and limits are in **Notes** instead of small on-screen annotations.

Use the fullscreen button or the menu's fullscreen action when supported by the browser. Load the menu's **Watch the backup walkthrough** before the meeting if a video-only fallback is needed. The downloadable H264 video is 39 seconds at 1440×900, with no audio; it is a short visual summary rather than the full narrated presentation.

## Seven chapters

| Chapter | Suggested discussion | Interaction |
| --- | --- | --- |
| The network | Explain 20 branches and 13 roles. | Show the actual Chairman map. In Try demo, pick a school on the 3D map or selector. |
| The journey | Show school-bus visibility for parents/staff. | Show Parent and Driver screens. In Try demo, advance Bus 01 and try a delayed signal. |
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

The 38 screenshots are unaltered captures of actual prototype views in an isolated demo browser. They are static images, not live data. Try demo interactions are presentation examples held in memory; they do not read or write the LMS's browser database. GPS, NFC, academic results, uniform designs, collection and student records are sample demonstrations. A missed tap means review, not automatic student absence. Lesson completion does not create academic marks. Book/uniform flows have no checkout or online payment.

Role links open the existing LMS in a separate tab with its normal demo account/login behavior. Parent demo admission: **SCN-1001**, password **1234**. Suggested pilot stages are a proposal, not a delivery commitment or an installed hardware claim.
