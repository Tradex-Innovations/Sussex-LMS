# Campusway

A browser-only school portal prototype for a client walkthrough. Greenfield Academy, the fleet, courses, and orders are sample data. The bus positions and trip statuses are simulated. Demo changes are saved in the current browser.

## Run locally

From this directory, run:

```sh
python3 -m http.server 4183 --bind 127.0.0.1 --directory dist
```

Open [the local demo](http://127.0.0.1:4183/). No install or build is required.

## Walkthrough

1. Start in **Admin view → Bus tracking**. Select a bus or map pin, filter the fleet by status, and pause or resume the simulation. Select BUS 06 to see a delayed signal.
2. Switch to **Parent view** and choose a student to see their assigned bus and route stops. Switch to **Driver view**, end BUS 01's trip, and return to the parent view with Amaya selected to see the updated status. Start a new trip from the driver view.
3. Open **Admin view → Course management** and assign a teacher and students. In **Teacher view**, open the assigned course and publish a handout. In **Parent view → Courses**, open the course for the enrolled child, download the handout, and mark it done.
4. Open **Parent view → Library**, add a book to the bag, and place a demo order for school collection. Review the receipt in **My orders** or **Admin view → Library orders**.
5. Select **Reset demo** in the role menu before a fresh walkthrough.

## Assets

- The local map image and sample route paths use [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) data under the Open Database License, via [Geofabrik's Sri Lanka extract](https://download.geofabrik.de/asia/sri-lanka.html).
- DM Sans is bundled with its [Open Font License](dist/assets/DM-Sans-OFL.txt).
- [Library cover art](dist/assets/library-cover-art.webp) was created with the built-in ImageGen tool.

### Library cover art prompt

> Create one portrait 2-by-2 tiled raster atlas of four different modern school textbook cover ILLUSTRATIONS for a polished library ordering web app. Each equal-sized rectangular quadrant must be edge-to-edge and independently croppable; seams meet exactly in the center, zero margin, no gutter, no borders, no 3D perspective. Top-left: dark navy applied-mathematics diagram, overlapping geometric arcs, a pale cornflower circle and warm cream grid. Top-right: warm ivory botany poster with a colorful green tropical leaf and small butterfly, detailed natural-history illustration. Bottom-left: deep terracotta landscape of layered hills, pale orange sun, and small birds, like a contemporary literary paperback. Bottom-right: dark forest green computing poster with interconnected gold circuit traces and a dimensional cream and green microchip. Refined matte paper print, bold minimal compositions, tactile muted colors, accurate clean crop edges. The art will receive HTML titles separately. No words, letters, numbers, text, logos or watermarks. Use a portrait overall canvas, with each quadrant the same portrait aspect.

