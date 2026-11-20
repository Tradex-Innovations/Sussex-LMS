import { fleetSummary, networkTelemetry } from "./network-fleet.js";
import { badge, button, escapeHtml as e, statusBadge, emptyState } from "./ui.js";
import { icon } from "./icons.js";

const labels = { all: "All buses", route: "On route", school: "At school", delayed: "Signal delayed" };

export function networkFleetOverlay(fleet, network, paused) {
  const summary = fleetSummary(fleet);
  const schools = [...new Map(fleet.map((bus) => [bus.branch, bus.branchName]))];
  return '<div class="network-map-hud"><div class="network-hud-title"><div><strong>School transport across Sri Lanka</strong><span>' + summary.branches + ' branches · ' + summary.total + ' buses · Simulated GPS</span></div>' +
    button(paused ? "Resume" : "Pause", "pause", { variant: "secondary compact", iconName: paused ? "play" : "pause" }) + '</div>' +
    '<div class="network-fleet-status" role="group" aria-label="Filter network buses">' +
    ["all", "route", "school", "delayed"].map((status) => '<button type="button" class="' + status + (network.status === status ? ' is-active' : '') + '" data-action="network-fleet-status" data-value="' + status + '" aria-pressed="' + (network.status === status) + '">' + labels[status] + '<strong>' + (status === "all" ? summary.total : summary[status]) + '</strong></button>').join("") + '</div>' +
    '<div class="network-hud-footer"><label class="network-school-jump"><span class="select-wrap"><select data-change="network-map-branch" aria-label="Find a school on the map"><option value="">Find a school</option>' + schools.map(([id, name]) => '<option value="' + e(id) + '">' + e(name) + '</option>').join("") + '</select>' + icon("chevronDown", 13) + '</span></label>' + button("View all buses", "network-fleet", { variant: "secondary compact", iconName: "bus" }) + '</div></div>';
}

function fleetRows(fleet, options) {
  return '<div class="network-bus-list">' + (fleet.map((bus) => {
    const telemetry = networkTelemetry(bus, { progress: options.progress, paused: options.paused, elapsed: options.networkElapsed });
    return '<button type="button" class="network-bus-row" data-action="network-bus" data-value="' + e(bus.id) + '"><span class="network-bus-symbol ' + bus.status + '">' + icon("bus", 22) + '</span><span><strong>BUS ' + e(bus.label) + '</strong><small>' + e(bus.branchName) + ' · ' + e(bus.name) + '</small><span class="network-bus-destination">' + e(telemetry.nextStop) + '</span></span>' + statusBadge(bus.status) + '</button>';
  }).join("") || emptyState("bus", "No matching buses", "Choose another bus status or school.")) + '</div>';
}

export function networkFleetPage(options) {
  const { state, context, network, networkBuses } = options;
  const allowedBranches = state.branches.filter((branch) => context.branch === "all" || branch.id === context.branch);
  const filtered = networkBuses.filter((bus) => (network.status === "all" || bus.status === network.status) && (network.busBranch === "all" || bus.branch === network.busBranch));
  return '<p class="network-data-note">Demonstration fleet. Vehicle locations, routes and occupancy are simulated.</p>' +
    '<label class="network-filter"><span>School branch</span><span class="select-wrap"><select data-change="network-fleet-branch" aria-label="Filter buses by school"><option value="all">All schools in view</option>' +
    allowedBranches.map((branch) => '<option value="' + branch.id + '" ' + (network.busBranch === branch.id ? "selected" : "") + '>' + e(branch.name) + '</option>').join("") + '</select>' + icon("chevronDown", 15) + '</span></label>' +
    '<div class="network-list-heading"><h3>' + labels[network.status] + '</h3>' + badge(filtered.length + " buses", "neutral") + '</div>' + fleetRows(filtered, options);
}

export function branchTransportPage(options, branch) {
  const fleet = options.networkBuses.filter((bus) => bus.branch === branch.id);
  const summary = fleetSummary(fleet);
  const filtered = fleet.filter((bus) => options.network.status === "all" || bus.status === options.network.status);
  return '<section class="selected-school-heading"><h2>' + e(branch.school) + '</h2><p>' + e(branch.address) + '</p></section>' +
    '<div class="branch-transport-counts"><div><strong>' + summary.route + '</strong><span>On route</span></div><div><strong>' + summary.school + '</strong><span>At school</span></div><div><strong>' + summary.delayed + '</strong><span>Signal delayed</span></div></div>' +
    '<p class="network-data-note">Simulated GPS · Illustrative pickup routes</p>' +
    '<div class="network-list-heading"><h3>Branch buses</h3>' + badge(filtered.length + " buses", "neutral") + '</div>' + fleetRows(filtered, options) +
    '<p class="network-bus-help">Select a bus to follow its route, next stop and trip activity.</p>';
}

export function networkBusPage(options, bus) {
  const telemetry = networkTelemetry(bus, { progress: options.progress, paused: options.paused, elapsed: options.networkElapsed });
  return '<div data-network-telemetry="' + e(bus.id) + '">' +
    button("Back to " + e(bus.branchName), "network-select", { value: bus.branch, variant: "secondary compact" }) +
    '<div class="network-bus-heading"><span class="network-bus-symbol ' + bus.status + '">' + icon("bus", 26) + '</span><div><h2>BUS ' + e(bus.label) + '</h2><p>' + e(bus.name) + '</p></div></div>' +
    statusBadge(bus.status) + '<p class="network-data-note bus-demo-note">Simulated GPS · Sample route and occupancy</p>' +
    '<dl class="network-trip-metrics"><div><dt>Students on board</dt><dd>' + bus.studentsOnBoard + '<small> / ' + bus.capacity + '</small></dd></div><div><dt>Speed</dt><dd><span data-network-value="speed">' + telemetry.speed + '</span><small> km/h</small></dd></div><div><dt>School arrival</dt><dd data-network-value="eta">' + (bus.status === "school" ? "Arrived" : telemetry.eta + " min") + '</dd></div><div><dt>Last update</dt><dd class="network-update-time" data-network-value="updated">' + telemetry.updated + '</dd></div></dl>' +
    '<section class="network-trip-next"><span>' + (bus.status === "school" ? "Arrived at" : "Next stop") + '</span><strong data-network-value="nextStop">' + e(telemetry.nextStop) + '</strong><progress data-network-value="progress" value="' + telemetry.progress + '" max="1" aria-label="Trip progress"></progress></section>' +
    '<dl class="network-driver-details"><div><dt>School</dt><dd>' + e(bus.branchName) + '</dd></div><div><dt>Driver</dt><dd>' + e(bus.driver || "Unassigned") + '</dd></div><div><dt>Vehicle</dt><dd>' + e(bus.registration) + '</dd></div></dl>' +
    '<section class="network-trip-stops"><h3>Trip activity</h3>' + bus.stops.map((stop, index) => '<div><span class="network-stop-number">' + (index + 1) + '</span><div><strong>' + e(stop) + '</strong><small data-network-stop="' + index + '">' + stopState(index, bus, telemetry) + '</small></div></div>').join("") + '</section></div>';
}

function stopState(index, bus, telemetry) {
  const ratio = index / (bus.stops.length - 1);
  if (bus.status === "school" || ratio <= telemetry.progress) return "Reached";
  return index === Math.min(bus.stops.length - 1, Math.floor(telemetry.progress * (bus.stops.length - 1)) + 1) ? "Next stop" : "Upcoming";
}

export function updateNetworkBusDetails(root, fleet, progress, paused, elapsed) {
  const detail = root.querySelector("[data-network-telemetry]");
  if (!detail) return;
  const bus = fleet.find((bus) => bus.id === detail.dataset.networkTelemetry);
  if (!bus) return;
  const telemetry = networkTelemetry(bus, { progress, paused, elapsed });
  for (const element of detail.querySelectorAll("[data-network-value]")) {
    const key = element.dataset.networkValue;
    if (key === "progress") element.value = telemetry.progress;
    else if (key === "eta") element.textContent = bus.status === "school" ? "Arrived" : telemetry.eta + " min";
    else element.textContent = telemetry[key];
  }
  for (const element of detail.querySelectorAll("[data-network-stop]")) element.textContent = stopState(Number(element.dataset.networkStop), bus, telemetry);
}
