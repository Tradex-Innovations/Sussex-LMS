import { icon } from "./icons.js";
import { geometry } from "./routes.js";
import { branchDirectory } from "./network-data.js";

const { width: mapWidth, height: mapHeight, routes } = geometry;

function demoRoute(coordinates, stopCoordinates) {
  let distance = 0;
  const points = coordinates.map((point, index) => {
    if (index) distance += Math.hypot(point[0] - coordinates[index - 1][0], point[1] - coordinates[index - 1][1]);
    return [point[0], point[1], distance];
  });
  return {
    points, length: distance,
    stops: stopCoordinates.map((stop) => {
      let nearest = points[0];
      let nearestDistance = Infinity;
      for (const point of points) {
        const difference = Math.hypot(point[0] - stop[0], point[1] - stop[1]);
        if (difference < nearestDistance) {
          nearest = point;
          nearestDistance = difference;
        }
      }
      return nearest[2] / distance;
    }),
    focus: [
      (Math.min(...points.map((point) => point[0])) + Math.max(...points.map((point) => point[0]))) / 2,
      (Math.min(...points.map((point) => point[1])) + Math.max(...points.map((point) => point[1]))) / 2,
    ],
  };
}

const reverseLake = [...routes["02"].points].reverse();
const rajagiriyaIndex = routes["02"].points.findIndex((point) => point[2] / routes["02"].length >= routes["02"].stops[2]);
const toLakeside = routes["02"].points.slice(0, rajagiriyaIndex + 1).reverse();
const diyatha = routes["02"].points.find((point) => point[2] / routes["02"].length >= routes["02"].stops[1]);
const nawala = routes["01"].points.find((point) => point[2] / routes["01"].length >= routes["01"].stops[1]);
routes["07"] = demoRoute(toLakeside, [toLakeside[0], diyatha, toLakeside.at(-1)]);
routes["08"] = demoRoute([...routes["01"].points, ...reverseLake.slice(1)], [routes["01"].points[0], nawala, toLakeside[0], diyatha, toLakeside.at(-1)]);

export const campusPoints = Object.fromEntries(branchDirectory.map((branch) => [
  branch.id,
  [(branch.lon - 79.835) * mapWidth / (79.993 - 79.835), (6.933 - branch.lat) * mapHeight / (6.933 - 6.832)],
]));

export function routeProgress(bus) {
  return routes[bus.id]?.stops ?? bus.stopProgress ?? bus.stops.map((_, index) => index / (bus.stops.length - 1));
}

function pointAt(route, progress) {
  const points = route.points;
  const distance = route.length * Math.min(1, Math.max(0, progress));
  const next = points.findIndex((point) => point[2] >= distance);
  if (next < 1) return points[0];
  const a = points[next - 1];
  const b = points[next];
  const fraction = (distance - a[2]) / (b[2] - a[2] || 1);
  return [a[0] + fraction * (b[0] - a[0]), a[1] + fraction * (b[1] - a[1])];
}

export class FleetMap {
  constructor(stage, options) {
    this.stage = stage;
    this.options = options;
    this.zoom = options.viewport?.zoom ?? 1;
    this.offset = options.viewport?.offset ?? [0, 0];
    this.showRoutes = options.viewport?.showRoutes ?? true;
    this.controller = new AbortController();

    stage.innerHTML = `
      <img class="basemap" src="./assets/colombo-map.webp" alt="" draggable="false">
      <canvas class="route-canvas" aria-hidden="true"></canvas>
      <div class="map-pins"></div>
      <div class="map-controls">
        <div class="zoom-controls">
          <button type="button" data-map="in" aria-label="Zoom in" title="Zoom in">${icon("plus", 18)}</button>
          <button type="button" data-map="out" aria-label="Zoom out" title="Zoom out">${icon("minus", 18)}</button>
        </div>
        <button class="recenter-control" type="button" data-map="reset" aria-label="Recenter map" title="Recenter map">${icon("locate", 18)}</button>
      </div>
      <button class="route-control" type="button" data-map="routes" aria-pressed="${this.showRoutes}">${icon("route", 16)} <span>Routes</span></button>
      <a class="map-attribution" href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">© OpenStreetMap contributors</a>
    `;
    this.image = stage.querySelector(".basemap");
    this.canvas = stage.querySelector("canvas");
    const pins = stage.querySelector(".map-pins");
    this.schoolPins = (options.schools || []).map((branch) => {
      const pin = document.createElement("div");
      pin.className = "school-map-pin";
      pin.innerHTML = `<span>${icon("school", 17)}</span><strong></strong>`;
      pin.querySelector("strong").textContent = branch.school;
      const parked = options.buses.filter((bus) => bus.branch === branch.id && bus.status === "school").length;
      if (parked) {
        const badge = document.createElement("small");
        badge.textContent = parked;
        pin.append(badge);
      }
      pins.append(pin);
      return { pin, point: campusPoints[branch.id] };
    });

    this.markers = new Map();
    const busMarkers = options.buses.filter((bus) => routes[bus.id] && bus.status !== "school");
    for (const bus of busMarkers) {
      const marker = document.createElement(options.onSelect ? "button" : "div");
      const selected = options.selected === bus.id;
      marker.className = `bus-map-pin ${selected ? "is-selected" : ""} ${bus.status === "delayed" ? "is-delayed" : ""}`;
      marker.style.setProperty("--pin-color", bus.color);
      marker.innerHTML = `<span class="pin-icon">${icon("bus", selected ? 19 : 17)}</span><span class="pin-label">BUS ${bus.id}</span>`;
      if (options.onSelect) {
        marker.type = "button";
        marker.setAttribute("aria-label", `Bus ${bus.id}, ${bus.name}`);
        marker.setAttribute("aria-pressed", String(selected));
        marker.dataset.focus = `map-bus-${bus.id}`;
        marker.addEventListener("click", () => options.onSelect(bus.id, marker.dataset.focus), { signal: this.controller.signal });
      }
      this.markers.set(bus, marker);
      pins.append(marker);
    }

    this.bindControls();
    this.bindDrag();
    this.resize = new ResizeObserver(() => this.draw());
    this.resize.observe(stage);
    this.draw();
    this.timer = setInterval(() => this.updateMarkers(), 1000);
  }

  bindControls() {
    const { signal } = this.controller;
    for (const button of this.stage.querySelectorAll("[data-map]")) {
      button.addEventListener("click", () => {
        switch (button.dataset.map) {
          case "in":
            this.zoom = Math.min(2.8, this.zoom * 1.25);
            break;
          case "out":
            this.zoom = Math.max(1, this.zoom / 1.25);
            break;
          case "reset":
            this.zoom = 1;
            this.offset = [0, 0];
            break;
          case "routes":
            this.showRoutes = !this.showRoutes;
            button.setAttribute("aria-pressed", String(this.showRoutes));
            break;
        }
        this.draw();
      }, { signal });
    }

    this.stage.addEventListener("keydown", (event) => {
      if (event.target !== this.stage) return;
      const step = 30;
      const offsets = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      const shift = offsets[event.key];
      if (!shift) return;
      event.preventDefault();
      this.offset = [this.offset[0] + shift[0], this.offset[1] + shift[1]];
      this.draw();
    }, { signal });
  }

  bindDrag() {
    const { signal } = this.controller;
    let drag = null;
    const stage = this.stage;

    stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button, a, .map-summary")) return;
      drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY, from: [...this.offset] };
    }, { signal });

    stage.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointer !== event.pointerId) return;
      if (event.pointerType === "mouse" && !(event.buttons & 1)) {
        drag = null;
        return;
      }
      const dx = event.clientX - drag.x;
      const dy = event.clientY - drag.y;
      if (!stage.hasPointerCapture(event.pointerId)) {
        if (Math.hypot(dx, dy) < 5) return;
        stage.setPointerCapture(event.pointerId);
        stage.classList.add("is-dragging");
      }
      this.offset = [drag.from[0] + dx, drag.from[1] + dy];
      this.draw();
    }, { signal });

    const end = () => {
      drag = null;
      stage.classList.remove("is-dragging");
    };
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) {
      stage.addEventListener(type, end, { signal });
    }
  }

  draw() {
    const width = this.stage.clientWidth;
    const height = this.stage.clientHeight;
    if (!width || !height) return;

    const isFleet = this.options.buses.length > 1;
    const selectedRoute = routes[this.options.selected];
    const focus = isFleet || !selectedRoute ? geometry.focus : selectedRoute.focus;
    const scale = Math.max(width / mapWidth, height / mapHeight) * this.zoom;
    const clampOffset = (value, size, worldSize) => Math.min(0, Math.max(size - worldSize * scale, value));

    const left = clampOffset(width / 2 - focus[0] * scale + this.offset[0], width, mapWidth);
    const top = clampOffset(height / 2 - focus[1] * scale + this.offset[1], height, mapHeight);
    this.projection = { left, top, scale };
    this.image.style.width = `${mapWidth * scale}px`;
    this.image.style.height = `${mapHeight * scale}px`;
    this.image.style.transform = `translate(${left}px, ${top}px)`;

    const density = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(width * density);
    this.canvas.height = Math.round(height * density);
    const ctx = this.canvas.getContext("2d");
    ctx.setTransform(density, 0, 0, density, 0, 0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (this.showRoutes) {
      const visible = this.options.buses.filter((bus) => routes[bus.id] && (bus.status === "route" || bus.status === "delayed" || bus.id === this.options.selected));
      for (const bus of visible.filter((bus) => bus.id !== this.options.selected)) this.drawRoute(ctx, bus);
      const current = visible.find((bus) => bus.id === this.options.selected);
      if (current) this.drawRoute(ctx, current);
    }

    for (const { pin, point } of this.schoolPins) this.place(pin, point);
    this.stage.classList.add("is-positioning");
    this.updateMarkers();
    this.stage.getBoundingClientRect();
    this.stage.classList.remove("is-positioning");
    this.stage.querySelector('[data-map="out"]').disabled = this.zoom <= 1.001;
    this.stage.querySelector('[data-map="in"]').disabled = this.zoom >= 2.8;
  }

  project(point) {
    const { left, top, scale } = this.projection;
    return [point[0] * scale + left, point[1] * scale + top];
  }

  drawRoute(ctx, bus) {
    const route = routes[bus.id];
    const selected = bus.id === this.options.selected;
    const stale = bus.status === "delayed";
    const lineWidth = selected ? 4.6 : 3.5;
    ctx.beginPath();
    route.points.forEach((point, index) => {
      const [x, y] = this.project(point);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.setLineDash(stale ? [6, 6] : []);
    ctx.strokeStyle = "rgba(255,255,255,.94)";
    ctx.lineWidth = lineWidth + 3.2;
    ctx.stroke();
    ctx.strokeStyle = bus.color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.setLineDash([]);

    if (selected) {
      for (const stop of route.stops.slice(0, -1)) {
        const [x, y] = this.project(pointAt(route, stop));
        ctx.beginPath();
        ctx.arc(x, y, 3.6, 0, Math.PI * 2);
        ctx.fillStyle = "#fff";
        ctx.fill();
        ctx.lineWidth = 1.7;
        ctx.strokeStyle = bus.color;
        ctx.stroke();
      }
    }
  }

  place(element, point) {
    const [x, y] = this.project(point);
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
  }

  updateMarkers() {
    if (!this.projection) return;
    for (const [bus, marker] of this.markers) {
      this.place(marker, pointAt(routes[bus.id], this.options.progress(bus)));
    }
    this.options.onTick?.();
  }

  get viewport() {
    return { zoom: this.zoom, offset: this.offset, showRoutes: this.showRoutes };
  }

  destroy() {
    clearInterval(this.timer);
    this.resize.disconnect();
    this.controller.abort();
  }
}
