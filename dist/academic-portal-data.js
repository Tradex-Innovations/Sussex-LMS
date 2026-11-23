import { linkedChildren, visibleCourses, withinScope } from "./access.js";
import { recordContext } from "./records.js";

const now = () => new Date().toISOString();
const text = (value, max, label) => { const result = String(value || "").trim(); if (!result || result.length > max) throw new Error(`Enter ${label} of up to ${max} characters.`); return result; };
function active(state, context) { return recordContext(state, context); }
export function academicClassStudents(state, context) {
  const ctx = active(state, context);
  if (ctx.role !== "class_teacher") return [];
  return state.students.filter((student) => withinScope(ctx, student));
}
export function selectedStudentSubjects(state, student) {
  const selection = state.studentSubjects?.[student?.id];
  return selection && selection.branch === student.branch && selection.grade === student.grade && selection.className === student.className ? selection.subjects : [];
}
export function assignStudentSubjects(state, context, input) {
  const ctx = active(state, context), student = academicClassStudents(state, ctx).find((item) => item.id === input.student);
  if (!student) throw new Error("Choose a student in your appointed class.");
  const courses = visibleCourses(state, ctx), ids = input.subjects;
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length || ids.some((id) => !courses.some((course) => course.id === id))) throw new Error("Choose subjects from this student’s school and class.");
  for (const course of courses) {
    const assignment = state.assignments[course.id], others = assignment.students.filter((id) => id !== student.id);
    assignment.students = ids.includes(course.id) ? [...others, student.id] : others;
  }
  state.studentSubjects ||= {};
  state.studentSubjects[student.id] = { branch: student.branch, grade: student.grade, className: student.className, subjects: [...ids], author: ctx.account.id, by: ctx.account.name, source: "class_teacher", at: now() };
  return state.studentSubjects[student.id];
}
function parentStudent(state, ctx, child) {
  const student = linkedChildren(state, ctx).find((item) => item.id === child?.id);
  if (!student) throw new Error("Choose your admission-linked student.");
  return student;
}
export function visibleClassNotices(state, context, child) {
  let ctx; try { ctx = active(state, context); } catch { return []; }
  const scope = ctx.role === "parent" ? linkedChildren(state, ctx).find((item) => item.id === child?.id) : ctx.role === "class_teacher" ? { branch: ctx.branch, ...ctx.grant } : null;
  if (!scope) return [];
  return (state.classNotices || []).filter((item) => item.branch === scope.branch && item.grade === scope.grade && item.className === scope.className && (ctx.role === "class_teacher" || item.status === "published")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
export function saveClassNotice(state, context, input) {
  const ctx = active(state, context);
  if (ctx.role !== "class_teacher") throw new Error("A Class Teacher appointment is required to publish class notices.");
  const existing = input.id ? visibleClassNotices(state, ctx).find((item) => item.id === input.id) : null;
  if (input.id && !existing) throw new Error("Choose a notice in your appointed class.");
  const title = text(input.title, 120, "a notice title"), message = text(input.message, 2000, "a notice message"), timestamp = now();
  const item = { ...existing, id: existing?.id || "notice-" + crypto.randomUUID(), branch: ctx.branch, grade: ctx.grant.grade, className: ctx.grant.className, title, message, author: existing?.author || ctx.account.id, by: ctx.account.name, status: input.status === "withdrawn" ? "withdrawn" : "published", createdAt: existing?.createdAt || timestamp, updatedAt: timestamp };
  state.classNotices ||= []; if (existing) state.classNotices[state.classNotices.indexOf(existing)] = item; else state.classNotices.push(item);
  return item;
}
export function markNoticeRead(state, context, child, id) {
  const ctx = active(state, context), student = parentStudent(state, ctx, child), item = visibleClassNotices(state, ctx, student).find((item) => item.id === id);
  if (!item) throw new Error("This notice is outside your child’s class.");
  state.noticeReads ||= {}; state.noticeReads[ctx.account.id + ":" + student.id + ":" + id] = item.updatedAt;
}
export function homeworkSubjects(state, context, child) {
  let ctx; try { ctx = active(state, context); } catch { return []; }
  return ["class_teacher", "teacher", "parent"].includes(ctx.role) ? visibleCourses(state, ctx, child) : [];
}
export function visibleHomework(state, context, child) {
  const subjects = homeworkSubjects(state, context, child);
  return (state.homework || []).filter((item) => subjects.some((course) => course.id === item.course && course.branch === item.branch && course.grade === item.grade && course.className === item.className) && (context.role !== "parent" || item.status === "published")).sort((a, b) => a.due.localeCompare(b.due) || b.updatedAt.localeCompare(a.updatedAt));
}
export function canManageHomework(state, context, item) {
  return ["class_teacher", "teacher"].includes(context?.role) && homeworkSubjects(state, context).some((course) => course.id === item.course && course.branch === item.branch && course.grade === item.grade && course.className === item.className);
}
export function saveHomework(state, context, input) {
  const ctx = active(state, context);
  if (!["class_teacher", "teacher"].includes(ctx.role)) throw new Error("A Class Teacher or Subject Teacher appointment is required.");
  const course = homeworkSubjects(state, ctx).find((item) => item.id === input.course), existing = input.id ? visibleHomework(state, ctx).find((item) => item.id === input.id) : null;
  if (!course || input.id && (!existing || existing.course !== course.id)) throw new Error("Choose a subject and class currently assigned to you.");
  const title = text(input.title, 120, "a homework title"), instructions = text(input.instructions, 3000, "homework instructions"), due = String(input.due || "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(due) || !Number.isFinite(Date.parse(due)) || new Date(due).toISOString().slice(0, 10) !== due) throw new Error("Choose a valid homework due date.");
  const timestamp = now(), item = { ...existing, id: existing?.id || "homework-" + crypto.randomUUID(), course: course.id, branch: course.branch, grade: course.grade, className: course.className, title, instructions, due, author: existing?.author || ctx.account.id, by: ctx.account.name, status: input.status === "withdrawn" ? "withdrawn" : "published", createdAt: existing?.createdAt || timestamp, updatedAt: timestamp };
  state.homework ||= []; if (existing) state.homework[state.homework.indexOf(existing)] = item; else state.homework.push(item);
  return item;
}
export function setHomeworkDone(state, context, child, id) {
  const ctx = active(state, context), student = parentStudent(state, ctx, child), item = visibleHomework(state, ctx, student).find((item) => item.id === id);
  if (!item) throw new Error("Choose homework for your child’s assigned subjects.");
  state.homeworkCompleted ||= {}; state.homeworkCompleted[student.id] ||= {};
  if (state.homeworkCompleted[student.id][id]) delete state.homeworkCompleted[student.id][id]; else state.homeworkCompleted[student.id][id] = { by: ctx.account.id, at: now() };
}
