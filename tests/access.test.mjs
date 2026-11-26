import assert from "node:assert/strict";
import test from "node:test";
import { freshState, loadState } from "../dist/data.js";
import { canManageGrant, canPublish, contextFor, linkedChildren, visibleBuses, visibleCourses, visibleOrders, visibleStudents, withinScope } from "../dist/access.js";

test("Chairman can see both branches while Principals retain their own branch", () => {
  const state = freshState();
  const chairman = contextFor(state, "chairman");
  assert.equal(visibleBuses(state, chairman).length, 8);
  for (const id of ["principal_c", "principal_l"]) {
    const principal = contextFor(state, "principal", id);
    assert.ok(visibleBuses(state, principal).every((bus) => bus.branch === principal.branch));
    assert.ok(visibleCourses(state, principal).every((course) => course.branch === principal.branch));
    assert.ok(visibleStudents(state, principal).every((student) => student.branch === principal.branch));
  }
  assert.equal(visibleBuses(state, contextFor(state, "chairman", undefined, "lakeside")).length, 2);
});

test("Section Heads and Grade Coordinators can access only their section or grade", () => {
  const state = freshState();
  const primary = contextFor(state, "section_head", "asha");
  assert.deepEqual(visibleCourses(state, primary).map((course) => course.id), ["math4"]);
  const middle = contextFor(state, "section_head", "dilini");
  assert.equal(visibleCourses(state, middle).length, 5);
  const coordinator = contextFor(state, "coordinator", "nuwan");
  assert.ok(visibleStudents(state, coordinator).every((student) => student.grade === 8));
  assert.equal(withinScope(coordinator, state.courses.find((course) => course.id === "english6")), false);
});

test("Publishing requires an assignment to that teacher or branch leadership permission", () => {
  const state = freshState();
  const teacher = contextFor(state, "teacher", "dilini");
  const classTeacher = contextFor(state, "class_teacher", "dilini");
  const math = state.courses.find((course) => course.id === "math8");
  const science = state.courses.find((course) => course.id === "science8");
  const lakeMath = state.courses.find((course) => course.id === "lake-math8");
  assert.equal(canPublish(state, teacher, math), true);
  assert.equal(canPublish(state, teacher, science), false);
  assert.equal(canPublish(state, classTeacher, science), false);
  assert.equal(canPublish(state, contextFor(state, "principal", "principal_c"), lakeMath), false);
});

test("Parents see linked children, enrolled courses and their assigned bus", () => {
  const state = freshState();
  const parent = contextFor(state, "parent", "parent");
  const children = linkedChildren(state, parent);
  assert.deepEqual(children.map((student) => student.id), ["amaya", "kavin"]);
  const amaya = children[0];
  assert.deepEqual(visibleBuses(state, parent, amaya).map((bus) => bus.id), ["01"]);
  assert.equal(visibleCourses(state, parent, state.students.find((student) => student.id === "meera")).length, 0);
  assert.equal(visibleBuses(state, parent, state.students.find((student) => student.id === "meera")).length, 0);
  state.students.find((student) => student.id === "meera").guardians.push("parent");
  assert.equal(linkedChildren(state, parent).some((student) => student.id === "meera"), false);
});

test("Retired Driver role cannot resolve an appointment or read buses", () => {
  const state = freshState(); assert.equal(contextFor(state, "driver", "driver_01"), null); assert.deepEqual(visibleBuses(state, null), []);
});

test("A Principal cannot grant leadership in another branch or appoint a Principal", () => {
  const state = freshState();
  const principal = contextFor(state, "principal", "principal_c");
  assert.equal(canManageGrant(principal, { role: "teacher", branch: "colombo" }), true);
  assert.equal(canManageGrant(principal, { role: "teacher", branch: "lakeside" }), false);
  assert.equal(canManageGrant(principal, { role: "principal", branch: "colombo" }), false);
  assert.equal(canManageGrant(principal, { role: "chairman", branch: "all" }), false);
});

test("Order visibility uses the branch or the purchasing parent", () => {
  const state = freshState();
  state.orders = [
    { number: "1", branch: "colombo", parent: "parent" },
    { number: "2", branch: "lakeside", parent: "parent_l" },
  ];
  assert.equal(visibleOrders(state, contextFor(state, "chairman")).length, 2);
  assert.deepEqual(visibleOrders(state, contextFor(state, "librarian", "librarian_l")).map((order) => order.number), ["2"]);
  assert.deepEqual(visibleOrders(state, contextFor(state, "parent", "parent")).map((order) => order.number), ["1"]);
});

test("Legacy browser data retains materials, progress, orders, cart and trip status", () => {
  const old = { assignments: { math8: { teacher: "nuwan", students: ["amaya"] } }, materials: [{ id: "old", course: "math8", title: "Existing" }], completed: { amaya: ["old"] }, cart: { b1: 2 }, orders: [{ number: "CW-1001", items: [] }], trip: "school" };
  globalThis.localStorage = { getItem: () => JSON.stringify(old) };
  const state = loadState();
  assert.equal(state.version, 2);
  assert.equal(state.assignments.math8.teacher, "nuwan");
  assert.equal(state.materials.some((item) => item.id === "old"), true);
  assert.deepEqual(state.completed.amaya, ["old"]);
  assert.equal(state.carts.parent.colombo.b1, 2);
  assert.equal(state.orders[0].parent, "parent");
  assert.equal(state.buses[0].status, "school");
  assert.equal(state.assignments["lake-math8"].teacher, "lakshmi");
});

test("Existing branch branding updates while user data and custom stop names are retained", () => {
  const old = freshState();
  old.branches.find((branch) => branch.id === "colombo").school = "Greenfield Colombo";
  old.buses[0].stops = ["Custom pickup", "Nawala", "Rajagiriya", "Greenfield Colombo"];
  old.orders = [{ number: "CW-1001", parent: "parent", branch: "colombo", status: "collected", items: [] }];
  globalThis.localStorage = { getItem: () => JSON.stringify(old) };
  const state = loadState();
  assert.equal(state.branches.find((branch) => branch.id === "colombo").school, "Sussex College Nugegoda");
  assert.equal(state.buses[0].stops.at(-1), "Sussex College Nugegoda");
  assert.equal(state.buses[0].stops[0], "Custom pickup");
  assert.deepEqual(state.assignments, old.assignments);
  assert.deepEqual(state.orders, old.orders);
});
