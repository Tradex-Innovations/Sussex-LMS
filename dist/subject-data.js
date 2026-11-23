import { visibleCourses } from "./access.js";
import { gradeScope } from "./grade-data.js";

export const subjectViews = [
  { id: "summary", name: "Subject Overview", short: "Overview", icon: "school" },
  { id: "teaching", name: "Teaching & Materials", short: "Teaching", icon: "book" },
  { id: "progress", name: "Student Progress", short: "Progress", icon: "checkCircle" },
  { id: "support", name: "Teaching Support", short: "Support", icon: "users" },
  { id: "reports", name: "Subject Reports", short: "Reports", icon: "file" },
];
export const subjectReportTypes = { brief: "Teaching summary", materials: "Subject materials register", progress: "Student learning progress", plans: "Lesson plan register" };
export const subjectPlanStatuses = { planned: "Planned", in_progress: "In progress", completed: "Completed" };
export const subjectReviewStatuses = { on_track: "On track", needs_practice: "Needs practice", reviewed: "Reviewed" };
export const subjectSupportTypes = { learning: "Learning support", materials: "Lecture materials", attendance: "Attendance concern", cover: "Teaching cover" };
export const subjectDefaults = () => ({ course: "all", query: "", review: "all", planStatus: "all", reportType: "brief", reportFormat: "csv", reportId: "" });
export function subjectScope(state, context) {
  if (context?.role !== "teacher" || context.grant?.role !== "teacher") return null;
  const account = state.accounts.find((person) => person.id === context.account?.id);
  const grant = account?.grants.find((item) => item.role === "teacher" && item.branch === context.grant.branch);
  const branch = state.branches.find((item) => item.id === grant?.branch);
  if (!branch) return null;
  const normalized = { ...context, account, grant, branch: branch.id };
  return { branch, account, context: normalized, key: "teacher:" + branch.id + ":" + account.id,
    courses: visibleCourses(state, normalized).filter((course) => state.assignments[course.id]?.teacher === account.id) };
}
function requireSubject(state, context) {
  const scope = subjectScope(state, context);
  if (!scope) throw new Error("An active Subject Teacher appointment is required.");
  return scope;
}
export function subjectFilters(state, context, input = {}) {
  const scope = requireSubject(state, context), defaults = subjectDefaults();
  return { course: scope.courses.some((course) => course.id === input.course) ? input.course : "all", query: String(input.query || "").slice(0, 80),
    review: ["all", "unreviewed"].includes(input.review) || Object.hasOwn(subjectReviewStatuses, input.review) ? input.review : "all",
    planStatus: input.planStatus === "all" || Object.hasOwn(subjectPlanStatuses, input.planStatus) ? input.planStatus : "all",
    reportType: Object.hasOwn(subjectReportTypes, input.reportType) ? input.reportType : defaults.reportType,
    reportFormat: input.reportFormat === "html" ? "html" : "csv", reportId: String(input.reportId || "") };
}
export function subjectCourses(state, context, input = {}) {
  const scope = requireSubject(state, context), f = subjectFilters(state, context, input);
  return scope.courses.filter((course) => f.course === "all" || course.id === f.course);
}
export function courseLearningReview(state, course, student) {
  return (state.subjectLearningReviews || []).find((item) => item.course === course && item.student === student);
}
export function subjectEnrolments(state, context, input = {}) {
  const f = subjectFilters(state, context, input), query = f.query.trim().toLowerCase();
  return subjectCourses(state, context, f).flatMap((course) => {
    const materials = state.materials.filter((item) => item.course === course.id);
    return state.students.filter((student) => student.branch === course.branch && student.grade === course.grade && student.className === course.className && state.assignments[course.id].students.includes(student.id)).map((student) => {
      const review = courseLearningReview(state, course.id, student.id);
      return { course, student, review, materials: materials.length, completed: materials.filter((item) => state.completed[student.id]?.includes(item.id)).length };
    });
  }).filter((row) => (f.review === "all" || row.review?.status === f.review || f.review === "unreviewed" && !row.review) &&
    (!query || [row.student.name, row.student.admissionNumber, row.course.title, row.course.className].join(" ").toLowerCase().includes(query)));
}
export function subjectCourseProgress(state, context, course) {
  if (!requireSubject(state, context).courses.some((item) => item.id === course.id)) throw new Error("Choose an assigned teaching subject.");
  const rows = subjectEnrolments(state, context, { course: course.id });
  const materials = state.materials.filter((item) => item.course === course.id).length;
  return { enrolled: rows.length, materials, completed: rows.reduce((sum, row) => sum + row.completed, 0), expected: rows.length * materials };
}
export function subjectPlans(state, context, input = {}) {
  const ids = new Set(subjectCourses(state, context, input).map((course) => course.id)), f = subjectFilters(state, context, input);
  return (state.subjectLessonPlans || []).filter((item) => ids.has(item.course) && (f.planStatus === "all" || item.status === f.planStatus));
}
function ownedCourse(state, context, id) {
  const course = requireSubject(state, context).courses.find((course) => course.id === id);
  if (!course) throw new Error("Choose a subject currently assigned to you.");
  return course;
}
function noteText(value) {
  const text = String(value || "").trim();
  if (!text || text.length > 1000) throw new Error("Enter a note of up to 1,000 characters.");
  return text;
}
export function saveSubjectPlan(state, context, input) {
  const previous = input.id ? subjectPlans(state, context).find((item) => item.id === input.id) : null;
  if (input.id && !previous) throw new Error("This lesson plan is outside your teaching subjects.");
  const course = ownedCourse(state, context, previous?.course || input.course), topic = String(input.topic || "").trim(), note = noteText(input.note);
  if (!topic || topic.length > 120) throw new Error("Enter a lesson topic of up to 120 characters.");
  if (!/^2026-11-(?:20|2[1-7])$/.test(input.date)) throw new Error("Choose a lesson date from 20 to 27 Nov 2026.");
  if (!Object.hasOwn(subjectPlanStatuses, input.status)) throw new Error("Choose a valid lesson plan status.");
  const item = { id: previous?.id || "subject-plan-" + crypto.randomUUID(), course: course.id, branch: course.branch, topic, date: input.date, status: input.status,
    notes: [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(previous?.notes || [])].slice(0, 20) };
  state.subjectLessonPlans = [item, ...(state.subjectLessonPlans || []).filter((entry) => entry.id !== item.id)];
  return item;
}
export function saveSubjectReview(state, context, input) {
  ownedCourse(state, context, input.course);
  const row = subjectEnrolments(state, context, { course: input.course }).find((row) => row.student.id === input.student);
  if (!row) throw new Error("Choose a student currently enrolled in your assigned subject and class.");
  if (!Object.hasOwn(subjectReviewStatuses, input.status)) throw new Error("Choose a learning review status.");
  const note = noteText(input.note), previous = row.review;
  const item = { course: row.course.id, student: row.student.id, branch: row.course.branch, status: input.status,
    notes: [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(previous?.notes || [])].slice(0, 20) };
  state.subjectLearningReviews = [item, ...(state.subjectLearningReviews || []).filter((entry) => entry.course !== item.course || entry.student !== item.student)];
  return item;
}
export function subjectSupportRequests(state, context, input = {}) {
  const ids = new Set(subjectCourses(state, context, input).map((course) => course.id));
  return (state.subjectSupportRequests || []).filter((item) => ids.has(item.course));
}
export function requestSubjectSupport(state, context, input) {
  const course = ownedCourse(state, context, input.course);
  if (!Object.hasOwn(subjectSupportTypes, input.type)) throw new Error("Choose a support topic.");
  if (subjectSupportRequests(state, context).some((item) => item.course === course.id && item.type === input.type && item.status !== "resolved")) throw new Error("An open request already exists for this subject and topic.");
  const item = { id: "subject-support-" + crypto.randomUUID(), course: course.id, branch: course.branch, grade: course.grade, className: course.className,
    title: course.title, type: input.type, note: noteText(input.note), status: "open", by: context.account.name, at: new Date().toISOString(), responses: [] };
  state.subjectSupportRequests = [item, ...(state.subjectSupportRequests || [])];
  return item;
}
export function gradeSubjectRequests(state, context) {
  const scope = gradeScope(state, context);
  if (!scope) return [];
  return (state.subjectSupportRequests || []).filter((item) => item.branch === scope.branch.id && item.grade === scope.grade &&
    state.courses.some((course) => course.id === item.course && course.branch === scope.branch.id && course.grade === scope.grade && course.className === item.className));
}
export function respondSubjectSupport(state, context, input) {
  const item = gradeSubjectRequests(state, context).find((item) => item.id === input.id);
  if (!item) throw new Error("Choose a Subject Teacher request from your appointed school and grade.");
  if (!["in_progress", "resolved"].includes(input.status)) throw new Error("Choose an in-progress or resolved response.");
  const note = noteText(input.note);
  item.status = input.status;
  item.responses = [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(item.responses || [])].slice(0, 20);
  return item;
}
export function subjectOverview(state, context, filters = {}) {
  const scope = requireSubject(state, context), courses = subjectCourses(state, context, filters), rows = subjectEnrolments(state, context, { course: filters.course });
  const expected = rows.reduce((sum, row) => sum + row.materials, 0), completed = rows.reduce((sum, row) => sum + row.completed, 0);
  return { scope, courses, students: new Set(rows.map((row) => row.student.id)).size, enrolments: rows.length,
    materials: state.materials.filter((item) => courses.some((course) => course.id === item.course)).length, expected, completed,
    completion: expected ? Math.round(completed / expected * 1000) / 10 : null,
    needsPractice: rows.filter((row) => row.review?.status === "needs_practice").length,
    plans: subjectPlans(state, context, { course: filters.course }), requests: subjectSupportRequests(state, context, { course: filters.course }) };
}
export function visibleSubjectReports(state, context) {
  const scope = subjectScope(state, context);
  if (!scope) return [];
  const ids = new Set(scope.courses.map((course) => course.id)), pairs = new Set(subjectEnrolments(state, context).map((row) => row.course.id + ":" + row.student.id));
  return (state.subjectReports || []).filter((report) => report.owner?.role === "teacher" && report.owner.key === scope.key &&
    report.criteria.scope.length === 1 && report.criteria.scope[0] === scope.branch.id && report.criteria.courseIds.every((id) => ids.has(id)) &&
    report.criteria.enrolments.every((pair) => pairs.has(pair.course + ":" + pair.student)));
}
export function generateSubjectReport(state, context, input = {}) {
  const scope = requireSubject(state, context), f = subjectFilters(state, context, input);
  if (input.course && input.course !== "all" && !scope.courses.some((course) => course.id === input.course)) throw new Error("Reports must stay within your assigned teaching subjects.");
  if (input.reportType && !Object.hasOwn(subjectReportTypes, input.reportType)) throw new Error("Choose a valid subject report type.");
  const courses = subjectCourses(state, context, f), data = subjectOverview(state, context, f);
  let rows, columns;
  if (f.reportType === "progress") {
    rows = subjectEnrolments(state, context, f).map((row) => ({ course: row.course.title, className: row.course.className, student: row.student.name, admission: row.student.admissionNumber, completed: row.completed, materials: row.materials, review: subjectReviewStatuses[row.review?.status] || "Not reviewed" }));
    columns = [["course", "Subject"], ["className", "Class"], ["student", "Student"], ["admission", "Admission number"], ["completed", "Materials done"], ["materials", "Materials assigned"], ["review", "Staff learning review"]];
  } else if (f.reportType === "plans") {
    rows = subjectPlans(state, context, f).map((item) => ({ course: courses.find((course) => course.id === item.course).title, className: courses.find((course) => course.id === item.course).className, topic: item.topic, date: item.date, status: subjectPlanStatuses[item.status] }));
    columns = [["course", "Subject"], ["className", "Class"], ["topic", "Lesson topic"], ["date", "Planned date"], ["status", "Plan status"]];
  } else if (f.reportType === "materials") {
    rows = courses.flatMap((course) => state.materials.filter((item) => item.course === course.id).map((item) => ({ course: course.title, className: course.className, title: item.title, type: item.type, date: item.date })));
    columns = [["course", "Subject"], ["className", "Class"], ["title", "Material"], ["type", "Type"], ["date", "Published label"]];
  } else {
    rows = courses.map((course) => ({ course: course.title, className: course.className, ...subjectCourseProgress(state, context, course), plans: subjectPlans(state, context, { course: course.id }).length, openRequests: subjectSupportRequests(state, context, { course: course.id }).filter((item) => item.status !== "resolved").length }));
    columns = [["course", "Subject"], ["className", "Class"], ["enrolled", "Enrolled students"], ["materials", "Published materials"], ["completed", "Completed material assignments"], ["expected", "Expected material assignments"], ["plans", "Lesson plans"], ["openRequests", "Open support requests"]];
  }
  const generatedAt = new Date().toISOString(), date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(generatedAt));
  return { id: "subject-report-" + crypto.randomUUID(), type: f.reportType, title: subjectReportTypes[f.reportType], generatedAt,
    owner: { role: "teacher", key: scope.key, school: scope.branch.school, teacher: scope.account.name },
    criteria: { from: date, to: date, scope: [scope.branch.id], courseIds: courses.map((course) => course.id), courseLabels: courses.map((course) => course.title + " / " + course.className),
      enrolments: subjectEnrolments(state, context, { course: f.course }).map((row) => ({ course: row.course.id, student: row.student.id })),
      query: f.reportType === "progress" ? f.query : "", review: f.reportType === "progress" ? f.review : "all", planStatus: f.reportType === "plans" ? f.planStatus : "all" },
    summary: { courses: courses.length, students: data.students, materials: data.materials, expected: data.expected, completed: data.completed }, customColumns: columns, customRows: rows };
}
