import assert from "node:assert/strict";
import test from "node:test";
import { freshState } from "../dist/data.js";
import { contextFor, can, assignableRoles } from "../dist/access.js";
import { chairmanBranches, chairmanDefaults, branchStaff, schoolLeaveRequests, generateExecutiveReport, visibleExecutiveReports } from "../dist/chairman-data.js";
import { schoolFollowups, followupAssignees, saveSchoolFollowup, schoolTemporaryCovers, coverTeachers, saveTemporaryCover, cancelTemporaryCover, saveLeaveRecommendation } from "../dist/vice-data.js";

const setup = (account = "vice_c") => {
  const state = freshState(), context = contextFor(state, "vice_principal", account);
  return { state, context, branch: chairmanBranches(state, context)[0] };
};
const academic = { subject: "mathematics", grade: 8, term: 3, className: "all" };

test("Vice Principals retain their appointment scope and cannot make permanent appointments", () => {
  const { state, context } = setup();
  assert.equal(can(context, "roles.manage"), false);
  assert.deepEqual(assignableRoles(context), []);
  assert.deepEqual(chairmanBranches(state, { ...context, branch: "all" }).map((branch) => branch.id), ["colombo"]);
  assert.deepEqual(chairmanBranches(state, context, ["lakeside"]), []);
});

test("Follow-ups validate school owners and preserve note history as progress changes", () => {
  const { state, context, branch } = setup();
  const other = state.branches.find((branch) => branch.id === "lakeside");
  const initial = schoolFollowups(state, branch)[0];
  const input = { ...initial, note: "Coordinator confirmed the bus has arrived.", status: "resolved" };
  saveSchoolFollowup(state, context, input);
  const saved = schoolFollowups(state, branch).find((item) => item.id === initial.id);
  assert.equal(saved.status, "resolved");
  assert.equal(saved.notes.length, 2);
  assert.equal(saved.notes[0].by, context.account.name);
  assert.equal(schoolFollowups(state, branch).length, 3);
  assert.throws(() => saveSchoolFollowup(state, context, { ...input, id: schoolFollowups(state, other)[0].id }), /outside your school/);
  assert.throws(() => saveSchoolFollowup(state, context, { ...input, assignee: followupAssignees(state, other)[0].id }), /owner from your school/);
  assert.throws(() => saveSchoolFollowup(state, context, { ...input, due: "2026-11-31" }), /date/);
  assert.equal(schoolFollowups(state, other).every((item) => item.status === "open"), true);
});

test("Temporary cover stays separate from assignments and rejects duplicate or foreign cover", () => {
  for (const account of ["vice_c", "vice_l"]) {
    const { state, context, branch } = setup(account);
    const courses = state.courses.filter((course) => course.branch === branch.id);
    const course = courses[0], original = structuredClone(state.assignments), grants = structuredClone(state.accounts);
    const teacher = coverTeachers(state, branch).find((person) => person.id !== state.assignments[course.id].teacher);
    const input = { course: course.id, teacher: teacher.id, date: "2026-11-20", reason: "Cover for leave." };
    const cover = saveTemporaryCover(state, context, input);
    assert.deepEqual(state.assignments, original);
    assert.deepEqual(state.accounts, grants);
    assert.equal(schoolTemporaryCovers(state, branch).length, 1);
    assert.throws(() => saveTemporaryCover(state, context, input), /already has active cover/);
    assert.throws(() => saveTemporaryCover(state, context, { ...input, course: state.courses.find((item) => item.branch !== branch.id).id }), /assigned school/);
    assert.throws(() => saveTemporaryCover(state, context, { ...input, teacher: state.assignments[course.id].teacher }), /another available teacher/);
    const other = contextFor(state, "vice_principal", account === "vice_c" ? "vice_l" : "vice_c");
    assert.throws(() => cancelTemporaryCover(state, other, cover.id), /within your school/);
    cancelTemporaryCover(state, context, cover.id);
    assert.equal(schoolTemporaryCovers(state, branch)[0].status, "cancelled");
    assert.ok(saveTemporaryCover(state, context, input));
  }
});

test("Leave recommendations leave availability and the Principal decision unchanged", () => {
  const { state, context, branch } = setup();
  const request = schoolLeaveRequests(state, branch)[0], before = branchStaff(state, branch);
  saveLeaveRecommendation(state, context, { id: request.id, recommendation: "support", note: "Cover arranged for the class." });
  const recommended = schoolLeaveRequests(state, branch)[0];
  assert.equal(recommended.decision, "pending");
  assert.equal(recommended.recommendation.by, context.account.name);
  assert.deepEqual(branchStaff(state, branch), before);
  assert.equal(state.principalLeaveReviews, undefined);
  const foreign = schoolLeaveRequests(state, state.branches.find((item) => item.id === "lakeside"))[0];
  assert.throws(() => saveLeaveRecommendation(state, context, { id: foreign.id, recommendation: "support", note: "Scope test" }), /from your school/);
  state.principalLeaveReviews = { [request.id]: { decision: "approved", by: "Principal" } };
  assert.equal(schoolLeaveRequests(state, branch)[0].decision, "approved");
  assert.throws(() => saveLeaveRecommendation(state, context, { id: request.id, recommendation: "discuss", note: "Too late" }), /pending leave request/);
});

test("Operational reports have a separate Vice Principal and school history", () => {
  const { state, context } = setup(), settings = { ...chairmanDefaults(), reportPeriod: "day" };
  const principal = contextFor(state, "principal", "principal_c"), other = contextFor(state, "vice_principal", "vice_l");
  const report = generateExecutiveReport(state, context, settings, academic);
  assert.equal(report.title, "School operational brief");
  assert.deepEqual(report.criteria.scope, ["colombo"]);
  assert.throws(() => generateExecutiveReport(state, context, { ...settings, reportBranches: ["lakeside"] }, academic), /assigned school/);
  state.executiveReports = [report, generateExecutiveReport(state, principal, settings, academic), generateExecutiveReport(state, other, settings, academic)];
  assert.deepEqual(visibleExecutiveReports(state, context).map((item) => item.id), [report.id]);
  assert.equal(visibleExecutiveReports(state, principal).length, 1);
  assert.equal(visibleExecutiveReports(state, other).length, 1);
});

test("Only the Vice Principal can change the daily coordination records", () => {
  const { state, branch } = setup(), context = contextFor(state, "teacher");
  assert.throws(() => saveSchoolFollowup(state, context, schoolFollowups(state, branch)[0]), /Vice Principal access required/);
  assert.throws(() => saveTemporaryCover(state, context, {}), /Vice Principal access required/);
  assert.throws(() => saveLeaveRecommendation(state, context, {}), /Vice Principal access required/);
});
