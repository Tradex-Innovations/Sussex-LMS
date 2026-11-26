# Sussex College Network

A browser-only school portal prototype for a client walkthrough. Official Sussex school names and approximate locations are paired with sample academic, attendance, staffing, fleet, subject and school-reservation data. Bus positions and trip statuses are simulated. Demo changes are saved in the current browser.

## Run locally

From this directory, run:

```sh
python3 -m http.server 4183 --bind 127.0.0.1 --directory dist
```

Open [the local demo](http://127.0.0.1:4183/). No install or build is required.

## GitHub Pages hosting

The prototype and presentation share one deployment, with separate routes:

- [Prototype](https://tradex-innovations.github.io/Sussex-LMS/)
- [Presentation](https://tradex-innovations.github.io/Sussex-LMS/showcase/)

The prepared workflow in [.github/workflows/pages.yml](.github/workflows/pages.yml) tests the prototype, builds the presentation and publishes only `dist/`. It runs on pushes to `main` and can also be started manually from Actions. Enable **Settings → Pages → Build and deployment → Source → GitHub Actions** first. The user approved making `Tradex-Innovations/Sussex-LMS` public on 25 November 2026 so it can use GitHub Pages. The first deployment succeeded on 25 November 2026 ([Actions run](https://github.com/Tradex-Innovations/Sussex-LMS/actions/runs/45555471117)); both URLs were checked live. The repository’s source and commit history are public.

All presentation **Open prototype** links retain the current host and repository prefix. The same build therefore works on localhost, the original hosted Site and GitHub Pages. Role pages continue to use hash routes, so they do not require server rewrites.

GitHub Pages serves the demonstration’s frontend. Browser-local records and demo login remain unchanged; there is no server authentication or live GPS/NFC integration. A different host uses separate browser storage. The existing private Site identity and access settings are retained.

## Features and access reference

[ROLE_FEATURES_ACCESS.md](ROLE_FEATURES_ACCESS.md) documents all 12 roles, their implemented views, read/write scope, approvals, cross-role workflows, demo accounts and prototype limits. Project instructions in [AGENTS.md](AGENTS.md) require this reference to be updated alongside future feature and permission changes. New user feature ideas are also recorded as proposed requirements before implementation. The [NFC boarding prototype](ROLE_FEATURES_ACCESS.md#nfc-boarding-prototype) demonstrates cards, reader taps and boarding registers; physical NFC hardware and external notifications remain future integration work; in-portal alerts are implemented.

## Interactive client presentation

Open [the GitHub Pages presentation](https://tradex-innovations.github.io/Sussex-LMS/showcase/), [the original private presentation](https://campusway-school-demo.manusara.chatgpt.site/showcase/) or the [local showcase](http://127.0.0.1:4183/showcase/). The same `/showcase/` route is included in the prepared GitHub Pages deployment. This separate eight-chapter presentation combines cinematic 3D scenes with **50 actual prototype screenshots**, four guided role tours and links to all 12 LMS roles. Chapters open in **Screens** view; click a screenshot to enlarge it, then choose **Actual size** to inspect the original. **Try demo** opens the interactive sample workflow. It does not change LMS records.

The presentation also includes a [drill-through system mind map](https://tradex-innovations.github.io/Sussex-LMS/showcase/#mind-map). Choose **System map** in the header (or the final role chapter) to see the 13-role architecture, then select a role → capability branch for **Can view / Can do**, scope limits and links to the actual prototype workspace. Try [Parent](https://tradex-innovations.github.io/Sussex-LMS/showcase/#mind-map/parent), [Class Teacher](https://tradex-innovations.github.io/Sussex-LMS/showcase/#mind-map/class_teacher) or [Transport privacy](https://tradex-innovations.github.io/Sussex-LMS/showcase/#mind-map/transport/privacy). Pan/zoom and Fit explore the canvas; Outline offers a mobile/keyboard alternative. Reporting lines explain responsibilities and do not grant permissions. This separate presenter view does not change LMS records. See [the maintained access contract](ROLE_FEATURES_ACCESS.md#interactive-system-role-mind-map).

Use **Present** for the guided story or **Explore** for client browsing. The presentation keeps large headlines and functional controls; supporting explanations and prototype limits are in presenter notes. Left/right keys move chapters, **N** opens notes and **M** opens the chapter menu. The menu includes reduced motion, simpler graphics, reset, fullscreen and a short backup video. Load once online until **Presentation available offline** appears before using it without a connection; screenshots and video are included. Prototype links need connectivity; the original private Site also requires its existing access.

The built presentation is included in `dist/showcase/`, so the same static server runs both experiences. To develop/rebuild only the presentation:

```sh
cd showcase
npm ci
npm run build
```

The build writes only `dist/showcase/`. Read [the meeting guide](showcase/PRESENTATION_GUIDE.md), [asset provenance](showcase/ASSETS.md) and [presentation access/limits](ROLE_FEATURES_ACCESS.md#interactive-client-presentation). GPS, NFC, results and collection examples remain simulated; school fees include a simulated online checkout; no real money is collected. Book/uniform reservations have no payment.

## Subjects, homework and class notices

- **Class Teacher → Subjects:** select **Assign subjects** beside a student. Only the selected subjects appear to that student’s parent; teaching appointments stay with school administration.
- **Parent:** the admission login displays Parent, Student, Admission number, Class/Grade and School. **Subjects**, **Homework** and **Notices** are separate mobile-friendly workspaces.
- **Class Teacher → Notices:** publish a common notice for every parent in the appointed class. Parents can mark it read; edits become unread, and withdrawn notices disappear from parents. Notices stay inside this demo portal.
- **Class Teacher / Subject Teacher → Homework:** choose a subject/class, enter instructions and a due date, then publish. Parents download and mark homework done separately from lecture notes or attendance.
- **Subject Teacher → Subjects:** classes are grouped by subject with separate **Open class** and **Give homework** controls. Preview Nuwan Gamage to compare Science 8A and 8B; their pupils, materials and homework stay separate.
- Existing demo enrolments are retained as imported selections by a one-time migration. Newly registered/admin-enrolled pupils need the Class Teacher’s subject selection before parents gain subject access. Class changes clear those selections. Old `/courses` links remain compatible with `/subjects`.

The presentation’s **The classroom → Prototype view** selector shows these actual screens. **Try demo** demonstrates class separation, subject visibility, homework, notices and attendance. See [the complete access reference](ROLE_FEATURES_ACCESS.md#student-subjects-homework-and-class-notices).

## Parent demo login

Open [Parent login](http://127.0.0.1:4183/#parent/login). Use `FAMILY-1001` / `1234` for Nadeesha’s Amaya + Kavin account or `FAMILY-1002` / `1234` for Tharushi’s Meera + Thevin account. Admission numbers below remain login aliases. All linked children appear under one family login.

| Student | Admission number |
| --- | --- |
| Amaya Perera | SCN-1001 |
| Kavin Perera | SCN-1002 |
| Meera Fernando | SCN-1008 |
| Thevin Fernando | SCN-1009 |

The account cards fill in demo credentials. Sign in to the Family dashboard and use the child switcher for each child’s bus, subjects, boarding and supplies. Inbox, events/consent and fees show all linked children. The session survives a tab refresh. Student admission numbers appear in the staff directory and can be edited by authorized branch staff.

## Family, communications and fee walkthrough

- [Family dashboard](http://127.0.0.1:4183/#parent/family): one family login, child cards and to-do list. Mobile uses Family / Buses / Inbox / Fees / More.
- [Transport alerts and tracking hours](http://127.0.0.1:4183/#transport/tracking): send a late/breakdown/other update to allocated families and Class Teachers. Change demo time from 07:15 to 18:00 to show Parent GPS hidden while management stays visible, or complete a current Parent trip. Defaults: weekdays 06:00–08:30 and 13:00–16:00, Asia/Colombo; presenter defaults are illustrative.
- [Teacher letters/email](http://127.0.0.1:4183/#class_teacher/communications) and [events/consent](http://127.0.0.1:4183/#class_teacher/events): preview whole-class or selected-student recipients, publish portal copies, download printable letters, review responses and remind pending guardians. Subject Teachers have equivalent pages separated by assigned teaching class.
- [Parent inbox](http://127.0.0.1:4183/#parent/inbox), [events](http://127.0.0.1:4183/#parent/events) and [fees](http://127.0.0.1:4183/#parent/fees): read transport updates, respond per child and try fee Review → Method → Confirm → Success/decline, then download a demo receipt.
- [School Administrator fees](http://127.0.0.1:4183/#admin/fees): issue invoices, record partial office payments, inspect one-row-per-unpaid-student register, preview reminders and export CSV. Principal/Chairman have scoped read-only fee oversight.

All notifications, consent and payments persist only in the same browser. No real email, payment gateway or money transfer is connected. Pupil’s books/uniforms remain reserve-and-collect without payment. See [the full workflow and access contract](ROLE_FEATURES_ACCESS.md#family-communication-and-school-fee-workflows).

## Walkthrough

### Chairman workspace

The Chairman's Overview has five views. Transport Activity opens first with the full map; each view also has a direct link:

- [Transport Activity](http://127.0.0.1:4183/#chairman/overview/transport): all 20 branches and 44 simulated buses, status filters, branch and vehicle drill-downs, next stops, route progress and pause/resume.
- [Academic Performance](http://127.0.0.1:4183/#chairman/overview/academic): subject, grade and term filters; weighted averages and pass rates; branch rankings; changes against the previous term; distribution and trend charts; branch results and CSV export.
- [Attendance](http://127.0.0.1:4183/#chairman/overview/attendance): student or staff registers, grade and reporting-date filters, one/five/twenty-school-day periods, weighted branch comparisons, trends, repeated absence watchlists, searchable student records and a personal 20-day calendar. Late arrivals are included in present totals; period totals count attendance-days.
- [Staffing Overview](http://127.0.0.1:4183/#chairman/overview/staffing): branch headcounts, teaching capacity, coverage and vacancies; available/absent/on-leave filters; searchable and paginated staff profiles; leadership drill-downs; persistent vacancy review and links to branch appointments. Existing prototype accounts appear once per school alongside labelled illustrative staff. Assigned subjects come from actual prototype subject assignments.
- [Executive Reports](http://127.0.0.1:4183/#chairman/overview/reports): executive brief or individual transport/academic/attendance/staffing reports; selectable branch scope and relevant filters; generated previews; CSV and standalone HTML downloads with embedded logo; browser Print / Save PDF; latest eight saved report snapshots. Editing filters does not alter an already captured report.

The shared School branch filter controls scope throughout the Chairman views. All data and actions remain a browser-only demonstration. Sample registers use 20 November 2026 by default and support dates from 12 October through 20 November. Academic cohorts are capped by the same illustrative grade enrolment used by attendance and staffing.

### Principal workspace

The Principal role now opens [its assigned-school overview](http://127.0.0.1:4183/#principal/overview/transport), with the same five main tabs and a daily school pulse. Use **Demo Principal** to preview Malini Senanayake at Nugegoda or Suresh Jayawardena at Malabe. Changing the demo account changes the assigned school and resets the view filters; the Principal does not have a branch selector.

- **Transport Activity** opens centred on the assigned school's routes. Principals can filter their own fleet, inspect buses, manage existing bus/GPS tracker/student assignments and view GPS 24/7. Resetting the map returns to the school routes.
- **Academic Performance** compares classes, subjects, grades and teachers within the school. Class cohorts reconcile with grade totals. Prototype teacher assignments and published materials appear for matching subject records. Principals can open lecture materials, assign subjects and export the selected comparison.
- **Attendance** includes school and class registers, student calendars, grade/class/date/period filters, staff attendance and repeated absence views.
- **Staffing Overview** includes leadership, staff capacity, directory filters, profiles, vacancies and sample leave requests. Leave approval/decline is saved in the browser and updates the school pulse, staff availability, attendance and newly generated reports. Appointment management uses the existing branch-scoped role forms; Principal and Chairman appointments remain excluded from the Principal's assignable roles.
- **Executive Reports** generates one-school briefs and transport/academic/attendance/staffing exports. CSV, standalone HTML with embedded logo, and Print / Save PDF are available. Principal report history is separated by school and from Chairman report history; each workspace retains its latest eight snapshots.

All Principal records, actions and exports use the assigned Principal grant's school. GPS, attendance, assessments, staffing complements and leave requests remain illustrative.

### Vice Principal workspace

Open [Vice Principal → Overview](http://127.0.0.1:4183/#vice_principal/overview/transport). **Demo Vice Principal** switches between Roshani Fernando at Nugegoda and Dilan Mendis at Malabe. The five views use the appointed school, with no branch selector or permanent staff appointments.

- **Transport Activity:** assigned-school street map, fleet and signal filters, bus routes, next stops and simulated GPS. A bus's **Record transport issue** action creates a follow-up with its bus reference.
- **Academic Performance:** school classes, subjects, grades and teacher comparisons; subject assignments, lecture materials and completion; comparison CSV. **Assign cover** records one-day teaching cover for 20 November without changing the permanent subject teacher or granting extra access. Available teachers include clearly labelled illustrative staff; cover can be cancelled and is also visible alongside subject teaching details to the Principal.
- **Attendance:** student and staff registers, class/grade/date/period filters, 20-day personal calendars and repeated absences. Student details can open a named attendance follow-up.
- **Staffing Overview:** school leadership, staff availability and capacity, vacancy follow-up, temporary cover and **Leave recommendations**. A Vice Principal adds a recommendation and note; the request stays pending and availability remains unchanged. The Principal sees the recommendation in **Leave requests** and makes the final approval/decline decision.
- **School Reports:** school operational briefs plus transport, academic, attendance and staffing snapshots, CSV/HTML exports and Print / Save PDF. The operational brief also captures follow-ups, active cover and leave recommendations pending Principal decision. The latest eight reports are retained per school and role, separate from Principal and Chairman histories.

The daily school pulse links into the relevant filtered view. **Follow-up board** contains three initial sample tasks and any added items, with a school owner, due date, status and note history. Use **Review follow-up** to record progress or resolve an item. All changes persist only in the current browser; assigning an owner or recommending leave does not send a message. The source and browser checks cover both demo schools, foreign-school action rejection, preserved subject assignments, separate recommendation/final decisions and 320px/390px layouts.

### Section Head workspace

Open [Section Head → Section Overview](http://127.0.0.1:4183/#section_head/overview/summary). **Demo Section Head** previews Dilini Silva (Nugegoda/Middle School), Asha Wickramasinghe (Nugegoda/Primary) or Lakshmi Fernando (Malabe/Middle School). The school and section come from the appointment; the five views are:

- **Section Overview:** daily sample attendance, actual prototype student/course/material counts, teaching priorities, grade summary, trend and recorded follow-ups.
- **Academic & Courses:** section-grade/class/subject/term comparisons; subject teacher/enrolment assignment, lecture materials/progress, material readiness/update reviews and comparison CSV.
- **Attendance:** section and class registers, date/period filters, search/watchlists, 20-day calendars and owned follow-ups with due dates, status and note history.
- **Teaching Coordination:** teachers serving the section, their in-section workloads and availability, missing materials/review feedback, temporary-cover requests and Vice Principal outcomes.
- **Section Reports:** scoped management/academic/attendance/teaching snapshots, CSV/HTML downloads and Print / Save PDF. Each school/section retains its own latest eight reports.

A Section Head requests cover; the school's Vice Principal assigns or declines it from Staffing Overview. Linked cover cancellation reopens the request. Subject material review notes appear in staff subject details and are hidden from parents. Active Section Head access does not grant material publication, staff appointments, leave decisions or school-wide data. See the full [role reference](ROLE_FEATURES_ACCESS.md#section-head) for boundaries and sample-data details.

### Grade Coordinator workspace

Open [Grade Coordinator → Grade Overview](http://127.0.0.1:4183/#coordinator/overview/summary). **Demo Grade Coordinator** previews Nuwan Gamage (Nugegoda/Grade 8), Tharushi Jayasekara (Nugegoda/Grade 6), or Kasun Perera (Malabe/Grade 8). School and grade come from the actual appointment. The five views are:

- **Grade Overview:** sample daily attendance, actual prototype students/courses/materials, class reviews, learning progress, support priorities and grade follow-ups.
- **Academic & Courses:** class/subject/assigned-teacher comparisons; lecture downloads/completion; matching-class student enrolment edits while retaining the assigned teacher; comparison CSV.
- **Attendance:** class registers, reporting periods, search/watchlists, 20-day student calendars and persistent grade follow-ups with owned notes and outcomes.
- **Class Coordination:** class review status/history, staff serving the grade and their grade-only workloads, lecture readiness and course-related support requests/responses with the Section Head.
- **Grade Reports:** management/academic/attendance/learning-progress snapshots, CSV/HTML and Print / Save PDF; eight reports per school/grade, separate from other roles/grades.

The Section Head sees coordinator requests in **Teaching Coordination → Requests from Grade Coordinators** and can respond, review materials or start the existing cover-request workflow. A response records coordination; it does not allocate a teacher or approve leave. The two extra demo coordinator accounts are added once to older browser state, preserving existing edits and later removed appointments. Full scope, workflow and prototype limits are in the maintained [role reference](ROLE_FEATURES_ACCESS.md#grade-coordinator).

### Class Teacher workspace

Open [Class Teacher → Class Overview](http://127.0.0.1:4183/#class_teacher/overview/summary). **Demo Class Teacher** previews Dilini Silva (Nugegoda/8A), Sanduni Rathnayake (Nugegoda/6A) or Chamodi Senanayake (Malabe/8A). School, grade and exact class come from the appointment. Five views are available:

- **Class Overview:** daily sample attendance/marked counts, actual class student/course/material counts, parent completion, subject results and follow-up priorities.
- **Learning & Materials:** read all class courses/progress; publish/edit only on subjects assigned to that teacher account; parent downloads/completion continue through the existing portal.
- **Attendance:** mark single or full illustrative class registers using large Present/Absent/Late choices beside each student, with name/admission search, All present, live totals and Save controls that stay visible. Selections remain drafts until Save; Cancel discards them. Inspect calendars/watchlists, keep class follow-up history and restore the generated sample for that class/day. Saved entries update related leadership attendance views and new reports; earlier snapshots stay unchanged.
- **Student Support:** actual admission/guardian and completion records, private planned/completed discussion notes, coordinator requests and responses. No messages are sent; private discussion notes are excluded from exports and parent portals.
- **Class Reports:** management/subject/attendance/learning-progress snapshots; day registers show each sample status/source, multi-day reports show daily totals; CSV/HTML/print; eight saved reports per school/grade/class.

The Grade Coordinator sees requests in **Class Coordination → Requests from Class Teachers** and records a response; course-linked matters can separately use the existing Section Head support workflow. Responding does not allocate cover or approve materials. The two extra demo Class Teacher accounts migrate once without replacing earlier edits or removed appointments. See the maintained [role reference](ROLE_FEATURES_ACCESS.md#class-teacher) for scope and prototype limits.

### Subject Teacher workspace

Open [Subject Teacher → Subject Overview](http://127.0.0.1:4183/#teacher/overview/summary). **Demo Subject Teacher** previews Dilini Silva (Mathematics 8A and ICT 6A), Nuwan Gamage (Science 8A), Rihana Farook (English 6A), Asha Wickramasinghe (Mathematics 4A) in Nugegoda, or Lakshmi Fernando in Malabe. Current teacher assignments and matching-class enrolments control visibility.

- **Subject Overview:** current subjects, distinct enrolled students, materials/completion, lesson plans and teaching priorities.
- **Teaching & Materials:** own-course publication/edit/download, parent-completion progress and internal lesson plans with status and note history.
- **Student Progress:** enrolled student/admission search, course/review filters and internal on-track/needs-practice/reviewed learning records. Notes are available to current subject staff and hidden from parents; they do not change completion or assessment marks.
- **Teaching Support:** course-specific coordinator requests and responses, plus Section Head material feedback. Coordinators respond through **Class Coordination → Requests from Subject Teachers** in the subject’s school/grade.
- **Subject Reports:** teaching summary, materials, student progress and lesson plans; scoped CSV/standalone HTML/print, with eight snapshots per teacher/school. Internal free-text notes are excluded, and snapshots losing current course/student access are hidden.

Class Teachers mark attendance only for their appointed class while that role is active. The Subject Teacher workspace records attendance concerns through coordinator requests. Subject plans/reviews/requests follow teaching reassignment; the former teacher loses access. All changes remain in this browser. Full boundaries are in the maintained [role reference](ROLE_FEATURES_ACCESS.md#subject-teacher).

### School Administrator workspace

Open [School Administrator → Administration Overview](http://127.0.0.1:4183/#admin/overview/summary). **Demo School Administrator** previews Anjali Fernando (Nugegoda) or Shanika Dias (Malabe), with access fixed to the appointed school.

- **Administration Overview:** actual admissions, guardian access, subjects, record-readiness priorities, class coverage and recent student/course updates.
- **Admissions & Students:** register/edit students, validate unique admission numbers and matching grade/class, link existing school guardians, search/filter records and inspect enrolment/completion.
- **Guardians & Access:** school parent-account directory, linked student/admission profiles, missing-link records and parent demo-login guidance. Principal/Chairman manages guardian appointments.
- **Subjects & Enrolment:** assign eligible school teachers and matching-class students, filter subjects needing attention, read/download materials and review parent-recorded completion.
- **Administration Reports:** school summary, admission register, guardian directory and subject enrolment snapshots; CSV/standalone HTML/print, with eight reports per school. Passwords and private note text are excluded.

Changing a student's grade/class removes incompatible subject enrolments; matching-course enrolment is then assigned separately. Staff appointments, lecture publication, attendance marking and transport/store operations stay with their authorised roles. All changes remain in the browser. See the maintained [role reference](ROLE_FEATURES_ACCESS.md#school-administrator) for complete access, workflow and report rules.

### Transport Coordinator workspace

Open [Transport Coordinator → Fleet Activity](http://127.0.0.1:4183/#transport/overview/fleet). **Demo Transport Coordinator** previews Nimal Rathnayake (Nugegoda’s six operational buses) or Chamara Silva (Malabe’s two). Access stays within the appointed school.

- **Fleet Activity:** the school fleet on an OpenStreetMap street map, vehicle/status selection, pause/resume, route progress and clearly labelled simulated telemetry. Assigned-student counts use saved records.
- **Routes & Stops:** review ordered pickups; edit existing route/stop labels, GPS trackers and students; retain the school destination and illustrative map paths.
- **Trackers & Students:** searchable student allocations and paired GPS devices; configure a unique ID and simulate device signal loss/recovery.
- **Issues & Coordination:** create bus issues and update transport follow-ups assigned to you. They share the Vice Principal’s **Follow-up board**, including status/note history; reassignment removes former-coordinator access.
- **Transport Reports:** coordination brief, fleet snapshot, stop register, student allocations and assigned issues; CSV/standalone HTML/print, with eight snapshots per coordinator/school and free-text notes excluded.

Management and Parent maps follow current allocations; management retains 24/7 viewing while Parent GPS is time-gated by the Transport Coordinator.

### Bus-mounted GPS trackers

Open [Transport Coordinator → Trackers & Students](http://127.0.0.1:4183/#transport/overview/assignments), then choose GPS trackers. Pair a unique tracker ID, inspect signal status and simulate signal loss/recovery. No Driver login or manual trip start is needed.

Chairman sees selected network/schools; Principal, Vice Principal, School Administrator and Transport Coordinator see their school’s buses 24/7. Administrator access is read-only. Parents see only their selected child’s allocated bus within the coordinator’s weekday pickup/drop-off windows. Closing a Parent trip window does not stop the management GPS view. Hardware ingestion is simulated, pending production integration.

### Pupil’s book and school uniform reservations

Parents **reserve and collect at school**, with no purchasing, prices or payment portal. The school Book Store distributes pupil’s books; the **Uniform Store** handles uniforms separately.

1. Sign in as Amaya (`SCN-1001` / `1234`). Open [Pupil’s books](http://127.0.0.1:4183/#parent/library) to see the selected pupil’s grade-matching book list. Add the required book, open **Reservation list** and **Submit reservation**.
2. Open [School uniforms](http://127.0.0.1:4183/#parent/uniforms), choose an item/size/quantity and submit a separate reservation. Lists and requests are tied to this child, guardian, school and store type.
3. Preview [Book Store Officer](http://127.0.0.1:4183/#librarian/overview/summary) (Hasini Perera, Nugegoda) or [Uniform Store Officer](http://127.0.0.1:4183/#uniform_store/overview/summary) (Ishara Senanayake, Nugegoda). Each has **Store Overview, Catalogue & Stock, Reservation Requests, School Collection and Store Reports**. Malabe has separate example officers/queues.
4. Review a request and **Confirm stock** to hold the units. **Mark ready to collect** with a date, counter and hours. Parent **My reservations** then shows the reference and pickup details.
5. At school, verify the reference/admission number, enter the receiving adult’s name and **Record collection**. Stock is consumed once. Parent can cancel Requested/Confirmed requests; later cancellation is handled by the store with a visible reason.
6. Adjust variant stock/listing with a reason; generate isolated CSV report snapshots. Internal staff notes never appear to Parent. Old family book records remain a read-only archive, without being assigned to the selected child.

Inventories are **sample 2027 book lists and uniform designs/sizes**, not official Sussex specifications. All state remains in the current browser; no message or payment is sent. Full access rules and limits are in [Book Store Officer](ROLE_FEATURES_ACCESS.md#book-store-officer) and [Uniform Store Officer](ROLE_FEATURES_ACCESS.md#uniform-store-officer).

### NFC transport cards and boarding

Open [Transport Coordinator → Bus boarding](http://127.0.0.1:4183/#transport/boarding). This workspace is separate from the five existing overview tabs and is also available to School Administrator, Parent and school/network leadership.

1. Existing allocated sample students start with demo cards/readers. Use [School Administrator → Bus boarding](http://127.0.0.1:4183/#admin/boarding) to issue, replace, mark lost or deactivate a card. To demonstrate several passengers on one bus, allocate additional students through Trackers & Students, then issue their cards.
2. As Transport Coordinator, **Open trip roster**, select the bus/date/direction, then type a demo card code or expand **Choose an expected student’s active card**. Valid taps mark Boarded; repeated taps are ignored for counts.
3. **Simulate offline**, record a tap, then **Reconnect & sync** to demonstrate queued events. Wrong-school/bus, unknown and inactive cards create exceptions. Lost/replaced-card history stays attached to the student.
4. The Transport Coordinator **closes pickup** and reviews untapped students. Missing scans become Needs review. Confirmed not boarded requires an online, synchronised reader, a closed window and a reason; NFC does not mark classroom attendance.
5. Sign in with `SCN-1001` / `1234` and open [Parent → Bus boarding](http://127.0.0.1:4183/#parent/boarding) to see only Amaya's status/history. Leadership sees scoped coverage/rosters. Manifest CSV omits card codes and private staff reasons.

All taps, readers and synchronisation are simulated in this browser. Physical reader integration, alighting and notifications are not connected. See the complete [NFC feature/access reference](ROLE_FEATURES_ACCESS.md#nfc-boarding-prototype).

### School portal

1. Start in **Chairman → Overview**. An interactive OpenStreetMap street map shows Sri Lanka and a simulated network fleet of 44 buses across all 20 branches. Nearby vehicles form bus-count groups; click a group to zoom in and see individual buses. Branch-name bubbles appear near their geographic positions where space permits. Use **View all buses** to find every branch's vehicles, or filter by On route, At school and Signal delayed. Pan, zoom, pause or resume the simulation, or choose **View whole island** to reset. Street tiles require an internet connection; a notice appears if they cannot load.
2. Select a branch bubble for **Bus activity** and **Performance** tabs. Selecting a bus shows its illustrative route, animated position, next stop, school arrival estimate, sample occupancy, GPS tracker and trip progress. The mobile details sheet keeps the route map and attribution visible above it. In **Performance**, use **Compare schools** to compare sample results by subject, grade and term. Closing the panel or pressing Escape restores the full map. A Principal stays within their assigned school. The overview preserves the eight existing operational demo records for Nugegoda and Malabe and adds two illustrative buses for each of the other 18 branches; these additional vehicles do not create student, staff or assignment records.
3. Open **Roles & access** as Chairman or Principal. Appoint staff, assign sections, grades, classes or buses, and remove appointments. The Chairman appoints Principals. A Principal appoints lower roles inside their branch. Existing people can receive multiple scoped roles.
4. Use **Section Head**, **Grade Coordinator**, **Class Teacher**, and **Subject Teacher** views to demonstrate the different academic scopes. Subject assignments support teachers from the same branch and students from the matching class. Grade Coordinators can update enrollment.
5. In an assigned Teacher view, publish or edit a handout. Open the enrolled child's subject in **Parent → Subjects**, download the handout, and mark it done. Teaching staff and leadership can review completion.
6. In **School Administrator → Students & guardians**, create a student or update a record and link a guardian. Parent accounts are appointed through **Roles & access**.
7. Open **Transport Coordinator → Trackers & Students → GPS trackers** to pair a bus device and simulate signal loss/recovery. Use **Tracking hours & alerts** to set Parent viewing windows. Management keeps 24/7 scoped access.
8. Open **Parent → Pupil’s books** or **School uniforms**, submit a student reservation, then preview **Book Store Officer** or **Uniform Store Officer** to confirm stock, mark it ready and record collection. There are no additional-book sales, prices or payment portal. Each school/store handles its own queue; Parent sees only their own selected-child reservations.
9. Select **Reset demo** in the role menu before a fresh walkthrough.

The prototype uses browser storage and a sample account switcher. Role, scope, and dummy login checks run in the browser for the demonstration. A production deployment needs authenticated accounts and server-side authorization. GPS, stock and school collection are simulated.

## Check access rules

Run from this directory:

```sh
node --test tests/*.test.mjs
```

The checks cover branch and academic scope, teacher publishing, parent transport scope and tracker configuration, role delegation, book/uniform reservation and stock scope, legacy order visibility, and migration of existing demo data.

## Branch locations and performance data

School names, addresses, and approximate branch positions were verified against [Sussex College Network's official directory](https://www.sussexcollege.lk/branches/) on 19 November 2026. The Matara pin uses destination coordinates in the official school's Google Maps link. The public directory lists 20 school branches.

Assessment marks, term comparisons, and seeded activity entries are illustrative data. They demonstrate comparison of the same subject, grade, and term. Actions inside the prototype also appear in the relevant school's activity feed. Branch workspace totals come from the records in the browser.

Network bus routes follow local OpenStreetMap road geometry with a schematic final approach to each school. They are demonstration routes, not verified Sussex operating routes. Existing vehicle status and tracker edits are reflected in the overview; additional branch vehicles, occupancy and arrival estimates are sample data. Bus-count groups account for every visible-scope vehicle. Crowded branch labels appear as you zoom in rather than being moved to unrelated locations.

Use **Find a school** to open any branch directly, including when its label is hidden by map crowding. Each branch panel retains both bus activity and academic performance.

Earlier sample branch IDs are retained internally so existing admission logins, subject assignments, orders, and trip state continue to resolve to their associated records. Their display names now identify Nugegoda and Malabe.

## Assets

- The national street map uses [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/) with visible attribution and normal browser caching. [Leaflet 1.9.4](https://leafletjs.com/) is bundled locally under its [BSD 2-Clause licence](dist/vendor/leaflet/LICENSE). The [Natural Earth public-domain coastline](https://www.naturalearthdata.com/about/terms-of-use/) remains beneath the tile layer as a geographic fallback.

- The local map image and sample route paths use [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) data under the Open Database License, via [Geofabrik's Sri Lanka extract](https://download.geofabrik.de/asia/sri-lanka.html).
- DM Sans is bundled with its [Open Font License](dist/assets/DM-Sans-OFL.txt).
- [Library cover art](dist/assets/library-cover-art.webp) was created with the built-in ImageGen tool.

### Library cover art prompt

> Create one portrait 2-by-2 tiled raster atlas of four different modern school textbook cover ILLUSTRATIONS for a polished library ordering web app. Each equal-sized rectangular quadrant must be edge-to-edge and independently croppable; seams meet exactly in the center, zero margin, no gutter, no borders, no 3D perspective. Top-left: dark navy applied-mathematics diagram, overlapping geometric arcs, a pale cornflower circle and warm cream grid. Top-right: warm ivory botany poster with a colorful green tropical leaf and small butterfly, detailed natural-history illustration. Bottom-left: deep terracotta landscape of layered hills, pale orange sun, and small birds, like a contemporary literary paperback. Bottom-right: dark forest green computing poster with interconnected gold circuit traces and a dimensional cream and green microchip. Refined matte paper print, bold minimal compositions, tactile muted colors, accurate clean crop edges. The art will receive HTML titles separately. No words, letters, numbers, text, logos or watermarks. Use a portrait overall canvas, with each quadrant the same portrait aspect.

