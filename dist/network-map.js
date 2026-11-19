import { islandPolygons } from "./sri-lanka-land.js";
import { mainRoads } from "./sri-lanka-roads.js";
import { icon } from "./icons.js";

export class SchoolNetworkMap {
  constructor(stage, results, selected, onSelect, viewport) {
    this.stage = stage;
    this.selected = selected;
    this.zoom = viewport?.zoom ?? 1;
    this.offset = viewport?.offset ?? [0, 0];
    this.controller = new AbortController();
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.className = "school-network-canvas";
    stage.append(this.canvas);
    this.labels = results.map(({ branch }) => {
      const label = document.createElement("button");
      label.type = "button";
      label.className = "school-branch-bubble";
      label.classList.toggle("is-selected", branch.id === selected);
      label.dataset.branch = branch.id;
      label.dataset.focus = "network-pin-" + branch.id;
      label.textContent = branch.name;
      label.setAttribute("aria-label", "View " + branch.name + " performance");
      label.setAttribute("aria-pressed", String(branch.id === selected));
      label.addEventListener("click", () => onSelect(branch.id, label.dataset.focus), { signal: this.controller.signal });
      stage.append(label);
      return { branch, label };
    });
    stage.insertAdjacentHTML("beforeend", `<div class="school-map-controls" role="group" aria-label="Map controls">
      <button type="button" data-school-map="in" aria-label="Zoom in" title="Zoom in">${icon("plus", 19)}</button>
      <button type="button" data-school-map="out" aria-label="Zoom out" title="Zoom out">${icon("minus", 19)}</button>
      <button type="button" data-school-map="reset" aria-label="View whole island" title="View whole island">${icon("locate", 19)}</button>
    </div>`);
    this.bindControls();
    this.resize = new ResizeObserver(() => this.draw());
    this.resize.observe(stage);
    document.fonts.ready.then(() => { if (!this.controller.signal.aborted) this.draw(); });
    this.draw();
  }

  get viewport() {
    return { zoom: this.zoom, offset: this.offset };
  }

  bindControls() {
    const { signal } = this.controller;
    for (const button of this.stage.querySelectorAll("[data-school-map]")) {
      button.addEventListener("click", () => {
        if (button.dataset.schoolMap === "in") this.zoom = Math.min(4, this.zoom * 1.3);
        if (button.dataset.schoolMap === "out") this.zoom = Math.max(1, this.zoom / 1.3);
        if (button.dataset.schoolMap === "reset" || this.zoom === 1) {
          this.offset = [0, 0];
          this.zoom = 1;
        }
        this.draw();
      }, { signal });
    }
    let drag = null;
    this.stage.addEventListener("pointerdown", (event) => {
      if (event.button !== 0 || event.target.closest("button, a")) return;
      drag = { x: event.clientX, y: event.clientY, start: [...this.offset], id: event.pointerId };
      this.stage.setPointerCapture(event.pointerId);
      this.stage.classList.add("is-dragging");
    }, { signal });
    this.stage.addEventListener("pointermove", (event) => {
      if (!drag || drag.id !== event.pointerId) return;
      this.offset = [drag.start[0] + event.clientX - drag.x, drag.start[1] + event.clientY - drag.y];
      this.scheduleDraw();
    }, { signal });
    const endDrag = () => {
      drag = null;
      this.stage.classList.remove("is-dragging");
    };
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"]) this.stage.addEventListener(type, endDrag, { signal });
    this.stage.addEventListener("wheel", (event) => {
      if (!event.ctrlKey && !event.metaKey) return;
      event.preventDefault();
      this.zoom = Math.max(1, Math.min(4, this.zoom * (event.deltaY < 0 ? 1.12 : 0.89)));
      if (this.zoom === 1) this.offset = [0, 0];
      this.scheduleDraw();
    }, { signal, passive: false });
    this.stage.addEventListener("keydown", (event) => {
      if (event.target !== this.stage) return;
      const moves = { ArrowLeft: [35, 0], ArrowRight: [-35, 0], ArrowUp: [0, 35], ArrowDown: [0, -35] };
      const movement = moves[event.key];
      if (!movement) return;
      event.preventDefault();
      this.offset = [this.offset[0] + movement[0], this.offset[1] + movement[1]];
      this.draw();
    }, { signal });
  }

  scheduleDraw() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.draw();
    });
  }

  draw() {
    const width = this.stage.clientWidth;
    const height = this.stage.clientHeight;
    if (!width || !height) return;
    const density = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = width * density;
    this.canvas.height = height * density;
    const ctx = this.canvas.getContext("2d");
    ctx.setTransform(density, 0, 0, density, 0, 0);
    const scale = Math.min((width - 44) / 2.55, (height - 62) / 4) * this.zoom;
    const project = (lon, lat) => [width / 2 + (lon - 80.7) * scale * 0.99 + this.offset[0], height / 2 - (lat - 7.85) * scale + this.offset[1]];
    const water = ctx.createLinearGradient(0, 0, width, height);
    water.addColorStop(0, "#e7f0f3");
    water.addColorStop(0.55, "#dcebf1");
    water.addColorStop(1, "#edf4f4");
    ctx.fillStyle = water;
    ctx.fillRect(0, 0, width, height);

    const land = new Path2D();
    for (const polygon of islandPolygons) {
      polygon.forEach(([lon, lat], index) => {
        const [x, y] = project(lon, lat);
        if (index === 0) land.moveTo(x, y); else land.lineTo(x, y);
      });
      land.closePath();
    }
    ctx.shadowColor = "#628da638";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 3;
    ctx.fillStyle = "#dbe7d4";
    ctx.fill(land);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = "#fbfdf8";
    ctx.lineWidth = 3;
    ctx.stroke(land);

    ctx.save();
    ctx.clip(land);
    const terrain = ctx.createLinearGradient(width * 0.4, height * 0.2, width * 0.6, height * 0.85);
    terrain.addColorStop(0, "#dce7ce");
    terrain.addColorStop(0.58, "#c7dbb8");
    terrain.addColorStop(1, "#dce8d3");
    ctx.fillStyle = terrain;
    ctx.fillRect(0, 0, width, height);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (const [kind, points] of mainRoads) {
      ctx.beginPath();
      points.forEach(([lon, lat], index) => {
        const [x, y] = project(lon, lat);
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = kind === "motorway" ? "#e8ca92" : kind === "trunk" ? "#f5edce" : "#f4f7eabf";
      ctx.lineWidth = (kind === "primary" ? 0.8 : 1.25) * Math.min(this.zoom, 1.8);
      ctx.stroke();
    }
    ctx.restore();
    const [countryX, countryY] = project(80.58, 8.8);
    ctx.textAlign = "center";
    ctx.fillStyle = "#6a866277";
    ctx.font = "650 15px 'DM Sans', sans-serif";
    ctx.fillText("SRI LANKA", countryX, countryY);
    ctx.fillStyle = "#7a9bab8c";
    ctx.font = "500 12px 'DM Sans', sans-serif";
    const [oceanX, oceanY] = project(81.7, 8.1);
    ctx.fillText("INDIAN OCEAN", oceanX, oceanY);
    ctx.fillStyle = "#66848b";
    ctx.font = "700 12px 'DM Sans', sans-serif";
    ctx.fillText("N", width - 27, 32);
    ctx.beginPath(); ctx.moveTo(width - 27, 40); ctx.lineTo(width - 27, 58); ctx.strokeStyle = "#78949a"; ctx.lineWidth = 1; ctx.stroke();

    const bubbles = [];
    for (const entry of this.labels) {
      const [x, y] = project(entry.branch.lon, entry.branch.lat);
      const hidden = this.zoom > 1 && (x < -65 || x > width + 65 || y < -65 || y > height + 65);
      entry.label.hidden = hidden;
      if (hidden) continue;
      const bubbleWidth = entry.label.offsetWidth;
      const bubbleHeight = entry.label.offsetHeight;
      bubbles.push({ ...entry, width: bubbleWidth, height: bubbleHeight, anchorX: x - bubbleWidth / 2, anchorY: y - bubbleHeight / 2, x: x - bubbleWidth / 2, y: y - bubbleHeight / 2 });
    }
    this.arrangeBubbles(bubbles, width, height);
    for (const bubble of bubbles) bubble.label.style.transform = `translate(${bubble.x}px, ${bubble.y}px)`;
    this.stage.querySelector('[data-school-map="in"]').disabled = this.zoom >= 4;
    this.stage.querySelector('[data-school-map="out"]').disabled = this.zoom <= 1;
  }

  arrangeBubbles(bubbles, width, height) {
    const padding = 9;
    const footerHeight = this.stage.parentElement.querySelector(".map-explorer-attribution")?.offsetHeight || 24;
    const gap = width < 500 ? 5 : 7;
    for (let iteration = 0; iteration < 450; iteration += 1) {
      for (const bubble of bubbles) {
        if (iteration < 120) {
          bubble.x += (bubble.anchorX - bubble.x) * 0.025;
          bubble.y += (bubble.anchorY - bubble.y) * 0.025;
        }
      }
      for (let i = 0; i < bubbles.length; i += 1) {
        for (let j = i + 1; j < bubbles.length; j += 1) {
          const a = bubbles[i];
          const b = bubbles[j];
          const dx = (a.x + a.width / 2) - (b.x + b.width / 2);
          const dy = (a.y + a.height / 2) - (b.y + b.height / 2);
          const overlapX = (a.width + b.width) / 2 + gap - Math.abs(dx);
          const overlapY = (a.height + b.height) / 2 + gap - Math.abs(dy);
          if (overlapX <= 0 || overlapY <= 0) continue;
          if (overlapY < overlapX) {
            const shift = (overlapY / 2 + 0.2) * (a.anchorY >= b.anchorY ? 1 : -1);
            a.y += shift; b.y -= shift;
          } else {
            const shift = (overlapX / 2 + 0.2) * (dx >= 0 ? 1 : -1);
            a.x += shift; b.x -= shift;
          }
        }
      }
      for (const bubble of bubbles) {
        bubble.x = Math.max(padding, Math.min(width - bubble.width - padding, bubble.x));
        bubble.y = Math.max(26, Math.min(height - bubble.height - footerHeight - 12, bubble.y));
      }
    }
  }

  destroy() {
    this.resize.disconnect();
    this.controller.abort();
    if (this.frame) cancelAnimationFrame(this.frame);
  }
}

