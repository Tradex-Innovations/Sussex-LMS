# A Connected School Day

Sussex College Network client presentation. Open `/showcase/` on the existing prototype site, or `http://127.0.0.1:4183/showcase/` when running the static server.

## Before the meeting

Open the presentation online once and wait for **Presentation available offline** in the menu. The local assets and backup video are cached in that browser. Opening the actual LMS prototype requires internet and the existing Site access. Prefer a laptop/projector for the cinematic layout; all chapters also support touch and smaller screens.

Choose **Present** for a guided walkthrough. **Explore** additionally supports scrolling over the scene and horizontal swiping to change chapters. Each chapter's mobile content scrolls vertically. The progress bar and chapter menu always allow direct navigation.

Use the fullscreen button or the menu's fullscreen action when supported by the browser. Load the menu's **Watch the backup walkthrough** before the meeting if a video-only fallback is needed. The downloadable H264 video is about 36 seconds, with no audio; it is a short visual summary rather than the full narrated presentation.

## Seven chapters

| Chapter | Suggested discussion | Interaction |
| --- | --- | --- |
| The network | Explain 20 branches and 13 roles. | Pick a school on the Sri Lanka map or school selector. Locations are approximate. |
| The journey | Show school-bus visibility for parents/staff. | Advance the sample Nugegoda Bus 01, then try a delayed signal. |
| The tap | Explain card-linked boarding and exceptions. | Tap/repeat, try offline/reconnect/sync, then show missing-scan review. |
| The classroom | Connect teaching, parent learning and attendance. | Publish notes, download/mark done as Parent, mark class attendance separately. |
| The bigger picture | Discuss network/school oversight. | Compare subjects using the LMS's sample Grade 8 Term 3 assessment model. |
| School essentials | Explain collection-only reservations. | Walk books/uniforms through requested, confirmed, ready and collected. |
| Your next chapter | Explain role scope and proposed pilot. | Four three-step role tours, all 13 role previews, then pilot discussion. |

Allow roughly 8–10 minutes for the guided story plus discussion. Chapter notes suggest individual discussion time and explain prototype limits. The example journey follows Nugegoda Bus 01; selecting another branch on the network map does not imply a verified operating route for that school.

## Controls

- **Next chapter / Previous** and the progress segments navigate the story.
- **Left / Right / Page Up / Page Down** navigate; editable controls and role tabs keep their native keys.
- **Space** pauses/resumes animation when focus is outside an interactive button/link.
- **N** opens presenter notes; **M** opens chapters; **Escape** closes an open dialog.
- Menu: notes, chapter jump, fullscreen, reduce motion, simpler 2D graphics, reset examples and backup video.
- OS reduced-motion preferences are respected. Simpler graphics keeps every product interaction usable without WebGL. GPU-context loss also falls back to that view.

## What the client is seeing

All interactions are presentation examples held in memory. They do not read or write the LMS's browser database. GPS, NFC, academic results, uniform designs, collection and student records are sample demonstrations. A missed tap means review, not automatic student absence. Lesson completion does not create academic marks. Book/uniform flows have no checkout or online payment.

Role links open the existing LMS in a separate tab with its normal demo account/login behavior. Parent demo admission: **SCN-1001**, password **1234**. Suggested pilot stages are a proposal, not a delivery commitment or an installed hardware claim.
