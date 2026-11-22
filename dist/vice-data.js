import { chairmanBranches, branchStaff, schoolLeaveRequests, demoDate } from "./chairman-data.js";

export const followupCategories = { transport: "Transport", academic: "Academic", attendance: "Attendance", staffing: "Staffing" };
export const followupStatuses = { open: "Open", in_progress: "In progress", resolved: "Resolved" };
export const leaveRecommendations = { support: "Support request", discuss: "Discuss with Principal" };

function assignedSchool(state, context) {
  if (context?.role !== "vice_principal") throw new Error("Vice Principal access required.");
  const school = chairmanBranches(state, context)[0];
  if (!school) throw new Error("An assigned school is required.");
  return school;
}

export function followupAssignees(state, branch) {
  return branchStaff(state, branch).filter((person) => person.category !== "support" || person.roles.includes("transport"));
}

export function schoolFollowups(state, branch) {
  const assignees = followupAssignees(state, branch);
  const owner = (role) => assignees.find((person) => person.roles.includes(role)) || assignees[0];
  const seeds = [
    ["transport", "Review daily bus readiness", "transport", "Confirm the route status with the transport coordinator before the afternoon trip."],
    ["attendance", "Review repeated student absences", "section_head", "Review the 20-day watchlist and record the class teacher’s follow-up."],
    ["academic", "Review Mathematics learning support", "coordinator", "Review the class comparison and agree the next support session."],
  ].map(([category, title, role, note], index) => ({ id: "followup-" + branch.id + "-" + index, branch: branch.id, category, title,
    assignee: owner(role).id, due: demoDate, status: "open", notes: [{ text: note, by: "Demo school office", at: demoDate + "T02:30:00Z" }], sample: true }));
  const saved = (state.viceFollowups || []).filter((item) => item.branch === branch.id);
  return [...saved, ...seeds.filter((item) => !saved.some((entry) => entry.id === item.id))];
}

export function saveSchoolFollowup(state, context, input) {
  const branch = assignedSchool(state, context);
  const previous = input.id ? schoolFollowups(state, branch).find((item) => item.id === input.id) : null;
  if (input.id && !previous) throw new Error("This follow-up is outside your school.");
  if (!Object.hasOwn(followupCategories, input.category) || !Object.hasOwn(followupStatuses, input.status)) throw new Error("Choose a valid category and status.");
  if (!followupAssignees(state, branch).some((person) => person.id === input.assignee)) throw new Error("Choose an owner from your school.");
  const title = String(input.title || "").trim(), note = String(input.note || "").trim();
  if (!title || title.length > 140 || !note || note.length > 1200) throw new Error("Enter a title and a follow-up note.");
  if (!/^2026-11-(?:20|2[1-7])$/.test(input.due)) throw new Error("Choose a follow-up date from 20 to 27 Nov 2026.");
  const item = { ...previous, id: previous?.id || "followup-" + crypto.randomUUID(), branch: branch.id,
    category: input.category, title, assignee: input.assignee, due: input.due, status: input.status,
    notes: [{ text: note, by: context.account.name, at: new Date().toISOString() }, ...(previous?.notes || [])].slice(0, 20) };
  state.viceFollowups = [item, ...(state.viceFollowups || []).filter((entry) => entry.id !== item.id)];
  return item;
}

export function schoolTemporaryCovers(state, branch) {
  return (state.temporaryCovers || []).filter((item) => item.branch === branch.id);
}

export function coverTeachers(state, branch, date = demoDate) {
  return branchStaff(state, branch, date).filter((person) => person.category === "teachers" && person.status === "present");
}

export function incomingSectionCoverRequests(state, context) {
  const branch = assignedSchool(state, context);
  return (state.sectionCoverRequests || []).filter((item) => item.branch === branch.id && item.status === "pending" && state.courses.some((course) => course.id === item.course && course.branch === branch.id));
}

export function declineSectionCoverRequest(state, context, input) {
  const request = incomingSectionCoverRequests(state, context).find((item) => item.id === input.id);
  if (!request) throw new Error("Choose a pending cover request from your school.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 500) throw new Error("Enter the reason for declining this request.");
  request.status = "declined";
  request.decisionNote = note;
  request.decidedBy = context.account.name;
}

export function saveTemporaryCover(state, context, input) {
  const branch = assignedSchool(state, context);
  const course = state.courses.find((course) => course.branch === branch.id && course.id === input.course);
  if (!course) throw new Error("Choose a course from your assigned school.");
  if (input.date !== demoDate) throw new Error("Temporary cover is demonstrated for 20 Nov 2026.");
  const teacher = coverTeachers(state, branch, input.date).find((person) => person.id === input.teacher);
  if (!teacher || teacher.id === state.assignments[course.id]?.teacher) throw new Error("Choose another available teacher from your school.");
  if (schoolTemporaryCovers(state, branch).some((item) => item.course === course.id && item.date === input.date && item.status === "active")) throw new Error("This class already has active cover. Cancel it before assigning another teacher.");
  const reason = String(input.reason || "").trim();
  if (!reason || reason.length > 500) throw new Error("Enter the reason for temporary cover.");
  const request = input.requestId ? incomingSectionCoverRequests(state, context).find((item) => item.id === input.requestId && item.course === course.id && item.date === input.date) : null;
  if (input.requestId && !request) throw new Error("Choose a pending cover request for this school and course.");
  const item = { id: "cover-" + crypto.randomUUID(), branch: branch.id, course: course.id, className: course.className, title: course.title,
    teacher: teacher.id, teacherName: teacher.name, originalTeacher: state.assignments[course.id]?.teacher, date: input.date, reason,
    status: "active", by: context.account.name, at: new Date().toISOString(), ...(request ? { requestId: request.id } : {}) };
  state.temporaryCovers = [item, ...(state.temporaryCovers || [])];
  if (request) { request.status = "fulfilled"; request.teacherName = teacher.name; request.decidedBy = context.account.name; request.decisionNote = "Temporary cover assigned."; }
  return item;
}

export function cancelTemporaryCover(state, context, id) {
  const branch = assignedSchool(state, context);
  const cover = schoolTemporaryCovers(state, branch).find((item) => item.id === id && item.status === "active");
  if (!cover) throw new Error("Active cover is required within your school.");
  cover.status = "cancelled";
  cover.cancelledBy = context.account.name;
  const request = (state.sectionCoverRequests || []).find((item) => item.id === cover.requestId && item.branch === branch.id && item.status === "fulfilled");
  if (request) { request.status = "pending"; delete request.teacherName; request.decisionNote = "Previous cover cancelled; awaiting replacement."; }
}

export function saveLeaveRecommendation(state, context, input) {
  const branch = assignedSchool(state, context);
  const request = schoolLeaveRequests(state, branch).find((item) => item.id === input.id);
  if (!request || request.decision !== "pending") throw new Error("Choose a pending leave request from your school.");
  if (!Object.hasOwn(leaveRecommendations, input.recommendation)) throw new Error("Choose a recommendation.");
  const note = String(input.note || "").trim();
  if (!note || note.length > 1000) throw new Error("Add a short recommendation note for the Principal.");
  state.viceLeaveRecommendations ??= {};
  state.viceLeaveRecommendations[request.id] = { recommendation: input.recommendation, note, by: context.account.name, at: new Date().toISOString() };
  return request;
}
