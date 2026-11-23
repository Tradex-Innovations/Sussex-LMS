import assert from "node:assert/strict";
import test from "node:test";
import { freshState, loadState, saveState, roles } from "../dist/data.js";
import { contextFor, can, canPublish } from "../dist/access.js";
import { attendanceResult, attendanceExceptions, chairmanDefaults, studentStatus, generateExecutiveReport, reportCSV } from "../dist/chairman-data.js";
import { sectionScope, sectionCourses, sectionAttendance, sectionAcademic, saveSectionCourseReview } from "../dist/section-data.js";
import { gradeAttendance, gradeScope } from "../dist/grade-data.js";
import { classScope, classFilters, classCourses, classAcademic, classAttendance, classStudents, classFollowups, saveClassFollowup,
  saveClassAttendance, resetClassAttendance, classDiscussionNotes, saveClassDiscussion, classSupportRequests, requestClassSupport, gradeClassRequests, respondClassSupport,
  generateClassReport, visibleClassReports } from "../dist/class-data.js";
import { sectionReportHTML } from "../dist/section-head.js";

const setup = (id = "dilini") => { const state = freshState(), context = contextFor(state, "class_teacher", id); return { state, context, scope: classScope(state, context) }; };
function addSibling(state) {
  state.accounts.push({ id: "class_8b", name: "Sample Class B Teacher", grants: [{ role: "class_teacher", branch: "colombo", grade: 8, className: "8B" }] });
  return contextFor(state, "class_teacher", "class_8b");
}
const settings = { date: "2026-11-20", period: "day", attendanceGrade: "all", audience: "students" };

test("Class Teacher scope follows the exact appointment, not another class, grade, school or active role", () => {
  const { state, context, scope } = setup();
  assert.equal(roles.class_teacher.start, "overview");
  assert.equal(scope.className, "8A");
  assert.equal(classScope(state, { ...context, branch: "all" }).branch.id, "colombo");
  for (const grant of [{ ...context.grant, className: "8B" }, { ...context.grant, grade: 6, className: "6A" }, { ...context.grant, branch: "lakeside" }]) assert.equal(classScope(state, { ...context, grant }), null);
  assert.equal(classScope(state, contextFor(state, "teacher", "dilini")), null);
  assert.equal(sectionScope(state, context), null);
  assert.equal(gradeScope(state, context), null);
  const f = classFilters(state, context, { grade: 6, className: "6A" });
  assert.equal(Number(f.grade), 8); assert.equal(f.className, "8A");
  assert.ok(sectionCourses(state, context).every((course) => course.branch === "colombo" && course.className === "8A"));
  assert.throws(() => saveSectionCourseReview(state, context, { course: "math8" }), /Section Head/);
});

test("Academic, register and admission data stay in the class for all seeded teachers", () => {
  for (const id of ["dilini", "class_teacher6_c", "class_teacher8_l"]) {
    const { state, context, scope } = setup(id), a = classAcademic(state, context), r = classAttendance(state, context, { period: "week" });
    assert.equal(a.classes.length, 1);
    assert.equal(a.classes[0].className, scope.className);
    assert.equal(a.summary.count, a.classes[0].count);
    assert.equal(r.summary.expected, r.roster.length * 5);
    assert.ok(r.roster.every((student) => student.branch === scope.branch.id && student.className === scope.className));
    assert.ok(classCourses(state, context).every((course) => course.branch === scope.branch.id && course.className === scope.className));
    assert.ok(classStudents(state, context).every((student) => student.branch === scope.branch.id && student.className === scope.className));
  }
});

test("Publication follows the assigned subject teacher, while class attendance is a separate permission", () => {
  const { state, context } = setup();
  assert.equal(canPublish(state, context, state.courses.find((course) => course.id === "math8")), true);
  assert.equal(canPublish(state, context, state.courses.find((course) => course.id === "science8")), false);
  assert.equal(canPublish(state, context, state.courses.find((course) => course.id === "ict6")), false);
  assert.equal(can(context, "attendance.mark"), true);
  assert.equal(can(contextFor(state, "teacher", "dilini"), "attendance.mark"), false);
  for (const permission of ["courses.assign", "courses.teacher", "students.edit", "roles.manage", "materials.publish", "transport.manage"]) assert.equal(can(context, permission), false);
});

test("Saved class attendance updates cached branch, grade and section totals and repeated-absence records", () => {
  const { state, context, scope } = setup(), sibling = addSibling(state), coordinator = contextFor(state, "coordinator", "nuwan"), head = contextFor(state, "section_head", "dilini");
  const original = classAttendance(state, context), beforeGrade = gradeAttendance(state, coordinator).summary, beforeSection = sectionAttendance(state, head).summary;
  const beforeSchool = attendanceResult(state, scope.branch, settings), beforeSibling = classAttendance(state, sibling).summary;
  const other = contextFor(state, "class_teacher", "class_teacher8_l"), beforeOther = classAttendance(state, other).summary;
  saveClassAttendance(state, context, { date: "2026-11-20", entries: original.roster.map((student) => ({ student: student.id, status: "absent" })) });
  const after = classAttendance(state, context);
  assert.equal(after.summary.present, 0); assert.equal(after.summary.absent, after.roster.length); assert.equal(after.marked, after.roster.length);
  assert.equal(gradeAttendance(state, coordinator).summary.present, beforeGrade.present - original.summary.present);
  assert.equal(sectionAttendance(state, head).summary.present, beforeSection.present - original.summary.present);
  assert.equal(attendanceResult(state, scope.branch, settings).present, beforeSchool.present - original.summary.present);
  assert.deepEqual(classAttendance(state, sibling).summary, beforeSibling);
  assert.deepEqual(classAttendance(state, other).summary, beforeOther);
  const exceptions = attendanceExceptions([scope.branch], { ...chairmanDefaults(), attendanceFlag: "absent" }, state);
  assert.ok(after.roster.every((student) => exceptions.some((person) => person.id === student.id)));
  assert.ok(after.roster.every((student) => studentStatus(student, "2026-11-20", state) === "absent"));
});

test("Attendance validation is atomic and late arrivals remain present", () => {
  const { state, context } = setup(), roster = classAttendance(state, context).roster, sibling = addSibling(state), foreign = classAttendance(state, sibling).roster[0];
  assert.throws(() => saveClassAttendance(state, context, { date: "2026-11-20", entries: [{ student: roster[0].id, status: "present" }, { student: foreign.id, status: "absent" }] }), /student in your class/);
  assert.equal(state.classAttendance, undefined);
  for (const date of ["2026-10-32", "2026-11-15", "2026-12-01"]) assert.throws(() => saveClassAttendance(state, context, { date, entries: [{ student: roster[0].id, status: "present" }] }), /school day/);
  assert.throws(() => saveClassAttendance(state, context, { date: "2026-11-20", entries: [{ student: roster[0].id, status: "leave" }] }), /present, absent or late/);
  saveClassAttendance(state, context, { date: "2026-11-20", entries: roster.map((student) => ({ student: student.id, status: "late" })) });
  const after = classAttendance(state, context);
  assert.equal(after.summary.present, roster.length); assert.equal(after.summary.late, roster.length); assert.equal(after.summary.absent, 0);
  assert.throws(() => saveClassAttendance(state, contextFor(state, "teacher", "dilini"), { date: "2026-11-20", entries: [] }), /Class Teacher/);
});

test("Restoring generated attendance changes only the appointed class and day", () => {
  const { state, context } = setup(), sibling = addSibling(state), before = classAttendance(state, context).summary;
  const student = classAttendance(state, context).roster[0], other = classAttendance(state, sibling).roster[0];
  saveClassAttendance(state, context, { date: "2026-11-20", entries: [{ student: student.id, status: "absent" }] });
  saveClassAttendance(state, context, { date: "2026-11-19", entries: [{ student: student.id, status: "late" }] });
  saveClassAttendance(state, sibling, { date: "2026-11-20", entries: [{ student: other.id, status: "absent" }] });
  resetClassAttendance(state, context, "2026-11-20");
  assert.deepEqual(classAttendance(state, context).summary, before);
  assert.ok(state.classAttendance[other.id + ":2026-11-20"]);
  assert.ok(state.classAttendance[student.id + ":2026-11-19"]);
});

test("Follow-ups retain note history and cannot target an actual admission or another class", () => {
  const { state, context } = setup(), student = classAttendance(state, context).roster[0], sibling = addSibling(state);
  const input = { student: student.id, due: "2026-11-20", status: "open", note: "Review repeated absences." };
  const item = saveClassFollowup(state, context, input);
  saveClassFollowup(state, context, { ...input, id: item.id, status: "resolved", note: "Attendance review completed." });
  assert.equal(classFollowups(state, context)[0].notes.length, 2);
  assert.equal(classFollowups(state, context)[0].owner, context.account.name);
  assert.throws(() => saveClassFollowup(state, context, { ...input, student: "amaya" }), /class register/);
  assert.throws(() => saveClassFollowup(state, sibling, { ...input, id: item.id }), /outside your class/);
  assert.deepEqual(classFollowups(state, sibling), []);
});

test("Parent discussion records use actual linked guardians, preserve updates and stay out of exports", () => {
  const { state, context } = setup(), sibling = addSibling(state);
  const input = { student: "amaya", guardian: "parent", date: "2026-11-20", status: "planned", note: "PRIVATE_DISCUSSION_DETAIL" };
  const item = saveClassDiscussion(state, context, input);
  saveClassDiscussion(state, context, { ...input, id: item.id, status: "completed", note: "PRIVATE_MEETING_OUTCOME" });
  assert.equal(classDiscussionNotes(state, context).length, 1);
  assert.equal(classDiscussionNotes(state, context)[0].notes.length, 2);
  assert.equal(classDiscussionNotes(state, context)[0].status, "completed");
  assert.throws(() => saveClassDiscussion(state, context, { ...input, student: "kavin" }), /actual student from your class/);
  assert.throws(() => saveClassDiscussion(state, context, { ...input, guardian: "parent_l" }), /guardian linked/);
  assert.throws(() => saveClassDiscussion(state, sibling, { ...input, id: item.id }), /outside your class/);
  assert.deepEqual(classDiscussionNotes(state, sibling), []);
  const report = generateClassReport(state, context, { reportType: "brief" });
  assert.ok(!JSON.stringify(report).includes("PRIVATE_"));
  assert.ok(!reportCSV(report).includes("PRIVATE_"));
});

test("Class Teacher requests reach only the correct Grade Coordinator without automatic approvals", () => {
  const { state, context } = setup(), before = structuredClone(state.assignments);
  const request = requestClassSupport(state, context, { course: "math8", type: "materials", note: "Please coordinate lecture support." });
  assert.throws(() => requestClassSupport(state, context, { course: "math8", type: "materials", note: "Duplicate" }), /already exists/);
  assert.throws(() => requestClassSupport(state, context, { course: "english6", type: "materials", note: "Foreign" }), /subject from your class/);
  assert.throws(() => requestClassSupport(state, context, { type: "cover", note: "No course" }), /Choose a class subject/);
  assert.ok(requestClassSupport(state, context, { type: "attendance", note: "Class-level concern." }));
  const coordinator = contextFor(state, "coordinator", "nuwan"), wrongGrade = contextFor(state, "coordinator", "coordinator6_c"), wrongSchool = contextFor(state, "coordinator", "coordinator8_l");
  assert.equal(gradeClassRequests(state, coordinator).length, 2);
  assert.deepEqual(gradeClassRequests(state, wrongGrade), []); assert.deepEqual(gradeClassRequests(state, wrongSchool), []);
  assert.throws(() => respondClassSupport(state, context, { id: request.id, status: "resolved", note: "Self approval" }), /from your grade/);
  assert.throws(() => respondClassSupport(state, wrongGrade, { id: request.id, status: "resolved", note: "Foreign" }), /from your grade/);
  respondClassSupport(state, coordinator, { id: request.id, status: "in_progress", note: "Reviewing the lesson plan." });
  respondClassSupport(state, coordinator, { id: request.id, status: "resolved", note: "Coordinated next steps with the Section Head." });
  assert.equal(classSupportRequests(state, context).find((item) => item.id === request.id).responses.length, 2);
  assert.deepEqual(state.assignments, before); assert.equal(state.temporaryCovers, undefined);
});

test("Class report snapshots use saved attendance and isolate class, school and role histories", () => {
  const { state, context, scope } = setup(), sibling = addSibling(state), roster = classAttendance(state, context).roster;
  const before = generateClassReport(state, context, { reportType: "attendance" });
  saveClassAttendance(state, context, { date: "2026-11-20", entries: roster.map((student) => ({ student: student.id, status: "absent" })) });
  for (const reportType of ["brief", "academic", "attendance", "teaching"]) {
    const report = generateClassReport(state, context, { reportType });
    assert.deepEqual(report.criteria.scope, [scope.branch.id]); assert.equal(report.criteria.className, "8A");
    assert.equal(report.summary.attendance.present, 0);
    state.classReports = [...(state.classReports || []), report];
  }
  assert.equal(before.summary.attendance.present > 0, true);
  const register = state.classReports.find((report) => report.type === "attendance");
  assert.ok(register.customRows.every((row) => row.status === "absent" && row.source === "Marked in prototype"));
  assert.match(sectionReportHTML(register), /Class Teacher’s office/);
  assert.equal(visibleClassReports(state, context).length, 4);
  assert.deepEqual(visibleClassReports(state, sibling), []);
  assert.deepEqual(visibleClassReports(state, contextFor(state, "class_teacher", "class_teacher8_l")), []);
  assert.deepEqual(visibleClassReports(state, contextFor(state, "coordinator", "nuwan")), []);
  assert.throws(() => generateClassReport(state, context, { className: "8B" }), /assigned class/);
  const principal = contextFor(state, "principal", "principal_c");
  const executive = generateExecutiveReport(state, principal, { ...chairmanDefaults(), reportType: "attendance", reportPeriod: "day" }, { subject: "mathematics", grade: 8, term: 3 });
  assert.equal(executive.summary.attendance.present, attendanceResult(state, scope.branch, settings).present);
});

test("Classes without A/B sample fixtures show empty results rather than another class", () => {
  const { state } = setup();
  state.accounts.find((person) => person.id === "dilini").grants.find((grant) => grant.role === "class_teacher").className = "8C";
  const context = contextFor(state, "class_teacher", "dilini");
  assert.equal(classScope(state, context).className, "8C");
  assert.equal(classAcademic(state, context).summary.count, 0);
  assert.deepEqual(classAcademic(state, context).rows, []);
  assert.equal(classAttendance(state, context).summary.expected, 0);
  assert.deepEqual(classCourses(state, context), []);
  assert.deepEqual(sectionAcademic(state, context, { compare: "subjects" }).rows, []);
});

test("Class Teacher demo migration preserves existing edits and does not restore removed appointments", () => {
  const saved = freshState(); delete saved.classTeacherVersion;
  saved.accounts = saved.accounts.filter((person) => !["class_teacher6_c", "class_teacher8_l"].includes(person.id));
  saved.assignments.math8.teacher = "nuwan"; saved.completed.amaya = ["m1", "m2"];
  let value = JSON.stringify(saved); const oldStorage = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => value, setItem: (_, next) => { value = next; } };
  try {
    const migrated = loadState();
    assert.equal(migrated.accounts.filter((person) => person.id === "class_teacher6_c").length, 1);
    assert.equal(migrated.accounts.filter((person) => person.id === "class_teacher8_l").length, 1);
    assert.equal(migrated.assignments.math8.teacher, "nuwan"); assert.deepEqual(migrated.completed.amaya, ["m1", "m2"]);
    migrated.accounts.find((person) => person.id === "class_teacher6_c").grants = [];
    assert.equal(saveState(migrated), true);
    assert.deepEqual(loadState().accounts.find((person) => person.id === "class_teacher6_c").grants, []);
  } finally { globalThis.localStorage = oldStorage; }
});
