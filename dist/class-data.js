import { academicScope } from "./academic-scope.js";
import { can, visibleStudents } from "./access.js";
import { demoDate, schoolDays, studentStatus } from "./chairman-data.js";
import { sectionDefaults, sectionFilters, sectionCourses, sectionAcademic, sectionAttendance, sectionCourseProgress } from "./section-data.js";
import { gradeScope } from "./grade-data.js";

export const classViews = [
  { id: "summary", name: "Class Overview", short: "Overview", icon: "school" },
  { id: "learning", name: "Subjects & Materials", short: "Subjects", icon: "book" },
  { id: "attendance", name: "Attendance", short: "Attendance", icon: "checkCircle" },
  { id: "support", name: "Student Support", short: "Support", icon: "users" },
  { id: "reports", name: "Class Reports", short: "Reports", icon: "file" },
];
export const classReportTypes = { brief: "Class management brief", academic: "Class subject comparison", attendance: "Class attendance register", teaching: "Class learning progress" };
export const classTaskStatuses = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
export const classSupportTypes = { attendance: "Attendance concern", learning: "Learning support", materials: "Lecture materials", cover: "Teaching cover" };
export const classAttendanceStatuses = { present: "Present", absent: "Absent", late: "Late" };
export const classDefaults = () => ({ ...sectionDefaults(), compare: "subjects" });
export function classScope(state, context) { return context?.role === "class_teacher" ? academicScope(state, context) : null; }
function requireClass(state, context) {
  const scope = classScope(state, context);
  if (!scope) throw new Error("An appointed Class Teacher school, grade and class are required.");
  return scope;
}
export function classFilters(state, context, input = {}) {
  const scope = requireClass(state, context);
  return { ...sectionFilters(state, context, { ...input, grade: String(scope.grade), className: scope.className }), compare: "subjects" };
}
export const classCourses = (state, context) => sectionCourses(state, context, classFilters(state, context));
export const classAcademic = (state, context, filters = {}) => sectionAcademic(state, context, classFilters(state, context, filters));
export const classStudents = (state, context) => visibleStudents(state, requireClass(state, context).context);

export function classAttendance(state, context, filters = {}) {
  const scope = requireClass(state, context), f = classFilters(state, context, filters), result = sectionAttendance(state, context, f);
  const last = result.dates.at(-1);
  const marked = result.roster.filter((student) => {
    const record = state.classAttendance?.[student.id + ":" + last];
    return record?.branch === scope.branch.id && record.grade === scope.grade && record.className === scope.className && record.date === last && Object.hasOwn(classAttendanceStatuses, record.status);
  }).length;
  return { ...result, marked, last };
}

function validRegisterDate(date) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date || "") && date >= "2026-10-12" && date <= demoDate && !Number.isNaN(Date.parse(date + "T12:00Z")) &&
    new Date(date + "T12:00Z").toISOString().slice(0, 10) === date && schoolDays(date)[0] === date;
}
export function saveClassAttendance(state, context, input) {
  const scope = requireClass(state, context);
  if (!can(context, "attendance.mark")) throw new Error("Class attendance permission is required.");
  if (!validRegisterDate(input.date)) throw new Error("Choose a valid sample school day from 12 Oct to 20 Nov 2026.");
  const roster = classAttendance(state, context, { date: input.date }).roster;
  if (!Array.isArray(input.entries) || !input.entries.length || input.entries.length > roster.length) throw new Error("Choose students from your class register.");
  const seen = new Set();
  const records = input.entries.map((entry) => {
    const student = roster.find((student) => student.id === entry.student);
    if (!student || seen.has(student.id)) throw new Error("Each attendance entry must belong to a different student in your class.");
    if (!Object.hasOwn(classAttendanceStatuses, entry.status)) throw new Error("Choose present, absent or late.");
    seen.add(student.id);
    return { student: student.id, branch: scope.branch.id, grade: scope.grade, className: scope.className, date: input.date,
      status: entry.status, by: context.account.name, at: new Date().toISOString() };
  });
  state.classAttendance ??= {};
  for (const record of records) state.classAttendance[record.student + ":" + record.date] = record;
  return records;
}
export function resetClassAttendance(state, context, date) {
  const scope = requireClass(state, context);
  if (!validRegisterDate(date)) throw new Error("Choose a valid sample school day.");
  for (const [key, record] of Object.entries(state.classAttendance || {})) if (record.branch === scope.branch.id && record.grade === scope.grade && record.className === scope.className && record.date === date) delete state.classAttendance[key];
}

export function classFollowups(state, context) {
  const scope = requireClass(state, context);
  return (state.classFollowups || []).filter((item) => item.branch === scope.branch.id && item.grade === scope.grade && item.className === scope.className);
}
export function saveClassFollowup(state, context, input) {
  const scope = requireClass(state, context), previous = input.id ? classFollowups(state, context).find((item) => item.id === input.id) : null;
  if (input.id && !previous) throw new Error("This follow-up is outside your class.");
  const student = classAttendance(state, context).roster.find((student) => student.id === (previous?.student || input.student));
  if (!student) throw new Error("Choose a student from your class register.");
  if (!Object.hasOwn(classTaskStatuses, input.status)) throw new Error("Choose a valid follow-up status.");
  if (!/^2026-11-(?:20|2[1-7])$/.test(input.due)) throw new Error("Choose a due date from 20 to 27 Nov 2026.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a follow-up note of up to 1,000 characters.");
  const item = { ...previous, id: previous?.id || "class-followup-" + crypto.randomUUID(), branch: scope.branch.id, grade: scope.grade, className: scope.className,
    student: student.id, name: student.name, admission: student.admission, owner: context.account.name, due: input.due, status: input.status,
    notes: [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(previous?.notes || [])].slice(0, 20) };
  state.classFollowups = [item, ...(state.classFollowups || []).filter((entry) => entry.id !== item.id)];
  return item;
}

export function classStudentProgress(state, context, student) {
  if (!classStudents(state, context).some((item) => item.id === student.id)) throw new Error("Choose an actual student from your class.");
  const courses = classCourses(state, context).filter((course) => state.assignments[course.id]?.students.includes(student.id));
  const materials = state.materials.filter((item) => courses.some((course) => course.id === item.course));
  return { courses: courses.length, materials: materials.length, completed: materials.filter((item) => state.completed[student.id]?.includes(item.id)).length };
}
export function classGuardians(state, context, student) {
  const scope = requireClass(state, context);
  if (!classStudents(state, context).some((item) => item.id === student.id)) return [];
  return state.accounts.filter((person) => student.guardians.includes(person.id) && person.grants.some((grant) => grant.role === "parent" && grant.branch === scope.branch.id));
}
export function classDiscussionNotes(state, context) {
  const scope = requireClass(state, context), ids = new Set(classStudents(state, context).map((student) => student.id));
  return (state.classDiscussionNotes || []).filter((item) => item.branch === scope.branch.id && item.grade === scope.grade && item.className === scope.className && ids.has(item.student));
}
export function saveClassDiscussion(state, context, input) {
  const scope = requireClass(state, context), previous = input.id ? classDiscussionNotes(state, context).find((item) => item.id === input.id) : null;
  if (input.id && !previous) throw new Error("This discussion record is outside your class.");
  const student = classStudents(state, context).find((item) => item.id === (previous?.student || input.student));
  if (!student) throw new Error("Choose an actual student from your class.");
  if (input.guardian && !classGuardians(state, context, student).some((person) => person.id === input.guardian)) throw new Error("Choose a guardian linked to this student.");
  if (!["planned", "completed"].includes(input.status)) throw new Error("Choose a planned or completed discussion.");
  if (!/^2026-11-(?:20|2[1-7])$/.test(input.date)) throw new Error("Choose a discussion date from 20 to 27 Nov 2026.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a parent-discussion note.");
  const item = { id: previous?.id || "class-discussion-" + crypto.randomUUID(), branch: scope.branch.id, grade: scope.grade, className: scope.className, student: student.id,
    name: student.name, guardian: input.guardian || "", guardianName: classGuardians(state, context, student).find((person) => person.id === input.guardian)?.name || "No linked guardian selected",
    date: input.date, status: input.status, note, by: context.account.name, at: new Date().toISOString(),
    notes: [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(previous?.notes || [])].slice(0, 20) };
  state.classDiscussionNotes = [item, ...(state.classDiscussionNotes || []).filter((entry) => entry.id !== item.id)];
  return item;
}

export function classSupportRequests(state, context) {
  const scope = requireClass(state, context);
  return (state.classSupportRequests || []).filter((item) => item.branch === scope.branch.id && item.grade === scope.grade && item.className === scope.className);
}
export function requestClassSupport(state, context, input) {
  const scope = requireClass(state, context), course = input.course ? classCourses(state, context).find((item) => item.id === input.course) : null;
  if (input.course && !course) throw new Error("Choose a subject from your class.");
  if (!Object.hasOwn(classSupportTypes, input.type)) throw new Error("Choose a support topic.");
  if (["cover", "materials"].includes(input.type) && !course) throw new Error("Choose a class subject for lecture-material or cover support.");
  if (classSupportRequests(state, context).some((item) => item.type === input.type && item.course === (course?.id || "") && item.status !== "resolved")) throw new Error("An open request already exists for this class/course and topic.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a request note for the Grade Coordinator.");
  const item = { id: "class-support-" + crypto.randomUUID(), branch: scope.branch.id, grade: scope.grade, className: scope.className,
    course: course?.id || "", title: course?.title || "Class " + scope.className, type: input.type, note, status: "open", by: context.account.name, at: new Date().toISOString(), responses: [] };
  state.classSupportRequests = [item, ...(state.classSupportRequests || [])];
  return item;
}
export function gradeClassRequests(state, context) {
  const scope = gradeScope(state, context);
  if (!scope) return [];
  return (state.classSupportRequests || []).filter((item) => item.branch === scope.branch.id && item.grade === scope.grade && new RegExp("^" + scope.grade + "[A-Z]{1,2}$").test(item.className) &&
    (!item.course || state.courses.some((course) => course.id === item.course && course.branch === scope.branch.id && course.grade === scope.grade && course.className === item.className)));
}
export function respondClassSupport(state, context, input) {
  const request = gradeClassRequests(state, context).find((item) => item.id === input.id);
  if (!request) throw new Error("Choose a Class Teacher request from your grade.");
  if (!["in_progress", "resolved"].includes(input.status)) throw new Error("Choose an in-progress or resolved response.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Enter a response for the Class Teacher.");
  request.status = input.status;
  request.responses = [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(request.responses || [])].slice(0, 20);
  return request;
}

export function classOverview(state, context) {
  const scope = requireClass(state, context), courses = classCourses(state, context), progress = courses.map((course) => sectionCourseProgress(state, course));
  return { scope, courses, attendance: classAttendance(state, context), academic: classAcademic(state, context), registered: classStudents(state, context).length,
    materials: progress.reduce((sum, row) => sum + row.materials, 0), completed: progress.reduce((sum, row) => sum + row.completed, 0), expected: progress.reduce((sum, row) => sum + row.expected, 0),
    followups: classFollowups(state, context), requests: classSupportRequests(state, context), discussions: classDiscussionNotes(state, context) };
}

export function visibleClassReports(state, context) {
  const scope = classScope(state, context);
  if (!scope) return [];
  return (state.classReports || []).filter((report) => report.owner?.role === "class_teacher" && report.owner.key === scope.key && report.criteria.scope.length === 1 && report.criteria.scope[0] === scope.branch.id &&
    report.criteria.className === scope.className && report.criteria.grades.length === 1 && report.criteria.grades[0] === scope.grade);
}
export function generateClassReport(state, context, input = {}) {
  const scope = requireClass(state, context), f = classFilters(state, context, input);
  if (input.grade !== undefined && Number(input.grade) !== scope.grade || input.className && input.className !== scope.className) throw new Error("Reports must stay within your assigned class.");
  if (!Object.hasOwn(classReportTypes, f.reportType)) throw new Error("Choose a class report type.");
  const academic = classAcademic(state, context, f), attendance = classAttendance(state, context, { ...f, query: "", flag: "all" }), courses = classCourses(state, context), progress = courses.map((course) => sectionCourseProgress(state, course));
  const followups = classFollowups(state, context).map(({ name, className, due, status }) => ({ name, className, due, status }));
  let rows, columns;
  if (f.reportType === "academic") {
    rows = academic.rows.map((row) => ({ subject: row.name, mean: row.mean, passRate: row.passRate, count: row.count }));
    columns = [["subject", "Subject"], ["mean", "Class average %"], ["passRate", "Pass rate %"], ["count", "Sample assessed"]];
  } else if (f.reportType === "attendance" && f.period === "day") {
    rows = attendance.roster.map((student) => ({ name: student.name, admission: student.admission, className: student.className, date: attendance.last, status: studentStatus(student, attendance.last, state), source: state.classAttendance?.[student.id + ":" + attendance.last] ? "Marked in prototype" : "Generated sample" }));
    columns = [["name", "Sample student"], ["admission", "Sample admission"], ["className", "Class"], ["date", "School day"], ["status", "Attendance"], ["source", "Source"]];
  } else if (f.reportType === "attendance") {
    rows = attendance.classes[0]?.trend.map(({ date, rate, expected, present, absent, late }) => ({ date, rate, expected, present, absent, late })) || [];
    columns = [["date", "School day"], ["rate", "Attendance %"], ["expected", "Expected"], ["present", "Present"], ["absent", "Absent"], ["late", "Late arrivals"]];
  } else if (f.reportType === "teaching") {
    rows = courses.map((course) => ({ title: course.title, className: course.className, ...sectionCourseProgress(state, course), review: state.sectionCourseReviews?.[course.id]?.status || "Not reviewed" }));
    columns = [["title", "Subject"], ["className", "Class"], ["teacher", "Assigned teacher"], ["enrolled", "Subject enrolment"], ["materials", "Materials"], ["completed", "Completed material assignments"], ["expected", "Expected material assignments"], ["review", "Section Head review"]];
  } else {
    rows = [{ className: scope.className, academic: academic.summary.count ? academic.summary.mean : "No sample data", attendance: attendance.summary.expected ? attendance.summary.rate : "No register data",
      registered: classStudents(state, context).length, courses: courses.length, materials: progress.reduce((sum, row) => sum + row.materials, 0), completed: progress.reduce((sum, row) => sum + row.completed, 0), expected: progress.reduce((sum, row) => sum + row.expected, 0), pending: followups.filter((item) => item.status !== "resolved").length }];
    columns = [["className", "Class"], ["academic", "Sample subject average %"], ["attendance", "Sample attendance %"], ["registered", "Actual prototype students"], ["courses", "Subjects"], ["materials", "Materials"], ["completed", "Completed material assignments"], ["expected", "Expected material assignments"], ["pending", "Pending follow-ups"]];
  }
  return { id: "class-report-" + crypto.randomUUID(), title: classReportTypes[f.reportType], type: f.reportType, sample: true, generatedAt: new Date().toISOString(),
    owner: { key: scope.key, role: "class_teacher", name: context.account.name, school: scope.branch.school, grade: scope.grade, className: scope.className, sectionName: scope.section.name },
    criteria: { scope: [scope.branch.id], grades: [scope.grade], grade: scope.grade, className: scope.className, section: scope.section.id, sectionName: scope.section.name,
      subject: f.subject, term: f.term, comparison: "subjects", date: f.date, from: attendance.dates[0], to: attendance.last, period: f.period, schoolDays: attendance.dates.length, audience: "students" },
    summary: { academic: academic.summary, attendance: attendance.summary, courses: courses.length, teachers: new Set(courses.map((course) => state.assignments[course.id]?.teacher).filter(Boolean)).size, marked: attendance.marked },
    followups, customRows: rows, customColumns: columns, rows };
}
