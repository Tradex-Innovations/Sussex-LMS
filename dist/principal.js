import { icon } from "./icons.js";
import { badge, button, escapeHtml as e, emptyState } from "./ui.js";
import { networkOverviewPage } from "./network.js";
import { subjects, assessmentResult } from "./network-analytics.js";
import { networkFleet, fleetSummary } from "./network-fleet.js";
import { chairmanBranches, attendanceResult, branchStaff, demoDate, academicTrend, academicDistribution } from "./chairman-data.js";
import { schoolClassResults, schoolAcademicComparison, schoolAcademicAttention } from "./principal-data.js";
import { chairmanViewBar, attendancePage, staffingPage, reportsPage, metric, panel, table, select, header, sparkline, histogram } from "./chairman.js";

const pct = (value) => value.toFixed(1) + "%";

function principalIdentity(options, branch) {
  const entries = options.state.accounts.flatMap((person) => person.grants.map((grant, index) => ({ person, grant, index }))).filter(({ grant }) => grant.role === "principal");
  const selected = options.context.account.id + "|" + options.context.account.grants.indexOf(options.context.grant);
  const accountPicker = '<label class="principal-demo-account"><span>Demo Principal</span><span class="select-wrap"><select data-change="account" aria-label="Preview Principal">' +
    entries.map(({ person, grant, index }) => '<option value="' + person.id + "|" + index + '" ' + (selected === person.id + "|" + index ? "selected" : "") + '>' + e(person.name) + " · " + e(options.state.branches.find((branch) => branch.id === grant.branch)?.name || "") + '</option>').join("") + '</select>' + icon("chevronDown", 14) + '</span></label>';
  const attendance = attendanceResult(options.state, branch, { date: demoDate, period: "day", audience: "students" });
  const teachers = branchStaff(options.state, branch, demoDate).filter((person) => person.category === "teachers" && person.status !== "present");
  const support = schoolAcademicAttention(options.state, branch).filter((row) => row.mean < 75).length;
  const delayed = fleetSummary(networkFleet(options.state, [branch])).delayed;
  const items = [["attendance", "Student attendance", pct(attendance.rate), "checkCircle"], ["staffing", "Teachers unavailable", teachers.length, "users"],
    ["academic", "Classes to review", support, "book"], ["transport", "Bus signals delayed", delayed, "bus"]];
  return '<header class="principal-school-header"><div class="principal-school-heading"><div><span class="chairman-eyebrow">PRINCIPAL WORKSPACE</span><h1>' + e(branch.school) + '</h1><small>School pulse · 20 Nov 2026 · Sample data</small></div>' + accountPicker + '</div>' +
    '<div class="principal-school-pulse" aria-label="School daily pulse">' + items.map(([id, label, value, name]) => '<button type="button" data-action="principal-pulse" data-value="' + id + '">' + icon(name, 17) + '<span>' + label + '</span><strong>' + value + '</strong></button>').join("") + '</div></header>';
}

function principalAcademicPage(options, branch) {
  const c = options.chairman, n = options.network;
  const result = assessmentResult(branch, n);
  const comparison = schoolAcademicComparison(options.state, branch, n, c.academicCompare);
  const subject = subjects.find((subject) => subject.id === n.subject).name;
  const rows = comparison.rows.map((row) => {
    const action = c.academicCompare === "subjects" ? "principal-subject" : c.academicCompare === "grades" ? "principal-grade" : c.academicCompare === "teachers" ? "chairman-staff" : "principal-class";
    return '<tr><td><button type="button" class="chairman-person-link" data-action="' + action + '" data-value="' + row.key + '">' + e(row.name) + '</button></td>' +
      (["classes", "teachers"].includes(c.academicCompare) ? '<td>' + e(row.detail) + '</td>' : "") +
      '<td><strong>' + pct(row.mean) + '</strong></td><td>' + pct(row.passRate) + '</td><td>' + row.count + '</td></tr>';
  }).join("");
  const heads = [comparison.columns[1][1], ...(["classes", "teachers"].includes(c.academicCompare) ? [c.academicCompare === "teachers" ? "Classes" : "Teacher"] : []), "Average", "Pass rate", "Assessed"];
  const classes = schoolClassResults(options.state, branch, n);
  const courseRows = options.state.courses.filter((course) => course.branch === branch.id && course.grade === Number(n.grade) && course.title === subject && (n.className === "all" || !n.className || course.className === n.className)).map((course) => {
    const assignment = options.state.assignments[course.id], materials = options.state.materials.filter((item) => item.course === course.id);
    const completed = assignment.students.reduce((sum, id) => sum + materials.filter((material) => options.state.completed[id]?.includes(material.id)).length, 0);
    const total = assignment.students.length * materials.length;
    const teacher = options.state.accounts.find((person) => person.id === assignment.teacher)?.name || "Unassigned";
    return '<tr><td>Class ' + e(course.className) + '</td><td>' + e(teacher) + '</td><td>' + materials.length + '</td><td>' + completed + " / " + total + '</td><td>' +
      button("View materials", "principal-course", { value: course.id, variant: "secondary compact" }) + '</td></tr>';
  }).join("");
  return header("Academic Performance", "Compare classes, subjects, grades and teachers within your school.",
      button("Assign courses", "assign", { variant: "secondary", iconName: "edit" }) + button("Comparison CSV", "chairman-export", { value: "academic", variant: "secondary", iconName: "download" })) +
    '<div class="chairman-filters">' + select("Subject", "network-subject", subjects.map((subject) => [subject.id, subject.name]), n.subject) +
    select("Grade", "network-grade", [6, 8, 10, 11].map((grade) => [grade, "Grade " + grade]), n.grade) +
    select("Assessment", "network-term", [1, 2, 3].map((term) => [term, "Term " + term]), n.term) +
    (c.academicCompare !== "grades" ? select("Class", "principal-academic-class", [["all", "All classes"], ...["A", "B"].map((letter) => [n.grade + letter, "Class " + n.grade + letter])], c.academicClass) : "") + '</div>' +
    '<div class="chairman-metrics">' + metric("Average mark", pct(result.mean), subject + " · " + (n.className === "all" ? "All classes" : "Class " + n.className), "book") +
    metric("Pass rate", pct(result.passRate), result.count + " sample students assessed", "checkCircle", "blue") +
    metric("High scores", pct(result.distinctionRate), "Marks of 75% and above", "spark", "amber") +
    metric("Classes in view", classes.length, "Grade " + n.grade + " · Term " + n.term, "users") + '</div>' +
    panel("School comparisons", "Sample assessments · Select a class, subject, grade or teacher for details",
      '<div class="chairman-panel-filter">' + select("Compare by", "principal-compare", [["classes", "Classes"], ["subjects", "Subjects"], ["grades", "Grades"], ["teachers", "Teachers"]], c.academicCompare) + '</div>' + table(heads, rows, "School academic comparison")) +
    '<div class="chairman-two-columns">' + panel("Assessment trend", subject + " · Grade " + n.grade + " · Selected class scope", sparkline(academicTrend([branch], n), "School academic term trend")) +
    panel("Mark distribution", "Selected class scope · Pass mark 50%", histogram(academicDistribution([branch], n))) + '</div>' +
    panel("Teaching and lecture materials", "Prototype course assignments and completion recorded through the parent portal",
      courseRows ? table(["Class", "Assigned teacher", "Materials", "Completed / assigned", "Action"], courseRows, "School teaching progress") :
      emptyState("book", "No course materials for this selection", "Choose another grade or subject to review published materials."));
}

export function principalOverviewPage(options) {
  const branch = chairmanBranches(options.state, options.context)[0];
  if (!branch) return emptyState("school", "No school assigned", "A Principal appointment is needed to open this workspace.");
  const view = options.chairman.view;
  const content = view === "transport" ? networkOverviewPage(options) : '<div class="chairman-analytics">' +
    (view === "academic" ? principalAcademicPage(options, branch) : view === "attendance" ? attendancePage(options, [branch]) : view === "staffing" ? staffingPage(options, [branch]) : reportsPage(options, [branch])) + '</div>';
  return '<section class="chairman-portal principal-portal">' + principalIdentity(options, branch) + chairmanViewBar(view, "principal") + content + '</section>';
}
