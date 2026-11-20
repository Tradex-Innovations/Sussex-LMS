import { icon } from "./icons.js";
import { badge, button, emptyState, escapeHtml as e } from "./ui.js";
import { networkOverviewPage } from "./network.js";
import { subjects, rankedResults, networkSummary, assessmentResult, performanceTone } from "./network-analytics.js";
import { chairmanViews, chairmanBranches, schoolDays, demoDate, studentRoster, studentStatus, attendanceResult, attendanceSummary, attendanceExceptions,
  branchStaff, branchVacancies, staffingResult, staffingSummary, academicTrend, academicDistribution, reportTypes, reportColumns, round, visibleExecutiveReports, schoolLeaveRequests, isSchoolOperator } from "./chairman-data.js";

import { leaveRecommendations } from "./vice-data.js";

const percent = (value) => value.toFixed(1) + "%";
const number = (value) => new Intl.NumberFormat("en-GB").format(value);
const dateLabel = (date) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(date + "T12:00:00Z"));
const statusLabel = { present: "Present", absent: "Absent", leave: "On leave", late: "Late" };
const statusTone = { present: "green", absent: "amber", leave: "blue", late: "amber" };

export function chairmanViewBar(active, role = "chairman") {
  const short = { transport: "Transport", academic: "Academic", attendance: "Attendance", staffing: "Staffing", reports: "Reports" };
  return '<nav class="chairman-view-bar" aria-label="' + (role === "vice_principal" ? "Vice Principal" : role === "principal" ? "Principal" : "Chairman") + ' views">' + chairmanViews.map((view) => '<a href="#' + role + '/overview/' + view.id + '" aria-label="' + view.name + '" class="' + (active === view.id ? "is-active" : "") + '" ' + (active === view.id ? 'aria-current="page"' : "") + '>' + icon(view.icon, 18) + '<span class="chairman-view-full">' + (role === "vice_principal" && view.id === "reports" ? "School Reports" : view.name) + '</span><span class="chairman-view-short">' + short[view.id] + '</span></a>').join("") + '</nav>';
}

function select(label, key, values, current) {
  return '<label class="chairman-filter"><span>' + label + '</span><span class="select-wrap"><select data-change="' + key + '" aria-label="' + label + '">' +
    values.map(([id, name]) => '<option value="' + e(id) + '" ' + (String(id) === String(current) ? "selected" : "") + '>' + e(name) + '</option>').join("") + '</select>' + icon("chevronDown", 15) + '</span></label>';
}

function dateFilter(current) {
  return '<label class="chairman-filter"><span>Reporting date</span><input type="date" aria-label="Reporting date" data-change="chairman-date" min="2026-10-12" max="' + demoDate + '" value="' + current + '"></label>';
}

function branchFilter(options) {
  if (isSchoolOperator(options.context)) return '<div class="principal-school-scope">' + icon("school", 19) + '<div><small>Assigned school</small><strong>' + e(options.state.branches.find((branch) => branch.id === options.context.branch)?.school || "") + '</strong></div>' + badge("School access", "green") + '</div>';
  return select("School branch", "branch", [["all", "All 20 branches"], ...options.state.branches.map((branch) => [branch.id, branch.name])], options.context.branch);
}

function filters(options, view) {
  const c = options.chairman, n = options.network;
  let fields = branchFilter(options);
  if (view === "academic") fields += select("Subject", "network-subject", subjects.map((subject) => [subject.id, subject.name]), n.subject) +
    select("Grade", "network-grade", [6, 8, 10, 11].map((grade) => [grade, "Grade " + grade]), n.grade) +
    select("Assessment", "network-term", [1, 2, 3].map((term) => [term, "Term " + term]), n.term);
  else if (view === "attendance") fields += dateFilter(c.date) +
    select("Period", "chairman-period", [["day", "One school day"], ["week", "Last 5 school days"], ["month", "Last 20 school days"]], c.period) +
    select("Attendance for", "chairman-audience", [["students", "Students"], ["staff", "Staff"]], c.audience) +
    (c.audience === "students" ? select("Student grade", "chairman-grade", [["all", "All grades"], ...Array.from({ length: 13 }, (_, i) => [i + 1, "Grade " + (i + 1)])], c.attendanceGrade) : "") +
    (isSchoolOperator(options.context) && c.audience === "students" && c.attendanceGrade !== "all" ? select("Class", "principal-attendance-class", [["all", "All classes"], ...["A", "B"].map((letter) => [c.attendanceGrade + letter, "Class " + c.attendanceGrade + letter])], c.attendanceClass) : "");
  else if (view === "staffing") fields += dateFilter(c.date);
  return '<div class="chairman-filters">' + fields + '</div>';
}

function metric(label, value, detail, name, tone = "green") {
  return '<article class="chairman-metric surface"><span class="chairman-metric-icon tone-' + tone + '">' + icon(name, 21) + '</span><span>' + label + '</span><strong>' + value + '</strong><small>' + detail + '</small></article>';
}

function header(title, description, action = "") {
  return '<header class="chairman-page-heading"><div><span class="chairman-eyebrow">SUSSEX COLLEGE NETWORK</span><h1>' + title + '</h1><p>' + description + '</p></div><div class="chairman-heading-actions">' + badge("Sample data", "amber") + action + '</div></header>';
}

function sparkline(points, label, suffix = "%") {
  if (!points.length) return "";
  const max = Math.max(...points.map((point) => point.value), suffix === "%" ? 100 : 1);
  const min = suffix === "%" ? Math.max(0, Math.floor(Math.min(...points.map((point) => point.value)) / 10) * 10 - 10) : 0;
  const xy = points.map((point, index) => [36 + (points.length === 1 ? 250 : index * 512 / (points.length - 1)), 144 - (point.value - min) / (max - min || 1) * 112]);
  const data = xy.map((point) => point.join(",")).join(" ");
  const floor = xy[0][0] + ",150 " + data + " " + xy.at(-1)[0] + ",150";
  return '<div class="chairman-line-chart"><svg viewBox="0 0 585 182" role="img" aria-label="' + e(label + ": " + points.map((point) => point.label + " " + point.value + suffix).join(", ")) + '">' +
    [40, 90, 140].map((y) => '<line x1="30" y1="' + y + '" x2="555" y2="' + y + '" stroke="#e2ebe3" stroke-dasharray="3 5"/>').join("") +
    '<polygon points="' + floor + '" fill="#e5f1e5"/><polyline points="' + data + '" fill="none" stroke="#25745b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>' +
    xy.map(([x, y], index) => '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#fff" stroke="#25745b" stroke-width="2"/>' +
      (points.length <= 5 || index === 0 || index === points.length - 1 ? '<text x="' + x + '" y="174" text-anchor="middle">' + e(points[index].label) + '</text>' : "")).join("") +
    '</svg><div class="chart-endpoints"><span>' + e(points[0].label) + '<strong>' + points[0].value.toFixed(1) + suffix + '</strong></span><span>' + e(points.at(-1).label) + '<strong>' + points.at(-1).value.toFixed(1) + suffix + '</strong></span></div></div>';
}

function histogram(bins) {
  const maximum = Math.max(1, ...bins.map((bin) => bin.count));
  return '<div class="chairman-histogram">' + bins.map((bin) => '<div><strong>' + bin.count + '</strong><span class="histogram-track"><i style="height:' + Math.max(2, bin.count / maximum * 100) + '%"></i></span><span>' + bin.label + '</span></div>').join("") + '</div>';
}

function panel(title, subtitle, body, extra = "") {
  return '<section class="surface chairman-panel"><header class="chairman-panel-heading"><div><h2>' + title + '</h2><p>' + subtitle + '</p></div>' + extra + '</header>' + body + '</section>';
}

function mapCard(view) {
  const labels = { academic: ["Academic performance map", "Average mark for the selected assessment", "85%+", "75–84.9%", "Below 75%"],
    attendance: ["Attendance across Sri Lanka", "Recorded attendance for the selected period", "95%+", "90–94.9%", "Below 90%"],
    staffing: ["Staffing coverage map", "Filled positions against required positions", "95%+", "90–94.9%", "Below 90%"] };
  const copy = labels[view];
  return '<section class="surface chairman-map-card"><header class="chairman-panel-heading"><div><h2>' + copy[0] + '</h2><p>' + copy[1] + '</p></div>' + icon("map", 20) + '</header>' +
    '<div id="school-network-map" class="school-network-map chairman-geo-map" tabindex="0" role="region" aria-label="Sri Lanka school branch map"></div>' +
    '<div class="chairman-map-legend"><span class="green">' + copy[2] + '</span><span class="blue">' + copy[3] + '</span><span class="amber">' + copy[4] + '</span></div><p class="chairman-map-note">Select a school bubble or a row to open branch details.</p></section>';
}

function schoolRow(branch, cells, options = "") {
  return '<tr><td><button type="button" class="chairman-school-link" data-action="network-select" data-value="' + branch.id + '">' + e(branch.name) + '</button><small>' + e(branch.province) + '</small></td>' + cells + options + '</tr>';
}

function table(headings, rows, label, className = "") {
  return '<div class="chairman-table-wrap ' + className + '"><table aria-label="' + label + '"><thead><tr>' + headings.map((heading) => '<th scope="col">' + heading + '</th>').join("") + '</tr></thead><tbody>' +
    (rows || '<tr><td colspan="' + headings.length + '" class="chairman-no-results">No records match these filters.</td></tr>') + '</tbody></table></div>';
}

function attention(items) {
  if (!items.length) return "";
  return '<section class="chairman-attention"><span>' + icon("alert", 20) + '</span><div><strong>Needs attention</strong><p>' + items.map((item) => '<button type="button" data-action="chairman-alert" data-value="' + item.view + "|" + item.branch + '">' + e(item.text) + '</button>').join("") + '</p></div></section>';
}

function academicPage(options, branches) {
  const n = options.network, c = options.chairman;
  const results = rankedResults(branches, n), summary = networkSummary(results);
  const declined = results.filter((row) => row.change < 0);
  const subject = subjects.find((subject) => subject.id === n.subject).name;
  const sorted = [...results].sort((a, b) => c.academicSort === "pass" ? b.passRate - a.passRate : c.academicSort === "change" ? (a.change || 0) - (b.change || 0) : a.rank - b.rank);
  const rows = sorted.map((row) => schoolRow(row.branch, '<td><strong>' + percent(row.mean) + '</strong></td><td>' + percent(row.passRate) + '</td><td><span class="chairman-change ' + (row.change < 0 ? "negative" : "") + '">' + (row.change === null ? "—" : (row.change > 0 ? "+" : "") + row.change.toFixed(1) + " pp") + '</span></td><td>' + row.count + '</td>')).join("");
  return header("Academic Performance", "Compare the same subject, grade and term across your school network.", button("Branch summary CSV", "chairman-export", { value: "academic", variant: "secondary", iconName: "download" })) +
    filters(options, "academic") + '<div class="chairman-metrics">' +
    metric("Network average", percent(summary.mean), subject + " · Grade " + n.grade, "book") +
    metric("Pass rate", percent(summary.passRate), number(summary.count) + " sample students assessed", "checkCircle", "blue") +
    metric("Leading school", e(results[0]?.branch.name || "—"), results[0] ? percent(results[0].mean) + " average mark" : "No schools in scope", "spark", "amber") +
    metric("Improving schools", results.filter((row) => row.change > 0).length + " / " + results.length, n.term === 1 ? "Baseline assessment · No previous term" : declined.length + " declining · Compared with previous term", "signal") + '</div>' +
    attention(declined.slice(0, 3).map((row) => ({ branch: row.branch.id, view: "academic", text: row.branch.name + " " + row.change.toFixed(1) + " pp" }))) +
    '<div class="chairman-map-comparison">' + mapCard("academic") +
    panel(subject + " comparison", "Term " + n.term + " · Select a school for its results", '<div class="chairman-panel-filter">' + select("Rank schools by", "chairman-academic-sort", [["average", "Highest average"], ["pass", "Highest pass rate"], ["change", "Largest decline"]], c.academicSort) + '</div>' +
      table(["School", "Average", "Pass rate", "Change", "Assessed"], rows, "Academic branch comparison", "scroll-table")) + '</div>' +
    '<div class="chairman-two-columns">' + panel("Term-by-term trend", subject + " · Grade " + n.grade + " · Weighted network average", sparkline(academicTrend(branches, n), "Academic term trend")) +
    panel("Mark distribution", "Students assessed in the selected term · Pass mark 50%", histogram(academicDistribution(branches, n))) + '</div>';
}

function attendanceTrends(options, branches) {
  const c = options.chairman;
  const period = c.period === "day" ? "week" : c.period;
  const results = branches.map((branch) => attendanceResult(options.state, branch, { ...c, period }));
  const dates = schoolDays(c.date, period);
  return dates.map((date, index) => {
    const days = results.map((result) => result.trend[index]);
    return { label: new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(date + "T12:00Z")), value: attendanceSummary(days).rate };
  });
}

function pager(total, page, kind, size = 12) {
  const count = Math.max(1, Math.ceil(total / size));
  const current = Math.min(count, Math.max(1, page));
  return '<div class="chairman-pager"><span>' + (total ? (current - 1) * size + 1 : 0) + "–" + Math.min(current * size, total) + " of " + number(total) + '</span><div>' +
    button("Previous", "chairman-page", { value: kind + "|" + (current - 1), variant: "secondary compact", extra: current <= 1 ? "disabled" : "" }) +
    '<span>Page ' + current + " of " + count + '</span>' + button("Next", "chairman-page", { value: kind + "|" + (current + 1), variant: "secondary compact", extra: current >= count ? "disabled" : "" }) + '</div></div>';
}

function paged(rows, page, size = 12) {
  const current = Math.min(Math.max(1, Math.ceil(rows.length / size)), Math.max(1, page));
  return rows.slice((current - 1) * size, current * size);
}

function search(label, key, value) {
  return '<label class="chairman-search">' + icon("search", 17) + '<input type="search" aria-label="' + label + '" placeholder="' + label + '" data-change="' + key + '" data-focus="' + key + '" value="' + e(value) + '"></label>';
}

function attendanceWatchlist(options, branches) {
  const c = options.chairman;
  if (c.audience === "staff") {
    const staff = branches.flatMap((branch) => branchStaff(options.state, branch, schoolDays(c.date)[0])).filter((person) => isSchoolOperator(options.context) || person.status !== "present");
    return panel(isSchoolOperator(options.context) ? "Staff register" : "Staff attendance exceptions", "Latest school day in the selected period", staffTable(staff, c.staffPage) + pager(staff.length, c.staffPage, "staff"));
  }
  const people = attendanceExceptions(branches, c);
  const body = '<div class="chairman-list-tools">' + select("Attendance watchlist", "chairman-attendance-flag", [...(isSchoolOperator(options.context) ? [["all", "All students"]] : []), ["repeated", "3+ absences in 20 school days"], ["absent", "Absent on latest school day"], ["late", "Late on latest school day"]], c.attendanceFlag) + search("Search student or admission", "chairman-student-search", c.studentQuery) + '</div>' +
    table(["Student", "School / class", "Absences in 20 days", "Latest status"], paged(people, c.studentPage).map((student) => '<tr><td><button type="button" class="chairman-person-link" data-action="chairman-student" data-value="' + student.id + '">' + e(student.name) + '</button><small>' + student.admission + '</small></td><td>' + e(student.branchName) + '<small>Class ' + student.className + '</small></td><td><strong>' + student.missed + '</strong></td><td>' + badge(statusLabel[student.status], statusTone[student.status]) + '</td></tr>').join(""), "Student attendance watchlist") + pager(people.length, c.studentPage, "student");
  return panel(isSchoolOperator(options.context) ? "Student register" : "Attendance watchlist", "Illustrative student records · Repeated absences always use the last 20 school days", body);
}

function attendancePage(options, branches) {
  const c = options.chairman;
  const results = branches.map((branch) => attendanceResult(options.state, branch, c)), summary = attendanceSummary(results);
  const dates = schoolDays(c.date, c.period), days = dates.length;
  const sorted = [...results].sort((a, b) => c.attendanceSort === "lowest" ? a.rate - b.rate : b.rate - a.rate);
  const rows = sorted.map((row) => schoolRow(row.branch, '<td><strong>' + percent(row.rate) + '</strong></td><td>' + number(row.present) + '</td><td>' + number(row.absent + row.leave) + '</td><td>' + (c.audience === "staff" ? row.leave : row.late) + '</td>')).join("");
  return header("Attendance", "Follow student and staff attendance, spot changes and review repeated absences.", button(isSchoolOperator(options.context) ? "School summary CSV" : "Branch summary CSV", "chairman-export", { value: "attendance", variant: "secondary", iconName: "download" })) +
    filters(options, "attendance") + '<p class="chairman-filter-note">' + dateLabel(dates[0]) + (days > 1 ? " – " + dateLabel(dates.at(-1)) : "") + " · " + days + " school day" + (days > 1 ? "s · Totals are attendance-days" : "") + " · Late arrivals are included in present totals.</p>" +
    '<div class="chairman-metrics">' + metric("Attendance rate", percent(summary.rate), c.audience === "staff" ? "Staff attendance" : "Student attendance", "checkCircle") +
    metric("Present", number(summary.present), "Out of " + number(summary.expected) + " expected attendance-days", "users", "blue") +
    metric("Not present", number(summary.absent + summary.leave), summary.leave ? summary.leave + " on approved sample leave" : "Absences in the selected period", "alert", "amber") +
    metric(c.audience === "staff" ? "On leave" : "Late arrivals", number(c.audience === "staff" ? summary.leave : summary.late), results.filter((row) => row.rate < 90).length + " branches below 90%", "clock") + '</div>' +
    attention(results.filter((row) => row.rate < 90).slice(0, 3).map((row) => ({ view: "attendance", branch: row.branch.id, text: row.branch.name + " · " + percent(row.rate) }))) +
    (isSchoolOperator(options.context) ? principalClassAttendance(options, branches[0]) : '<div class="chairman-map-comparison">' + mapCard("attendance") + panel("Branch attendance", "Same reporting period and audience across schools",
      '<div class="chairman-panel-filter">' + select("Sort attendance", "chairman-attendance-sort", [["rate", "Highest attendance"], ["lowest", "Needs most attention"]], c.attendanceSort) + '</div>' +
      table(["School", "Rate", "Present", "Not present", c.audience === "staff" ? "On leave" : "Late"], rows, "Attendance branch comparison", "scroll-table")) + '</div>') +
    panel("Attendance trend", (c.period === "day" ? "Last 5 school days" : "Selected reporting period") + " · Weighted attendance across selected schools", sparkline(attendanceTrends(options, branches), "Attendance trend")) +
    attendanceWatchlist(options, branches);
}

export function filteredStaff(options, branches) {
  const c = options.chairman;
  return branches.flatMap((branch) => branchStaff(options.state, branch, schoolDays(c.date)[0]))
    .filter((person) => c.staffGroup === "all" || person.category === c.staffGroup)
    .filter((person) => c.staffStatus === "all" || c.staffStatus === "unavailable" && person.status !== "present" || person.status === c.staffStatus)
    .filter((person) => !c.staffQuery || (person.name + " " + person.branchName + " " + person.designation + " " + person.subject).toLowerCase().includes(c.staffQuery.toLowerCase()))
    .sort((a, b) => a.branchName.localeCompare(b.branchName) || a.name.localeCompare(b.name));
}

function staffTable(staff, page) {
  return table(["Staff member", "School", "Role / subject", "Availability"], paged(staff, page).map((person) => '<tr><td><button type="button" class="chairman-person-link" data-action="chairman-staff" data-value="' + person.id + '">' + e(person.name) + '</button><small>' + (person.sample ? "Illustrative staff record" : "Appointed in prototype") + '</small></td><td>' + e(person.branchName) + '</td><td>' + person.designation + '<small>' + e(person.subject) + '</small></td><td>' + badge(statusLabel[person.status], statusTone[person.status]) + '</td></tr>').join(""), "School staff directory");
}

function vacancyCards(options, branches) {
  const vacancies = branches.flatMap((branch) => branchVacancies(options.state, branch));
  return '<div class="chairman-vacancy-grid">' + (vacancies.map((vacancy) => '<article class="chairman-vacancy"><div>' + badge(vacancy.reviewed ? "Reviewed" : vacancy.priority + " priority", vacancy.reviewed ? "blue" : vacancy.priority === "High" ? "amber" : "neutral") + '<span>' + e(vacancy.branchName) + '</span></div><h3>' + e(vacancy.subject) + '</h3><p>' + vacancy.role + '</p>' +
    button("Review vacancy", "chairman-vacancy", { value: vacancy.id, variant: "secondary compact" }) + '</article>').join("") || emptyState("checkCircle", "No vacancies in this scope", "All sample positions are filled.")) + '</div>';
}

function staffingPage(options, branches) {
  const c = options.chairman;
  const results = branches.map((branch) => staffingResult(options.state, branch, schoolDays(c.date)[0])), summary = staffingSummary(results);
  const people = filteredStaff(options, branches);
  const rows = results.map((row) => schoolRow(row.branch, '<td><strong>' + row.total + '</strong></td><td>' + row.teachers + '</td><td>' + row.available + '</td><td>' + row.vacancies.length + '</td><td>' + row.ratio.toFixed(1) + ':1</td>')).join("");
  const tabs = '<nav class="chairman-sub-tabs" aria-label="Staffing lists">' + [["people", "Staff directory"], ["vacancies", "Open vacancies"], ...(isSchoolOperator(options.context) ? [["leave", options.context.role === "vice_principal" ? "Leave recommendations" : "Leave requests"]] : [])].map(([id, label]) => '<button type="button" data-action="chairman-staff-tab" data-value="' + id + '" aria-pressed="' + (c.staffingTab === id) + '">' + label + '</button>').join("") + '</nav>';
  const directory = '<div class="chairman-list-tools">' + select("Staff group", "chairman-staff-group", [["all", "All staff"], ["leadership", "Leadership"], ["teachers", "Teaching staff"], ["support", "Support staff"]], c.staffGroup) +
    select("Availability", "chairman-staff-status", [["all", "All statuses"], ["present", "Present"], ["absent", "Absent"], ["leave", "On leave"], ...(isSchoolOperator(options.context) ? [["unavailable", "Unavailable staff"]] : [])], c.staffStatus) + search("Search staff, role or subject", "chairman-staff-search", c.staffQuery) + '</div>' +
    staffTable(people, c.staffPage) + pager(people.length, c.staffPage, "staff");
  return header("Staffing Overview", "See school leadership, teaching capacity, availability and open positions.", button(isSchoolOperator(options.context) ? "School summary CSV" : "Branch summary CSV", "chairman-export", { value: "staffing", variant: "secondary", iconName: "download" })) +
    filters(options, "staffing") + '<p class="chairman-filter-note">Availability as of ' + dateLabel(schoolDays(c.date)[0]) + ". Appointed staff are combined with clearly labelled illustrative records.</p>" +
    '<div class="chairman-metrics">' + metric("Total staff", number(summary.total), summary.leadership + " leaders · " + summary.support + " support staff", "users") +
    metric("Teaching staff", number(summary.teachers), summary.ratio.toFixed(1) + " sample students per teacher", "book", "blue") +
    metric("Available today", number(summary.available), summary.onLeave + " on leave · " + summary.absent + " absent", "checkCircle") +
    metric("Open vacancies", summary.vacancies, percent(summary.coverage) + " of required positions filled", "badge", "amber") + '</div>' +
    attention(results.filter((row) => row.vacancies.length >= 3).slice(0, 3).map((row) => ({ view: "staffing", branch: row.branch.id, text: row.branch.name + " · " + row.vacancies.length + " vacancies" }))) +
    (isSchoolOperator(options.context) ? principalStaffingSummary(options, results[0]) : '<div class="chairman-map-comparison">' + mapCard("staffing") + panel("Branch staffing comparison", "Headcount, availability and student-to-teacher ratio",
      table(["School", "Staff", "Teachers", "Available", "Vacancies", "Ratio"], rows, "Staffing branch comparison", "scroll-table")) + '</div>') +
    panel("People and positions", "Select a person, vacancy or leave request for details", tabs + (c.staffingTab === "people" ? directory : c.staffingTab === "leave" && isSchoolOperator(options.context) ? principalLeaveCards(options, branches[0]) : vacancyCards(options, branches)));
}

function reportScope(options, branches) {
  if (isSchoolOperator(options.context)) return '<div class="principal-report-scope">' + icon("school", 19) + '<div><strong>' + e(branches[0].school) + '</strong><p>This report includes your assigned school.</p></div></div>';
  const selected = options.chairman.reportBranches;
  return '<fieldset class="chairman-report-schools"><legend>Schools to include</legend><div>' + button("Select all", "chairman-report-all", { variant: "secondary compact" }) +
    button("Clear", "chairman-report-none", { variant: "secondary compact" }) + '</div><section>' + branches.map((branch) => '<label><input type="checkbox" data-change="chairman-report-branch" value="' + branch.id + '" ' + (selected === null || selected.includes(branch.id) ? "checked" : "") + '><span>' + e(branch.name) + '</span></label>').join("") + '</section></fieldset>';
}

export function reportPreview(report) {
  const columns = report.customColumns || reportColumns(report.type, report.criteria.audience), rows = report.customRows || (report.type === "transport" ? report.buses : report.rows);
  const summary = report.summary;
  const stats = report.type === "transport" ? [["Buses", summary.fleet.total], ["On route", summary.fleet.route], ["At school", summary.fleet.school], ["Delayed signals", summary.fleet.delayed]]
    : report.type === "academic" ? [["Average mark", percent(summary.academic.mean)], ["Pass rate", percent(summary.academic.passRate)], ["Assessed", number(summary.academic.count)], ["Schools", report.rows.length]]
    : report.type === "attendance" ? [["Attendance", percent(summary.attendance.rate)], ["Present", number(summary.attendance.present)], ["Not present", number(summary.attendance.absent + summary.attendance.leave)], [report.criteria.audience === "staff" ? "On leave" : "Late", number(report.criteria.audience === "staff" ? summary.attendance.leave : summary.attendance.late)]]
    : report.type === "staffing" ? [["Staff", number(summary.staffing.total)], ["Teachers", number(summary.staffing.teachers)], ["Vacancies", summary.staffing.vacancies], ["Positions filled", percent(summary.staffing.coverage)]]
    : [["Schools", report.rows.length], ["Academic average", percent(summary.academic.mean)], ["Student attendance", percent(summary.attendance.rate)], ["Open vacancies", summary.staffing.vacancies]];
  const criteria = [];
  if (["brief", "academic"].includes(report.type)) criteria.push("Academic assessment: " + (subjects.find((subject) => subject.id === report.criteria.subject)?.name || report.criteria.subject) + " · Grade " + report.criteria.grade + " · Term " + report.criteria.term + (report.criteria.className && report.criteria.className !== "all" ? " · Class " + report.criteria.className : "") + ".");
  if (report.criteria.comparison) criteria.push("Comparison by " + report.criteria.comparison + ".");
  if (["brief", "attendance"].includes(report.type)) criteria.push("Attendance: " + report.criteria.schoolDays + " school day" + (report.criteria.schoolDays > 1 ? "s" : "") + ", " + (report.criteria.audience === "staff" ? "staff" : report.criteria.attendanceGrade === "all" ? "all student grades" : "student Grade " + report.criteria.attendanceGrade) + ". Late arrivals are included in present totals.");
  if (report.criteria.audience !== "staff" && report.criteria.attendanceClass && report.criteria.attendanceClass !== "all") criteria.push("Attendance class: " + report.criteria.attendanceClass + ".");
  if (["brief", "staffing"].includes(report.type)) criteria.push("Staff availability: " + dateLabel(report.criteria.to) + ".");
  if (["brief", "transport"].includes(report.type)) criteria.push("Fleet status is captured when the report is generated.");
  return '<article class="executive-report-preview"><header><span class="chairman-eyebrow">SUSSEX COLLEGE NETWORK</span><h2>' + e(report.title) + '</h2><p>' + dateLabel(report.criteria.from) + (report.criteria.from !== report.criteria.to ? " – " + dateLabel(report.criteria.to) : "") + " · " + report.rows.length + " school" + (report.rows.length > 1 ? "s" : "") + '</p>' + badge("SAMPLE DATA · PROTOTYPE", "amber") + '</header>' +
    '<div class="executive-report-stats">' + stats.map(([label, value]) => '<div><span>' + label + '</span><strong>' + value + '</strong></div>').join("") + '</div>' +
    '<p class="executive-report-criteria">' + e(criteria.join(" ")) + '</p>' +
    table(columns.map(([, label]) => label), rows.map((row) => '<tr>' + columns.map(([key]) => '<td>' + e(row[key]) + '</td>').join("") + '</tr>').join(""), "Generated executive report") +
    (report.insights.length && report.type === "brief" ? '<section class="executive-report-insights"><h3>Items for branch review</h3>' + report.insights.slice(0, 12).map((item) => '<p><strong>' + e(item.school) + '</strong> · ' + e(item.message) + '</p>').join("") + '</section>' : "") +
    (report.operations ? '<section class="executive-report-insights"><h3>School coordination snapshot</h3><p>As of ' + e(report.operations.date || report.criteria.to) + ' · ' + report.operations.followups.filter((item) => item.status !== "resolved").length + ' pending follow-ups · ' + report.operations.covers.length + ' active cover assignments · ' + report.operations.recommendations + ' leave recommendations awaiting a Principal decision.</p>' +
      table(["Follow-up", "Category", "Status", "Due"], report.operations.followups.map((item) => '<tr><td>' + e(item.title) + '</td><td>' + e(item.category) + '</td><td>' + e(item.status.replaceAll("_", " ")) + '</td><td>' + e(item.due) + '</td></tr>').join(""), "School coordination follow-ups") +
      (report.operations.covers.length ? table(["Cover class", "Subject", "Cover teacher", "Date"], report.operations.covers.map((item) => '<tr><td>' + e(item.className) + '</td><td>' + e(item.title) + '</td><td>' + e(item.teacherName) + '</td><td>' + e(item.date) + '</td></tr>').join(""), "School temporary cover snapshot") : "") + '</section>' : "") +
    '<footer>Generated ' + new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Colombo" }).format(new Date(report.generatedAt)) + " · Sri Lanka time. Illustrative data for client demonstration.</footer></article>";
}

function reportsPage(options, branches) {
  const c = options.chairman, allowed = new Set(branches.map((branch) => branch.id));
  const history = visibleExecutiveReports(options.state, options.context);
  const report = history.find((report) => report.id === c.reportId);
  let assessmentFields = "";
  if (["brief", "academic"].includes(c.reportType)) assessmentFields += select("Subject", "network-subject", subjects.map((subject) => [subject.id, subject.name]), options.network.subject) + select("Grade", "network-grade", [6, 8, 10, 11].map((grade) => [grade, "Grade " + grade]), options.network.grade) + select("Assessment", "network-term", [1, 2, 3].map((term) => [term, "Term " + term]), options.network.term);
  if (isSchoolOperator(options.context) && ["brief", "academic"].includes(c.reportType)) assessmentFields += select("Academic class", "principal-academic-class", [["all", "All classes"], ...["A", "B"].map((letter) => [options.network.grade + letter, "Class " + options.network.grade + letter])], c.academicClass);
  if (c.reportType === "attendance") assessmentFields += select("Attendance for", "chairman-audience", [["students", "Students"], ["staff", "Staff"]], c.audience);
  if (c.reportType === "brief" || c.reportType === "attendance" && c.audience === "students") assessmentFields += select("Attendance grade", "chairman-grade", [["all", "All grades"], ...Array.from({ length: 13 }, (_, i) => [i + 1, "Grade " + (i + 1)])], c.attendanceGrade);
  if (isSchoolOperator(options.context) && (c.reportType === "brief" || c.reportType === "attendance" && c.audience === "students") && c.attendanceGrade !== "all") assessmentFields += select("Attendance class", "principal-attendance-class", [["all", "All classes"], ...["A", "B"].map((letter) => [c.attendanceGrade + letter, "Class " + c.attendanceGrade + letter])], c.attendanceClass);
  const builder = '<section class="surface chairman-report-builder"><header class="chairman-panel-heading"><div><h2>Build a report</h2><p>Choose a scope and capture a snapshot</p></div></header><div class="chairman-report-form">' +
    select("Report type", "chairman-report-type", Object.entries(reportTypes).map(([id, label]) => [id, id === "brief" && isSchoolOperator(options.context) ? (options.context.role === "vice_principal" ? "School operational brief" : "School executive brief") : label]), c.reportType) + (c.reportType !== "transport" ? dateFilter(c.date) : '<p class="chairman-filter-note">Fleet status is captured when you generate the report.</p>') +
    (["brief", "attendance"].includes(c.reportType) ? select("Report period", "chairman-report-period", [["day", "One school day"], ["week", "Last 5 school days"], ["month", "Last 20 school days"]], c.reportPeriod) : "") +
    (assessmentFields ? '<div class="chairman-report-assessment">' + assessmentFields + '</div>' : "") +
    reportScope(options, branches) + button("Generate report", "chairman-generate-report", { variant: "primary", iconName: "file" }) +
    '<p class="chairman-filter-note">Generated reports are saved in this browser. Filters take effect when you generate a new report.</p></div></section>';
  const preview = '<section class="surface chairman-report-result"><div class="chairman-report-actions">' + (report ? select("Download format", "chairman-report-format", [["csv", "CSV spreadsheet"], ["html", "Standalone HTML"]], c.reportFormat) +
    button("Download report", "chairman-download-report", { value: report.id, variant: "secondary", iconName: "download" }) + button("Print / Save PDF", "chairman-print-report", { value: report.id, variant: "secondary", iconName: "file" }) : '<span>Report preview</span>') + '</div>' +
    (report ? reportPreview(report) : emptyState("file", "Your executive brief starts here", "Select schools and a reporting period, then generate a report to preview, download or print.")) + '</section>';
  const cards = history.map((item) => '<button type="button" class="chairman-history-card ' + (item.id === c.reportId ? "is-selected" : "") + '" data-action="chairman-open-report" data-value="' + item.id + '">' + icon("file", 22) + '<span><strong>' + e(item.title) + '</strong><small>' + item.rows.length + " schools · " + dateLabel(item.criteria.to) + '</small></span><span>' + badge("Sample", "neutral") + '</span></button>').join("");
  return header(options.context.role === "vice_principal" ? "School Reports" : "Executive Reports", options.context.role === "vice_principal" ? "Capture school activity for the Principal with downloadable operational reports." : "Turn branch activity into a clear, downloadable management brief.") + '<div class="chairman-filters">' + branchFilter(options) + '</div>' +
    '<div class="chairman-reports-layout">' + builder + preview + '</div>' +
    panel("Saved report snapshots", history.length + " reports in this scope · Latest 8 retained in this browser", '<div class="chairman-report-history">' + (cards || '<p class="chairman-no-history">Your generated reports will appear here.</p>') + '</div>');
}

export function chairmanOverviewPage(options) {
  const view = options.chairman.view;
  const branches = chairmanBranches(options.state, options.context);
  if (view === "transport") return '<section class="chairman-portal">' + chairmanViewBar(view) + networkOverviewPage(options) + '</section>';
  const pages = { academic: academicPage, attendance: attendancePage, staffing: staffingPage, reports: reportsPage };
  return '<section class="chairman-portal">' + chairmanViewBar(view) + '<div class="chairman-analytics">' + pages[view](options, branches) + '</div></section>';
}

export function chairmanMapMetrics(options) {
  const branches = chairmanBranches(options.state, options.context), view = options.chairman.view;
  return Object.fromEntries(branches.map((branch) => {
    const value = view === "academic" ? assessmentResult(branch, options.network).mean : view === "attendance" ? attendanceResult(options.state, branch, options.chairman).rate : staffingResult(options.state, branch, options.chairman.date).coverage;
    return [branch.id, { value: percent(value), tone: view === "academic" ? performanceTone(value) : value >= 95 ? "green" : value >= 90 ? "blue" : "amber" }];
  }));
}

export function chairmanBranchPanel(options, branch) {
  const view = options.chairman.view, c = options.chairman;
  const heading = '<div class="chairman-detail-school"><span>' + e(branch.province) + '</span><p>' + e(branch.address) + '</p></div>';
  if (view === "academic") {
    const result = assessmentResult(branch, options.network);
    return heading + '<div class="chairman-detail-stats"><div><span>Average</span><strong>' + percent(result.mean) + '</strong></div><div><span>Pass rate</span><strong>' + percent(result.passRate) + '</strong></div><div><span>High scores</span><strong>' + percent(result.distinctionRate) + '</strong></div></div>' +
      '<p class="chairman-filter-note">Grade ' + options.network.grade + " · Term " + options.network.term + " · " + result.count + ' sample students assessed.</p>' +
      panel("Subject comparison", "Same grade and term", '<div class="chairman-detail-bars">' + subjects.map((subject) => {
        const score = assessmentResult(branch, { ...options.network, subject: subject.id });
        return '<div><span>' + subject.name + '</span><strong>' + percent(score.mean) + '</strong><progress max="100" value="' + score.mean + '" aria-label="' + subject.name + ' average"></progress></div>';
      }).join("") + '</div>') + panel("Term trend", "Selected subject and grade", sparkline(academicTrend([branch], options.network), branch.name + " term trend")) +
      panel("Mark distribution", "Pass mark 50% · High scores 75%+", histogram(academicDistribution([branch], options.network))) +
      button("Open branch courses", "network-open", { value: branch.id, variant: "secondary", iconName: "book" });
  }
  if (view === "attendance") {
    const result = attendanceResult(options.state, branch, c);
    const rows = c.audience === "students" ? Array.from({ length: 13 }, (_, i) => attendanceResult(options.state, branch, { ...c, attendanceGrade: i + 1 }))
      .filter((row, i) => c.attendanceGrade === "all" || i + 1 === Number(c.attendanceGrade)).map((row, i) => '<tr><td>Grade ' + (c.attendanceGrade === "all" ? i + 1 : c.attendanceGrade) + '</td><td>' + percent(row.rate) + '</td><td>' + row.present + '</td><td>' + row.absent + '</td><td>' + row.late + '</td></tr>').join("") : "";
    return heading + '<div class="chairman-detail-stats"><div><span>Attendance</span><strong>' + percent(result.rate) + '</strong></div><div><span>Present</span><strong>' + result.present + '</strong></div><div><span>Not present</span><strong>' + (result.absent + result.leave) + '</strong></div></div>' +
      (c.audience === "students" ? panel("Grade attendance", "Selected reporting period · Late included in present", table(["Grade", "Rate", "Present", "Absent", "Late"], rows, "Branch attendance by grade")) : "") +
      attendanceWatchlist({ ...options, chairman: { ...c, studentPage: 1, staffPage: 1 } }, [branch]);
  }
  const staffing = staffingResult(options.state, branch, c.date);
  return heading + '<div class="chairman-detail-stats"><div><span>Total staff</span><strong>' + staffing.total + '</strong></div><div><span>Teachers</span><strong>' + staffing.teachers + '</strong></div><div><span>Vacancies</span><strong>' + staffing.vacancies.length + '</strong></div></div>' +
    panel("School leadership", "Sample leadership and prototype appointments", '<div class="chairman-leadership">' + staffing.staff.filter((person) => person.category === "leadership" || person.roles.includes("section_head")).map((person) => '<button type="button" data-action="chairman-staff" data-value="' + person.id + '"><span>' + icon("user", 20) + '</span><div><strong>' + e(person.name) + '</strong><small>' + person.designation + '</small></div></button>').join("") + '</div>') +
    panel("Open positions", "Vacancy review is saved in this browser", vacancyCards(options, [branch])) +
    (options.context.role !== "vice_principal" ? button("Manage branch appointments", "chairman-manage-staff", { value: branch.id, variant: "secondary", iconName: "badge" }) : "");
}

export function chairmanStudentPanel(options, student, branch) {
  const dates = schoolDays(options.chairman.date, "month");
  const days = dates.map((date) => ({ date, status: studentStatus(student, date) }));
  const absent = days.filter((day) => day.status === "absent").length;
  return button("Back to " + e(branch.name), "network-select", { value: branch.id, variant: "secondary compact" }) +
    '<div class="chairman-person-heading"><h3>' + e(student.name) + '</h3><p>' + student.admission + " · " + e(branch.name) + " · Class " + student.className + '</p>' + badge("Illustrative student", "amber") + '</div>' +
    '<div class="chairman-detail-stats"><div><span>School days</span><strong>20</strong></div><div><span>Absent</span><strong>' + absent + '</strong></div><div><span>Late</span><strong>' + days.filter((day) => day.status === "late").length + '</strong></div></div>' +
    (options.context.role === "vice_principal" ? button("Record attendance follow-up", "vice-student-followup", { value: student.id, variant: "secondary" }) : "") +
    '<div class="chairman-attendance-calendar">' + days.map((day) => '<div class="' + day.status + '"><span>' + dateLabel(day.date) + '</span><strong>' + statusLabel[day.status] + '</strong></div>').join("") + '</div>';
}

export function chairmanStaffPanel(options, person, branch) {
  const dates = schoolDays(options.chairman.date, "month");
  const days = dates.map((date) => branchStaff(options.state, branch, date).find((entry) => entry.id === person.id));
  return button("Back to " + e(branch.name), "network-select", { value: branch.id, variant: "secondary compact" }) +
    '<div class="chairman-person-heading"><h3>' + e(person.name) + '</h3><p>' + e(branch.name) + " · " + person.designation + '</p>' + badge(person.sample ? "Illustrative staff record" : "Appointed in prototype", "neutral") + '</div>' +
    '<dl class="chairman-person-facts"><div><dt>Availability</dt><dd>' + statusLabel[person.status] + '</dd></div><div><dt>Subject</dt><dd>' + e(person.subject) + '</dd></div><div><dt>Roles</dt><dd>' + person.roles.map((role) => e(role.replaceAll("_", " "))).join(", ") + '</dd></div><div><dt>Demo contact</dt><dd>' + e(person.email) + '</dd></div></dl>' +
    '<div class="chairman-detail-stats"><div><span>Present in 20 days</span><strong>' + days.filter((day) => day?.status === "present").length + '</strong></div><div><span>On leave</span><strong>' + days.filter((day) => day?.status === "leave").length + '</strong></div><div><span>Absent</span><strong>' + days.filter((day) => day?.status === "absent").length + '</strong></div></div>' +
    (options.context.role !== "vice_principal" ? button("Manage branch appointments", "chairman-manage-staff", { value: branch.id, variant: "secondary", iconName: "badge" }) : "");
}

export function chairmanVacancyPanel(options, vacancy) {
  return '<div class="chairman-person-heading"><h3>' + e(vacancy.subject + " · " + vacancy.role) + '</h3><p>' + e(vacancy.branchName) + '</p>' + badge(vacancy.reviewed ? "Reviewed" : "Open vacancy", vacancy.reviewed ? "blue" : "amber") + '</div><p class="chairman-filter-note">Illustrative staffing requirement. Review status tracks management follow-up; open positions remain listed.</p>' +
    '<div class="chairman-vacancy-actions">' + button(vacancy.reviewed ? "Reopen review" : "Mark reviewed", "chairman-review-vacancy", { value: vacancy.id, iconName: "check" }) +
    (options.context.role !== "vice_principal" ? button("Manage branch appointments", "chairman-manage-staff", { value: vacancy.branch, variant: "secondary", iconName: "badge" }) : "") + '</div>';
}

export function executiveReportHTML(report, logo = "") {
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>' + e(report.title) +
    ' · SAMPLE · Sussex College Network</title><style>@page{size:A4 landscape;margin:14mm}*{box-sizing:border-box}body{font:14px/1.5 Arial,sans-serif;color:#18382c;max-width:1180px;margin:36px auto;padding:0 18px}h2{font-size:28px;line-height:1.2;margin:10px 0}h3{margin-top:24px}.export-brand{display:flex;gap:15px;align-items:center;padding-bottom:20px;border-bottom:3px solid #1b6752}.export-brand img{width:65px;height:80px;object-fit:contain}.export-brand strong{font-size:20px}.chairman-eyebrow{font-size:11px;letter-spacing:1px}.executive-report-preview>header{padding:22px 0}.badge{display:inline-block;border:1px solid #d8be73;background:#fff5d5;color:#775520;border-radius:6px;padding:4px 8px;font-size:11px;margin-top:8px}.executive-report-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;padding:20px;background:#edf5ee}.executive-report-stats span{display:block;font-size:12px}.executive-report-stats strong{display:block;font-size:25px;margin-top:8px}.executive-report-criteria{font-size:12px;margin:20px 0;color:#52685b}table{border-collapse:collapse;width:100%;font-size:12px}th,td{border-bottom:1px solid #dce7dc;padding:9px 7px;text-align:left}th{background:#edf5ee}thead{display:table-header-group}tr{break-inside:avoid}.executive-report-insights p{margin:7px 0}footer{margin-top:25px;border-top:1px solid #dce7dc;padding-top:14px;font-size:11px;color:#52685b}@media print{body{margin:0;padding:0;max-width:none}.executive-report-stats{print-color-adjust:exact}h2,h3{break-after:avoid}.executive-report-preview>header{padding-top:14px}}</style></head><body><div class="export-brand">' +
    (logo ? '<img alt="Sussex College Network logo" src="' + e(logo) + '">' : "") + '<div><strong>Sussex College Network</strong><div>' + (report.owner?.role === "vice_principal" ? 'Vice Principal’s office · ' + e(report.owner.school) : report.owner?.role === "principal" ? 'Principal’s office · ' + e(report.owner.school) : 'Chairman’s office · Executive reporting') + '</div></div></div>' + reportPreview(report) + '</body></html>';
}

function principalClassAttendance(options, branch) {
  const c = options.chairman;
  if (c.audience === "staff") {
    const people = branchStaff(options.state, branch, schoolDays(c.date)[0]);
    const rows = [["leadership", "Leadership"], ["teachers", "Teaching staff"], ["support", "Support staff"]].map(([key, label]) => {
      const group = people.filter((person) => person.category === key);
      return '<tr><td>' + label + '</td><td>' + group.length + '</td><td>' + group.filter((person) => person.status === "present").length + '</td><td>' + group.filter((person) => person.status === "absent").length + '</td><td>' + group.filter((person) => person.status === "leave").length + '</td></tr>';
    }).join("");
    return panel("School staff attendance", "Latest school day · Attendance totals above use the selected period", table(["Group", "Staff", "Present", "Absent", "On leave"], rows, "School staff attendance"));
  }
  const grades = c.attendanceGrade === "all" ? Array.from({ length: 13 }, (_, i) => i + 1) : [Number(c.attendanceGrade)];
  const rows = grades.flatMap((grade) => ["A", "B"].map((letter) => {
    const className = grade + letter;
    if (c.attendanceClass !== "all" && c.attendanceClass !== className) return "";
    const result = attendanceResult(options.state, branch, { ...c, attendanceGrade: grade, attendanceClass: className });
    return '<tr><td><button type="button" class="chairman-person-link" data-action="principal-attendance-class" data-value="' + className + '">Class ' + className + '</button></td><td><strong>' + percent(result.rate) + '</strong></td><td>' + result.present + '</td><td>' + result.absent + '</td><td>' + result.late + '</td></tr>';
  })).join("");
  return panel("Class attendance", "Select a class to open its register · Late arrivals are included in present totals",
    table(["Class", "Rate", "Present", "Absent", "Late"], rows, "School class attendance", "scroll-table"));
}

function principalStaffingSummary(options, result) {
  const leaders = result.staff.filter((person) => person.category === "leadership" || person.roles.includes("section_head"));
  const roster = '<div class="chairman-leadership">' + leaders.map((person) => '<button type="button" data-action="chairman-staff" data-value="' + person.id + '">' + icon("user", 20) + '<div><strong>' + e(person.name) + '</strong><small>' + person.designation + '</small></div></button>').join("") + '</div>';
  const capacity = '<div class="principal-capacity"><div><span>Teaching positions</span><strong>' + result.teachers + '</strong></div><div><span>Support staff</span><strong>' + result.support + '</strong></div><div><span>Students per teacher</span><strong>' + result.ratio.toFixed(1) + ':1</strong></div><div><span>Positions filled</span><strong>' + percent(result.coverage) + '</strong></div></div><div class="principal-capacity-action">' +
    (options.context.role !== "vice_principal" ? button("Manage school appointments", "chairman-manage-staff", { value: result.branch.id, variant: "secondary", iconName: "badge" }) : "") + '</div>';
  return '<div class="chairman-two-columns">' + panel("School leadership", result.branch.school, roster) + panel("Staffing capacity", "Illustrative enrolment and staffing positions", capacity) + '</div>';
}

function principalLeaveCards(options, branch) {
  return '<div class="principal-leave-grid">' + schoolLeaveRequests(options.state, branch).map((request) =>
    '<article class="principal-leave-card"><div>' + badge(request.decision[0].toUpperCase() + request.decision.slice(1), request.decision === "approved" ? "green" : request.decision === "declined" ? "neutral" : "amber") +
    '<small>Sample request</small></div><h3>' + e(request.name) + '</h3><p>' + e(request.designation) + '</p><dl><div><dt>Date</dt><dd>' + dateLabel(request.date) + '</dd></div><div><dt>Reason</dt><dd>' + request.reason + '</dd></div></dl>' +
    (request.recommendation ? '<div class="vice-leave-recommendation"><strong>Vice Principal: ' + e(leaveRecommendations[request.recommendation.recommendation]) + '</strong><p>' + e(request.recommendation.note) + '</p><small>' + e(request.recommendation.by) + '</small></div>' : "") +
    (request.reviewedBy ? '<p class="principal-leave-reviewed">Reviewed by ' + e(request.reviewedBy) + '</p>' : "") +
    '<div class="principal-leave-actions">' + (options.context.role === "vice_principal" ? (request.decision === "pending" ? button(request.recommendation ? "Edit recommendation" : "Recommend to Principal", "vice-leave-recommend", { value: request.id, variant: "secondary compact" }) : '<small>Final decision by Principal</small>') : (request.decision !== "approved" ? button("Approve", "principal-review-leave", { value: request.id + "|approved", variant: "primary compact" }) : "") +
    (request.decision !== "declined" ? button("Decline", "principal-review-leave", { value: request.id + "|declined", variant: "secondary compact" }) : "")) + '</div></article>').join("") + '</div>';
}

export { attendancePage, staffingPage, reportsPage, metric, panel, table, select, header, sparkline, histogram };
