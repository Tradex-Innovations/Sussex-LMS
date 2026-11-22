import assert from "node:assert/strict";
import test from "node:test";
import { freshState, loadState, saveState, roles } from "../dist/data.js";
import { contextFor, can, canPublish, visibleCourses } from "../dist/access.js";
import { reportCSV } from "../dist/chairman-data.js";
import { sectionScope, sectionCourses, saveSectionCourseReview, requestSectionCover, sectionFollowups, generateSectionReport } from "../dist/section-data.js";
import { gradeScope, gradeFilters, gradeAcademic, gradeAttendance, gradeCourses, gradeTeachers, gradeFollowups, saveGradeFollowup,
  gradeClassUpdates, saveGradeClassUpdate, gradeSupportRequests, requestGradeSupport, sectionGradeRequests, respondGradeSupport, generateGradeReport, visibleGradeReports } from "../dist/grade-data.js";

const setup = (id = "nuwan") => { const state = freshState(), context = contextFor(state, "coordinator", id); return { state, context, scope: gradeScope(state, context) }; };

test("Grade Coordinator appointments cannot widen to another school, grade or Section Head scope", () => {
  const { state, context, scope } = setup();
  assert.equal(roles.coordinator.start, "overview");
  assert.deepEqual(scope.grades, [8]);
  assert.equal(gradeScope(state, { ...context, branch: "all" }).branch.id, "colombo");
  assert.equal(gradeScope(state, { ...context, grant: { ...context.grant, grade: 6 } }), null);
  assert.equal(gradeScope(state, { ...context, grant: { ...context.grant, branch: "lakeside" } }), null);
  assert.equal(sectionScope(state, context), null);
  assert.equal(gradeScope(state, contextFor(state, "section_head", "dilini")), null);
  assert.ok(visibleCourses(state, { ...context, branch: "all" }).every((course) => course.grade === 8 && course.branch === "colombo"));
  assert.ok(sectionCourses(state, context).every((course) => course.grade === 8));
  assert.throws(() => sectionFollowups(state, context), /Section Head/);
  assert.throws(() => saveSectionCourseReview(state, context, { course: "math8" }), /Section Head/);
  assert.throws(() => requestSectionCover(state, context, { course: "math8" }), /Section Head/);
  assert.throws(() => generateSectionReport(state, context, {}), /Section Head/);
});

test("Grade filters keep the actual grade and academic cohorts reconcile with their classes", () => {
  for (const id of ["nuwan", "coordinator6_c", "coordinator8_l"]) {
    const { state, context, scope } = setup(id), result = gradeAcademic(state, context);
    const normalized = gradeFilters(state, context, { grade: 13, className: "13A", compare: "grades" });
    assert.equal(Number(normalized.grade), scope.grade);
    assert.equal(normalized.className, "all");
    assert.equal(normalized.compare, "classes");
    assert.equal(result.classes.length, 2);
    assert.equal(result.classes.reduce((sum, row) => sum + row.count, 0), result.summary.count);
    assert.ok(result.classes.every((row) => row.grade === scope.grade && row.branch.id === scope.branch.id));
    for (const compare of ["classes", "subjects", "teachers"]) assert.ok(gradeAcademic(state, context, { compare, subject: scope.grade === 6 ? "english" : "mathematics" }).rows.length);
    if (scope.grade === 6) assert.equal(gradeAcademic(state, context, { compare: "teachers", subject: "mathematics" }).rows.length, 0);
    assert.ok(gradeCourses(state, context).every((course) => course.grade === scope.grade && course.branch === scope.branch.id));
  }
});

test("Grade attendance periods and class totals reconcile without another grade", () => {
  const { state, context } = setup(), result = gradeAttendance(state, context, { period: "week" });
  assert.equal(result.summary.expected, result.roster.length * 5);
  const a = gradeAttendance(state, context, { className: "8A", period: "week" }), b = gradeAttendance(state, context, { className: "8B", period: "week" });
  assert.equal(a.summary.present + b.summary.present, result.summary.present);
  assert.equal(a.summary.expected + b.summary.expected, result.summary.expected);
  assert.ok(a.roster.every((student) => student.grade === 8 && student.className === "8A"));
  assert.ok(gradeAttendance(state, context, { flag: "repeated" }).rows.every((student) => student.missed >= 3));
});

test("Shared teachers show grade workloads while teacher changes and publishing remain restricted", () => {
  const { state, context } = setup();
  state.assignments.english6.teacher = "nuwan";
  const teacher = gradeTeachers(state, context).find((person) => person.id === "nuwan");
  assert.ok(teacher.courses.length);
  assert.ok(teacher.courses.every((course) => course.grade === 8));
  assert.ok(!teacher.classes.includes("6A"));
  assert.equal(can(context, "courses.assign"), true);
  assert.equal(can(context, "courses.teacher"), false);
  for (const permission of ["roles.manage", "materials.publish", "transport.manage", "students.edit"]) assert.equal(can(context, permission), false);
  assert.equal(canPublish(state, context, state.courses.find((course) => course.id === "science8")), false);
});

test("Class coordination reviews preserve note history and never change academic or attendance marks", () => {
  const { state, context } = setup(), beforeAcademic = gradeAcademic(state, context).summary, beforeAttendance = gradeAttendance(state, context).summary;
  saveGradeClassUpdate(state, context, { className: "8A", status: "needs_support", note: "Review progress on the next worksheet." });
  saveGradeClassUpdate(state, context, { className: "8A", status: "completed", note: "Class review completed." });
  const update = gradeClassUpdates(state, context)[0];
  assert.equal(update.notes.length, 2);
  assert.equal(update.status, "completed");
  assert.deepEqual(gradeAcademic(state, context).summary, beforeAcademic);
  assert.deepEqual(gradeAttendance(state, context).summary, beforeAttendance);
  assert.throws(() => saveGradeClassUpdate(state, context, { className: "6A", status: "on_track", note: "Foreign" }), /class from your grade/);
  assert.deepEqual(gradeClassUpdates(state, contextFor(state, "coordinator", "coordinator6_c")), []);
});

test("Grade follow-ups reject other-grade students, owners and task IDs and retain outcomes", () => {
  const { state, context } = setup(), student = gradeAttendance(state, context).roster[0];
  const input = { student: student.id, owner: context.account.id, due: "2026-11-20", status: "open", note: "Class teacher will review the absences." };
  const saved = saveGradeFollowup(state, context, input);
  saveGradeFollowup(state, context, { ...input, id: saved.id, status: "resolved", note: "Meeting completed and attendance reviewed." });
  assert.equal(gradeFollowups(state, context)[0].notes.length, 2);
  assert.equal(gradeFollowups(state, context)[0].status, "resolved");
  const other = contextFor(state, "coordinator", "coordinator6_c"), foreign = gradeAttendance(state, other).roster[0];
  assert.throws(() => saveGradeFollowup(state, context, { ...input, student: foreign.id }), /student from your assigned grade/);
  assert.throws(() => saveGradeFollowup(state, other, { ...input, id: saved.id }), /outside your grade/);
  assert.throws(() => saveGradeFollowup(state, context, { ...input, owner: "rihana" }), /owner serving your grade/);
  assert.deepEqual(gradeFollowups(state, contextFor(state, "coordinator", "coordinator8_l")), []);
});

test("Support requests reach only the correct Section Head and responses preserve leadership ownership", () => {
  const { state, context } = setup(), assignments = structuredClone(state.assignments), materials = structuredClone(state.materials);
  const request = requestGradeSupport(state, context, { course: "math8", type: "cover", note: "Please review the need for class cover." });
  assert.equal(gradeSupportRequests(state, context)[0].status, "open");
  assert.throws(() => requestGradeSupport(state, context, { course: "math8", type: "cover", note: "Duplicate" }), /already exists/);
  assert.throws(() => requestGradeSupport(state, context, { course: "english6", type: "materials", note: "Foreign grade" }), /assigned grade/);
  const head = contextFor(state, "section_head", "dilini"), primary = contextFor(state, "section_head", "asha"), foreign = contextFor(state, "section_head", "lakshmi");
  assert.equal(sectionGradeRequests(state, head)[0].id, request.id);
  assert.deepEqual(sectionGradeRequests(state, primary), []);
  assert.deepEqual(sectionGradeRequests(state, foreign), []);
  assert.throws(() => respondGradeSupport(state, primary, { id: request.id, status: "resolved", note: "Foreign" }), /from your section/);
  assert.throws(() => respondGradeSupport(state, context, { id: request.id, status: "resolved", note: "Self approval" }), /from your section/);
  respondGradeSupport(state, head, { id: request.id, status: "in_progress", note: "I will review cover with the Vice Principal." });
  respondGradeSupport(state, head, { id: request.id, status: "resolved", note: "Coordination reviewed and next steps agreed." });
  assert.equal(gradeSupportRequests(state, context)[0].responses.length, 2);
  assert.equal(gradeSupportRequests(state, context)[0].status, "resolved");
  assert.deepEqual(state.assignments, assignments);
  assert.deepEqual(state.materials, materials);
  assert.equal(state.temporaryCovers, undefined);
});

test("Grade reports capture fixed grade/class scope and isolate school, grade and role histories", () => {
  const { state, context } = setup();
  for (const reportType of ["brief", "academic", "attendance", "teaching"]) {
    const report = generateGradeReport(state, context, { reportType, period: "week" });
    assert.deepEqual(report.criteria.grades, [8]);
    assert.deepEqual(report.criteria.scope, ["colombo"]);
    assert.ok(!reportCSV(report).includes('"Class 6A"'));
    state.gradeReports = [...(state.gradeReports || []), report];
  }
  const snapshot = structuredClone(state.gradeReports[0]);
  state.assignments.math8.students = [];
  assert.deepEqual(state.gradeReports[0], snapshot);
  assert.equal(visibleGradeReports(state, context).length, 4);
  assert.deepEqual(visibleGradeReports(state, contextFor(state, "coordinator", "coordinator6_c")), []);
  assert.deepEqual(visibleGradeReports(state, contextFor(state, "coordinator", "coordinator8_l")), []);
  assert.deepEqual(visibleGradeReports(state, contextFor(state, "section_head", "dilini")), []);
  assert.throws(() => generateGradeReport(state, context, { grade: 6 }), /assigned grade/);
  assert.throws(() => generateGradeReport(state, context, { className: "6A" }), /assigned grade/);
  state.gradeReports.push({ ...snapshot, id: "forged-grade-report", criteria: { ...snapshot.criteria, grades: [6] } });
  assert.equal(visibleGradeReports(state, context).length, 4);
});

test("Existing browser data gains new demo coordinators once without restoring removed appointments", () => {
  const saved = freshState();
  delete saved.gradeCoordinatorVersion;
  saved.accounts = saved.accounts.filter((person) => !["coordinator6_c", "coordinator8_l"].includes(person.id));
  saved.assignments.math8.teacher = "nuwan";
  saved.materials[0].description = "User edited description";
  let storage = JSON.stringify(saved);
  const oldStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => storage, setItem: (_, value) => { storage = value; } };
  try {
    const migrated = loadState();
    assert.equal(migrated.accounts.filter((person) => person.id === "coordinator6_c").length, 1);
    assert.equal(migrated.accounts.filter((person) => person.id === "coordinator8_l").length, 1);
    assert.equal(migrated.assignments.math8.teacher, "nuwan");
    assert.equal(migrated.materials[0].description, "User edited description");
    assert.deepEqual(migrated.accounts.find((person) => person.id === "nuwan").grants, saved.accounts.find((person) => person.id === "nuwan").grants);
    migrated.accounts.find((person) => person.id === "coordinator6_c").grants = [];
    assert.equal(saveState(migrated), true);
    assert.deepEqual(loadState().accounts.find((person) => person.id === "coordinator6_c").grants, []);
  } finally { globalThis.localStorage = oldStorage; }
});
