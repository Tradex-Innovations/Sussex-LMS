import assert from "node:assert/strict";
import test from "node:test";
import { freshState } from "../dist/data.js";
import { contextFor } from "../dist/access.js";
import { networkBranches } from "../dist/network.js";
import { networkFleet, fleetSummary, networkTelemetry, pointOnRoute } from "../dist/network-fleet.js";

test("The network fleet covers every school while preserving assigned vehicle records", () => {
  const state = freshState();
  const fleet = networkFleet(state, state.branches);
  assert.equal(new Set(fleet.map((bus) => bus.id)).size, fleet.length);
  assert.equal(new Set(fleet.map((bus) => bus.branch)).size, 20);
  for (const bus of state.buses) {
    const record = fleet.find((record) => record.id === bus.id);
    assert.equal(record.trackerId, bus.trackerId);
    assert.equal(record.status, bus.status);
    assert.equal(record.registration, bus.registration);
  }
  const counts = fleetSummary(fleet);
  assert.equal(counts.total, 44);
  assert.equal(counts.route + counts.school + counts.delayed, counts.total);
});

test("Network bus visibility follows the assigned school and comparison scope", () => {
  const state = freshState();
  const principal = contextFor(state, "principal", "principal_c");
  const scoped = networkBranches(state, principal, { compare: ["galle"] });
  assert.ok(networkFleet(state, scoped).every((bus) => bus.branch === "colombo"));
  const chairman = contextFor(state, "chairman");
  assert.ok(networkFleet(state, networkBranches(state, chairman, { compare: ["galle", "kandy"] })).every((bus) => ["galle", "kandy"].includes(bus.branch)));
  assert.equal(networkFleet(state, []).length, 0);
});

test("Route interpolation follows the route and ends at the associated school", () => {
  const state = freshState();
  const fleet = networkFleet(state, state.branches);
  for (const bus of fleet.filter((bus) => bus.trackingVisible)) {
    assert.ok(bus.route.points.length >= 2);
    assert.ok(bus.route.points.every(([lat, lon]) => lat > 5.7 && lat < 9.9 && lon > 79.4 && lon < 82));
    const school = state.branches.find((branch) => branch.id === bus.branch);
    assert.deepEqual(pointOnRoute(bus.route, 1), [school.lat, school.lon]);
    assert.deepEqual(pointOnRoute(bus.route, 0), bus.route.points[0]);
    assert.deepEqual(pointOnRoute(bus.route, -1), bus.route.points[0]);
  }
});

test("Moving buses advance while parked and delayed buses retain their positions", () => {
  const state = freshState();
  const fleet = networkFleet(state, state.branches);
  const moving = fleet.find((bus) => !bus.operational && bus.status === "route");
  assert.notDeepEqual(networkTelemetry(moving, { elapsed: 0 }).position, networkTelemetry(moving, { elapsed: 10 }).position);
  for (const status of ["school", "delayed"]) {
    const bus = fleet.find((bus) => bus.status === status);
    assert.deepEqual(networkTelemetry(bus, { elapsed: 0 }).position, networkTelemetry(bus, { elapsed: 10 }).position);
    assert.equal(networkTelemetry(bus).speed, bus.trackingVisible ? 0 : null);
  }
  assert.equal(networkTelemetry(moving, { paused: true, elapsed: 5 }).speed, 0);
  const assigned = fleet.find((bus) => bus.operational && bus.status === "route");
  assert.equal(networkTelemetry(assigned, { progress: () => 0.6 }).progress, 0.6);
});
