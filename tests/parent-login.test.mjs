import assert from "node:assert/strict";
import test from "node:test";
import { freshState, loadState, nextAdmissionNumber } from "../dist/data.js";
import { linkedChildren, visibleBuses, visibleCourses } from "../dist/access.js";
import { authenticateParent, parentContext } from "../dist/parent-login.js";

test("Demo admission numbers are unique and the temporary password selects a student", () => {
  const state = freshState();
  assert.equal(new Set(state.students.map((student) => student.admissionNumber)).size, state.students.length);
  assert.equal(state.students[0].admissionNumber, "SCN-1001");
  assert.deepEqual(authenticateParent(state, " scn-1001 ", "1234"), { studentId: "amaya", parentId: "parent" });
  assert.equal(authenticateParent(state, "SCN-1001", "wrong"), null);
  assert.equal(authenticateParent(state, "UNKNOWN", "1234"), null);
});

test("Admission alias opens the linked family and keeps a selected child", () => {
  const state = freshState();
  const session = authenticateParent(state, "SCN-1001", "1234");
  const context = parentContext(state, session);
  assert.deepEqual(linkedChildren(state, context).map((child) => child.id), ["amaya", "kavin"]);
  const sibling = state.students.find((student) => student.id === "kavin");
  assert.equal(visibleBuses(state, context, sibling).length, 1);
  assert.equal(visibleCourses(state, context, sibling).length, 1);
});

test("Login and sessions require a linked guardian with a parent role in the student's branch", () => {
  const state = freshState();
  const student = state.students[0];
  const session = authenticateParent(state, student.admissionNumber, "1234");
  student.guardians = [];
  assert.equal(authenticateParent(state, student.admissionNumber, "1234"), null);
  assert.equal(parentContext(state, session), null);
  student.guardians = ["parent"];
  state.accounts.find((person) => person.id === "parent").grants = [{ role: "parent", branch: "lakeside" }];
  assert.equal(parentContext(state, session), null);
  assert.equal(authenticateParent(state, student.admissionNumber, "1234"), null);
});

test("Existing browser records receive stable admission numbers without overwriting custom ones", () => {
  const old = freshState();
  delete old.students[0].admissionNumber;
  old.students[1].admissionNumber = "CUSTOM-22";
  globalThis.localStorage = { getItem: () => JSON.stringify(old) };
  const migrated = loadState();
  assert.equal(migrated.students[0].admissionNumber, "SCN-1001");
  assert.equal(migrated.students[1].admissionNumber, "CUSTOM-22");
  assert.deepEqual(migrated.students[0].guardians, old.students[0].guardians);
  assert.equal(nextAdmissionNumber(migrated.students), "SCN-1002");
});
