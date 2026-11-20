import assert from "node:assert/strict";
import test from "node:test";
import { freshState } from "../dist/data.js";
import { contextFor } from "../dist/access.js";
import { chairmanBranches, chairmanDefaults, schoolDays, studentRoster, studentStatus, schoolEnrollment, attendanceResult, attendanceSummary,
  attendanceExceptions, branchStaff, staffingResult, staffingSummary, branchVacancies, generateExecutiveReport, reportCSV } from "../dist/chairman-data.js";
import { rankedResults, networkSummary, assessmentResult } from "../dist/network-analytics.js";

const academic = { subject: "mathematics", grade: 8, term: 3 };
const state = freshState();
const settings = { ...chairmanDefaults(), reportPeriod: "week" };
const chairman = contextFor(state, "chairman");

test("Attendance periods contain the requested number of school days and normalize weekends", () => {
  for (const [period, count] of [["day", 1], ["week", 5], ["month", 20]]) {
    const days = schoolDays("2026-11-22", period);
    assert.equal(days.length, count);
    assert.equal(days.at(-1), "2026-11-20");
    assert.ok(days.every((date) => ![0, 6].includes(new Date(date + "T12:00Z").getUTCDay())));
    assert.deepEqual(days, [...days].sort());
  }
});

test("Illustrative students have stable unique identifiers and grade counts reconcile with enrolment", () => {
  const admissions = [];
  for (const branch of state.branches) {
    const roster = studentRoster(branch);
    assert.equal(roster.length, schoolEnrollment(branch));
    assert.equal(Array.from({ length: 13 }, (_, i) => studentRoster(branch, i + 1).length).reduce((a, b) => a + b), roster.length);
    assert.ok(roster.every((person) => person.branch === branch.id && person.sample));
    admissions.push(...roster.map((person) => person.admission));
    assert.deepEqual(studentRoster(branch, 8), roster.filter((person) => person.grade === 8));
    assert.ok(assessmentResult(branch, academic).count <= studentRoster(branch, academic.grade).length);
  }
  assert.equal(new Set(admissions).size, admissions.length);
});

test("Attendance details, late counts and weighted network totals use the same underlying registers", () => {
  for (const audience of ["students", "staff"]) {
    const rows = state.branches.slice(0, 3).map((branch) => attendanceResult(state, branch, { ...settings, audience, period: "week" }));
    for (const row of rows) {
      assert.equal(row.present + row.absent + row.leave, row.expected);
      assert.ok(row.late <= row.present);
      assert.equal(row.rate, Math.round(row.present / row.expected * 1000) / 10);
      assert.equal(row.expected, row.trend.reduce((sum, day) => sum + day.expected, 0));
    }
    const summary = attendanceSummary(rows);
    assert.equal(summary.expected, rows.reduce((sum, row) => sum + row.expected, 0));
    assert.equal(summary.rate, Math.round(summary.present / summary.expected * 1000) / 10);
  }
  const branch = state.branches[0];
  const all = attendanceResult(state, branch, settings);
  const grades = Array.from({ length: 13 }, (_, i) => attendanceResult(state, branch, { ...settings, attendanceGrade: i + 1 }));
  assert.equal(attendanceSummary(grades).expected, all.expected);
  assert.equal(attendanceSummary(grades).present, all.present);
});

test("Repeated absence records reconcile with each student's trailing 20-school-day calendar", () => {
  const branch = state.branches[0];
  const people = attendanceExceptions([branch], settings);
  assert.ok(people.length > 0);
  for (const person of people) {
    assert.equal(person.missed, schoolDays(settings.date, "month").filter((date) => studentStatus(person, date) === "absent").length);
    assert.ok(person.missed >= 3);
  }
  const absent = attendanceExceptions([branch], { ...settings, attendanceFlag: "absent" });
  assert.ok(absent.every((person) => studentStatus(person, settings.date) === "absent"));
});

test("Staffing retains actual prototype appointments once per person and separates sample positions", () => {
  const branch = state.branches.find((branch) => branch.id === "colombo");
  const roster = branchStaff(state, branch);
  const dilini = roster.filter((person) => person.id === "dilini");
  assert.equal(dilini.length, 1);
  assert.equal(dilini[0].sample, false);
  assert.ok(dilini[0].roles.includes("section_head") && dilini[0].roles.includes("teacher"));
  assert.equal(dilini[0].subject, "Mathematics, ICT");
  assert.ok(roster.some((person) => person.id === "principal_c" && person.primaryRole === "principal"));
  assert.ok(!roster.some((person) => ["parent", "chairman", "principal_l"].includes(person.id)));
  const rows = state.branches.map((branch) => staffingResult(state, branch));
  const total = staffingSummary(rows);
  assert.equal(total.total, rows.reduce((sum, row) => sum + row.staff.length, 0));
  assert.equal(total.available + total.onLeave + total.absent, total.total);
  const edited = structuredClone(state);
  edited.accounts.push({ id: "new_teacher", name: "Appointed Teacher", grants: [{ role: "teacher", branch: "colombo" }] });
  assert.ok(branchStaff(edited, branch).some((person) => person.id === "new_teacher" && !person.sample));
});

test("Vacancy review tracks follow-up without silently filling an open position", () => {
  const branch = state.branches[0], vacancies = branchVacancies(state, branch);
  const edited = { ...state, executiveReviews: { [vacancies[0].id]: "2026-11-20T05:00:00Z" } };
  const reviewed = branchVacancies(edited, branch);
  assert.equal(reviewed.length, vacancies.length);
  assert.equal(reviewed[0].reviewed, true);
  assert.equal(branchVacancies(state, branch)[0].reviewed, false);
});

test("Executive reports enforce scope, reject empty selections and preserve captured values", () => {
  const report = generateExecutiveReport(state, chairman, { ...settings, reportBranches: ["galle", "kandy"] }, academic, { elapsed: 0 });
  assert.equal(report.rows.length, 2);
  assert.deepEqual(report.criteria.scope.sort(), ["galle", "kandy"]);
  assert.ok(report.buses.every((bus) => ["Galle", "Kandy"].includes(bus.school)));
  assert.deepEqual(report.summary.academic, networkSummary(rankedResults(state.branches.filter((branch) => ["galle", "kandy"].includes(branch.id)), academic)));
  assert.throws(() => generateExecutiveReport(state, contextFor(state, "principal"), settings, academic), /Chairman/);
  assert.throws(() => generateExecutiveReport(state, chairman, { ...settings, reportBranches: [] }, academic), /Select/);
  const scoped = contextFor(state, "chairman", undefined, "galle");
  assert.equal(chairmanBranches(state, scoped).length, 1);
  assert.throws(() => generateExecutiveReport(state, scoped, { ...settings, reportBranches: ["kandy"] }, academic), /Select/);
  const snapshot = JSON.stringify(report);
  state.executiveReports = [report];
  const copy = JSON.parse(snapshot);
  copy.rows[0].academic = -1;
  assert.notEqual(report.rows[0].academic, -1);
  assert.ok(!chairmanBranches(state, contextFor(state, "teacher")).length);
});

test("Attendance exports honor staff audience and include leave separately", () => {
  const scoped = contextFor(state, "chairman", undefined, "colombo");
  const report = generateExecutiveReport(state, scoped, { ...settings, reportType: "attendance", audience: "staff" }, academic);
  const expected = attendanceResult(state, state.branches.find((branch) => branch.id === "colombo"), { ...settings, period: "week", audience: "staff" });
  assert.equal(report.criteria.audience, "staff");
  assert.equal(report.rows[0].present, expected.present);
  assert.equal(report.rows[0].leave, expected.leave);
  assert.equal(report.rows[0].expected, expected.expected);
  assert.match(reportCSV(report), /On leave attendance-days/);
});

test("CSV downloads carry sample provenance, quote fields and neutralize spreadsheet formulas", () => {
  const report = generateExecutiveReport(state, chairman, { ...settings, reportBranches: ["galle"] }, academic);
  report.rows[0].school = '=2+2';
  const csv = reportCSV(report);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /SAMPLE DATA - PROTOTYPE/);
  assert.match(csv, /"'=2\+2"/);
  assert.match(csv, /Attendance period/);
  const transport = generateExecutiveReport(state, chairman, { ...settings, reportType: "transport", reportBranches: ["galle"] }, academic, { elapsed: 5 });
  assert.match(reportCSV(transport), /Latitude/);
  assert.equal(transport.buses.length, 2);
});
