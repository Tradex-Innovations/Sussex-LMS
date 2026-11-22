import { button, badge, escapeHtml as e } from "./ui.js";
import { classCourses, classSupportTypes, classTaskStatuses, gradeClassRequests } from "./class-data.js";

const choices = (values, current) => values.map(([id, name]) => `<option value="${e(id)}" ${id === current ? "selected" : ""}>${e(name)}</option>`).join("");
const footer = (label) => `<p class="form-error" role="alert" hidden></p><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button class="button primary" type="submit">${label}</button></footer>`;

export function classSupportRequestForm(options, courseId = "") {
  const courses = classCourses(options.state, options.context);
  return `<form data-form="class-support"><div class="form-body"><label class="field">Course / class matter<select name="course">${choices([["", "Class-level request"], ...courses.map((course) => [course.id, course.title + " · Class " + course.className])], courseId)}</select></label><label class="field">Support topic<select name="type">${choices(Object.entries(classSupportTypes), courseId ? "materials" : "attendance")}</select></label><label class="field">Note for Grade Coordinator<textarea name="note" rows="4" maxlength="1000" required placeholder="Describe the support or decision needed"></textarea></label><p class="chairman-filter-note">Recorded in this browser for the coordinator of your school and grade. Lecture-material and cover topics require a class course.</p></div>${footer("Record coordinator request")}</form>`;
}

export function classRequestInbox(options) {
  const items = gradeClassRequests(options.state, options.context);
  if (!items.length) return "";
  return `<section class="surface chairman-panel grade-support-inbox class-request-inbox"><header class="chairman-panel-heading"><div><h2>Requests from Class Teachers</h2><p>Only your appointed school and grade · Responses record coordination</p></div>${badge(items.filter((item) => item.status !== "resolved").length + " open", "amber")}</header><div class="grade-support-grid">${items.map((item) => `<article class="grade-support-card"><div>${badge(classSupportTypes[item.type], "blue")}${badge(classTaskStatuses[item.status], item.status === "resolved" ? "green" : "amber")}</div><h3>${e(item.title)} · Class ${e(item.className)}</h3><p>${e(item.note)}</p><small>${e(item.by)} · Grade ${item.grade}</small>${item.responses?.[0] ? `<div class="grade-response"><strong>Latest response</strong><p>${e(item.responses[0].text)}</p></div>` : ""}<div class="section-row-actions">${button("Respond to Class Teacher", "grade-class-response", { value: item.id, variant: "secondary compact" })}${item.course ? button("Request Section Head support", "grade-support", { value: item.course, variant: "secondary compact" }) : ""}</div></article>`).join("")}</div></section>`;
}

export function classSupportResponseForm(request) {
  return `<form data-form="grade-class-response"><div class="form-body"><input type="hidden" name="id" value="${e(request.id)}"><h3>${e(request.title)} · Class ${e(request.className)}</h3><p class="chairman-filter-note">${e(request.note)}</p><label class="field">Request progress<select name="status">${choices([["in_progress", "In progress"], ["resolved", "Resolved"]], request.status === "resolved" ? "resolved" : "in_progress")}</select></label><label class="field">Response for Class Teacher<textarea name="note" rows="4" maxlength="1000" required></textarea></label><p class="chairman-filter-note">This records a response; it does not allocate cover, change attendance or publish materials.</p></div>${footer("Save class response")}</form>`;
}
