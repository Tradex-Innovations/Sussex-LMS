import { recordContext } from "./records.js";
import { linkedChildren, visibleCourses, withinScope } from "./access.js";
import { feeToday } from "./fees-data.js";
export function communicationClasses(state, context) {
  let ctx; try { ctx = recordContext(state, context); } catch { return []; }
  if (ctx.role === "class_teacher") return [{ id: "class", branch: ctx.branch, grade: ctx.grant.grade, className: ctx.grant.className, title: "Class " + ctx.grant.className }];
  return ctx.role === "teacher" ? visibleCourses(state, ctx).map((course) => ({ ...course, title: course.title + " · " + course.className })) : [];
}
export function communicationStudents(state, context, classId) {
  const scope = communicationClasses(state, context).find((item) => item.id === classId);
  if (!scope) return [];
  return state.students.filter((student) => student.branch === scope.branch && student.grade === scope.grade && student.className === scope.className && (classId === "class" || state.assignments[classId]?.students.includes(student.id)));
}
function staffOwns(state, ctx, item) {
  return item.author === ctx.account.id && communicationClasses(state, ctx).some((scope) => scope.branch === item.branch && scope.grade === item.grade && scope.className === item.className && (item.courseId ? scope.id === item.courseId : ctx.role === "class_teacher"));
}
export function communicationChildren(state, context, item) {
  const children = context?.role === "parent" ? linkedChildren(state, context) : communicationStudents(state, context, item.courseId || "class");
  return children.filter((student) => item.studentIds.includes(student.id) && student.branch === item.branch && student.grade === item.grade && student.className === item.className && (context.role !== "parent" || item.recipients.some((recipient) => recipient.studentId === student.id && recipient.parentId === context.account.id)));
}
export function communications(state, context, kind) {
  let ctx; try { ctx = recordContext(state, context); } catch { return []; }
  return (state.communications || []).filter((item) => (!kind || item.kind === kind) && (ctx.role === "parent" ? communicationChildren(state, ctx, item).length : staffOwns(state, ctx, item))).sort((a, b) => b.at.localeCompare(a.at));
}
export function publishCommunication(state, context, input) {
  const ctx = recordContext(state, context), scope = communicationClasses(state, ctx).find((item) => item.id === input.classId), eligible = communicationStudents(state, ctx, input.classId);
  if (!scope || !["event", "message"].includes(input.kind) || !["email", "letter"].includes(input.channel) || !["whole", "selected"].includes(input.audience)) throw new Error("Choose your teaching class, communication type and audience.");
  const ids = input.audience === "whole" ? eligible.map((student) => student.id) : input.students;
  if (!Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length || !ids.every((id) => eligible.some((student) => student.id === id))) throw new Error("Select students from this teaching class only.");
  const title = String(input.title || "").trim(), message = String(input.message || "").trim();
  if (!title || title.length > 120 || !message || message.length > 4000) throw new Error("Enter a title (120 characters) and message (4,000 characters).");
  const dateOK = (date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
  if (input.kind === "event" && (!dateOK(input.eventDate) || !dateOK(input.deadline) || input.deadline < feeToday() || input.eventDate < input.deadline || !String(input.location || "").trim() || String(input.location).length > 160)) throw new Error("Enter an event location and future consent deadline on or before the event date.");
  const recipients = ids.flatMap((id) => eligible.find((student) => student.id === id).guardians.filter((parentId) => state.accounts.some((person) => person.id === parentId && person.grants.some((grant) => grant.role === "parent" && grant.branch === scope.branch))).map((parentId) => ({ studentId: id, parentId })));
  const item = { id: "communication-" + crypto.randomUUID(), kind: input.kind, channel: input.channel, title, message, branch: scope.branch, grade: scope.grade, className: scope.className, courseId: input.classId === "class" ? "" : input.classId, author: ctx.account.id, by: ctx.account.name, audience: input.audience, studentIds: [...ids], recipients, status: "published", at: new Date().toISOString(), ...(input.kind === "event" ? { eventDate: input.eventDate, deadline: input.deadline, location: String(input.location).trim() } : {}) };
  state.communications ||= []; state.communications.push(item); return item;
}
export function cancelCommunication(state, context, id) {
  const ctx = recordContext(state, context), item = communications(state, ctx).find((item) => item.id === id);
  if (ctx.role === "parent" || !item) throw new Error("Choose your own current-class communication.");
  item.status = "cancelled"; item.cancelledAt = new Date().toISOString();
}
export function consentFor(state, eventId, studentId) { return (state.consentResponses || []).find((item) => item.eventId === eventId && item.studentId === studentId); }
export function respondConsent(state, context, input) {
  const ctx = recordContext(state, context), event = communications(state, ctx, "event").find((item) => item.id === input.eventId), student = event && communicationChildren(state, ctx, event).find((item) => item.id === input.studentId), signature = String(input.signature || "").trim();
  if (ctx.role !== "parent" || !event || !student || event.status !== "published" || feeToday() > event.deadline) throw new Error("Consent is closed or this event is outside your linked children.");
  if (!["yes", "no"].includes(input.decision) || signature !== ctx.account.name) throw new Error("Choose a response and type your displayed guardian name exactly.");
  const previous = consentFor(state, event.id, student.id), response = { eventId: event.id, studentId: student.id, parentId: ctx.account.id, by: ctx.account.name, decision: input.decision, at: new Date().toISOString(), history: previous ? [{ decision: previous.decision, by: previous.by, at: previous.at }, ...(previous.history || [])] : [] };
  state.consentResponses = [...(state.consentResponses || []).filter((item) => !(item.eventId === event.id && item.studentId === student.id)), response]; return response;
}
export function remindEvent(state, context, id) {
  const ctx = recordContext(state, context), event = communications(state, ctx, "event").find((item) => item.id === id);
  if (ctx.role === "parent" || !event || event.status !== "published" || feeToday() > event.deadline) throw new Error("Choose your open event.");
  event.reminders ||= []; if (event.reminders.includes(feeToday())) return false; event.reminders.push(feeToday()); return true;
}
export function eventCSV(state, context, id) {
  const ctx = recordContext(state, context), event = communications(state, ctx, "event").find((item) => item.id === id);
  if (!event || ctx.role === "parent") throw new Error("Choose your class event.");
  const q = (value) => '"' + String(/^[\s]*[=+@-]/.test(String(value)) ? "'" + value : value ?? "").replaceAll('"', '""') + '"';
  return [["DEMO consent register", "Admission", "Class", "Response", "Guardian", "Recorded at"], ...communicationChildren(state, ctx, event).map((student) => { const response = consentFor(state, event.id, student.id); return [student.name, student.admissionNumber, student.className, response?.decision || "pending", response?.by || "", response?.at || ""]; })].map((row) => row.map(q).join(",")).join("\r\n");
}
