import { badge, button, escapeHtml as e, emptyState } from "./ui.js";
import { icon } from "./icons.js";
import { demoDate, branchStaff } from "./chairman-data.js";
import { schoolFollowups, followupAssignees, followupCategories, followupStatuses, schoolTemporaryCovers, coverTeachers, leaveRecommendations, incomingSectionCoverRequests } from "./vice-data.js";

const choices = (values, selected) => values.map(([id, name]) => `<option value="${e(id)}" ${id === selected ? "selected" : ""}>${e(name)}</option>`).join("");
const field = (label, content) => `<label class="field">${label}${content}</label>`;
const footer = (label) => `<p class="form-error" role="alert" hidden></p><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button type="submit" class="button primary">${label}</button></footer>`;
const panel = (title, description, body, actions = "") => `<section class="surface chairman-panel vice-operations-panel"><header class="chairman-panel-heading"><div><h2>${title}</h2><p>${description}</p></div>${actions}</header>${body}</section>`;

export function viceTaskBar(options, branch) {
  const pending = schoolFollowups(options.state, branch).filter((item) => item.status !== "resolved").length;
  return `<div class="vice-task-bar"><span>${icon("checkCircle", 18)}<strong>${pending} pending follow-ups</strong><small>Daily school coordination</small></span><div>${button("Follow-up board", "vice-followups", { variant: "secondary compact" })}${button("Add follow-up", "vice-new-followup", { value: options.chairman.view === "reports" ? "staffing" : options.chairman.view, variant: "primary compact", iconName: "plus" })}</div></div>`;
}

export function viceFollowupBoard(options, branch) {
  const people = followupAssignees(options.state, branch);
  const items = schoolFollowups(options.state, branch);
  return `<div class="vice-board-intro"><p>${e(branch.school)} · Sample school coordination</p>${button("Add follow-up", "vice-new-followup", { value: "attendance", variant: "primary compact", iconName: "plus" })}</div><div class="vice-followup-list">` + items.map((item) =>
    `<article class="vice-followup-card"><div>${badge(followupCategories[item.category], "blue")}${item.busId && options.state.buses.some((bus) => bus.id === item.busId && bus.branch === branch.id) ? badge("Bus " + item.busId, "neutral") : ""}${badge(followupStatuses[item.status], item.status === "resolved" ? "green" : "amber")}</div><h3>${e(item.title)}</h3><p>${e(people.find((person) => person.id === item.assignee)?.name || "School office")} · Due ${e(item.due)}</p><blockquote>${e(item.notes[0]?.text)}</blockquote>${button("Review follow-up", "vice-edit-followup", { value: item.id, variant: "secondary compact" })}</article>`).join("") + '</div>';
}

export function viceFollowupForm(options, branch, item = null, category = "attendance", title = "") {
  const people = followupAssignees(options.state, branch);
  return `<form data-form="vice-followup"><div class="form-body"><input type="hidden" name="id" value="${e(item?.id || "")}">${field("Follow-up title", `<input name="title" maxlength="140" required value="${e(item?.title || title)}">`)}<div class="form-row">${field("Category", `<select name="category">${choices(Object.entries(followupCategories), item?.category || category)}</select>`)}${field("Status", `<select name="status">${choices(Object.entries(followupStatuses), item?.status || "open")}</select>`)}</div>${field("Assigned owner", `<select name="assignee">${choices(people.map((person) => [person.id, person.name + " · " + person.designation]), item?.assignee || options.context.account.id)}</select>`)}${field("Follow-up due", `<input type="date" name="due" min="${demoDate}" max="2026-11-27" value="${e(item?.due || demoDate)}" required>`)}${field(item ? "Update note" : "Follow-up note", '<textarea name="note" rows="3" maxlength="1200" required placeholder="Record the next step or outcome"></textarea>')}${item ? '<div class="vice-note-history"><h3>Previous notes</h3>' + item.notes.map((note) => `<article><p>${e(note.text)}</p><small>${e(note.by)} · ${e(note.at.slice(0, 10))}</small></article>`).join("") + '</div>' : ""}<p class="chairman-filter-note">Saved in this demo browser. The assigned owner is recorded for review.</p></div>${footer("Save follow-up")}</form>`;
}

export function temporaryCoverPanel(options, branch) {
  const entries = schoolTemporaryCovers(options.state, branch);
  const teachers = branchStaff(options.state, branch);
  const rows = entries.map((item) => `<article class="vice-cover-card"><div><strong>Class ${e(item.className)} · ${e(item.title)}</strong>${badge(item.status === "active" ? "Cover assigned" : "Cancelled", item.status === "active" ? "green" : "neutral")}</div><p>${e(item.teacherName)} covering for ${e(teachers.find((person) => person.id === item.originalTeacher)?.name || "assigned teacher")}</p><small>${e(item.date)} · ${e(item.reason)}</small>${item.status === "active" ? button("Cancel cover", "vice-cancel-cover", { value: item.id, variant: "secondary compact" }) : ""}</article>`).join("");
  return panel("Temporary teaching cover", "One-day cover for 20 Nov · Permanent course assignments stay with the assigned teacher", `<div class="vice-cover-list">${rows || emptyState("book", "No temporary cover assigned", "Choose a course and an available teacher for today’s cover.")}</div>`, options.context.role === "vice_principal" ? button("Assign cover", "vice-cover", { value: "", variant: "secondary compact", iconName: "plus" }) : "");
}

export function temporaryCoverForm(options, branch, courseId = "", requestId = "") {
  const courses = options.state.courses.filter((course) => course.branch === branch.id);
  const teachers = coverTeachers(options.state, branch);
  return `<form data-form="vice-cover"><input type="hidden" name="requestId" value="${e(requestId)}"><div class="form-body"><p>Cover is for one school day. The course’s permanent teacher remains assigned.</p>${field("Course / class", `<select name="course" data-change="vice-cover-course">${choices(courses.map((course) => [course.id, course.title + " · Class " + course.className]), courseId || courses[0]?.id)}</select>`)}${field("Cover date", `<input name="date" type="date" value="${demoDate}" readonly>`)}${field("Available cover teacher", `<select name="teacher" id="vice-cover-teacher">${choices(teachers.filter((person) => person.id !== options.state.assignments[courseId || courses[0]?.id]?.teacher).map((person) => [person.id, person.name + (person.sample ? " · Sample teacher" : "")]), "")}</select>`)}${field("Cover reason", '<textarea name="reason" rows="3" maxlength="500" required placeholder="For example, assigned teacher on leave"></textarea>')}</div>${footer("Assign temporary cover")}</form>`;
}

export function leaveRecommendationForm(request) {
  const previous = request.recommendation;
  return `<form data-form="vice-leave"><div class="form-body"><input type="hidden" name="id" value="${e(request.id)}"><h3>${e(request.name)}</h3><p>${e(request.reason)} · ${e(request.date)}</p>${field("Recommendation", `<select name="recommendation">${choices(Object.entries(leaveRecommendations), previous?.recommendation || "support")}</select>`)}${field("Note for Principal", `<textarea name="note" rows="4" maxlength="1000" required>${e(previous?.note || "")}</textarea>`)}<p class="chairman-filter-note">The Principal makes the final leave decision.</p></div>${footer("Save recommendation")}</form>`;
}


export function incomingSectionCoverPanel(options) {
  const items = incomingSectionCoverRequests(options.state, options.context);
  if (!items.length) return "";
  return panel("Cover requests from Section Heads", "Review requests within your school and assign available temporary cover", '<div class="vice-cover-list">' + items.map((item) => `<article class="vice-cover-card"><div><strong>${e(item.title)} · Class ${e(item.className)}</strong>${badge("Pending", "amber")}</div><p>${e(item.sectionName)} · ${e(item.by)} · ${e(item.date)}</p><small>${e(item.reason)}</small><div class="section-row-actions">${button("Assign requested cover", "vice-cover-request", { value: item.id, variant: "primary compact" })}${button("Decline request", "vice-decline-cover-request", { value: item.id, variant: "secondary compact" })}</div></article>`).join("") + '</div>');
}

export function declineCoverRequestForm(request) {
  return `<form data-form="vice-decline-cover"><div class="form-body"><input type="hidden" name="id" value="${e(request.id)}">${field("Decision note for Section Head", '<textarea name="note" rows="3" required maxlength="500"></textarea>')}</div>${footer("Decline cover request")}</form>`;
}
