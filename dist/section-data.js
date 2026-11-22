import { sections, sectionFor } from "./data.js";
import { visibleCourses, visibleStudents } from "./access.js";
import { assessmentResult, subjects, networkSummary } from "./network-analytics.js";
import { demoDate, studentRoster, studentStatus, attendanceResult, attendanceSummary, schoolDays, branchStaff } from "./chairman-data.js";

export const sectionViews = [
  { id: "summary", name: "Section Overview", short: "Overview", icon: "school" },
  { id: "academic", name: "Academic & Courses", short: "Academic", icon: "book" },
  { id: "attendance", name: "Attendance", short: "Attendance", icon: "checkCircle" },
  { id: "teaching", name: "Teaching Coordination", short: "Teaching", icon: "users" },
  { id: "reports", name: "Section Reports", short: "Reports", icon: "file" },
];
export const sectionReportTypes = { brief: "Section management brief", academic: "Section academic comparison", attendance: "Section attendance", teaching: "Section teaching progress" };
export const sectionFollowupStatuses = { open: "Open", in_progress: "In progress", resolved: "Resolved" };

export function sectionDefaults() {
  return { grade: "all", className: "all", subject: "mathematics", term: 3, compare: "classes", date: demoDate, period: "day",
    flag: "all", query: "", page: 1, teacherQuery: "", reportType: "brief", reportFormat: "csv", reportId: "" };
}

export function sectionScope(state, context) {
  if (context?.role !== "section_head" || context.grant?.role !== "section_head") return null;
  const grant = state.accounts.find((person) => person.id === context.account?.id)?.grants.find((grant) => grant.role === "section_head" && grant.branch === context.grant.branch && grant.section === context.grant.section);
  const branch = state.branches.find((branch) => branch.id === grant?.branch), section = sections.find((section) => section.id === grant?.section);
  return branch && section ? { branch, section, grades: [...section.grades], key: "section_head:" + branch.id + ":" + section.id,
    context: { ...context, grant, branch: grant.branch } } : null;
}

function requireScope(state, context) {
  const scope = sectionScope(state, context);
  if (!scope) throw new Error("An assigned Section Head school and section are required.");
  return scope;
}

export function sectionFilters(state, context, input = {}) {
  const scope = requireScope(state, context), defaults = sectionDefaults();
  const grade = input.grade === "all" || scope.grades.includes(Number(input.grade)) ? String(input.grade) : "all";
  const className = grade !== "all" && [grade + "A", grade + "B"].includes(input.className) ? input.className : "all";
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(input.date || "") && input.date >= "2026-10-12" && input.date <= demoDate && !Number.isNaN(Date.parse(input.date + "T12:00Z")) && new Date(input.date + "T12:00Z").toISOString().slice(0, 10) === input.date;
  return { ...defaults, ...input, grade, className, subject: subjects.some((subject) => subject.id === input.subject) ? input.subject : defaults.subject,
    term: [1, 2, 3].includes(Number(input.term)) ? Number(input.term) : defaults.term, date: validDate ? input.date : defaults.date,
    period: ["day", "week", "month"].includes(input.period) ? input.period : defaults.period,
    compare: ["classes", "grades", "subjects", "teachers"].includes(input.compare) ? input.compare : defaults.compare,
    flag: ["all", "repeated", "absent", "late"].includes(input.flag) ? input.flag : "all",
    page: Math.max(1, Math.min(100, Number(input.page) || 1)), query: String(input.query || "").slice(0, 80), teacherQuery: String(input.teacherQuery || "").slice(0, 80) };
}

export function sectionCourses(state, context, filters = {}) {
  const scope = requireScope(state, context), f = sectionFilters(state, context, filters);
  return visibleCourses(state, scope.context).filter((course) => (f.grade === "all" || course.grade === Number(f.grade)) && (f.className === "all" || course.className === f.className));
}

export function sectionTeachers(state, context, filters = {}) {
  const scope = requireScope(state, context), f = sectionFilters(state, context, filters), courses = sectionCourses(state, context, f);
  const grades = f.grade === "all" ? scope.grades : [Number(f.grade)];
  const staff = branchStaff(state, scope.branch, schoolDays(f.date)[0]);
  return state.accounts.filter((person) => courses.some((course) => state.assignments[course.id]?.teacher === person.id) || person.grants.some((grant) => grant.branch === scope.branch.id &&
    (["coordinator", "class_teacher"].includes(grant.role) && grades.includes(Number(grant.grade)) && (f.className === "all" || grant.role === "coordinator" || grant.className === f.className))))
    .map((person) => {
      const assigned = courses.filter((course) => state.assignments[course.id]?.teacher === person.id);
      const gradesHeld = person.grants.filter((grant) => grant.branch === scope.branch.id && ["coordinator", "class_teacher"].includes(grant.role) && grades.includes(Number(grant.grade)));
      return { id: person.id, name: person.name, courses: assigned, role: gradesHeld.some((grant) => grant.role === "coordinator") ? "Grade Coordinator" : gradesHeld.length ? "Class Teacher" : "Subject Teacher",
        status: staff.find((entry) => entry.id === person.id)?.status || "present", classes: [...new Set([...assigned.map((course) => course.className), ...gradesHeld.map((grant) => grant.className || "Grade " + grant.grade)])] };
    });
}

export function sectionCourseProgress(state, course) {
  const assignment = state.assignments[course.id] || { students: [], teacher: "" };
  const materials = state.materials.filter((item) => item.course === course.id);
  const completed = assignment.students.reduce((sum, id) => sum + materials.filter((item) => state.completed[id]?.includes(item.id)).length, 0);
  return { materials: materials.length, enrolled: assignment.students.length, completed, expected: materials.length * assignment.students.length,
    teacher: state.accounts.find((person) => person.id === assignment.teacher)?.name || "Unassigned", review: state.sectionCourseReviews?.[course.id] || null };
}

export function sectionAcademic(state, context, filters = {}) {
  const scope = requireScope(state, context), f = sectionFilters(state, context, filters);
  const grades = (f.grade === "all" ? scope.grades : [Number(f.grade)]).filter((grade) => grade > 0);
  const courses = sectionCourses(state, context, f), subjectName = subjects.find((subject) => subject.id === f.subject).name;
  const classes = grades.flatMap((grade) => ["A", "B"].map((letter) => {
    const className = grade + letter, result = assessmentResult(scope.branch, { ...f, grade, className });
    const course = courses.find((course) => course.grade === grade && course.className === className && course.title === subjectName);
    const teacher = course && state.accounts.find((person) => person.id === state.assignments[course.id]?.teacher);
    return { ...result, grade, className, key: className, name: "Class " + className, detail: teacher?.name || "Sample class · No course assigned", teacher, course };
  })).filter((row) => f.className === "all" || row.className === f.className);
  let rows = classes;
  if (f.compare === "grades") rows = grades.map((grade) => ({ ...assessmentResult(scope.branch, { ...f, grade }), key: String(grade), name: "Grade " + grade }));
  if (f.compare === "subjects") rows = subjects.map((subject) => ({ ...networkSummary(grades.map((grade) => assessmentResult(scope.branch, { ...f, grade, subject: subject.id }))), key: subject.id, name: subject.name }));
  if (f.compare === "teachers") rows = [...new Set(classes.filter((row) => row.teacher).map((row) => row.teacher.id))].map((id) => {
    const group = classes.filter((row) => row.teacher?.id === id);
    return { ...networkSummary(group), key: id, name: group[0].teacher.name, detail: group.map((row) => row.className).join(", ") };
  });
  return { summary: networkSummary(classes), classes, rows, subjectName, filters: f };
}

export function sectionAttendance(state, context, filters = {}) {
  const scope = requireScope(state, context), f = sectionFilters(state, context, filters);
  const grades = f.grade === "all" ? scope.grades : [Number(f.grade)];
  const classes = grades.filter((grade) => grade > 0).flatMap((grade) => ["A", "B"].map((letter) => {
    const className = grade + letter;
    return { ...attendanceResult(state, scope.branch, { date: f.date, period: f.period, attendanceGrade: grade, attendanceClass: className, audience: "students" }), grade, className };
  })).filter((row) => f.className === "all" || row.className === f.className);
  const dates = schoolDays(f.date, f.period), repeat = schoolDays(f.date, "month"), last = dates.at(-1);
  const roster = studentRoster(scope.branch).filter((student) => grades.includes(student.grade) && (f.className === "all" || student.className === f.className)).map((student) => ({ ...student,
    status: studentStatus(student, last), missed: repeat.filter((date) => studentStatus(student, date) === "absent").length }));
  const rows = roster.filter((student) => f.flag === "all" || f.flag === "repeated" && student.missed >= 3 || student.status === f.flag)
    .filter((student) => (student.name + " " + student.admission).toLowerCase().includes(f.query.toLowerCase()))
    .sort((a, b) => b.missed - a.missed || a.name.localeCompare(b.name));
  const trend = dates.map((date, index) => ({ label: date.slice(5), value: attendanceSummary(classes.map((row) => row.trend[index])).rate }));
  return { summary: attendanceSummary(classes), classes, roster, rows, dates, repeat, trend, filters: f };
}

export function sectionFollowups(state, context) {
  const scope = requireScope(state, context);
  return (state.sectionFollowups || []).filter((item) => item.branch === scope.branch.id && item.section === scope.section.id);
}

export function saveSectionFollowup(state, context, input) {
  const scope = requireScope(state, context);
  const previous = input.id ? sectionFollowups(state, context).find((item) => item.id === input.id) : null;
  if (input.id && !previous) throw new Error("This follow-up is outside your section.");
  const student = sectionAttendance(state, context).roster.find((item) => item.id === (previous?.student || input.student));
  if (!student) throw new Error("Choose a student from your section.");
  if (!Object.hasOwn(sectionFollowupStatuses, input.status)) throw new Error("Choose a valid follow-up status.");
  const owner = sectionTeachers(state, context).find((person) => person.id === input.owner);
  if (!owner && input.owner !== context.account.id) throw new Error("Choose an owner serving your section.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a follow-up note of up to 1,000 characters.");
  if (!/^2026-11-(?:20|2[1-7])$/.test(input.due)) throw new Error("Choose a due date from 20 to 27 Nov 2026.");
  const item = { ...previous, id: previous?.id || "section-followup-" + crypto.randomUUID(), branch: scope.branch.id, section: scope.section.id,
    student: student.id, name: student.name, admission: student.admission, className: student.className, owner: input.owner, due: input.due, status: input.status,
    notes: [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(previous?.notes || [])].slice(0, 20) };
  state.sectionFollowups = [item, ...(state.sectionFollowups || []).filter((entry) => entry.id !== item.id)];
  return item;
}

export function saveSectionCourseReview(state, context, input) {
  const scope = requireScope(state, context), course = sectionCourses(state, context).find((item) => item.id === input.course);
  if (!course) throw new Error("Choose a course within your section.");
  if (!["ready", "changes_requested"].includes(input.status)) throw new Error("Choose a review outcome.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a material review note.");
  state.sectionCourseReviews ??= {};
  state.sectionCourseReviews[course.id] = { course: course.id, branch: scope.branch.id, section: scope.section.id, status: input.status, note, by: context.account.name, at: new Date().toISOString() };
  return course;
}

export function sectionCoverRequests(state, context) {
  const scope = requireScope(state, context);
  return (state.sectionCoverRequests || []).filter((item) => item.branch === scope.branch.id && item.section === scope.section.id);
}

export function requestSectionCover(state, context, input) {
  const scope = requireScope(state, context), course = sectionCourses(state, context).find((item) => item.id === input.course);
  if (!course) throw new Error("Choose a course within your section.");
  if (input.date !== demoDate) throw new Error("The cover demonstration uses 20 Nov 2026.");
  if (sectionCoverRequests(state, context).some((item) => item.course === course.id && item.date === input.date && item.status === "pending")) throw new Error("A pending cover request already exists for this course.");
  const reason = String(input.reason || "").trim();
  if (!reason || reason.length > 500) throw new Error("Enter a reason for the cover request.");
  const item = { id: "section-cover-" + crypto.randomUUID(), branch: scope.branch.id, section: scope.section.id, sectionName: scope.section.name,
    course: course.id, title: course.title, className: course.className, date: input.date, reason, status: "pending", by: context.account.name, at: new Date().toISOString() };
  state.sectionCoverRequests = [item, ...(state.sectionCoverRequests || [])];
  return item;
}

export function sectionOverview(state, context) {
  const scope = requireScope(state, context), courses = sectionCourses(state, context), progress = courses.map((course) => sectionCourseProgress(state, course));
  const teachers = sectionTeachers(state, context), academic = sectionAcademic(state, context), attendance = sectionAttendance(state, context);
  return { scope, courses, progress, teachers, academic, attendance, registered: visibleStudents(state, scope.context).length,
    materials: progress.reduce((sum, row) => sum + row.materials, 0), missing: progress.filter((row) => !row.materials).length,
    completed: progress.reduce((sum, row) => sum + row.completed, 0), expected: progress.reduce((sum, row) => sum + row.expected, 0),
    followups: sectionFollowups(state, context), requests: sectionCoverRequests(state, context) };
}

export function visibleSectionReports(state, context) {
  const scope = sectionScope(state, context);
  if (!scope) return [];
  return (state.sectionReports || []).filter((report) => report.owner?.key === scope.key && report.criteria.section === scope.section.id && report.criteria.scope.length === 1 && report.criteria.scope[0] === scope.branch.id && report.criteria.grades.every((grade) => scope.grades.includes(grade)));
}

export function generateSectionReport(state, context, filters) {
  const scope = requireScope(state, context), f = sectionFilters(state, context, filters);
  if (!Object.hasOwn(sectionReportTypes, f.reportType)) throw new Error("Choose a section report type.");
  if (filters.grade !== "all" && !scope.grades.includes(Number(filters.grade))) throw new Error("Report grades must stay within your section.");
  const grades = f.grade === "all" ? scope.grades : [Number(f.grade)], academic = sectionAcademic(state, context, f), attendance = sectionAttendance(state, context, f), courses = sectionCourses(state, context, f);
  const teachers = sectionTeachers(state, context, f), dates = attendance.dates;
  let rows, columns;
  if (f.reportType === "academic") {
    rows = academic.rows.map((row) => ({ name: row.name, detail: row.detail || "", mean: row.mean, passRate: row.passRate, count: row.count }));
    columns = [["name", f.compare === "subjects" ? "Subject" : f.compare === "grades" ? "Grade" : f.compare === "teachers" ? "Teacher" : "Class"], ["detail", "Teaching detail"], ["mean", "Average mark %"], ["passRate", "Pass rate %"], ["count", "Sample assessed"]];
  } else if (f.reportType === "attendance") {
    rows = attendance.classes.map((row) => ({ className: row.className, rate: row.rate, present: row.present, absent: row.absent, late: row.late, expected: row.expected }));
    columns = [["className", "Class"], ["rate", "Attendance %"], ["expected", "Expected attendance-days"], ["present", "Present attendance-days"], ["absent", "Absent attendance-days"], ["late", "Late arrivals"]];
  } else if (f.reportType === "teaching") {
    rows = courses.map((course) => ({ className: course.className, title: course.title, ...sectionCourseProgress(state, course), review: state.sectionCourseReviews?.[course.id]?.status || "Not reviewed" }));
    columns = [["className", "Class"], ["title", "Course"], ["teacher", "Assigned teacher"], ["materials", "Materials"], ["enrolled", "Enrolled in course"], ["completed", "Completed material assignments"], ["expected", "Expected material assignments"], ["review", "Material review"]];
  } else {
    rows = grades.map((grade) => {
      const a = sectionAcademic(state, context, { ...f, grade }), r = sectionAttendance(state, context, { ...f, grade }), c = sectionCourses(state, context, { ...f, grade });
      return { grade: grade === 0 ? "Preschool" : "Grade " + grade, academic: a.summary.count ? a.summary.mean : "No assessment data", attendance: r.summary.expected ? r.summary.rate : "No register data", courses: c.length, materials: c.reduce((sum, course) => sum + sectionCourseProgress(state, course).materials, 0) };
    });
    columns = [["grade", "Grade"], ["academic", "Sample subject average %"], ["attendance", "Sample attendance %"], ["courses", "Prototype courses"], ["materials", "Published materials"]];
  }
  return { id: "section-report-" + crypto.randomUUID(), type: f.reportType, title: sectionReportTypes[f.reportType], sample: true, generatedAt: new Date().toISOString(),
    owner: { key: scope.key, role: "section_head", name: context.account.name, school: scope.branch.school, sectionName: scope.section.name },
    criteria: { scope: [scope.branch.id], section: scope.section.id, sectionName: scope.section.name, grades, grade: f.grade, className: f.className, subject: f.subject, term: f.term, comparison: f.compare,
      date: f.date, from: dates[0], to: dates.at(-1), period: f.period, schoolDays: dates.length, audience: "students" },
    summary: { academic: academic.summary, attendance: attendance.summary, teachers: teachers.length, courses: courses.length,
      pending: sectionFollowups(state, context).filter((item) => item.status !== "resolved").length, coverRequests: sectionCoverRequests(state, context).filter((item) => item.status === "pending").length },
    followups: sectionFollowups(state, context).filter((item) => grades.includes(Number(item.className.slice(0, -1))) && (f.className === "all" || item.className === f.className)).map(({ name, className, due, status }) => ({ name, className, due, status })),
    customColumns: columns, customRows: rows, rows };
}
