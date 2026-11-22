import { button, badge, emptyState, escapeHtml as e } from "./ui.js";
import { gradeSupportTypes, gradeTaskStatuses, gradeCourses, gradeSupportRequests, sectionGradeRequests } from "./grade-data.js";

const choices = (values, current) => values.map(([id, name]) => `<option value="${e(id)}" ${id === current ? "selected" : ""}>${e(name)}</option>`).join("");
const footer = (label) => `<p class="form-error" role="alert" hidden></p><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button type="submit" class="button primary">${label}</button></footer>`;

export function gradeSupportList(options) {
  const requests = gradeSupportRequests(options.state, options.context);
  return `<div class="grade-support-grid">${requests.map((item) => `<article class="grade-support-card"><div>${badge(gradeSupportTypes[item.type], "blue")}${badge(gradeTaskStatuses[item.status], item.status === "resolved" ? "green" : "amber")}</div><h3>${e(item.title)} · Class ${e(item.className)}</h3><p>${e(item.note)}</p><small>Recorded by ${e(item.by)}</small>${item.responses?.length ? `<div class="grade-response"><strong>Section Head response</strong>${item.responses.map((response) => `<p>${e(response.text)}</p><small>${e(response.by)} · ${e(response.at.slice(0, 10))}</small>`).join("")}</div>` : '<p class="chairman-filter-note">Awaiting Section Head review</p>'}</article>`).join("") || emptyState("checkCircle", "No support requested", "Record a course-related request for the Section Head from the course coordination list.")}</div>`;
}

export function gradeSupportRequestForm(options, courseId) {
  const courses = gradeCourses(options.state, options.context);
  return `<form data-form="grade-support"><div class="form-body"><label class="field">Course / class<select name="course">${choices(courses.map((course) => [course.id, course.title + " · Class " + course.className]), courseId)}</select></label><label class="field">Support topic<select name="type">${choices(Object.entries(gradeSupportTypes), "materials")}</select></label><label class="field">Note for Section Head<textarea name="note" maxlength="1000" rows="4" required placeholder="Describe the support or decision needed"></textarea></label><p class="chairman-filter-note">Recorded in this demo browser for the assigned Section Head’s review.</p></div>${footer("Record support request")}</form>`;
}

export function gradeSupportInbox(options) {
  const requests = sectionGradeRequests(options.state, options.context);
  if (!requests.length) return "";
  return `<section class="surface chairman-panel grade-support-inbox"><header class="chairman-panel-heading"><div><h2>Requests from Grade Coordinators</h2><p>Only requests within your assigned school and section</p></div>${badge(requests.filter((item) => item.status !== "resolved").length + " open", "amber")}</header><div class="grade-support-grid">${requests.map((item) => `<article class="grade-support-card"><div>${badge(gradeSupportTypes[item.type], "blue")}${badge(gradeTaskStatuses[item.status], item.status === "resolved" ? "green" : "amber")}</div><h3>${e(item.title)} · Class ${e(item.className)}</h3><p>${e(item.note)}</p><small>Grade ${item.grade} · ${e(item.by)}</small>${item.responses?.[0] ? `<div class="grade-response"><strong>Latest response</strong><p>${e(item.responses[0].text)}</p></div>` : ""}<div class="section-row-actions">${button("Respond to coordinator", "section-grade-response", { value: item.id, variant: "secondary compact" })}${item.type === "cover" ? button("Request cover", "section-request-cover", { value: item.course, variant: "secondary compact" }) : item.type === "materials" ? button("Review materials", "section-review", { value: item.course, variant: "secondary compact" }) : ""}</div></article>`).join("")}</div></section>`;
}

export function gradeSupportResponseForm(request) {
  return `<form data-form="section-grade-response"><div class="form-body"><input type="hidden" name="id" value="${e(request.id)}"><h3>${e(request.title)} · Class ${e(request.className)}</h3><p class="chairman-filter-note">${e(request.note)}</p><label class="field">Request progress<select name="status">${choices([["in_progress", "In progress"], ["resolved", "Resolved"]], request.status === "resolved" ? "resolved" : "in_progress")}</select></label><label class="field">Response for coordinator<textarea name="note" rows="4" maxlength="1000" required></textarea></label><p class="chairman-filter-note">This records a response. Cover allocation and material review remain separate actions.</p></div>${footer("Save response")}</form>`;
}
