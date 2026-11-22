import assert from "node:assert/strict";
import test from "node:test";
import { freshState, roles, sectionFor } from "../dist/data.js";
import { contextFor, can, canPublish, visibleCourses } from "../dist/access.js";
import { schoolDays, studentStatus, reportCSV } from "../dist/chairman-data.js";
import { sectionScope, sectionFilters, sectionCourses, sectionTeachers, sectionAcademic, sectionAttendance, sectionFollowups, saveSectionFollowup,
  saveSectionCourseReview, requestSectionCover, sectionCoverRequests, generateSectionReport, visibleSectionReports } from "../dist/section-data.js";
import { incomingSectionCoverRequests, saveTemporaryCover, coverTeachers, cancelTemporaryCover, declineSectionCoverRequest } from "../dist/vice-data.js";

function setup(id = "dilini") {
  const state = freshState(), context = contextFor(state, "section_head", id);
  return { state, context, scope: sectionScope(state, context) };
}

test("The Section Head opens an overview and cannot widen the actual appointment scope", () => {
  const { state, context, scope } = setup();
  assert.equal(roles.section_head.start, "overview");
  assert.deepEqual(scope.grades, [6, 7, 8, 9]);
  assert.equal(sectionScope(state, { ...context, branch: "all" }).branch.id, "colombo");
  assert.equal(sectionScope(state, { ...context, grant: { ...context.grant, section: "primary" } }), null);
  assert.equal(sectionScope(state, contextFor(state, "teacher")), null);
  assert.deepEqual(sectionFilters(state, context, { grade: "4", className: "4A" }).grade, "all");
  assert.equal(sectionFilters(state, context, { date: "2026-10-32" }).date, "2026-11-20");
  assert.ok(visibleCourses(state, { ...context, branch: "all" }).every((course) => course.branch === "colombo" && sectionFor(course.grade) === "middle"));
});

test("Academic cohorts and class comparisons contain only assigned section grades", () => {
  for (const id of ["dilini", "asha", "lakshmi"]) {
    const { state, context, scope } = setup(id), result = sectionAcademic(state, context);
    assert.ok(result.classes.every((row) => scope.grades.includes(row.grade)));
    assert.equal(result.classes.reduce((sum, row) => sum + row.count, 0), result.summary.count);
    assert.equal(Math.round(result.classes.flatMap((row) => row.marks).reduce((a, b) => a + b, 0) / result.summary.count * 10) / 10, result.summary.mean);
    for (const compare of ["classes", "grades", "subjects", "teachers"]) assert.ok(sectionAcademic(state, context, { compare }).rows.length);
    assert.ok(sectionCourses(state, context).every((course) => course.branch === scope.branch.id && scope.grades.includes(course.grade)));
  }
});

test("Section attendance totals, class registers and repeated absences reconcile", () => {
  const { state, context } = setup(), result = sectionAttendance(state, context, { period: "week" });
  assert.equal(result.summary.expected, result.roster.length * 5);
  assert.equal(result.classes.reduce((sum, row) => sum + row.present, 0), result.summary.present);
  const a = sectionAttendance(state, context, { grade: "8", className: "8A", period: "week" });
  const b = sectionAttendance(state, context, { grade: "8", className: "8B", period: "week" });
  assert.equal(a.summary.expected + b.summary.expected, sectionAttendance(state, context, { grade: "8", period: "week" }).summary.expected);
  assert.ok(a.roster.every((student) => student.className === "8A"));
  const repeated = sectionAttendance(state, context, { flag: "repeated" });
  assert.ok(repeated.rows.every((student) => student.missed >= 3 && student.missed === schoolDays("2026-11-20", "month").filter((date) => studentStatus(student, date) === "absent").length));
});

test("Shared teachers expose only their section workloads and relevant appointments", () => {
  const { state, context } = setup();
  state.assignments.math4.teacher = "dilini";
  const teacher = sectionTeachers(state, context).find((person) => person.id === "dilini");
  assert.ok(teacher.courses.length);
  assert.ok(teacher.courses.every((course) => sectionFor(course.grade) === "middle"));
  assert.ok(!teacher.classes.includes("4A"));
  assert.ok(!sectionTeachers(state, context).some((person) => person.id === "lakshmi"));
});

test("Attendance follow-ups retain notes and reject foreign students, owners and IDs", () => {
  const { state, context } = setup(), student = sectionAttendance(state, context).roster[0];
  const input = { student: student.id, owner: context.account.id, status: "open", due: "2026-11-20", note: "Class teacher will arrange a meeting." };
  const item = saveSectionFollowup(state, context, input);
  saveSectionFollowup(state, context, { ...input, id: item.id, status: "resolved", note: "Meeting completed and outcome recorded." });
  assert.equal(sectionFollowups(state, context)[0].notes.length, 2);
  assert.equal(sectionFollowups(state, context)[0].status, "resolved");
  const primary = contextFor(state, "section_head", "asha"), foreign = sectionAttendance(state, primary).roster[0];
  assert.throws(() => saveSectionFollowup(state, context, { ...input, student: foreign.id }), /student from your section/);
  assert.throws(() => saveSectionFollowup(state, primary, { ...input, id: item.id }), /outside your section/);
  assert.throws(() => saveSectionFollowup(state, context, { ...input, owner: "asha" }), /owner serving your section/);
});

test("Material reviews leave published materials intact and cannot cross sections", () => {
  const { state, context } = setup(), before = structuredClone(state.materials);
  saveSectionCourseReview(state, context, { course: "math8", status: "changes_requested", note: "Please add a worked example." });
  assert.equal(state.sectionCourseReviews.math8.status, "changes_requested");
  assert.deepEqual(state.materials, before);
  assert.equal(canPublish(state, context, state.courses.find((course) => course.id === "math8")), false);
  assert.equal(can(context, "roles.manage"), false);
  assert.throws(() => saveSectionCourseReview(state, context, { course: "math4", status: "ready", note: "Foreign course" }), /within your section/);
});

test("A cover request can be fulfilled or declined only by the school Vice Principal", () => {
  const { state, context, scope } = setup(), before = structuredClone(state.assignments);
  const request = requestSectionCover(state, context, { course: "math8", date: "2026-11-20", reason: "Daily class cover required." });
  assert.equal(sectionCoverRequests(state, context)[0].status, "pending");
  assert.throws(() => requestSectionCover(state, context, { course: "math8", date: "2026-11-20", reason: "Duplicate" }), /already exists/);
  assert.throws(() => requestSectionCover(state, context, { course: "math4", date: "2026-11-20", reason: "Foreign" }), /within your section/);
  const vice = contextFor(state, "vice_principal", "vice_c"), foreign = contextFor(state, "vice_principal", "vice_l");
  assert.deepEqual(incomingSectionCoverRequests(state, foreign), []);
  assert.throws(() => declineSectionCoverRequest(state, foreign, { id: request.id, note: "Foreign" }), /from your school/);
  const teacher = coverTeachers(state, scope.branch).find((person) => person.id !== state.assignments.math8.teacher);
  const cover = saveTemporaryCover(state, vice, { requestId: request.id, course: "math8", teacher: teacher.id, date: "2026-11-20", reason: request.reason });
  assert.equal(sectionCoverRequests(state, context)[0].status, "fulfilled");
  assert.equal(sectionCoverRequests(state, context)[0].teacherName, teacher.name);
  assert.deepEqual(state.assignments, before);
  cancelTemporaryCover(state, vice, cover.id);
  assert.equal(sectionCoverRequests(state, context)[0].status, "pending");
  declineSectionCoverRequest(state, vice, { id: request.id, note: "Please reschedule this class." });
  assert.equal(sectionCoverRequests(state, context)[0].status, "declined");
});

test("Section reports preserve captured values and separate school and section histories", () => {
  const { state, context, scope } = setup(), primary = contextFor(state, "section_head", "asha"), other = contextFor(state, "section_head", "lakshmi");
  for (const reportType of ["brief", "academic", "attendance", "teaching"]) {
    const report = generateSectionReport(state, context, { grade: "all", reportType, period: "week" });
    assert.deepEqual(report.criteria.grades, scope.grades);
    assert.deepEqual(report.criteria.scope, ["colombo"]);
    assert.ok(!reportCSV(report).includes('"Grade 4"'));
    state.sectionReports = [...(state.sectionReports || []), report];
  }
  const first = state.sectionReports[0], snapshot = structuredClone(first);
  state.assignments.math8.teacher = "nuwan";
  assert.deepEqual(first, snapshot);
  assert.throws(() => generateSectionReport(state, context, { grade: "4", reportType: "brief" }), /within your section/);
  assert.equal(visibleSectionReports(state, context).length, 4);
  assert.equal(visibleSectionReports(state, primary).length, 0);
  assert.equal(visibleSectionReports(state, other).length, 0);
  state.sectionReports.push({ ...first, id: "forged", criteria: { ...first.criteria, grades: [4] } });
  assert.equal(visibleSectionReports(state, context).length, 4);
});

test("Sections without demo rosters show empty data instead of invented enrolment", () => {
  const { state } = setup();
  state.accounts.find((person) => person.id === "asha").grants[0].section = "preschool";
  const context = contextFor(state, "section_head", "asha");
  assert.equal(sectionAcademic(state, context).summary.count, 0);
  assert.equal(sectionAttendance(state, context).summary.expected, 0);
  const report = generateSectionReport(state, context, { grade: "all", reportType: "brief" });
  assert.equal(report.customRows[0].academic, "No assessment data");
});
