import { islandPolygons } from "./sri-lanka-land.js";
import { performanceTone } from "./network-analytics.js";

const palette = { green: "#287052", blue: "#537c9d", amber: "#b57a34" };

export class SchoolNetworkMap {
  constructor(stage, results, selected, onSelect) {
    this.stage = stage;
    this.results = results;
    this.selected = selected;
    this.controller = new AbortController();
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("aria-hidden", "true");
    this.canvas.className = "school-network-canvas";
    stage.append(this.canvas);
    this.labels = results.map((result) => {
      const label = document.createElement("button");
      label.type = "button";
      label.className = "school-location-label";
      label.classList.toggle("is-selected", result.branch.id === selected);
      label.dataset.branch = result.branch.id;
      label.dataset.focus = "network-pin-" + result.branch.id;
      label.textContent = result.branch.name;
      label.setAttribute("aria-label", result.branch.name + ", sample average " + result.mean + " percent");
      label.setAttribute("aria-pressed", String(result.branch.id === selected));
      label.style.setProperty("--school-color", palette[performanceTone(result.mean)]);
      label.addEventListener("click", () => onSelect(result.branch.id, label.dataset.focus), { signal: this.controller.signal });
      stage.append(label);
      return { result, label };
    });
    this.resize = new ResizeObserver(() => this.draw());
    this.resize.observe(stage);
    this.draw();
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
    ctx.clearRect(0, 0, width, height);
    const scale = Math.min((width - 45) / 2.5, (height - 48) / 4);
    const project = (lon, lat) => [width / 2 + (lon - 80.7) * scale * 0.99, height / 2 - (lat - 7.85) * scale];

    ctx.fillStyle = "#e9f0ef";
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = "#e0e9e6";
    ctx.lineWidth = 1;
    for (const longitude of [79.5, 80.5, 81.5]) {
      const [x] = project(longitude, 7);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (const latitude of [6, 7, 8, 9]) {
      const [, y] = project(80, latitude);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }

    for (const polygon of islandPolygons) {
      ctx.beginPath();
      polygon.forEach(([lon, lat], index) => {
        const [x, y] = project(lon, lat);
        if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.fillStyle = "#d4e2d0";
      ctx.shadowColor = "#8ba39824";
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#fafffa";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    ctx.textAlign = "center";
    ctx.fillStyle = "#779581";
    ctx.font = "600 12px 'DM Sans', sans-serif";
    const [countryX, countryY] = project(80.55, 8.85);
    ctx.fillText("SRI LANKA", countryX, countryY);
    ctx.font = "500 11px 'DM Sans', sans-serif";
    ctx.fillStyle = "#8fa5a5";
    const [oceanX, oceanY] = project(81.45, 8.45);
    ctx.fillText("INDIAN OCEAN", oceanX, oceanY);
    ctx.fillStyle = "#607c72";
    ctx.font = "700 12px 'DM Sans', sans-serif";
    ctx.fillText("N", width - 25, 28);
    ctx.beginPath(); ctx.moveTo(width - 25, 35); ctx.lineTo(width - 25, 54); ctx.strokeStyle = "#607c72"; ctx.stroke();
    const scaleWidth = 50 / 111 * scale;
    ctx.beginPath(); ctx.moveTo(17, height - 22); ctx.lineTo(17 + scaleWidth, height - 22); ctx.strokeStyle = "#778e85"; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "500 10px 'DM Sans', sans-serif"; ctx.textAlign = "left"; ctx.fillText("50 km", 17, height - 30);

    const groups = { left: [], right: [] };
    for (const entry of this.labels) {
      const { branch } = entry.result;
      entry.point = project(branch.lon, branch.lat);
      const side = branch.lon < 80.3 || branch.slug === "anuradhapura" ? "left" : "right";
      groups[side].push(entry);
    }
    const labelWidth = Math.min(126, width * 0.3);
    const gap = width < 400 ? 30 : 29;
    for (const [side, entries] of Object.entries(groups)) {
      entries.sort((a, b) => a.point[1] - b.point[1]);
      let previous = 25;
      for (const entry of entries) {
        entry.labelY = Math.max(entry.point[1], previous + gap);
        previous = entry.labelY;
      }
      const overflow = Math.max(0, previous - (height - 50));
      for (const entry of entries) {
        const { label, point, result } = entry;
        entry.labelY -= overflow;
        const x = side === "left" ? 9 : width - labelWidth - 9;
        label.style.left = x + "px";
        label.style.top = (entry.labelY - 13) + "px";
        label.style.width = labelWidth + "px";
        const endpoint = side === "left" ? x + labelWidth : x;
        const selected = result.branch.id === this.selected;
        ctx.beginPath();
        ctx.moveTo(point[0], point[1]);
        ctx.lineTo(endpoint + (side === "left" ? 7 : -7), entry.labelY);
        ctx.lineTo(endpoint, entry.labelY);
        ctx.strokeStyle = selected ? "#486e50" : "#819a8d99";
        ctx.lineWidth = selected ? 1.5 : 0.8;
        ctx.stroke();
      }
    }

    const ordered = [...this.labels].sort((a, b) => Number(a.result.branch.id === this.selected) - Number(b.result.branch.id === this.selected));
    for (const { point, result } of ordered) {
      const selected = result.branch.id === this.selected;
      if (selected) {
        ctx.beginPath(); ctx.arc(...point, 11, 0, Math.PI * 2); ctx.fillStyle = "#f7fbf8c9"; ctx.fill();
        ctx.beginPath(); ctx.arc(...point, 10, 0, Math.PI * 2); ctx.strokeStyle = "#f0c762"; ctx.lineWidth = 2.5; ctx.stroke();
      }
      ctx.beginPath(); ctx.arc(...point, selected ? 5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = palette[performanceTone(result.mean)]; ctx.fill();
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  destroy() {
    this.resize.disconnect();
    this.controller.abort();
  }
}

