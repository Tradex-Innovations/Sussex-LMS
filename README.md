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

1. Start in **Chairman → Bus tracking**. Switch between all branches, Colombo, and Lakeside. The fleet has eight simulated buses and two school destinations. Use the role menu and **Preview account** selector to compare a Principal's branch access with the Chairman's group access.
2. Open **Roles & access** as Chairman or Principal. Appoint staff, assign sections, grades, classes or buses, and remove appointments. The Chairman appoints Principals. A Principal appoints lower roles inside their branch. Existing people can receive multiple scoped roles.
3. Use **Section Head**, **Grade Coordinator**, **Class Teacher**, and **Subject Teacher** views to demonstrate the different academic scopes. Course assignments support teachers from the same branch and students from the matching class. Grade Coordinators can update enrollment.
4. In an assigned Teacher view, publish or edit a handout. Open the enrolled child's course in **Parent → Courses**, download the handout, and mark it done. Teaching staff and leadership can review completion.
5. In **School Administrator → Students & guardians**, create a student or update a record and link a guardian. Parent accounts are appointed through **Roles & access**.
6. Open **Transport Coordinator → Bus tracking**, select a bus, and choose **Manage bus** to update its driver, stop names, and assigned students. In **Driver** view, start or end the assigned trip. The linked Parent view reflects the assignment and trip status.
7. Open **Parent → Library**, place an order, then use **Librarian → Library** to edit price or availability and mark the order collected. Each branch manages its catalogue and orders, and each parent sees their own orders.
8. Select **Reset demo** in the role menu before a fresh walkthrough.

The prototype uses browser storage and a sample account switcher. Role, scope, and dummy login checks run in the browser for the demonstration. A production deployment needs authenticated accounts and server-side authorization. GPS and book orders are simulated.

## Check access rules

Run from this directory:

```sh
node --test tests/*.test.mjs
```

The checks cover branch and academic scope, teacher publishing, parent and driver assignments, role delegation, order visibility, and migration of existing demo data.

## Assets

- The local map image and sample route paths use [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) data under the Open Database License, via [Geofabrik's Sri Lanka extract](https://download.geofabrik.de/asia/sri-lanka.html).
- DM Sans is bundled with its [Open Font License](dist/assets/DM-Sans-OFL.txt).
- [Library cover art](dist/assets/library-cover-art.webp) was created with the built-in ImageGen tool.

### Library cover art prompt

> Create one portrait 2-by-2 tiled raster atlas of four different modern school textbook cover ILLUSTRATIONS for a polished library ordering web app. Each equal-sized rectangular quadrant must be edge-to-edge and independently croppable; seams meet exactly in the center, zero margin, no gutter, no borders, no 3D perspective. Top-left: dark navy applied-mathematics diagram, overlapping geometric arcs, a pale cornflower circle and warm cream grid. Top-right: warm ivory botany poster with a colorful green tropical leaf and small butterfly, detailed natural-history illustration. Bottom-left: deep terracotta landscape of layered hills, pale orange sun, and small birds, like a contemporary literary paperback. Bottom-right: dark forest green computing poster with interconnected gold circuit traces and a dimensional cream and green microchip. Refined matte paper print, bold minimal compositions, tactile muted colors, accurate clean crop edges. The art will receive HTML titles separately. No words, letters, numbers, text, logos or watermarks. Use a portrait overall canvas, with each quadrant the same portrait aspect.

