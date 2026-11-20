import { networkRoutes } from "./network-routes.js";

const routeCache = new WeakMap();
const startedAt = performance.now();

export function networkFleet(state, branches) {
  return branches.flatMap((branch, index) => {
    const assigned = state.buses.filter((bus) => bus.branch === branch.id);
    const buses = assigned.length ? assigned : [0, 1].map((number) => ({
      id: "demo-" + branch.id + "-" + (number + 1),
      name: branch.name + (number ? " town pickup" : " morning pickup"),
      driver: "Sample driver " + (index * 2 + number + 1),
      registration: "Demo vehicle",
      status: number === 0 ? "route" : index % 3 === 0 ? "delayed" : index % 3 === 1 ? "school" : "route",
      start: 0.16 + ((index * 7 + number * 19) % 60) / 100,
      stops: [branch.name + " pickup point", "Neighbourhood stop", "School approach", branch.school],
      branch: branch.id,
    }));
    return buses.map((bus, number) => ({
      ...bus, branchName: branch.name, school: branch.school,
      label: assigned.length ? bus.id : String(state.branches.findIndex((item) => item.id === branch.id) + 1).padStart(2, "0") + (number ? "B" : "A"),
      route: networkRoutes[branch.id]?.[number % 3],
      studentsOnBoard: bus.status === "school" ? 0 : 18 + (index * 7 + number * 3) % 22,
      capacity: 40, sample: true, operational: Boolean(assigned.length),
    }));
  });
}

export function fleetSummary(fleet) {
  return {
    total: fleet.length,
    route: fleet.filter((bus) => bus.status === "route").length,
    school: fleet.filter((bus) => bus.status === "school").length,
    delayed: fleet.filter((bus) => bus.status === "delayed").length,
    branches: new Set(fleet.map((bus) => bus.branch)).size,
  };
}

function routeMetrics(route) {
  if (routeCache.has(route)) return routeCache.get(route);
  let length = 0;
  const points = route.points.map(([lat, lon], index, coordinates) => {
    if (index) length += Math.hypot((lat - coordinates[index - 1][0]) * 111, (lon - coordinates[index - 1][1]) * 110);
    return { lat, lon, distance: length };
  });
  const result = { points, length };
  routeCache.set(route, result);
  return result;
}

export function pointOnRoute(route, progress) {
  if (!route?.points.length) return null;
  const { points, length } = routeMetrics(route);
  const target = Math.max(0, Math.min(1, progress)) * length;
  const index = points.findIndex((point) => point.distance >= target);
  if (index <= 0) return [points[0].lat, points[0].lon];
  const a = points[index - 1], b = points[index];
  const fraction = (target - a.distance) / (b.distance - a.distance || 1);
  return [a.lat + (b.lat - a.lat) * fraction, a.lon + (b.lon - a.lon) * fraction];
}

export function networkTelemetry(bus, options = {}) {
  const simulatedElapsed = options.elapsed ?? (performance.now() - startedAt) / 1000;
  const progress = bus.status === "school" ? 1 : bus.status === "delayed" ? bus.start || 0.4
    : bus.operational && options.progress ? options.progress(bus)
      : 0.1 + ((bus.start || 0.2) + simulatedElapsed * 0.003) % 0.78;
  const nextIndex = Math.min(bus.stops.length - 1, Math.floor(progress * (bus.stops.length - 1)) + 1);
  return {
    progress, position: pointOnRoute(bus.route, progress),
    speed: bus.status !== "route" || options.paused ? 0 : 24 + Math.floor(progress * 23),
    nextStop: bus.status === "school" ? bus.stops.at(-1) : bus.stops[nextIndex],
    eta: bus.status === "school" ? 0 : Math.max(2, Math.round((1 - progress) * 24)),
    updated: bus.status === "delayed" ? "6 min ago" : options.paused ? "Simulation paused" : "Just now",
  };
}
