# Sussex College Network

A browser-only school portal prototype for a client walkthrough. Sussex College Network, the fleet, courses, and orders are sample data. The bus positions and trip statuses are simulated. Demo changes are saved in the current browser.

## Run locally

From this directory, run:

```sh
python3 -m http.server 4183 --bind 127.0.0.1 --directory dist
```

Open [the local demo](http://127.0.0.1:4183/). No install or build is required.

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

