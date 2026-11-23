import { recordContext } from "./records.js";
import { branchTeachers } from "./access.js";

export const adminViews = [
  { id: "summary", name: "Administration Overview", short: "Overview", icon: "school" },
  { id: "students", name: "Admissions & Students", short: "Students", icon: "users" },
  { id: "guardians", name: "Guardians & Access", short: "Guardians", icon: "badge" },
  { id: "courses", name: "Subjects & Enrolment", short: "Subjects", icon: "book" },
  { id: "reports", name: "Administration Reports", short: "Reports", icon: "file" },
];
export const adminReportTypes = { brief: "Administration summary", students: "Student admission register", guardians: "Guardian access directory", courses: "Subject enrolment register" };
export const adminStudentStatuses = { all: "All student records", missing_guardian: "No valid guardian linked", no_courses: "No subject enrolment" };
export const adminGuardianStatuses = { all: "All guardian accounts", linked: "With linked students", unlinked: "No linked students" };
export const adminCourseStatuses = { all: "All school subjects", unassigned: "No eligible teacher", no_students: "No enrolled students", no_materials: "No materials published" };
export const adminDefaults = () => ({ grade: "all", className: "all", query: "", studentStatus: "all", guardianStatus: "all", courseStatus: "all", page: 1, reportType: "brief", reportId: "", reportFormat: "csv" });
export function adminScope(state, context) {
  if (context?.role !== "admin" || context.grant?.role !== "admin") return null;
  try { const normalized = recordContext(state, context), branch = state.branches.find((branch) => branch.id === normalized.branch); return branch ? { context: normalized, branch, key: "admin:" + branch.id } : null; } catch { return null; }
}
function requireAdmin(state, context) { const scope = adminScope(state, context); if (!scope) throw new Error("An active School Administrator appointment is required."); return scope; }
export function adminClasses(state, context, grade = "all") {
  const scope = requireAdmin(state, context);
  return [...new Set([...state.students, ...state.courses].filter((item) => item.branch === scope.branch.id && (grade === "all" || item.grade === Number(grade))).map((item) => item.className))].sort((a,b) => a.localeCompare(b, undefined, { numeric: true }));
}
export function adminFilters(state, context, input = {}) {
  const grade = input.grade !== "all" && /^\d+$/.test(String(input.grade)) && Number(input.grade) <= 13 ? String(Number(input.grade)) : "all";
  return { grade, className: adminClasses(state, context, grade).includes(input.className) ? input.className : "all", query: String(input.query || "").slice(0, 80),
    studentStatus: Object.hasOwn(adminStudentStatuses, input.studentStatus) ? input.studentStatus : "all", guardianStatus: Object.hasOwn(adminGuardianStatuses, input.guardianStatus) ? input.guardianStatus : "all", courseStatus: Object.hasOwn(adminCourseStatuses, input.courseStatus) ? input.courseStatus : "all",
    page: Number.isInteger(Number(input.page)) && Number(input.page) > 0 ? Number(input.page) : 1, reportType: Object.hasOwn(adminReportTypes, input.reportType) ? input.reportType : "brief", reportFormat: input.reportFormat === "html" ? "html" : "csv", reportId: String(input.reportId || "") };
}
const matchesClass = (item, f) => (f.grade === "all" || item.grade === Number(f.grade)) && (f.className === "all" || item.className === f.className);
export function adminGuardianAccounts(state, context) {
  const scope = requireAdmin(state, context);
  return state.accounts.filter((person) => person.grants.some((grant) => grant.role === "parent" && grant.branch === scope.branch.id));
}
export function adminStudentDetail(state, context, student) {
  const scope = requireAdmin(state, context);
  student = state.students.find((item) => item.id === student.id && item.branch === scope.branch.id);
  if (!student) throw new Error("Choose an admission record from your school.");
  const guardians = adminGuardianAccounts(state, context).filter((person) => student.guardians.includes(person.id));
  const courses = state.courses.filter((course) => course.branch === scope.branch.id && course.grade === student.grade && course.className === student.className && state.assignments[course.id]?.students.includes(student.id));
  const materials = state.materials.filter((item) => courses.some((course) => course.id === item.course));
  return { student, guardians, courses, materials: materials.length, completed: materials.filter((item) => state.completed[student.id]?.includes(item.id)).length, loginReady: Boolean(guardians.length) };
}
export function adminStudents(state, context, input = {}) {
  const scope = requireAdmin(state, context), f = adminFilters(state, context, input), query = f.query.trim().toLowerCase();
  return state.students.filter((student) => student.branch === scope.branch.id && matchesClass(student, f)).map((student) => adminStudentDetail(state, context, student)).filter((row) =>
    (f.studentStatus === "all" || f.studentStatus === "missing_guardian" && !row.guardians.length || f.studentStatus === "no_courses" && !row.courses.length) &&
    (!query || [row.student.name, row.student.admissionNumber, row.student.className, ...row.guardians.map((person) => person.name)].join(" ").toLowerCase().includes(query)));
}
export function adminGuardians(state, context, input = {}) {
  const scope = requireAdmin(state, context), f = adminFilters(state, context, input), query = f.query.trim().toLowerCase();
  return adminGuardianAccounts(state, context).map((person) => ({ person, students: state.students.filter((student) => student.branch === scope.branch.id && student.guardians.includes(person.id) && matchesClass(student, f)) })).filter((row) =>
    ((f.grade === "all" && f.className === "all") || row.students.length) && (f.guardianStatus === "all" || f.guardianStatus === "linked" && row.students.length || f.guardianStatus === "unlinked" && !row.students.length) &&
    (!query || [row.person.name, ...row.students.flatMap((student) => [student.name, student.admissionNumber, student.className])].join(" ").toLowerCase().includes(query)));
}
export function adminCourseDetail(state, context, course) {
  const scope = requireAdmin(state, context);
  course = state.courses.find((item) => item.id === course.id && item.branch === scope.branch.id);
  if (!course) throw new Error("Choose a subject from your appointed school.");
  const assignment = state.assignments[course.id], teacher = branchTeachers(state, scope.branch.id).find((person) => person.id === assignment.teacher);
  const students = state.students.filter((student) => student.branch === course.branch && student.grade === course.grade && student.className === course.className && assignment.students.includes(student.id));
  const materials = state.materials.filter((item) => item.course === course.id);
  return { course, teacher, students, materials: materials.length, expected: materials.length * students.length, completed: students.reduce((total, student) => total + materials.filter((item) => state.completed[student.id]?.includes(item.id)).length, 0) };
}
export function adminCourses(state, context, input = {}) {
  const scope = requireAdmin(state, context), f = adminFilters(state, context, input), query = f.query.trim().toLowerCase();
  return state.courses.filter((course) => course.branch === scope.branch.id && matchesClass(course, f)).map((course) => adminCourseDetail(state, context, course)).filter((row) =>
    (f.courseStatus === "all" || f.courseStatus === "unassigned" && !row.teacher || f.courseStatus === "no_students" && !row.students.length || f.courseStatus === "no_materials" && !row.materials) &&
    (!query || [row.course.title, row.course.code, row.course.className, row.teacher?.name].join(" ").toLowerCase().includes(query)));
}
export function adminOverview(state, context) {
  const scope = requireAdmin(state, context), students = adminStudents(state, context), guardians = adminGuardians(state, context), courses = adminCourses(state, context);
  const classes = adminClasses(state, context).map((className) => { const rows = students.filter((row) => row.student.className === className); return { className, students: rows.length, guardians: rows.filter((row) => row.loginReady).length, enrolled: rows.filter((row) => row.courses.length).length, courses: courses.filter((row) => row.course.className === className).length }; });
  const activity = (state.activity || []).filter((item) => item.branch === scope.branch.id && ["Student record updated.", "New student added.", "Subject assignments updated."].includes(item.message)).slice(0, 8);
  return { scope, students, guardians, courses, classes, missingGuardians: students.filter((row) => !row.loginReady).length, noCourses: students.filter((row) => !row.courses.length).length, unassigned: courses.filter((row) => !row.teacher).length, activity };
}
export function visibleAdminReports(state, context) {
  const scope = adminScope(state, context);
  return scope ? (state.adminReports || []).filter((report) => report.owner?.role === "admin" && report.owner.key === scope.key && report.criteria.scope.length === 1 && report.criteria.scope[0] === scope.branch.id &&
    report.criteria.studentIds.every((id) => state.students.some((student) => student.id === id && student.branch === scope.branch.id)) && report.criteria.courseIds.every((id) => state.courses.some((course) => course.id === id && course.branch === scope.branch.id))) : [];
}
export function generateAdminReport(state, context, input = {}) {
  const scope = requireAdmin(state, context), f = adminFilters(state, context, input);
  if (input.reportType && !Object.hasOwn(adminReportTypes, input.reportType)) throw new Error("Choose an administration report type.");
  const criteria = { grade: f.grade, className: f.className, query: f.reportType === "brief" ? "" : f.query, studentStatus: f.reportType === "students" ? f.studentStatus : "all", guardianStatus: f.reportType === "guardians" ? f.guardianStatus : "all", courseStatus: f.reportType === "courses" ? f.courseStatus : "all" };
  const base = { grade: f.grade, className: f.className };
  let students = adminStudents(state, context, f.reportType === "students" ? criteria : base), guardians = adminGuardians(state, context, f.reportType === "guardians" ? criteria : base), courses = adminCourses(state, context, f.reportType === "courses" ? criteria : base);
  if (f.reportType === "guardians") {
    const ids = new Set(guardians.flatMap((row) => row.students.map((student) => student.id)));
    students = students.filter((row) => ids.has(row.student.id));
  } else if (f.reportType === "courses") {
    const ids = new Set(courses.flatMap((row) => row.students.map((student) => student.id)));
    students = students.filter((row) => ids.has(row.student.id));
  }
  if (f.reportType !== "brief") {
    if (f.reportType !== "guardians") {
      const ids = new Set(students.flatMap((row) => row.guardians.map((person) => person.id)));
      guardians = guardians.filter((row) => ids.has(row.person.id));
    }
    if (f.reportType !== "courses") {
      const ids = new Set(students.flatMap((row) => row.courses.map((course) => course.id)));
      courses = courses.filter((row) => ids.has(row.course.id));
    }
  }
  const labels = { brief: [["className", "Class"], ["students", "Admission records"], ["guardians", "With guardian access"], ["enrolled", "With subject enrolment"], ["courses", "School subjects"]],
    students: [["name", "Student"], ["admission", "Admission number"], ["className", "Class"], ["guardians", "Linked guardians"], ["courses", "Enrolled subjects"], ["completed", "Materials done"], ["materials", "Materials assigned"]],
    guardians: [["guardian", "Guardian account"], ["name", "Linked student"], ["admission", "Admission number"], ["className", "Class"], ["access", "Parent demo access"]],
    courses: [["title", "Subject"], ["code", "Code"], ["className", "Class"], ["teacher", "Assigned teacher"], ["students", "Matching-class enrolment"], ["materials", "Published materials"], ["completed", "Materials done"], ["expected", "Material assignments"]] };
  let rows;
  if (f.reportType === "students") rows = students.map((row) => ({ name: row.student.name, admission: row.student.admissionNumber, className: row.student.className, guardians: row.guardians.map((person) => person.name).join("; ") || "None linked", courses: row.courses.length, completed: row.completed, materials: row.materials }));
  else if (f.reportType === "guardians") rows = guardians.flatMap((row) => row.students.length ? row.students.map((student) => ({ guardian: row.person.name, name: student.name, admission: student.admissionNumber, className: student.className, access: "Admission login linked" })) : [{ guardian: row.person.name, name: "No linked student", access: "Awaiting student link" }]);
  else if (f.reportType === "courses") rows = courses.map((row) => ({ title: row.course.title, code: row.course.code, className: row.course.className, teacher: row.teacher?.name || "No eligible teacher", students: row.students.length, materials: row.materials, completed: row.completed, expected: row.expected }));
  else rows = adminClasses(state, context, f.grade).filter((className) => f.className === "all" || className === f.className).map((className) => { const entries = students.filter((row) => row.student.className === className); return { className, students: entries.length, guardians: entries.filter((row) => row.loginReady).length, enrolled: entries.filter((row) => row.courses.length).length, courses: courses.filter((row) => row.course.className === className).length }; });
  const generatedAt = new Date().toISOString(), date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(generatedAt));
  return { id: "admin-report-" + crypto.randomUUID(), title: adminReportTypes[f.reportType], type: f.reportType, generatedAt, owner: { role: "admin", key: scope.key, school: scope.branch.school, by: scope.context.account.name },
    criteria: { ...criteria, from: date, to: date, scope: [scope.branch.id], studentIds: students.map((row) => row.student.id), courseIds: courses.map((row) => row.course.id) },
    summary: { students: students.length, guardians: guardians.length, courses: courses.length, ready: students.filter((row) => row.loginReady).length }, customColumns: labels[f.reportType], customRows: rows };
}
