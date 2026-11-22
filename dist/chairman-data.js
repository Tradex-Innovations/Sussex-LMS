import { assessmentResult, rankedResults, networkSummary, subjects } from "./network-analytics.js";
import { networkFleet, fleetSummary, networkTelemetry } from "./network-fleet.js";
import { sampleEnrollment } from "./school-sample.js";

export const demoDate = "2026-11-20";
export const chairmanViews = [
  { id: "transport", name: "Transport Activity", icon: "bus" },
  { id: "academic", name: "Academic Performance", icon: "book" },
  { id: "attendance", name: "Attendance", icon: "checkCircle" },
  { id: "staffing", name: "Staffing Overview", icon: "users" },
  { id: "reports", name: "Executive Reports", icon: "file" },
];
export const reportTypes = { brief: "Network executive brief", transport: "Transport activity", academic: "Academic performance", attendance: "Attendance", staffing: "Staffing overview" };
export const staffRoles = { principal: "Principal", vice_principal: "Vice Principal", section_head: "Section Head", coordinator: "Grade Coordinator", class_teacher: "Class Teacher", teacher: "Subject Teacher", admin: "School Administrator", transport: "Transport Coordinator", librarian: "Librarian", driver: "Driver" };
export const round = (value) => Math.round(value * 10) / 10;
const hash = (value) => [...String(value)].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) >>> 0, 7);
const names = ["Amaya", "Kavin", "Senuli", "Dineth", "Nethmi", "Yenul", "Thisali", "Dulith", "Hasini", "Thevin", "Minuli", "Shenul", "Rashmi", "Sahan", "Tharushi", "Naveen", "Anuki", "Keshan", "Dinuli", "Ravin"];
const surnames = ["Perera", "Fernando", "Silva", "Jayasinghe", "Senanayake", "Dias", "Wijesinghe", "Rathnayake", "Mendis", "Gunawardena", "De Alwis", "Karunaratne"];
const sampleName = (seed) => names[seed % names.length] + " " + surnames[Math.floor(seed / 3) % surnames.length];
const rosterCache = new Map(), attendanceCache = new Map();

export function chairmanDefaults() {
  return { date: demoDate, period: "day", attendanceGrade: "all", audience: "students", attendanceFlag: "repeated", studentQuery: "", studentPage: 1,
    staffGroup: "all", staffStatus: "all", staffQuery: "", staffPage: 1, staffingTab: "people",
    reportType: "brief", reportPeriod: "week", reportBranches: null, reportId: "", reportFormat: "csv",
    detail: "", personId: "", branchId: "", academicSort: "average", attendanceSort: "rate", academicClass: "all", academicCompare: "classes", attendanceClass: "all" };
}

export function isSchoolOperator(context) { return ["principal", "vice_principal"].includes(context?.role); }

export function isSchoolLeader(context) { return context?.role === "chairman" || isSchoolOperator(context); }

export function reportOwnerKey(context) {
  return isSchoolOperator(context) ? context.role + ":" + (context.grant?.branch || context.branch) : "chairman:" + context?.account?.id;
}

export function visibleExecutiveReports(state, context) {
  if (!isSchoolLeader(context)) return [];
  const allowed = new Set(chairmanBranches(state, context).map((branch) => branch.id));
  const owner = reportOwnerKey(context);
  return (state.executiveReports || []).filter((report) => (report.owner?.key ? report.owner.key === owner : context.role === "chairman") && report.criteria.scope.every((branch) => allowed.has(branch)));
}

export function chairmanBranches(state, context, selected = null) {
  if (!["chairman", "principal", "vice_principal"].includes(context?.role)) return [];
  const scope = context.role === "chairman" ? context.branch : context.grant?.branch || context.branch;
  const scoped = state.branches.filter((branch) => context.role === "chairman" && scope === "all" || scope === branch.id);
  return selected === null ? scoped : scoped.filter((branch) => selected.includes(branch.id));
}

export function schoolDays(date = demoDate, period = "day") {
  const count = { day: 1, week: 5, month: 20 }[period] || 1;
  const cursor = new Date(date + "T12:00:00Z");
  if (Number.isNaN(cursor.getTime())) return [];
  const days = [];
  while (days.length < count) {
    if (![0, 6].includes(cursor.getUTCDay())) days.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return days.reverse();
}

export function schoolEnrollment(branch) {
  return sampleEnrollment(branch);
}

export function studentRoster(branch, grade = "all") {
  const key = branch.id;
  if (!rosterCache.has(key)) {
    const total = schoolEnrollment(branch);
    rosterCache.set(key, Array.from({ length: total }, (_, index) => {
      const studentGrade = index % 13 + 1;
      return { id: "sample-student-" + branch.id + "-" + index, index, seed: branch.directoryIndex * 811 + index,
        name: sampleName(index + branch.directoryIndex * 13), branch: branch.id, branchName: branch.name,
        grade: studentGrade, className: studentGrade + (Math.floor(index / 13) % 2 ? "B" : "A"),
        admission: "DEMO-" + String(branch.directoryIndex + 1).padStart(2, "0") + "-" + String(index + 1).padStart(4, "0"), sample: true };
    }));
  }
  const roster = rosterCache.get(key);
  for (const student of roster) student.branchName = branch.name;
  return grade === "all" ? roster : roster.filter((student) => student.grade === Number(grade));
}

export function studentStatus(student, date, state) {
  const saved = state?.classAttendance?.[student.id + ":" + date];
  if (saved && saved.branch === student.branch && saved.grade === student.grade && saved.className === student.className && saved.date === date && ["present", "absent", "late"].includes(saved.status)) return saved.status;
  const day = Math.floor(Date.parse(date + "T12:00:00Z") / 86400000);
  const branchIndex = Math.floor(student.seed / 811);
  const value = (student.seed * 37 + day * 19 + (student.seed % 17) * (day % 13) * 7) % 1000;
  const threshold = 32 + branchIndex % 5 * 10 + ((branchIndex + day) % 7 === 0 ? 90 : 0);
  if ((student.index % 47 === 0 && day % 5 < 3) || value < threshold) return "absent";
  return value < threshold + 46 ? "late" : "present";
}

export function branchStaff(state, branch, date = demoDate) {
  const appointed = state.accounts.flatMap((person) => {
    const grants = person.grants.filter((grant) => grant.branch === branch.id && Object.hasOwn(staffRoles, grant.role));
    return grants.length ? [{ ...person, roles: [...new Set(grants.map((grant) => grant.role))], grants, branch: branch.id, branchName: branch.name, sample: false }] : [];
  });
  const staff = [...appointed];
  const add = (role, number) => staff.push({ id: "sample-staff-" + branch.id + "-" + role + "-" + number,
    name: sampleName(branch.directoryIndex * 23 + number * 7 + hash(role) % 50), roles: [role], grants: [{ role, branch: branch.id }],
    branch: branch.id, branchName: branch.name, sample: true });
  for (const role of ["principal", "vice_principal"]) if (!staff.some((person) => person.roles.includes(role))) add(role, 0);
  const sectionHeads = staff.filter((person) => person.roles.includes("section_head")).length;
  for (let i = sectionHeads; i < 3; i += 1) add("section_head", i);
  const category = (person) => person.roles.some((role) => ["principal", "vice_principal"].includes(role)) ? "leadership"
    : person.roles.some((role) => ["teacher", "class_teacher", "coordinator", "section_head"].includes(role)) ? "teachers" : "support";
  const target = Math.ceil(schoolEnrollment(branch) / 21);
  for (let i = staff.filter((person) => category(person) === "teachers").length; i < target; i += 1) add("teacher", i);
  for (let i = staff.filter((person) => category(person) === "support").length; i < 7 + branch.directoryIndex % 4; i += 1) add(["admin", "librarian", "transport", "driver"][i % 4], i);
  const requestDay = Math.floor(Date.parse(demoDate + "T12:00:00Z") / 86400000);
  const requestStaff = new Set(staff.filter((person) => category(person) === "teachers" && (hash(person.id) + requestDay * 7) % 23 >= 2 && (hash(person.id) + requestDay) % 29 !== 0).slice(0, 3).map((person) => person.id));
  return staff.map((person, index) => {
    const key = hash(person.id);
    const day = Math.floor(Date.parse(date + "T12:00:00Z") / 86400000);
    const absent = (key + day * 7) % 23 < 2;
    const leave = (key + day) % 29 === 0;
    const approved = requestStaff.has(person.id) && date === demoDate && state.principalLeaveReviews?.["leave-" + branch.id + "-" + person.id]?.decision === "approved";
    const status = approved || leave ? "leave" : absent ? "absent" : "present";
    const primaryRole = ["principal", "vice_principal", "section_head", "coordinator", "class_teacher", "teacher", "admin", "transport", "librarian", "driver"].find((role) => person.roles.includes(role));
    const assignedCourses = state.courses.filter((course) => course.branch === branch.id && state.assignments[course.id]?.teacher === person.id);
    const assignedSubjects = [...new Set(assignedCourses.map((course) => course.title))];
    return { ...person, category: category(person), primaryRole, designation: staffRoles[primaryRole], status, leaveRequestEligible: requestStaff.has(person.id),
      assignedCourses,
      subject: category(person) === "teachers" ? person.sample ? subjects[(index + branch.directoryIndex) % subjects.length].name : assignedSubjects.join(", ") || "No courses assigned" : "—",
      email: person.sample ? "sample." + (index + 1) + "@school.example" : "demo." + person.id + "@school.example" };
  });
}

export function schoolLeaveRequests(state, branch) {
  return branchStaff(state, branch, demoDate).filter((person) => person.leaveRequestEligible).map((person, index) => {
    const id = "leave-" + branch.id + "-" + person.id;
    const review = state.principalLeaveReviews?.[id];
    return { id, branch: branch.id, person: person.id, name: person.name, designation: person.designation, date: demoDate,
      reason: ["Personal leave", "Family commitment", "Professional development"][index], decision: review?.decision || "pending", reviewedBy: review?.by || "", recommendation: state.viceLeaveRecommendations?.[id] || null, sample: true };
  });
}

export function branchVacancies(state, branch) {
  return Array.from({ length: (branch.directoryIndex * 3 + 1) % 5 }, (_, index) => {
    const id = "vacancy-" + branch.id + "-" + index;
    return { id, branch: branch.id, branchName: branch.name, role: index === 3 ? "School Administrator" : "Subject Teacher",
      subject: index === 3 ? "Administration" : subjects[(branch.directoryIndex + index) % 4].name,
      priority: index === 0 && branch.directoryIndex % 3 === 0 ? "High" : "Normal",
      reviewed: Boolean(state.executiveReviews?.[id]), sample: true };
  });
}

export function studentDaySummary(branch, date, grade = "all", className = "all", state) {
  const key = branch.id + ":" + date + ":" + grade + ":" + className;
  const savedRegister = Object.values(state?.classAttendance || {}).some((entry) => entry.branch === branch.id && entry.date === date);
  if (!savedRegister && attendanceCache.has(key)) return attendanceCache.get(key);
  const roster = studentRoster(branch, grade).filter((student) => className === "all" || student.className === className);
  const counts = { expected: roster.length, present: 0, absent: 0, late: 0 };
  for (const student of roster) {
    const status = studentStatus(student, date, state);
    if (status === "absent") counts.absent += 1;
    else { counts.present += 1; if (status === "late") counts.late += 1; }
  }
  if (!savedRegister) attendanceCache.set(key, counts);
  return counts;
}

export function attendanceResult(state, branch, options = {}) {
  const dates = schoolDays(options.date || demoDate, options.period || "day");
  const audience = options.audience || "students";
  const counts = { expected: 0, present: 0, absent: 0, late: 0, leave: 0 };
  const trend = dates.map((date) => {
    let day;
    if (audience === "staff") {
      const staff = branchStaff(state, branch, date);
      day = { expected: staff.length, present: staff.filter((person) => person.status === "present").length,
        absent: staff.filter((person) => person.status === "absent").length, late: 0, leave: staff.filter((person) => person.status === "leave").length };
    } else day = { ...studentDaySummary(branch, date, options.attendanceGrade || "all", options.attendanceClass || "all", state), leave: 0 };
    for (const key of Object.keys(counts)) counts[key] += day[key];
    return { date, ...day, rate: day.expected ? round(day.present / day.expected * 100) : 0 };
  });
  const previousDates = schoolDays(dates[0] || demoDate, "day");
  const previous = new Date((previousDates[0] || demoDate) + "T12:00:00Z");
  previous.setUTCDate(previous.getUTCDate() - 1);
  const priorDate = schoolDays(previous.toISOString().slice(0, 10), "day")[0];
  const current = trend.at(-1);
  const prior = audience === "students" ? studentDaySummary(branch, priorDate, options.attendanceGrade || "all", options.attendanceClass || "all", state) : null;
  return { branch, dates, ...counts, rate: counts.expected ? round(counts.present / counts.expected * 100) : 0, trend,
    change: prior?.expected && current ? round(current.rate - prior.present / prior.expected * 100) : null };
}

export function attendanceSummary(results) {
  const total = results.reduce((sum, result) => {
    for (const key of ["expected", "present", "absent", "late", "leave"]) sum[key] += result[key];
    return sum;
  }, { expected: 0, present: 0, absent: 0, late: 0, leave: 0 });
  return { ...total, rate: total.expected ? round(total.present / total.expected * 100) : 0 };
}

export function attendanceExceptions(branches, options, state) {
  const dates = schoolDays(options.date, options.period);
  // Repeated absences use a consistent trailing 20-school-day window.
  const repeatDates = schoolDays(options.date, "month");
  return branches.flatMap((branch) => studentRoster(branch, options.attendanceGrade).map((student) => {
    const missed = repeatDates.filter((date) => studentStatus(student, date, state) === "absent").length;
    const status = studentStatus(student, dates.at(-1), state);
    return { ...student, missed, status };
  })).filter((student) => (!options.attendanceClass || options.attendanceClass === "all" || options.attendanceClass === student.className))
    .filter((student) => options.attendanceFlag === "all" ? true : options.attendanceFlag === "repeated" ? student.missed >= 3
    : options.attendanceFlag === "late" ? student.status === "late" : student.status === "absent")
    .filter((student) => !options.studentQuery || (student.name + " " + student.admission + " " + student.branchName).toLowerCase().includes(options.studentQuery.toLowerCase()))
    .sort((a, b) => b.missed - a.missed || a.name.localeCompare(b.name));
}

export function staffingResult(state, branch, date = demoDate) {
  const staff = branchStaff(state, branch, date);
  const vacancies = branchVacancies(state, branch);
  const teachers = staff.filter((person) => person.category === "teachers").length;
  return { branch, staff, vacancies, total: staff.length, teachers, leadership: staff.filter((person) => person.category === "leadership").length,
    support: staff.filter((person) => person.category === "support").length, enrolled: schoolEnrollment(branch),
    available: staff.filter((person) => person.status === "present").length, onLeave: staff.filter((person) => person.status === "leave").length,
    absent: staff.filter((person) => person.status === "absent").length, ratio: teachers ? round(schoolEnrollment(branch) / teachers) : 0,
    coverage: round(staff.length / (staff.length + vacancies.length) * 100) };
}

export function staffingSummary(results) {
  const total = results.reduce((sum, row) => {
    for (const key of ["total", "teachers", "leadership", "support", "enrolled", "available", "onLeave", "absent"]) sum[key] += row[key];
    sum.vacancies += row.vacancies.length;
    return sum;
  }, { total: 0, teachers: 0, leadership: 0, support: 0, enrolled: 0, available: 0, onLeave: 0, absent: 0, vacancies: 0 });
  return { ...total, ratio: total.teachers ? round(total.enrolled / total.teachers) : 0, coverage: total.total ? round(total.total / (total.total + total.vacancies) * 100) : 0 };
}

export function academicTrend(branches, options) {
  return [1, 2, 3].map((term) => ({ label: "Term " + term, value: networkSummary(rankedResults(branches, { ...options, term })).mean }));
}

export function academicDistribution(branches, options) {
  const marks = branches.flatMap((branch) => assessmentResult(branch, options).marks);
  return [[0, 49], [50, 64], [65, 74], [75, 89], [90, 100]].map(([min, max]) => ({ label: min + "–" + max, count: marks.filter((mark) => mark >= min && mark <= max).length }));
}

export function generateExecutiveReport(state, context, settings, academic, telemetry = {}) {
  if (!isSchoolLeader(context)) throw new Error("School leadership access required.");
  if (isSchoolOperator(context) && settings.reportBranches?.some((id) => id !== (context.grant?.branch || context.branch))) throw new Error("Reports are limited to your assigned school.");
  const branches = chairmanBranches(state, context, settings.reportBranches);
  if (!branches.length) throw new Error("Select at least one school for the report.");
  const dates = schoolDays(settings.date, settings.reportPeriod);
  const assessments = rankedResults(branches, academic);
  const audience = settings.reportType === "attendance" ? settings.audience : "students";
  const attendance = branches.map((branch) => attendanceResult(state, branch, { ...settings, period: settings.reportPeriod, audience }));
  const staffing = branches.map((branch) => staffingResult(state, branch, dates.at(-1)));
  const fleet = networkFleet(state, branches);
  const rows = branches.map((branch) => {
    const result = assessments.find((row) => row.branch.id === branch.id);
    const register = attendance.find((row) => row.branch.id === branch.id);
    const staff = staffing.find((row) => row.branch.id === branch.id);
    const buses = fleetSummary(fleet.filter((bus) => bus.branch === branch.id));
    return { id: branch.id, school: branch.name, academic: result.mean, passRate: result.passRate, assessed: result.count, rank: result.rank,
      attendance: register.rate, expected: register.expected, present: register.present, absent: register.absent, late: register.late, leave: register.leave,
      staff: staff.total, teachers: staff.teachers, available: staff.available, vacancies: staff.vacancies.length, coverage: staff.coverage,
      ratio: staff.ratio, buses: buses.total, onRoute: buses.route, atSchool: buses.school, delayed: buses.delayed };
  });
  const insights = rows.flatMap((row) => [
    row.delayed ? { branch: row.id, school: row.school, view: "transport", message: row.delayed + " bus signal(s) delayed." } : null,
    row.attendance < 92 ? { branch: row.id, school: row.school, view: "attendance", message: "Student attendance is " + row.attendance + "%." } : null,
    row.vacancies >= 3 ? { branch: row.id, school: row.school, view: "staffing", message: row.vacancies + " open staffing positions." } : null,
    row.academic < 75 ? { branch: row.id, school: row.school, view: "academic", message: "Subject average is " + row.academic + "%." } : null,
  ].filter(Boolean));
  return { id: "report-" + crypto.randomUUID(), generatedAt: new Date().toISOString(), type: settings.reportType, title: isSchoolOperator(context) && settings.reportType === "brief" ? (context.role === "vice_principal" ? "School operational brief" : "School executive brief") : reportTypes[settings.reportType] || reportTypes.brief,
    owner: { key: reportOwnerKey(context), role: context.role, name: context.account.name, school: isSchoolOperator(context) ? branches[0].school : "" },
    sample: true, criteria: { date: settings.date, from: dates[0], to: dates.at(-1), schoolDays: dates.length, period: settings.reportPeriod,
      grade: academic.grade, term: academic.term, subject: academic.subject, className: academic.className || "all", audience, attendanceGrade: settings.attendanceGrade, attendanceClass: settings.attendanceClass || "all", scope: branches.map((branch) => branch.id) },
    summary: { academic: networkSummary(assessments), attendance: attendanceSummary(attendance), staffing: staffingSummary(staffing), fleet: fleetSummary(fleet) },
    rows, insights, buses: fleet.map((bus) => {
      const signal = networkTelemetry(bus, telemetry);
      return { school: bus.branchName, label: bus.label, route: bus.name, driver: bus.driver, status: bus.status,
        speed: signal.speed, nextStop: signal.nextStop, signal: signal.updated, students: bus.studentsOnBoard,
        lat: signal.position?.[0], lon: signal.position?.[1] };
    }) };
}

export function reportColumns(type, audience = "students") {
  const shared = [["school", "School branch"]];
  if (type === "transport") return [...shared, ["label", "Bus"], ["route", "Route"], ["driver", "Driver"], ["status", "Status"], ["speed", "Speed km/h"], ["nextStop", "Next stop"], ["signal", "Last signal"], ["students", "Sample occupancy"], ["lat", "Latitude"], ["lon", "Longitude"]];
  if (type === "academic") return [...shared, ["rank", "Rank"], ["academic", "Average mark %"], ["passRate", "Pass rate %"], ["assessed", "Students assessed"]];
  if (type === "attendance") return [...shared, ["attendance", "Attendance %"], ["expected", "Expected attendance-days"], ["present", "Present attendance-days"], ["absent", "Absent attendance-days"], audience === "staff" ? ["leave", "On leave attendance-days"] : ["late", "Late arrivals"]];
  if (type === "staffing") return [...shared, ["staff", "Total staff"], ["teachers", "Teachers"], ["available", "Available staff"], ["vacancies", "Vacancies"], ["coverage", "Positions filled %"], ["ratio", "Students per teacher"]];
  return [...shared, ["academic", "Average mark %"], ["attendance", "Attendance %"], ["staff", "Staff"], ["vacancies", "Vacancies"], ["buses", "Buses"], ["onRoute", "On route"], ["atSchool", "At school"], ["delayed", "Signal delayed"]];
}

export function reportCSV(report) {
  const columns = report.customColumns || reportColumns(report.type, report.criteria.audience);
  const safe = (value) => {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const metadata = [["Sussex College Network", report.title], ["Data", "SAMPLE DATA - PROTOTYPE"], [["teacher", "admin", "transport"].includes(report.owner?.role) ? "Snapshot date" : "Reporting period", report.criteria.from + " to " + report.criteria.to],
    ...(!["teacher", "admin", "transport"].includes(report.owner?.role) && ["brief", "attendance"].includes(report.type) ? [["Attendance period", report.criteria.from + " to " + report.criteria.to], ["Attendance for", report.criteria.audience]] : []),
    ...(!["teacher", "admin", "transport"].includes(report.owner?.role) && ["brief", "academic"].includes(report.type) ? [["Academic assessment", report.criteria.subject + " / Grade " + report.criteria.grade + " / Term " + report.criteria.term]] : []), ["Generated UTC", report.generatedAt], []];
  if (["section_head", "coordinator", "class_teacher"].includes(report.owner?.role)) metadata.splice(-1, 0, ["School", report.owner.school], ["Section", report.owner.sectionName], [report.owner.role === "class_teacher" ? "Assigned class grade" : report.owner.role === "coordinator" ? "Assigned grade" : "Section grades", report.criteria.grades.join(", ")]);
  if (report.criteria.className && report.criteria.className !== "all") metadata.splice(-1, 0, ["Academic class", report.criteria.className]);
  if (report.criteria.attendanceClass && report.criteria.attendanceClass !== "all") metadata.splice(-1, 0, ["Attendance class", report.criteria.attendanceClass]);
  if (report.criteria.comparison) metadata.splice(-1, 0, ["Comparison", report.criteria.comparison]);
  if (report.owner?.role === "teacher") metadata.splice(-1, 0, ["School", report.owner.school], ["Subject Teacher", report.owner.teacher], ["Assigned courses", report.criteria.courseLabels.join("; ")],
    ...(report.type === "progress" ? [["Learning review filter", report.criteria.review], ["Student search", report.criteria.query || "All enrolled students"]] : []),
    ...(report.type === "plans" ? [["Plan status filter", report.criteria.planStatus], ["Planning window", "20 to 27 Nov 2026"]] : []));
  if (report.owner?.role === "admin") metadata.splice(-1, 0, ["School", report.owner.school], ["School Administrator", report.owner.by], ["Grade selection", report.criteria.grade], ["Class selection", report.criteria.className],
    ["Record search", report.criteria.query || "All records"], ["Student record filter", report.criteria.studentStatus], ["Guardian link filter", report.criteria.guardianStatus], ["Course filter", report.criteria.courseStatus]);
  if (report.owner?.role === "transport") metadata.splice(-1, 0, ["School", report.owner.school], ["Transport Coordinator", report.owner.by], ["Operational bus filter", report.criteria.busFilter], ["Vehicle status filter", report.criteria.status],
    ["Record search", report.criteria.query || "All records"], ["Student allocation filter", report.criteria.allocation], ["Assigned issue status", report.criteria.taskStatus], ["Telemetry", "SIMULATED GPS / progress / arrival estimates"]);
  const rows = report.customRows || (report.type === "transport" ? report.buses : report.rows);
  const operations = report.operations ? [[], ["School coordination snapshot"], ["Leave recommendations pending Principal decision", report.operations.recommendations],
    ["Follow-up", "Category", "Status", "Due"], ...report.operations.followups.map((item) => [item.title, item.category, item.status, item.due]), [],
    ["Cover class", "Subject", "Cover teacher", "Date"], ...report.operations.covers.map((item) => [item.className, item.title, item.teacherName, item.date])] : [];
  const sectionFollowups = ["section_head", "coordinator", "class_teacher"].includes(report.owner?.role) && report.type === "brief" && report.followups?.length ? [[], ["Recorded attendance follow-ups"], ["Student", "Class", "Due", "Status"], ...report.followups.map((item) => [item.name, item.className, item.due, item.status])] : [];
  return "\uFEFF" + [...metadata, columns.map(([, label]) => label), ...rows.map((row) => columns.map(([key]) => row[key])), ...operations, ...sectionFollowups].map((row) => row.map(safe).join(",")).join("\r\n");
}
