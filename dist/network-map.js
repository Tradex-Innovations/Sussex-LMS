import { islandPolygons } from "./sri-lanka-land.js";
import { icon } from "./icons.js";
import { escapeHtml as e } from "./ui.js";
import { fleetSummary, networkTelemetry } from "./network-fleet.js";

export class SchoolNetworkMap {
  constructor(stage, options) {
    this.stage = stage;
    this.options = options;
    this.controller = new AbortController();
    this.labels = [];
    this.busMarkers = new Map();
    this.clusterMarkers = new Map();
    this.markerObstacles = [];
    const L = window.L;
    this.map = L.map(stage, { zoomControl: false, attributionControl: true, minZoom: 6, maxZoom: 18,
      zoomSnap: 0.25, zoomDelta: 1, scrollWheelZoom: true, maxBounds: [[4.5, 77.5], [11, 84.5]], maxBoundsViscosity: 0.8 });
    this.map.attributionControl.setPrefix('<a href="https://leafletjs.com/" target="_blank" rel="noopener">Leaflet</a>');
    this.map.createPane("coastline").style.zIndex = 150;
    L.polygon(islandPolygons.map((polygon) => polygon.map(([lon, lat]) => [lat, lon])), {
      pane: "coastline", color: "#c5d6bf", fillColor: "#e0ead9", fillOpacity: 1, weight: 1, interactive: false,
    }).addTo(this.map);
    this.tiles = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>',
      updateWhenIdle: true, keepBuffer: 1,
    }).addTo(this.map);
    let tilesLoaded = 0;
    this.tiles.on("tileload", () => {
      tilesLoaded += 1;
      stage.querySelector(".network-map-unavailable")?.remove();
      stage.dataset.tiles = "loaded";
    });
    this.tileNoticeTimer = setTimeout(() => {
      if (!tilesLoaded && !this.controller.signal.aborted) {
        stage.insertAdjacentHTML("beforeend", '<p class="network-map-unavailable" role="status">Street map unavailable. Check your internet connection. Branches and demo buses are still available.</p>');
      }
    }, 7000);
    this.map.createPane("networkRoutes").style.zIndex = 420;
    this.drawRoutes();
    this.bubbleLayer = document.createElement("div");
    this.bubbleLayer.className = "school-bubbles-layer";
    stage.append(this.bubbleLayer);
    for (const branch of options.branches) {
      const buses = options.fleet.filter((bus) => bus.branch === branch.id);
      const counts = fleetSummary(buses);
      const label = document.createElement("button");
      label.type = "button";
      label.className = "school-branch-bubble" + (options.selected === branch.id ? " is-selected" : "");
      label.dataset.branch = branch.id;
      label.dataset.focus = "network-pin-" + branch.id;
      label.textContent = branch.name;
      label.setAttribute("aria-label", "View " + branch.name + " performance");
      label.setAttribute("aria-pressed", String(options.selected === branch.id));
      label.title = branch.name + ": " + counts.route + " on route, " + counts.school + " at school, " + counts.delayed + " signal delayed";
      label.addEventListener("click", () => options.onSelect(branch.id), { signal: this.controller.signal });
      this.bubbleLayer.append(label);
      this.labels.push({ branch, label });
    }
    stage.insertAdjacentHTML("beforeend", '<div class="school-map-controls" role="group" aria-label="Map controls">' +
      '<button type="button" data-school-map="in" aria-label="Zoom in" title="Zoom in">' + icon("plus", 19) + '</button>' +
      '<button type="button" data-school-map="out" aria-label="Zoom out" title="Zoom out">' + icon("minus", 19) + '</button>' +
      '<button type="button" data-school-map="reset" aria-label="View whole island" title="View whole island">' + icon("locate", 19) + '</button></div>');
    const { signal } = this.controller;
    for (const control of stage.querySelectorAll("[data-school-map]")) {
      control.addEventListener("click", () => {
        if (control.dataset.schoolMap === "in") this.map.zoomIn();
        else if (control.dataset.schoolMap === "out") this.map.zoomOut();
        else this.fitIsland();
      }, { signal });
      L.DomEvent.disableClickPropagation(control);
    }
    L.DomEvent.disableClickPropagation(this.bubbleLayer);
    L.DomEvent.disableScrollPropagation(this.bubbleLayer);
    this.map.on("move zoom resize", () => { this.updateMarkers(); this.drawLabels(); });
    if (options.viewport?.center) this.map.setView(options.viewport.center, options.viewport.zoom, { animate: false });
    else this.fitIsland();
    this.resize = new ResizeObserver(() => {
      this.map.invalidateSize({ pan: false });
      this.drawLabels();
    });
    this.resize.observe(stage);
    document.fonts.ready.then(() => { if (!signal.aborted) this.drawLabels(); });
    this.updateMarkers();
    this.timer = setInterval(() => { this.updateMarkers(); this.drawLabels(); options.onTick?.(); }, 1000);
  }

  get viewport() {
    const center = this.map.getCenter();
    return { center: [center.lat, center.lng], zoom: this.map.getZoom() };
  }

  fitIsland() {
    const hud = this.stage.parentElement.querySelector(".network-map-hud");
    this.map.fitBounds([[5.7, 79.35], [9.95, 82.05]], { paddingTopLeft: [30, Math.max(70, (hud?.offsetHeight || 0) + 35)], paddingBottomRight: [30, 35], animate: false });
  }

  focusBranch(id) {
    const buses = this.options.fleet.filter((bus) => bus.branch === id);
    const points = buses.flatMap((bus) => bus.route?.points || []);
    const branch = this.options.branches.find((branch) => branch.id === id);
    if (points.length) this.map.fitBounds(points, { ...this.focusPadding(), maxZoom: 13, animate: false });
    else if (branch) this.map.setView([branch.lat, branch.lon], 12, { animate: false });
  }

  focusBus(id) {
    const bus = this.options.fleet.find((bus) => bus.id === id);
    if (bus?.route) this.map.fitBounds(bus.route.points, { ...this.focusPadding(), maxZoom: 14, animate: false });
  }

  focusPadding() {
    const inspector = this.stage.closest(".network-experience").querySelector(".network-inspector");
    if (inspector && innerWidth <= 750) return { paddingTopLeft: [30, 25], paddingBottomRight: [50, inspector.offsetHeight + 28] };
    const hud = this.stage.parentElement.querySelector(".network-map-hud");
    return { paddingTopLeft: [45, Math.max(80, (hud?.offsetHeight || 0) + 40)], paddingBottomRight: [50, 75] };
  }

  drawRoutes() {
    const L = window.L;
    for (const bus of this.options.fleet) {
      if (!bus.route || (this.options.selectedBus ? bus.id !== this.options.selectedBus : bus.branch !== this.options.selected)) continue;
      L.polyline(bus.route.points, {
        pane: "networkRoutes", color: bus.status === "delayed" ? "#bb701e" : bus.status === "school" ? "#527ca4" : "#168166",
        opacity: 0.85, weight: bus.id === this.options.selectedBus ? 5 : 3, dashArray: bus.status === "route" ? "7 9" : null,
        className: bus.status === "route" && !this.options.paused ? "network-bus-route" : "", interactive: false,
      }).addTo(this.map);
    }
  }

  updateMarkers() {
    const L = window.L;
    const detailed = this.map.getZoom() >= 10;
    this.markerObstacles = [];
    if (!detailed) {
      for (const marker of this.busMarkers.values()) this.map.removeLayer(marker);
      this.updateClusters();
      return;
    }
    for (const marker of this.clusterMarkers.values()) this.map.removeLayer(marker);
    for (const bus of this.options.fleet) {
      let marker = this.busMarkers.get(bus.id);
      const show = (detailed || bus.id === this.options.selectedBus) && (this.options.status === "all" || this.options.status === bus.status);
      if (!show) { if (marker) this.map.removeLayer(marker); continue; }
      const telemetry = networkTelemetry(bus, { progress: this.options.progress, paused: this.options.paused, elapsed: this.options.elapsed() });
      if (!telemetry.position) continue;
      if (!marker) {
        marker = L.marker(telemetry.position, {
          icon: L.divIcon({ className: "network-vehicle " + bus.status + (bus.id === this.options.selectedBus ? " is-selected" : ""),
            html: '<span class="network-vehicle-icon">' + icon("bus", 18) + '</span><strong>' + e(bus.label) + '</strong>',
            iconSize: [64, 34], iconAnchor: [32, 17] }),
          title: "Bus " + bus.label + " · " + bus.branchName, alt: "View bus " + bus.label + " activity", keyboard: true, riseOnHover: true,
          zIndexOffset: bus.id === this.options.selectedBus ? 900 : 100,
        });
        marker.on("click", () => this.options.onBusSelect(bus.id));
        this.busMarkers.set(bus.id, marker);
      }
      marker.setLatLng(telemetry.position);
      if (!this.map.hasLayer(marker)) marker.addTo(this.map);
      const element = marker.getElement();
      if (element) {
        element.dataset.bus = bus.id;
        element.setAttribute("role", "button");
        element.setAttribute("aria-label", "View bus " + bus.label + " activity, " + bus.branchName);
        element.setAttribute("aria-pressed", String(bus.id === this.options.selectedBus));
      }
    }
  }

  updateClusters() {
    const L = window.L, groups = new Map(), keep = new Set();
    for (const bus of this.options.fleet) {
      if (this.options.status !== "all" && this.options.status !== bus.status) continue;
      const telemetry = networkTelemetry(bus, { progress: this.options.progress, paused: this.options.paused, elapsed: this.options.elapsed() });
      if (!telemetry.position) continue;
      const p = this.map.latLngToContainerPoint(telemetry.position);
      const key = Math.floor(p.x / 48) + ":" + Math.floor(p.y / 40);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push({ bus, position: telemetry.position });
    }
    for (const entries of groups.values()) {
      const key = entries.map(({ bus }) => bus.id).sort().join(",");
      keep.add(key);
      const position = [0, 1].map((axis) => entries.reduce((sum, entry) => sum + entry.position[axis], 0) / entries.length);
      let marker = this.clusterMarkers.get(key);
      if (!marker) {
        const tone = entries.some(({ bus }) => bus.status === "delayed") ? "delayed" : entries.every(({ bus }) => bus.status === "school") ? "school" : "route";
        marker = L.marker(position, {
          icon: L.divIcon({ className: "network-vehicle-cluster " + tone, html: icon("bus", 17) + "<strong>" + entries.length + "</strong>", iconSize: [40, 29], iconAnchor: [20, 14] }),
          title: entries.length + " buses · " + [...new Set(entries.map(({ bus }) => bus.branchName))].join(", "),
          keyboard: true, riseOnHover: true,
        });
        marker.on("click", () => {
          if (entries.length === 1) this.options.onBusSelect(entries[0].bus.id);
          else this.map.fitBounds(entries.map((entry) => entry.position), { ...this.focusPadding(), maxZoom: 13, animate: false });
        });
        this.clusterMarkers.set(key, marker);
      }
      marker.setLatLng(position);
      if (!this.map.hasLayer(marker)) marker.addTo(this.map);
      marker.getElement().dataset.busCount = entries.length;
      marker.getElement().setAttribute("aria-label", "View " + entries.length + " buses near " + entries[0].bus.branchName);
      const p = this.map.latLngToContainerPoint(position);
      this.markerObstacles.push({ x: p.x - 21, y: p.y - 16, width: 42, height: 32 });
    }
    for (const [key, marker] of this.clusterMarkers) if (!keep.has(key)) { this.map.removeLayer(marker); this.clusterMarkers.delete(key); }
  }

  drawLabels() {
    const width = this.stage.clientWidth, height = this.stage.clientHeight;
    const bubbles = [];
    for (const entry of this.labels) {
      const { x, y } = this.map.latLngToContainerPoint([entry.branch.lat, entry.branch.lon]);
      entry.label.hidden = x < -20 || x > width + 20 || y < 50 || y > height - 28;
      if (entry.label.hidden) continue;
      const w = entry.label.offsetWidth, h = entry.label.offsetHeight;
      bubbles.push({ ...entry, width: w, height: h, anchorX: x - w / 2, anchorY: y - h / 2, x: x - w / 2, y: y - h / 2 });
    }
    this.arrangeBubbles(bubbles, width, height);
    for (const bubble of bubbles) bubble.label.style.transform = "translate(" + bubble.x + "px," + bubble.y + "px)";
  }

  arrangeBubbles(bubbles, width, height) {
    const stageBox = this.stage.getBoundingClientRect();
    const occupied = this.markerObstacles.map((rect) => ({ ...rect }));
    const hud = this.stage.parentElement.querySelector(".network-map-hud");
    const controls = this.stage.querySelector(".school-map-controls");
    for (const element of [hud, controls]) {
      if (!element || !element.offsetHeight) continue;
      const box = element.getBoundingClientRect();
      occupied.push({ x: box.x - stageBox.x - 5, y: box.y - stageBox.y - 5, width: box.width + 10, height: box.height + 10 });
    }
    const overlaps = (candidate) => occupied.some((box) =>
      candidate.x < box.x + box.width + 5 && candidate.x + candidate.width + 5 > box.x &&
      candidate.y < box.y + box.height + 5 && candidate.y + candidate.height + 5 > box.y);
    for (const bubble of bubbles.sort((a, b) => a.anchorY - b.anchorY || a.anchorX - b.anchorX)) {
      let best = null, score = Infinity;
      const minX = 9, maxX = width - bubble.width - 9;
      const minY = 12, maxY = height - bubble.height - 30;
      const consider = (x, y) => {
        const candidateScore = (x - bubble.anchorX) ** 2 + (y - bubble.anchorY) ** 2 * 1.2;
        const maximumDisplacement = width < 550 ? 34 : 70;
        if (candidateScore > maximumDisplacement ** 2) return;
        if (candidateScore >= score || overlaps({ x, y, width: bubble.width, height: bubble.height })) return;
        best = { x, y }; score = candidateScore;
      };
      consider(Math.max(minX, Math.min(maxX, bubble.anchorX)), Math.max(minY, Math.min(maxY, bubble.anchorY)));
      if (score !== 0) for (let y = minY; y <= maxY; y += 8) for (let x = minX; x <= maxX; x += 10) consider(x, y);
      if (best) { bubble.x = best.x; bubble.y = best.y; }
      else { bubble.label.hidden = true; continue; }
      occupied.push({ x: bubble.x, y: bubble.y, width: bubble.width, height: bubble.height });
    }
  }

  destroy() {
    clearInterval(this.timer);
    clearTimeout(this.tileNoticeTimer);
    this.controller.abort();
    this.resize.disconnect();
    this.map.remove();
  }
}
