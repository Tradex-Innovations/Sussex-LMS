import { academicScope } from "./academic-scope.js";
import { visibleStudents } from "./access.js";
import { demoDate } from "./chairman-data.js";
import { sectionDefaults, sectionFilters, sectionCourses, sectionAcademic, sectionAttendance, sectionTeachers, sectionCourseProgress, sectionScope } from "./section-data.js";

export const gradeViews = [
  { id: "summary", name: "Grade Overview", short: "Overview", icon: "school" },
  { id: "academic", name: "Academic & Courses", short: "Academic", icon: "book" },
  { id: "attendance", name: "Attendance", short: "Attendance", icon: "checkCircle" },
  { id: "coordination", name: "Class Coordination", short: "Classes", icon: "users" },
  { id: "reports", name: "Grade Reports", short: "Reports", icon: "file" },
];
export const gradeReportTypes = { brief: "Grade management brief", academic: "Grade academic comparison", attendance: "Grade attendance", teaching: "Grade learning progress" };
export const gradeTaskStatuses = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
export const gradeSupportTypes = { attendance: "Attendance concern", materials: "Lecture materials", cover: "Teaching cover", learning: "Learning support" };
export const gradeClassStatuses = { on_track: "On track", needs_support: "Needs support", completed: "Review completed" };
export const gradeDefaults = () => ({ ...sectionDefaults(), compare: "classes", classStatus: "all" });

export function gradeScope(state, context) { return context?.role === "coordinator" ? academicScope(state, context) : null; }
function requireGrade(state, context) {
  const scope = gradeScope(state, context);
  if (!scope) throw new Error("An appointed Grade Coordinator school and grade are required.");
  return scope;
}
export function gradeFilters(state, context, input = {}) {
  const scope = requireGrade(state, context);
  const filters = sectionFilters(state, context, { ...input, grade: String(scope.grade) });
  return { ...filters, compare: ["classes", "subjects", "teachers"].includes(input.compare) ? input.compare : "classes" };
}
export const gradeCourses = (state, context, filters = {}) => sectionCourses(state, context, gradeFilters(state, context, filters));
export const gradeTeachers = (state, context, filters = {}) => sectionTeachers(state, context, gradeFilters(state, context, filters));
export const gradeAcademic = (state, context, filters = {}) => sectionAcademic(state, context, gradeFilters(state, context, filters));
export const gradeAttendance = (state, context, filters = {}) => sectionAttendance(state, context, gradeFilters(state, context, filters));

export function gradeFollowups(state, context) {
  const scope = requireGrade(state, context);
  return (state.gradeFollowups || []).filter((item) => item.branch === scope.branch.id && item.grade === scope.grade);
}
export function saveGradeFollowup(state, context, input) {
  const scope = requireGrade(state, context), previous = input.id ? gradeFollowups(state, context).find((item) => item.id === input.id) : null;
  if (input.id && !previous) throw new Error("This follow-up is outside your grade.");
  const student = gradeAttendance(state, context).roster.find((item) => item.id === (previous?.student || input.student));
  if (!student) throw new Error("Choose a student from your assigned grade.");
  if (!Object.hasOwn(gradeTaskStatuses, input.status)) throw new Error("Choose a valid follow-up status.");
  if (input.owner !== context.account.id && !gradeTeachers(state, context).some((person) => person.id === input.owner)) throw new Error("Choose an owner serving your grade.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a follow-up note of up to 1,000 characters.");
  if (!/^2026-11-(?:20|2[1-7])$/.test(input.due)) throw new Error("Choose a due date from 20 to 27 Nov 2026.");
  const item = { ...previous, id: previous?.id || "grade-followup-" + crypto.randomUUID(), branch: scope.branch.id, grade: scope.grade,
    student: student.id, name: student.name, admission: student.admission, className: student.className, owner: input.owner, due: input.due, status: input.status,
    notes: [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(previous?.notes || [])].slice(0, 20) };
  state.gradeFollowups = [item, ...(state.gradeFollowups || []).filter((entry) => entry.id !== item.id)];
  return item;
}

export function gradeClassUpdates(state, context) {
  const scope = requireGrade(state, context);
  return (state.gradeClassUpdates || []).filter((item) => item.branch === scope.branch.id && item.grade === scope.grade);
}
export function saveGradeClassUpdate(state, context, input) {
  const scope = requireGrade(state, context);
  if (![scope.grade + "A", scope.grade + "B"].includes(input.className) || scope.grade === 0) throw new Error("Choose a class from your grade.");
  if (!Object.hasOwn(gradeClassStatuses, input.status)) throw new Error("Choose a valid class review status.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a class coordination note.");
  const previous = gradeClassUpdates(state, context).find((item) => item.className === input.className);
  const item = { branch: scope.branch.id, grade: scope.grade, className: input.className, status: input.status,
    notes: [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(previous?.notes || [])].slice(0, 20) };
  state.gradeClassUpdates = [item, ...(state.gradeClassUpdates || []).filter((entry) => !(entry.branch === scope.branch.id && entry.grade === scope.grade && entry.className === item.className))];
  return item;
}

export function gradeSupportRequests(state, context) {
  const scope = requireGrade(state, context);
  return (state.gradeSupportRequests || []).filter((item) => item.branch === scope.branch.id && item.grade === scope.grade);
}
export function requestGradeSupport(state, context, input) {
  const scope = requireGrade(state, context), course = gradeCourses(state, context).find((item) => item.id === input.course);
  if (!course) throw new Error("Choose a course from your assigned grade.");
  if (!Object.hasOwn(gradeSupportTypes, input.type)) throw new Error("Choose a support request type.");
  if (gradeSupportRequests(state, context).some((item) => item.course === course.id && item.type === input.type && item.status !== "resolved")) throw new Error("An open support request already exists for this course and topic.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a support request note for the Section Head.");
  const item = { id: "grade-support-" + crypto.randomUUID(), branch: scope.branch.id, grade: scope.grade, section: scope.section.id,
    course: course.id, title: course.title, className: course.className, type: input.type, note, status: "open", by: context.account.name, at: new Date().toISOString(), responses: [] };
  state.gradeSupportRequests = [item, ...(state.gradeSupportRequests || [])];
  return item;
}

export function sectionGradeRequests(state, context) {
  const scope = sectionScope(state, context);
  if (!scope) return [];
  return (state.gradeSupportRequests || []).filter((item) => item.branch === scope.branch.id && item.section === scope.section.id && scope.grades.includes(item.grade) &&
    state.courses.some((course) => course.id === item.course && course.branch === scope.branch.id && course.grade === item.grade));
}
export function respondGradeSupport(state, context, input) {
  const request = sectionGradeRequests(state, context).find((item) => item.id === input.id);
  if (!request) throw new Error("Choose a Grade Coordinator request from your section.");
  if (!["in_progress", "resolved"].includes(input.status)) throw new Error("Choose an in-progress or resolved response.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a response for the Grade Coordinator.");
  request.status = input.status;
  request.responses = [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(request.responses || [])].slice(0, 20);
  return request;
}

export function gradeOverview(state, context) {
  const scope = requireGrade(state, context), courses = gradeCourses(state, context), progress = courses.map((course) => sectionCourseProgress(state, course));
  return { scope, courses, teachers: gradeTeachers(state, context), academic: gradeAcademic(state, context), attendance: gradeAttendance(state, context),
    registered: visibleStudents(state, scope.context).length, materials: progress.reduce((sum, row) => sum + row.materials, 0),
    completed: progress.reduce((sum, row) => sum + row.completed, 0), expected: progress.reduce((sum, row) => sum + row.expected, 0),
    missing: progress.filter((row) => !row.materials).length, followups: gradeFollowups(state, context), requests: gradeSupportRequests(state, context), updates: gradeClassUpdates(state, context) };
}

export function visibleGradeReports(state, context) {
  const scope = gradeScope(state, context);
  if (!scope) return [];
  return (state.gradeReports || []).filter((report) => report.owner?.role === "coordinator" && report.owner.key === scope.key && report.criteria.scope.length === 1 && report.criteria.scope[0] === scope.branch.id &&
    report.criteria.grades.length === 1 && report.criteria.grades[0] === scope.grade && (report.criteria.className === "all" || [scope.grade + "A", scope.grade + "B"].includes(report.criteria.className)));
}
export function generateGradeReport(state, context, input = {}) {
  const scope = requireGrade(state, context), f = gradeFilters(state, context, input);
  if (input.grade !== undefined && Number(input.grade) !== scope.grade) throw new Error("Reports must stay within your assigned grade.");
  if (input.className && input.className !== "all" && ![scope.grade + "A", scope.grade + "B"].includes(input.className)) throw new Error("Reports must use a class within your assigned grade.");
  if (!Object.hasOwn(gradeReportTypes, f.reportType)) throw new Error("Choose a grade report type.");
  const academic = gradeAcademic(state, context, f), attendance = gradeAttendance(state, context, f), courses = gradeCourses(state, context, f), teachers = gradeTeachers(state, context, f);
  const updates = gradeClassUpdates(state, context);
  let rows, columns;
  if (f.reportType === "academic") {
    rows = academic.rows.map((row) => ({ name: row.name, detail: row.detail || "", mean: row.mean, passRate: row.passRate, count: row.count }));
    columns = [["name", f.compare === "classes" ? "Class" : f.compare === "teachers" ? "Assigned teacher" : "Subject"], ["detail", "Teaching detail"], ["mean", "Average mark %"], ["passRate", "Pass rate %"], ["count", "Sample assessed"]];
  } else if (f.reportType === "attendance") {
    rows = attendance.classes.map((row) => ({ className: row.className, rate: row.rate, expected: row.expected, present: row.present, absent: row.absent, late: row.late }));
    columns = [["className", "Class"], ["rate", "Attendance %"], ["expected", "Expected attendance-days"], ["present", "Present attendance-days"], ["absent", "Absent attendance-days"], ["late", "Late arrivals"]];
  } else if (f.reportType === "teaching") {
    rows = courses.map((course) => ({ title: course.title, className: course.className, ...sectionCourseProgress(state, course), review: state.sectionCourseReviews?.[course.id]?.status || "Not reviewed" }));
    columns = [["title", "Course"], ["className", "Class"], ["teacher", "Assigned teacher"], ["enrolled", "Course enrolment"], ["materials", "Materials"], ["completed", "Completed material assignments"], ["expected", "Expected material assignments"], ["review", "Section Head review"]];
  } else {
    rows = attendance.classes.map((row) => {
      const score = academic.classes.find((item) => item.className === row.className), classCourses = courses.filter((course) => course.className === row.className);
      return { className: row.className, academic: score?.count ? score.mean : "No sample data", attendance: row.rate, courses: classCourses.length,
        materials: classCourses.reduce((sum, course) => sum + sectionCourseProgress(state, course).materials, 0), checkin: gradeClassStatuses[updates.find((item) => item.className === row.className)?.status] || "Not reviewed" };
    });
    columns = [["className", "Class"], ["academic", "Sample subject average %"], ["attendance", "Sample attendance %"], ["courses", "Prototype courses"], ["materials", "Published materials"], ["checkin", "Class coordination"]];
  }
  const followups = gradeFollowups(state, context).filter((item) => f.className === "all" || item.className === f.className).map(({ name, className, due, status }) => ({ name, className, due, status }));
  return { id: "grade-report-" + crypto.randomUUID(), title: gradeReportTypes[f.reportType], type: f.reportType, sample: true, generatedAt: new Date().toISOString(),
    owner: { key: scope.key, role: "coordinator", name: context.account.name, school: scope.branch.school, grade: scope.grade, sectionName: scope.section.name },
    criteria: { scope: [scope.branch.id], section: scope.section.id, sectionName: scope.section.name, grade: scope.grade, grades: [scope.grade], className: f.className, subject: f.subject,
      term: f.term, comparison: f.compare, date: f.date, from: attendance.dates[0], to: attendance.dates.at(-1), period: f.period, schoolDays: attendance.dates.length, audience: "students" },
    summary: { academic: academic.summary, attendance: attendance.summary, courses: courses.length, teachers: teachers.length, pending: followups.filter((item) => item.status !== "resolved").length },
    followups, customRows: rows, customColumns: columns, rows };
}
