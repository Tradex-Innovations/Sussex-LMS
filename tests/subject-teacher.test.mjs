import assert from "node:assert/strict";
import test from "node:test";
import { freshState, roles, loadState, saveState } from "../dist/data.js";
import { contextFor, can, canPublish, visibleStudents } from "../dist/access.js";
import { coursesPage } from "../dist/learning.js";
import { reportCSV } from "../dist/chairman-data.js";
import { saveClassAttendance, classAttendance } from "../dist/class-data.js";
import { subjectScope, subjectFilters, subjectCourses, subjectEnrolments, subjectPlans, subjectOverview, saveSubjectPlan, saveSubjectReview, requestSubjectSupport,
  subjectSupportRequests, gradeSubjectRequests, respondSubjectSupport, generateSubjectReport, visibleSubjectReports } from "../dist/subject-data.js";
import { subjectReportHTML, subjectTeacherPage } from "../dist/subject-teacher.js";

const setup = (id = "dilini") => { const state = freshState(), context = contextFor(state, "teacher", id); return { state, context }; };
const plan = { course: "math8", topic: "Algebra practice", date: "2026-11-23", status: "planned", note: "INTERNAL_PLAN_NOTE" };
const review = { course: "math8", student: "amaya", status: "needs_practice", note: "INTERNAL_LEARNING_NOTE" };
const request = { course: "math8", type: "learning", note: "INTERNAL_SUPPORT_NOTE" };

test("Subject Teacher scope requires an actual active school appointment and current course assignment", () => {
  const { state, context } = setup();
  assert.equal(roles.teacher.start, "overview"); assert.deepEqual(roles.teacher.pages, ["overview", "courses"]);
  assert.deepEqual(subjectCourses(state, context).map((course) => course.id), ["math8", "ict6"]);
  assert.equal(subjectScope(state, { ...context, branch: "lakeside" }).branch.id, "colombo");
  assert.equal(subjectScope(state, { ...context, grant: { ...context.grant, branch: "lakeside" } }), null);
  for (const role of ["class_teacher", "section_head", "coordinator", "principal", "parent"]) assert.equal(subjectScope(state, contextFor(state, role)), null);
  for (const permission of ["attendance.mark", "courses.assign", "courses.teacher", "students.edit", "roles.manage", "materials.publish"]) assert.equal(can(context, permission), false);
  assert.equal(canPublish(state, context, state.courses.find((course) => course.id === "math8")), true);
  assert.equal(canPublish(state, context, state.courses.find((course) => course.id === "science8")), false);
  state.accounts.find((person) => person.id === "dilini").grants = [{ role: "class_teacher", branch: "colombo", grade: 8, className: "8A" }];
  assert.equal(subjectScope(state, context), null); assert.throws(() => saveSubjectPlan(state, context, plan), /appointment/);
});

test("Enrolled learning excludes other teachers, schools, grades, classes and invalid assignment members", () => {
  const { state, context } = setup();
  state.students.push({ id: "other8b", name: "Other Class", branch: "colombo", grade: 8, className: "8B" });
  state.assignments.math8.students.push("meera", "kavin", "other8b");
  assert.deepEqual(subjectEnrolments(state, context, { course: "math8" }).map((row) => row.student.id), ["amaya", "lohith", "sara"]);
  assert.ok(!visibleStudents(state, context).some((student) => ["meera", "kavin", "other8b"].includes(student.id)));
  const data = subjectOverview(state, context); assert.equal(data.students, 5); assert.equal(data.completed, 1); assert.equal(data.expected, 11);
  assert.equal(subjectEnrolments(state, context, { query: "SCN-1001" }).length, 1);
  assert.throws(() => saveSubjectReview(state, context, { ...review, student: "meera" }), /currently enrolled/);
  assert.throws(() => saveSubjectReview(state, context, { ...review, course: "science8" }), /currently assigned/);
});

test("Lesson plans retain history, validate dates and status, and follow course reassignment", () => {
  const { state, context } = setup(), saved = saveSubjectPlan(state, context, plan);
  const updated = saveSubjectPlan(state, context, { ...plan, id: saved.id, status: "completed", note: "Practice complete" });
  assert.equal(updated.notes.length, 2); assert.equal(updated.status, "completed");
  assert.equal(subjectPlans(state, context, { planStatus: "planned" }).length, 0);
  for (const invalid of [{ course: "lake-math8" }, { status: "approved" }, { date: "2026-11-31" }, { topic: "" }, { note: "" }]) assert.throws(() => saveSubjectPlan(state, context, { ...plan, ...invalid }));
  state.assignments.math8.teacher = "nuwan";
  assert.equal(subjectPlans(state, context).length, 0);
  assert.throws(() => saveSubjectPlan(state, context, { ...plan, id: saved.id }), /outside/);
  assert.equal(subjectPlans(state, contextFor(state, "teacher", "nuwan"))[0].id, saved.id);
});

test("Staff learning reviews have history, never set parent completion and stay out of parent views", () => {
  const { state, context } = setup(), completion = structuredClone(state.completed);
  saveSubjectReview(state, context, review);
  saveSubjectReview(state, context, { ...review, status: "reviewed", note: "INTERNAL_REVIEW_OUTCOME" });
  const row = subjectEnrolments(state, context, { course: "math8", query: "Amaya" })[0];
  assert.equal(row.review.notes.length, 2); assert.equal(row.review.status, "reviewed"); assert.deepEqual(state.completed, completion);
  assert.equal(subjectEnrolments(state, context, { review: "unreviewed" }).length, 4);
  assert.equal(subjectEnrolments(state, context, { review: "reviewed" }).length, 1);
  const staff = coursesPage({ state, context, courseId: "math8" }); assert.match(staff, /INTERNAL_REVIEW_OUTCOME/);
  const parent = contextFor(state, "parent", "parent"), child = state.students.find((person) => person.id === "amaya");
  const html = coursesPage({ state, context: parent, courseId: "math8", child, children: [child] });
  assert.doesNotMatch(html, /INTERNAL_|Staff learning review|Review learning/);
  state.assignments.math8.students = state.assignments.math8.students.filter((id) => id !== "amaya");
  assert.throws(() => saveSubjectReview(state, context, review), /currently enrolled/);
  assert.doesNotMatch(coursesPage({ state, context, courseId: "math8" }), /INTERNAL_REVIEW_OUTCOME/);
});

test("Subject Teachers cannot invoke Class Teacher register writes even on a multi-role account", () => {
  const { state, context } = setup(), appointed = contextFor(state, "class_teacher", "dilini"), student = classAttendance(state, appointed).roster[0];
  const input = { date: "2026-11-20", entries: [{ student: student.id, status: "absent" }] };
  assert.throws(() => saveClassAttendance(state, context, input), /Class Teacher/); assert.equal(state.classAttendance, undefined);
  saveClassAttendance(state, appointed, input); assert.equal(state.classAttendance[student.id + ":2026-11-20"].status, "absent");
  assert.throws(() => saveSubjectReview(state, appointed, review), /Subject Teacher/);
});

test("Course support reaches only its school and grade coordinator and has response history", () => {
  const { state, context } = setup(), coordinator = contextFor(state, "coordinator", "nuwan"), saved = requestSubjectSupport(state, context, request);
  assert.equal(gradeSubjectRequests(state, coordinator).length, 1);
  for (const id of ["coordinator6_c", "coordinator8_l"]) {
    const foreign = contextFor(state, "coordinator", id);
    assert.equal(gradeSubjectRequests(state, foreign).length, 0);
    assert.throws(() => respondSubjectSupport(state, foreign, { id: saved.id, status: "resolved", note: "Invalid response" }), /appointed school/);
  }
  assert.throws(() => requestSubjectSupport(state, context, request), /open request/);
  assert.throws(() => requestSubjectSupport(state, context, { ...request, course: "science8" }), /currently assigned/);
  const assignments = structuredClone(state.assignments);
  respondSubjectSupport(state, coordinator, { id: saved.id, status: "in_progress", note: "Reviewing" });
  respondSubjectSupport(state, coordinator, { id: saved.id, status: "resolved", note: "Plan agreed" });
  assert.equal(subjectSupportRequests(state, context)[0].responses.length, 2); assert.deepEqual(state.assignments, assignments);
  assert.equal(state.temporaryCovers, undefined); assert.equal(state.classAttendance, undefined);
  requestSubjectSupport(state, context, request); assert.equal(subjectSupportRequests(state, context).length, 2);
  state.assignments.math8.teacher = "nuwan";
  assert.equal(subjectSupportRequests(state, context).length, 0);
  assert.equal(subjectSupportRequests(state, contextFor(state, "teacher", "nuwan")).length, 2);
});

test("All four reports capture actual scoped records, relevant filters and exclude internal free-text notes", () => {
  const { state, context } = setup(); saveSubjectPlan(state, context, plan); saveSubjectReview(state, context, review); requestSubjectSupport(state, context, request);
  for (const type of ["brief", "materials", "progress", "plans"]) {
    const report = generateSubjectReport(state, context, { reportType: type, course: "math8", review: "needs_practice", query: "Amaya", planStatus: "planned" });
    assert.equal(report.owner.key, "teacher:colombo:dilini"); assert.deepEqual(report.criteria.courseIds, ["math8"]);
    assert.equal(report.summary.students, 3); assert.equal(report.summary.expected, 9);
    const csv = reportCSV(report), html = subjectReportHTML(report);
    for (const text of [JSON.stringify(report), csv, html]) assert.doesNotMatch(text, /INTERNAL_|Malabe|Academic assessment|Attendance period|undefined/);
    assert.match(csv, /Subject Teacher/); assert.match(csv, /Snapshot date/); assert.match(html, /Subject Teacher’s workspace/);
    if (type === "progress") { assert.equal(report.customRows.length, 1); assert.equal(report.customRows[0].review, "Needs practice"); assert.match(csv, /Student search.*Amaya/); }
    if (type === "plans") { assert.equal(report.customRows.length, 1); assert.equal(report.customRows[0].topic, plan.topic); }
  }
  assert.throws(() => generateSubjectReport(state, context, { course: "science8" }), /assigned teaching/);
  assert.throws(() => generateSubjectReport(state, context, { reportType: "attendance" }), /report type/);
});

test("Saved report scope rechecks teacher, school, every captured course and student enrolment", () => {
  const { state, context } = setup(), report = generateSubjectReport(state, context, { reportType: "progress", course: "math8" });
  state.subjectReports = [report]; assert.equal(visibleSubjectReports(state, context).length, 1);
  assert.equal(visibleSubjectReports(state, contextFor(state, "teacher", "nuwan")).length, 0);
  assert.equal(visibleSubjectReports(state, contextFor(state, "teacher", "lakshmi")).length, 0);
  const original = JSON.stringify(report);
  state.completed.amaya = ["m1", "m2", "m3"]; assert.equal(JSON.stringify(report), original);
  state.assignments.math8.students = ["lohith", "sara"]; assert.equal(visibleSubjectReports(state, context).length, 0);
  state.assignments.math8.students.push("amaya"); assert.equal(visibleSubjectReports(state, context).length, 1);
  state.students.find((student) => student.id === "amaya").className = "8B"; assert.equal(visibleSubjectReports(state, context).length, 0);
  state.students.find((student) => student.id === "amaya").className = "8A";
  state.assignments.math8.teacher = "nuwan"; assert.equal(visibleSubjectReports(state, context).length, 0);
  assert.equal(visibleSubjectReports(state, contextFor(state, "teacher", "nuwan")).length, 0);
  assert.equal(JSON.stringify(report), original);
});

test("Empty teaching appointments render all five views and filters cannot expand scope", () => {
  const { state, context } = setup();
  assert.equal(subjectFilters(state, context, { course: "lake-math8" }).course, "all");
  for (const assignment of Object.values(state.assignments)) if (assignment.teacher === "dilini") assignment.teacher = "nuwan";
  for (const view of ["summary", "teaching", "progress", "support", "reports"]) {
    const html = subjectTeacherPage({ state, context, subjectTeacher: { ...subjectFilters(state, context), view } });
    assert.match(html, /SUBJECT TEACHER WORKSPACE/); assert.doesNotMatch(html, /data-action="add-material"|data-action="subject-support"/);
  }
  assert.equal(generateSubjectReport(state, context).customRows.length, 0);
  assert.throws(() => requestSubjectSupport(state, context, request), /currently assigned/);
});

test("Subject state persists alongside existing browser records without account migration", () => {
  const { state, context } = setup(); saveSubjectPlan(state, context, plan); saveSubjectReview(state, context, review); requestSubjectSupport(state, context, request);
  state.subjectReports = [generateSubjectReport(state, context)];
  const previous = globalThis.localStorage, storage = new Map(); globalThis.localStorage = { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) };
  try { assert.equal(saveState(state), true); const restored = loadState(); for (const key of ["subjectLessonPlans", "subjectLearningReviews", "subjectSupportRequests", "subjectReports", "accounts", "completed", "assignments"]) assert.deepEqual(restored[key], state[key]); }
  finally { globalThis.localStorage = previous; }
});

test("Subject CSV and standalone HTML escape malicious sample text", () => {
  const { state, context } = setup(); state.materials[0].title = '=HYPERLINK("https://example.com")';
  let report = generateSubjectReport(state, context, { reportType: "materials" }); assert.match(reportCSV(report), /'=HYPERLINK/);
  state.materials[0].title = '<script>alert("x")</script>'; report = generateSubjectReport(state, context, { reportType: "materials" });
  assert.doesNotMatch(subjectReportHTML(report), /<script>/); assert.match(subjectReportHTML(report), /&lt;script&gt;/);
});
