import { statuses } from "./data.js";
import { icon } from "./icons.js";
import { can } from "./access.js";
import { routeProgress } from "./map.js";
import { badge, button, childSelect, emptyState, escapeHtml as e, iconTile, pageHeading, statusBadge } from "./ui.js";

export function nextStop(bus, progress) {
  const stops = routeProgress(bus);
  const nextIndex = stops.findIndex((value) => value > progress + 0.005);
  const index = nextIndex < 0 ? bus.stops.length - 1 : nextIndex;
  return { index, label: bus.stops[index] };
}

function filterLabel(status) {
  return status === "all" ? "All statuses" : statuses[status].label;
}

function stat(label, value, name, tone, filter, current) {
  return `<button type="button" class="stat-card surface ${filter === current && filter !== "all" ? "is-filtered" : ""}" data-action="filter" data-value="${filter}" data-focus="stat-${filter}" aria-pressed="${filter === current}">
    ${iconTile(name, tone)}
    <span class="stat-text"><span class="stat-label">${label}</span><strong>${value}</strong></span>
  </button>`;
}

function filterSelect(current) {
  const values = ["all", "route", "school", "delayed"];
  return `<label class="select-wrap fleet-filter">
    <span class="sr-only">Filter buses by status</span>
    <select data-change="filter" data-focus="fleet-status">
      ${values.map((status) => `<option value="${status}" ${status === current ? "selected" : ""}>${filterLabel(status)}</option>`).join("")}
    </select>
    ${icon("chevronDown", 15)}
  </label>`;
}

function fleetRow(bus, selected) {
  return `<button type="button" class="fleet-row ${selected ? "is-selected" : ""}" data-action="bus" data-value="${bus.id}" data-focus="fleet-${bus.id}" aria-pressed="${selected}">
    <span class="fleet-bus-icon" style="--route-color:${bus.color}">${icon("bus", 20)}</span>
    <span class="fleet-bus-label"><strong>BUS ${bus.id}</strong><small>${e(bus.name)} · ${e(bus.trackerId || "No GPS tracker")}</small></span>
    ${statusBadge(bus.status)}
  </button>`;
}

function mapSummary(bus, progress) {
  if (!bus) return "";
  const arrived = bus.status === "school";
  return `<div class="map-summary">
    <div class="map-summary-top">${iconTile("bus", statuses[bus.status].tone, "small-tile")}
      <div><strong>BUS ${bus.id}</strong><span>${e(bus.name)}</span></div>
    </div>
    <div class="map-summary-detail">${icon(arrived ? "checkCircle" : "pin", 15)}
      <span>${arrived ? "Arrived at" : "Next stop"} <strong ${arrived ? "" : "data-next-stop"}>${e(arrived ? bus.stops.at(-1) : nextStop(bus, progress).label)}</strong></span>
    </div>
  </div>`;
}

function mapPanel(title, context, bus, paused) {
  return `<section class="surface map-card">
    <header class="panel-heading map-heading">
      <div class="panel-title-icon">
        ${iconTile("map", "green", "small-tile")}
        <div><h2>${title}</h2><p>${context}</p></div>
      </div>
      ${badge(paused ? "Simulation paused" : "Live simulation", paused ? "neutral" : "green", true)}
    </header>
    <div class="map-frame">
      <div id="map-stage" class="map-stage" tabindex="0" role="region" aria-label="${title}. Use arrow keys to pan."></div>
    </div>
    <div class="map-footer">
      <span>${icon("pin", 14)} Colombo, Sri Lanka</span>
      <span>${icon("signal", 15)} ${bus?.status === "delayed" ? "Last signal 6 min ago" : paused ? "Updates paused" : "Simulated GPS"}</span>
    </div>
  </section>`;
}

function adminTransport({ fleet, filter, selected, paused, context }) {
  const count = (status) => fleet.filter((bus) => bus.status === status).length;
  const visible = filter === "all" ? fleet : fleet.filter((bus) => bus.status === filter);
  const current = fleet.find((bus) => bus.id === selected);
  return `
    ${pageHeading("Bus tracking", "24/7 school fleet visibility from bus GPS trackers. Device locations are simulated.",
      `<span class="run-label">${icon("calendar", 16)} 24/7 management</span>${current && can(context, "transport.manage") ? button("Manage bus", "edit-bus", { value: current.id, variant: "secondary", iconName: "edit" }) : ""}${button(paused ? "Resume simulation" : "Pause simulation", "pause", { variant: "secondary", iconName: paused ? "play" : "pause", focus: "pause" })}`)}
    <div class="stats-grid" aria-label="Fleet status">
      ${stat("Total buses", fleet.length, "bus", "neutral", "all", filter)}
      ${stat("On route", count("route"), "route", "green", "route", filter)}
      ${stat("At school", count("school"), "school", "blue", "school", filter)}
      ${stat("Signal delayed", count("delayed"), "alert", "amber", "delayed", filter)}
    </div>
    <div class="tracking-grid">
      ${mapPanel("Live fleet map", "School fleet · 24/7 GPS source", current, paused)}
      <section class="surface fleet-card">
        <header class="panel-heading fleet-heading">
          <div><h2>Bus fleet</h2><p>${fleet.length} buses assigned today</p></div>
        </header>
        ${filterSelect(filter)}
        <div class="fleet-rows" aria-label="Buses">
          ${visible.length ? visible.map((bus) => fleetRow(bus, bus.id === selected)).join("") : emptyState("bus", "No matching buses", "Choose another status to see more buses.")}
        </div>
        <div class="fleet-footer">${icon("pin", 15)} Select a bus to see its route.</div>
      </section>
    </div>`;
}

function routeStops(bus, progress) {
  const arrived = bus.status === "school";
  const next = nextStop(bus, progress).index;
  return `<section class="surface route-stops">
    <header class="panel-heading"><div><h2>Route stops</h2><p>${e(bus.name)}</p></div>${iconTile("route", "green", "small-tile")}</header>
    <ol class="stops-list ${arrived ? "all-arrived" : ""}">
      ${bus.stops.map((name, index) => {
        const done = arrived || index < next;
        const upcoming = !arrived && index === next;
        return `<li class="${done ? "passed" : upcoming ? "next" : ""}" data-stop-index="${index}">
          <span class="stop-marker">${done ? icon("check", 13) : ""}</span><strong>${e(name)}</strong>
          <span class="stop-description">${arrived ? "Reached" : upcoming ? "Next stop" : done ? "Passed" : ""}</span>
        </li>`;
      }).join("")}
    </ol>
  </section>`;
}

function parentTransport({ fleet, child, children, progress, paused }) {
  const bus = fleet.find((item) => item.id === child.bus);
  const arrived = bus.status === "school";
  return `
    ${pageHeading("Track my bus", "Follow your child’s assigned bus during the school trip.", childSelect(child, children))}
    <section class="surface trip-summary">
      ${iconTile("bus", "green", "trip-icon")}
      <div class="trip-heading">
        <div><h2>BUS ${bus.id}</h2>${statusBadge(bus.status)}</div>
        <p>${e(bus.name)} <span>·</span> Grade ${child.grade}</p>
      </div>
      <dl class="trip-detail"><dt>${icon(arrived ? "checkCircle" : "pin", 16)} ${arrived ? "Arrived at" : "Next stop"}</dt><dd ${arrived ? "" : "data-next-stop"}>${e(arrived ? bus.stops.at(-1) : nextStop(bus, progress(bus)).label)}</dd></dl>
      <dl class="trip-detail"><dt>${icon("clock", 16)} Last update</dt><dd data-last-update>${bus.status === "delayed" ? "6 min ago" : paused ? "Simulation paused" : "Just now"}</dd></dl>
    </section>
    <div class="tracking-grid individual-tracking">
      ${mapPanel("Bus location", `BUS ${bus.id} · ${e(bus.name)}`, bus, paused)}
      ${routeStops(bus, progress(bus))}
    </div>`;
}

export function transportPage(role, options) {
  if (!options.fleet.length) return pageHeading(role === "parent" ? "Track my bus" : "Bus tracking", "School transport", role === "parent" && options.child ? childSelect(options.child, options.children) : "") + `<section class="surface">${emptyState("bus", "No bus assigned", role === "parent" ? "Your child’s bus assignment will appear here." : "No buses are available in your assigned scope.")}</section>`;
  if (role === "parent" && options.fleet[0]?.trackingVisible === false) {
    const bus = options.fleet[0], policy = bus.trackingPolicy;
    return pageHeading(role === "parent" ? "Track my bus" : "My trip map", "School transport privacy", role === "parent" ? childSelect(options.child, options.children) : "") + `<section class="surface portal-card gps-hidden"><span class="family-initials">${icon("bus", 30)}</span><h2>Bus location is hidden</h2><p>BUS ${e(bus.id)} · ${e(bus.name)}</p>${badge(e(policy.reason), "neutral")}<p>Pickup ${e(policy.settings.pickupStart)}–${e(policy.settings.pickupEnd)} · Drop-off ${e(policy.settings.dropoffStart)}–${e(policy.settings.dropoffEnd)}<br>Weekdays · Sri Lanka time</p><p>${policy.clock.demo ? "Demo clock" : "Current time"}: ${e(policy.clock.date)} ${e(policy.clock.time)}</p><a class="button secondary" href="#${role}/${role === "parent" ? "inbox" : "overview"}">${role === "parent" ? "View transport updates" : "Daily overview"}</a></section>`;
  }
  if (role === "parent") return `<a class="button secondary compact nfc-transport-link" href="#parent/boarding">${icon("badge",17)}View boarding status</a>` + parentTransport(options);
  const html = adminTransport(options);
  return options.fleet.some((bus) => bus.trackingVisible) ? html : html.replace(/<div id="map-stage"[^>]*><\/div>/, `<div class="portal-card gps-hidden"><h2>Bus locations hidden</h2><p>Outside active school trips. Status and alerts remain available.</p></div>`);
}

export function mountMapSummary(stage, bus, progress) {
  stage.insertAdjacentHTML("beforeend", mapSummary(bus, progress));
}

export function updateTripDetails(page, bus, progress) {
  if (!bus || bus.trackingVisible === false || bus.status !== "route") return;
  const stop = nextStop(bus, progress);
  for (const label of page.querySelectorAll("[data-next-stop]")) {
    if (label.textContent !== stop.label) label.textContent = stop.label;
  }
  for (const row of page.querySelectorAll("[data-stop-index]")) {
    const index = Number(row.dataset.stopIndex);
    const passed = index < stop.index;
    const next = index === stop.index;
    const label = passed ? "Passed" : next ? "Next stop" : "";
    const description = row.querySelector(".stop-description");
    if (description.textContent !== label) {
      row.classList.toggle("passed", passed);
      row.classList.toggle("next", next);
      row.querySelector(".stop-marker").innerHTML = passed ? icon("check", 13) : "";
      description.textContent = label;
    }
  }
}

