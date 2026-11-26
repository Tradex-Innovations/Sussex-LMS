import assert from "node:assert/strict";
import test from "node:test";
import { freshState, roles } from "../dist/data.js";
import { contextFor, assignableRoles, canManageGrant } from "../dist/access.js";
import { chairmanDefaults, chairmanBranches, branchStaff, schoolLeaveRequests, attendanceResult, studentRoster, generateExecutiveReport, visibleExecutiveReports, reportOwnerKey } from "../dist/chairman-data.js";
import { assessmentResult } from "../dist/network-analytics.js";
import { schoolClassResults, schoolAcademicComparison } from "../dist/principal-data.js";
import { networkFleet } from "../dist/network-fleet.js";

const state = freshState(), principal = contextFor(state, "principal", "principal_c");
const branch = state.branches.find((branch) => branch.id === principal.branch);
const academic = { subject: "mathematics", grade: 8, term: 3, className: "all" };
const settings = { ...chairmanDefaults(), reportPeriod: "week" };

test("The Principal opens the assigned-school overview and cannot widen branch scope", () => {
  assert.equal(roles.principal.start, "overview");
  assert.deepEqual(chairmanBranches(state, principal).map((branch) => branch.id), ["colombo"]);
  assert.deepEqual(chairmanBranches(state, { ...principal, branch: "all" }).map((branch) => branch.id), ["colombo"]);
  assert.deepEqual(chairmanBranches(state, principal, ["lakeside"]), []);
  assert.ok(!assignableRoles(principal).includes("principal") && !assignableRoles(principal).includes("chairman"));
  assert.ok(!canManageGrant(principal, { role: "teacher", branch: "lakeside" }));
});

test("Academic class cohorts reconcile with grade results and preserve prototype teacher assignments", () => {
  const rows = schoolClassResults(state, branch, academic), full = assessmentResult(branch, academic);
  assert.equal(rows.reduce((sum, row) => sum + row.count, 0), full.count);
  assert.equal(rows.find((row) => row.className === "8A").teacher.id, "dilini");
  assert.equal(Math.round(rows.flatMap((row) => row.marks).reduce((a, b) => a + b, 0) / full.count * 10) / 10, full.mean);
  assert.equal(schoolClassResults(state, branch, { ...academic, className: "8A" }).length, 1);
  for (const mode of ["classes", "grades", "subjects", "teachers"]) {
    const comparison = schoolAcademicComparison(state, branch, academic, mode);
    assert.ok(comparison.rows.length > 0);
    assert.ok(comparison.rows.every((row) => row.school === branch.name && row.count > 0));
  }
});

test("Class attendance totals and registers stay within the selected school and class", () => {
  const full = attendanceResult(state, branch, { ...settings, attendanceGrade: 8, period: "week" });
  const a = attendanceResult(state, branch, { ...settings, attendanceGrade: 8, attendanceClass: "8A", period: "week" });
  const b = attendanceResult(state, branch, { ...settings, attendanceGrade: 8, attendanceClass: "8B", period: "week" });
  assert.equal(a.expected + b.expected, full.expected);
  assert.equal(a.present + b.present, full.present);
  assert.equal(a.expected, studentRoster(branch, 8).filter((student) => student.className === "8A").length * 5);
});

test("Leave decisions update availability and attendance without affecting another school", () => {
  const before = branchStaff(state, branch);
  const request = schoolLeaveRequests(state, branch).find((request) => before.find((person) => person.id === request.person)?.status === "present");
  assert.ok(request);
  const other = state.branches.find((branch) => branch.id === "lakeside");
  const otherBefore = branchStaff(state, other);
  const edited = { ...state, principalLeaveReviews: { [request.id]: { decision: "approved", by: principal.account.name } } };
  assert.equal(branchStaff(edited, branch).find((person) => person.id === request.person).status, "leave");
  assert.deepEqual(branchStaff(edited, other), otherBefore);
  const attendanceBefore = attendanceResult(state, branch, { ...settings, audience: "staff", period: "day" });
  const attendanceAfter = attendanceResult(edited, branch, { ...settings, audience: "staff", period: "day" });
  assert.equal(attendanceAfter.leave, attendanceBefore.leave + 1);
  assert.equal(attendanceAfter.present, attendanceBefore.present - 1);
  edited.principalLeaveReviews[request.id].decision = "declined";
  assert.equal(branchStaff(edited, branch).find((person) => person.id === request.person).status, "present");
});

test("Principal reports capture one school and keep report history separated from the Chairman", () => {
  const principalReport = generateExecutiveReport(state, principal, settings, academic);
  const chairman = contextFor(state, "chairman");
  const chairmanReport = generateExecutiveReport(state, chairman, settings, academic);
  const other = contextFor(state, "principal", "principal_l");
  const otherReport = generateExecutiveReport(state, other, settings, academic);
  assert.deepEqual(principalReport.criteria.scope, ["colombo"]);
  assert.equal(principalReport.owner.role, "principal");
  assert.equal(principalReport.owner.key, reportOwnerKey(principal));
  assert.throws(() => generateExecutiveReport(state, principal, { ...settings, reportBranches: ["lakeside"] }, academic), /assigned school/);
  const saved = { ...state, executiveReports: [principalReport, chairmanReport, otherReport] };
  assert.deepEqual(visibleExecutiveReports(saved, principal).map((report) => report.id), [principalReport.id]);
  assert.deepEqual(visibleExecutiveReports(saved, other).map((report) => report.id), [otherReport.id]);
  assert.deepEqual(visibleExecutiveReports(saved, chairman).map((report) => report.id), [chairmanReport.id]);
  assert.equal(visibleExecutiveReports(saved, contextFor(state, "teacher")).length, 0);
});

test("Bus identities, statuses and sample occupancy do not change when the fleet is scoped", () => {
  const all = networkFleet(state, state.branches);
  for (const school of state.branches) {
    const scoped = networkFleet(state, [school]);
    for (const bus of scoped) {
      const full = all.find((item) => item.id === bus.id);
      assert.equal(bus.status, full.status);
      assert.equal(bus.studentsOnBoard, full.studentsOnBoard);
      assert.equal(bus.trackerId, full.trackerId);
    }
  }
});
