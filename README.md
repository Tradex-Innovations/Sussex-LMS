# Sussex College Network

A browser-only school portal prototype for a client walkthrough. Official Sussex school names and approximate locations are paired with sample academic, attendance, staffing, fleet, course and order data. Bus positions and trip statuses are simulated. Demo changes are saved in the current browser.

## Run locally

From this directory, run:

```sh
python3 -m http.server 4183 --bind 127.0.0.1 --directory dist
```

Open [the local demo](http://127.0.0.1:4183/). No install or build is required.

## Features and access reference

[ROLE_FEATURES_ACCESS.md](ROLE_FEATURES_ACCESS.md) documents all 12 roles, their implemented views, read/write scope, approvals, cross-role workflows, demo accounts and prototype limits. Project instructions in [AGENTS.md](AGENTS.md) require this reference to be updated alongside future feature and permission changes.

## Parent demo login

Open [Parent login](http://127.0.0.1:4183/#parent/login). Use a student's admission number and the temporary demo password `1234`.

| Student | Admission number |
| --- | --- |
| Amaya Perera | SCN-1001 |
| Kavin Perera | SCN-1002 |
| Meera Fernando | SCN-1008 |
| Thevin Fernando | SCN-1009 |

The account cards fill in demo credentials. Sign in to open that student's bus, courses, and library portal. Log out to choose another admission number. The session survives a tab refresh. Student admission numbers appear in the staff directory and can be edited by authorized branch staff.

## Walkthrough

### Chairman workspace

The Chairman's Overview has five views. Transport Activity opens first with the full map; each view also has a direct link:

- [Transport Activity](http://127.0.0.1:4183/#chairman/overview/transport): all 20 branches and 44 simulated buses, status filters, branch and vehicle drill-downs, next stops, route progress and pause/resume.
- [Academic Performance](http://127.0.0.1:4183/#chairman/overview/academic): subject, grade and term filters; weighted averages and pass rates; branch rankings; changes against the previous term; distribution and trend charts; branch results and CSV export.
- [Attendance](http://127.0.0.1:4183/#chairman/overview/attendance): student or staff registers, grade and reporting-date filters, one/five/twenty-school-day periods, weighted branch comparisons, trends, repeated absence watchlists, searchable student records and a personal 20-day calendar. Late arrivals are included in present totals; period totals count attendance-days.
- [Staffing Overview](http://127.0.0.1:4183/#chairman/overview/staffing): branch headcounts, teaching capacity, coverage and vacancies; available/absent/on-leave filters; searchable and paginated staff profiles; leadership drill-downs; persistent vacancy review and links to branch appointments. Existing prototype accounts appear once per school alongside labelled illustrative staff. Assigned subjects come from actual prototype course assignments.
- [Executive Reports](http://127.0.0.1:4183/#chairman/overview/reports): executive brief or individual transport/academic/attendance/staffing reports; selectable branch scope and relevant filters; generated previews; CSV and standalone HTML downloads with embedded logo; browser Print / Save PDF; latest eight saved report snapshots. Editing filters does not alter an already captured report.

The shared School branch filter controls scope throughout the Chairman views. All data and actions remain a browser-only demonstration. Sample registers use 20 November 2026 by default and support dates from 12 October through 20 November. Academic cohorts are capped by the same illustrative grade enrolment used by attendance and staffing.

### Principal workspace

The Principal role now opens [its assigned-school overview](http://127.0.0.1:4183/#principal/overview/transport), with the same five main tabs and a daily school pulse. Use **Demo Principal** to preview Malini Senanayake at Nugegoda or Suresh Jayawardena at Malabe. Changing the demo account changes the assigned school and resets the view filters; the Principal does not have a branch selector.

- **Transport Activity** opens centred on the assigned school's routes. Principals can filter their own fleet, inspect buses, manage existing bus/driver/student assignments and start or end demo trips. Resetting the map returns to the school routes.
- **Academic Performance** compares classes, subjects, grades and teachers within the school. Class cohorts reconcile with grade totals. Prototype teacher assignments and published materials appear for matching course records. Principals can open lecture materials, assign courses and export the selected comparison.
- **Attendance** includes school and class registers, student calendars, grade/class/date/period filters, staff attendance and repeated absence views.
- **Staffing Overview** includes leadership, staff capacity, directory filters, profiles, vacancies and sample leave requests. Leave approval/decline is saved in the browser and updates the school pulse, staff availability, attendance and newly generated reports. Appointment management uses the existing branch-scoped role forms; Principal and Chairman appointments remain excluded from the Principal's assignable roles.
- **Executive Reports** generates one-school briefs and transport/academic/attendance/staffing exports. CSV, standalone HTML with embedded logo, and Print / Save PDF are available. Principal report history is separated by school and from Chairman report history; each workspace retains its latest eight snapshots.

All Principal records, actions and exports use the assigned Principal grant's school. GPS, attendance, assessments, staffing complements and leave requests remain illustrative.

### Vice Principal workspace

Open [Vice Principal → Overview](http://127.0.0.1:4183/#vice_principal/overview/transport). **Demo Vice Principal** switches between Roshani Fernando at Nugegoda and Dilan Mendis at Malabe. The five views use the appointed school, with no branch selector or permanent staff appointments.

- **Transport Activity:** assigned-school street map, fleet and signal filters, bus routes, next stops and simulated GPS. A bus's **Record transport issue** action creates a follow-up with its bus reference.
- **Academic Performance:** school classes, subjects, grades and teacher comparisons; course assignments, lecture materials and completion; comparison CSV. **Assign cover** records one-day teaching cover for 20 November without changing the permanent course teacher or granting extra access. Available teachers include clearly labelled illustrative staff; cover can be cancelled and is also visible alongside course teaching details to the Principal.
- **Attendance:** student and staff registers, class/grade/date/period filters, 20-day personal calendars and repeated absences. Student details can open a named attendance follow-up.
- **Staffing Overview:** school leadership, staff availability and capacity, vacancy follow-up, temporary cover and **Leave recommendations**. A Vice Principal adds a recommendation and note; the request stays pending and availability remains unchanged. The Principal sees the recommendation in **Leave requests** and makes the final approval/decline decision.
- **School Reports:** school operational briefs plus transport, academic, attendance and staffing snapshots, CSV/HTML exports and Print / Save PDF. The operational brief also captures follow-ups, active cover and leave recommendations pending Principal decision. The latest eight reports are retained per school and role, separate from Principal and Chairman histories.

The daily school pulse links into the relevant filtered view. **Follow-up board** contains three initial sample tasks and any added items, with a school owner, due date, status and note history. Use **Review follow-up** to record progress or resolve an item. All changes persist only in the current browser; assigning an owner or recommending leave does not send a message. The source and browser checks cover both demo schools, foreign-school action rejection, preserved course assignments, separate recommendation/final decisions and 320px/390px layouts.

### Section Head workspace

Open [Section Head → Section Overview](http://127.0.0.1:4183/#section_head/overview/summary). **Demo Section Head** previews Dilini Silva (Nugegoda/Middle School), Asha Wickramasinghe (Nugegoda/Primary) or Lakshmi Fernando (Malabe/Middle School). The school and section come from the appointment; the five views are:

- **Section Overview:** daily sample attendance, actual prototype student/course/material counts, teaching priorities, grade summary, trend and recorded follow-ups.
- **Academic & Courses:** section-grade/class/subject/term comparisons; course teacher/enrolment assignment, lecture materials/progress, material readiness/update reviews and comparison CSV.
- **Attendance:** section and class registers, date/period filters, search/watchlists, 20-day calendars and owned follow-ups with due dates, status and note history.
- **Teaching Coordination:** teachers serving the section, their in-section workloads and availability, missing materials/review feedback, temporary-cover requests and Vice Principal outcomes.
- **Section Reports:** scoped management/academic/attendance/teaching snapshots, CSV/HTML downloads and Print / Save PDF. Each school/section retains its own latest eight reports.

A Section Head requests cover; the school's Vice Principal assigns or declines it from Staffing Overview. Linked cover cancellation reopens the request. Course material review notes appear in staff course details and are hidden from parents. Active Section Head access does not grant material publication, staff appointments, leave decisions or school-wide data. See the full [role reference](ROLE_FEATURES_ACCESS.md#section-head) for boundaries and sample-data details.

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
- **Learning & Materials:** read all class courses/progress; publish/edit only on courses assigned to that teacher account; parent downloads/completion continue through the existing portal.
- **Attendance:** mark single or full illustrative class registers using large Present/Absent/Late choices beside each student, with name/admission search, All present, live totals and Save controls that stay visible. Selections remain drafts until Save; Cancel discards them. Inspect calendars/watchlists, keep class follow-up history and restore the generated sample for that class/day. Saved entries update related leadership attendance views and new reports; earlier snapshots stay unchanged.
- **Student Support:** actual admission/guardian and completion records, private planned/completed discussion notes, coordinator requests and responses. No messages are sent; private discussion notes are excluded from exports and parent portals.
- **Class Reports:** management/subject/attendance/learning-progress snapshots; day registers show each sample status/source, multi-day reports show daily totals; CSV/HTML/print; eight saved reports per school/grade/class.

The Grade Coordinator sees requests in **Class Coordination → Requests from Class Teachers** and records a response; course-linked matters can separately use the existing Section Head support workflow. Responding does not allocate cover or approve materials. The two extra demo Class Teacher accounts migrate once without replacing earlier edits or removed appointments. See the maintained [role reference](ROLE_FEATURES_ACCESS.md#class-teacher) for scope and prototype limits.

### Subject Teacher workspace

Open [Subject Teacher → Subject Overview](http://127.0.0.1:4183/#teacher/overview/summary). **Demo Subject Teacher** previews Dilini Silva (Mathematics 8A and ICT 6A), Nuwan Gamage (Science 8A), Rihana Farook (English 6A), Asha Wickramasinghe (Mathematics 4A) in Nugegoda, or Lakshmi Fernando in Malabe. Current teacher assignments and matching-class enrolments control visibility.

- **Subject Overview:** current courses, distinct enrolled students, materials/completion, lesson plans and teaching priorities.
- **Teaching & Materials:** own-course publication/edit/download, parent-completion progress and internal lesson plans with status and note history.
- **Student Progress:** enrolled student/admission search, course/review filters and internal on-track/needs-practice/reviewed learning records. Notes are available to current course staff and hidden from parents; they do not change completion or assessment marks.
- **Teaching Support:** course-specific coordinator requests and responses, plus Section Head material feedback. Coordinators respond through **Class Coordination → Requests from Subject Teachers** in the course’s school/grade.
- **Subject Reports:** teaching summary, materials, student progress and lesson plans; scoped CSV/standalone HTML/print, with eight snapshots per teacher/school. Internal free-text notes are excluded, and snapshots losing current course/student access are hidden.

Class Teachers mark attendance only for their appointed class while that role is active. The Subject Teacher workspace records attendance concerns through coordinator requests. Course plans/reviews/requests follow teaching reassignment; the former teacher loses access. All changes remain in this browser. Full boundaries are in the maintained [role reference](ROLE_FEATURES_ACCESS.md#subject-teacher).

### School Administrator workspace

Open [School Administrator → Administration Overview](http://127.0.0.1:4183/#admin/overview/summary). **Demo School Administrator** previews Anjali Fernando (Nugegoda) or Shanika Dias (Malabe), with access fixed to the appointed school.

- **Administration Overview:** actual admissions, guardian access, courses, record-readiness priorities, class coverage and recent student/course updates.
- **Admissions & Students:** register/edit students, validate unique admission numbers and matching grade/class, link existing school guardians, search/filter records and inspect enrolment/completion.
- **Guardians & Access:** school parent-account directory, linked student/admission profiles, missing-link records and parent demo-login guidance. Principal/Chairman manages guardian appointments.
- **Courses & Enrolment:** assign eligible school teachers and matching-class students, filter courses needing attention, read/download materials and review parent-recorded completion.
- **Administration Reports:** school summary, admission register, guardian directory and course enrolment snapshots; CSV/standalone HTML/print, with eight reports per school. Passwords and private note text are excluded.

Changing a student's grade/class removes incompatible course enrolments; matching-course enrolment is then assigned separately. Staff appointments, lecture publication, attendance marking and transport/library operations stay with their authorised roles. All changes remain in the browser. See the maintained [role reference](ROLE_FEATURES_ACCESS.md#school-administrator) for complete access, workflow and report rules.

### Transport Coordinator workspace

Open [Transport Coordinator → Fleet Activity](http://127.0.0.1:4183/#transport/overview/fleet). **Demo Transport Coordinator** previews Nimal Rathnayake (Nugegoda’s six operational buses) or Chamara Silva (Malabe’s two). Access stays within the appointed school.

- **Fleet Activity:** the school fleet on an OpenStreetMap street map, vehicle/status selection, pause/resume, route progress and clearly labelled simulated telemetry. Assigned-student counts use saved records.
- **Routes & Stops:** review ordered pickups; edit existing route/stop labels, drivers and students; retain the school destination and illustrative map paths.
- **Drivers & Students:** separate searchable allocation views, quick student/driver allocation and full bus management. Driver moves leave the former bus unassigned; replaced drivers remain available for a later bus allocation.
- **Issues & Coordination:** create bus issues and update transport follow-ups assigned to you. They share the Vice Principal’s **Follow-up board**, including status/note history; reassignment removes former-coordinator access.
- **Transport Reports:** coordination brief, fleet snapshot, stop register, student allocations and assigned issues; CSV/standalone HTML/print, with eight snapshots per coordinator/school and free-text notes excluded.

Driver and Parent portals follow the same bus assignments and trip status. Trip start/end remains with Driver/Principal; recording an issue does not dispatch a bus or send a message. The existing [Bus tracking workspace](http://127.0.0.1:4183/#transport/transport) remains available. Full scope, persistence and prototype limits are in the maintained [role reference](ROLE_FEATURES_ACCESS.md#transport-coordinator).

### School portal

1. Start in **Chairman → Overview**. An interactive OpenStreetMap street map shows Sri Lanka and a simulated network fleet of 44 buses across all 20 branches. Nearby vehicles form bus-count groups; click a group to zoom in and see individual buses. Branch-name bubbles appear near their geographic positions where space permits. Use **View all buses** to find every branch's vehicles, or filter by On route, At school and Signal delayed. Pan, zoom, pause or resume the simulation, or choose **View whole island** to reset. Street tiles require an internet connection; a notice appears if they cannot load.
2. Select a branch bubble for **Bus activity** and **Performance** tabs. Selecting a bus shows its illustrative route, animated position, next stop, school arrival estimate, sample occupancy, driver and trip progress. The mobile details sheet keeps the route map and attribution visible above it. In **Performance**, use **Compare schools** to compare sample results by subject, grade and term. Closing the panel or pressing Escape restores the full map. A Principal stays within their assigned school. The overview preserves the eight existing operational demo records for Nugegoda and Malabe and adds two illustrative buses for each of the other 18 branches; these additional vehicles do not create student, staff or assignment records.
3. Open **Roles & access** as Chairman or Principal. Appoint staff, assign sections, grades, classes or buses, and remove appointments. The Chairman appoints Principals. A Principal appoints lower roles inside their branch. Existing people can receive multiple scoped roles.
4. Use **Section Head**, **Grade Coordinator**, **Class Teacher**, and **Subject Teacher** views to demonstrate the different academic scopes. Course assignments support teachers from the same branch and students from the matching class. Grade Coordinators can update enrollment.
5. In an assigned Teacher view, publish or edit a handout. Open the enrolled child's course in **Parent → Courses**, download the handout, and mark it done. Teaching staff and leadership can review completion.
6. In **School Administrator → Students & guardians**, create a student or update a record and link a guardian. Parent accounts are appointed through **Roles & access**.
7. Open **Transport Coordinator → Bus tracking**, select a bus, and choose **Manage bus** to update its driver, stop names, and assigned students. In **Driver** view, start or end the assigned trip. The linked Parent view reflects the assignment and trip status.
8. Open **Parent → Library**, place an order, then use **Librarian → Library** to edit price or availability and mark the order collected. Each branch manages its catalogue and orders, and each parent sees their own orders.
9. Select **Reset demo** in the role menu before a fresh walkthrough.

The prototype uses browser storage and a sample account switcher. Role, scope, and dummy login checks run in the browser for the demonstration. A production deployment needs authenticated accounts and server-side authorization. GPS and book orders are simulated.

## Check access rules

Run from this directory:

```sh
node --test tests/*.test.mjs
```

The checks cover branch and academic scope, teacher publishing, parent and driver assignments, role delegation, order visibility, and migration of existing demo data.

## Branch locations and performance data

School names, addresses, and approximate branch positions were verified against [Sussex College Network's official directory](https://www.sussexcollege.lk/branches/) on 19 November 2026. The Matara pin uses destination coordinates in the official school's Google Maps link. The public directory lists 20 school branches.

Assessment marks, term comparisons, and seeded activity entries are illustrative data. They demonstrate comparison of the same subject, grade, and term. Actions inside the prototype also appear in the relevant school's activity feed. Branch workspace totals come from the records in the browser.

Network bus routes follow local OpenStreetMap road geometry with a schematic final approach to each school. They are demonstration routes, not verified Sussex operating routes. Existing vehicle status and driver edits are reflected in the overview; additional branch vehicles, occupancy and arrival estimates are sample data. Bus-count groups account for every visible-scope vehicle. Crowded branch labels appear as you zoom in rather than being moved to unrelated locations.

Use **Find a school** to open any branch directly, including when its label is hidden by map crowding. Each branch panel retains both bus activity and academic performance.

Earlier sample branch IDs are retained internally so existing admission logins, course assignments, orders, and trip state continue to resolve to their associated records. Their display names now identify Nugegoda and Malabe.

## Assets

- The national street map uses [OpenStreetMap tiles](https://operations.osmfoundation.org/policies/tiles/) with visible attribution and normal browser caching. [Leaflet 1.9.4](https://leafletjs.com/) is bundled locally under its [BSD 2-Clause licence](dist/vendor/leaflet/LICENSE). The [Natural Earth public-domain coastline](https://www.naturalearthdata.com/about/terms-of-use/) remains beneath the tile layer as a geographic fallback.

- The local map image and sample route paths use [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) data under the Open Database License, via [Geofabrik's Sri Lanka extract](https://download.geofabrik.de/asia/sri-lanka.html).
- DM Sans is bundled with its [Open Font License](dist/assets/DM-Sans-OFL.txt).
- [Library cover art](dist/assets/library-cover-art.webp) was created with the built-in ImageGen tool.

### Library cover art prompt

> Create one portrait 2-by-2 tiled raster atlas of four different modern school textbook cover ILLUSTRATIONS for a polished library ordering web app. Each equal-sized rectangular quadrant must be edge-to-edge and independently croppable; seams meet exactly in the center, zero margin, no gutter, no borders, no 3D perspective. Top-left: dark navy applied-mathematics diagram, overlapping geometric arcs, a pale cornflower circle and warm cream grid. Top-right: warm ivory botany poster with a colorful green tropical leaf and small butterfly, detailed natural-history illustration. Bottom-left: deep terracotta landscape of layered hills, pale orange sun, and small birds, like a contemporary literary paperback. Bottom-right: dark forest green computing poster with interconnected gold circuit traces and a dimensional cream and green microchip. Refined matte paper print, bold minimal compositions, tactile muted colors, accurate clean crop edges. The art will receive HTML titles separately. No words, letters, numbers, text, logos or watermarks. Use a portrait overall canvas, with each quadrant the same portrait aspect.

