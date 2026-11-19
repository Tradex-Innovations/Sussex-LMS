import { icon } from "./icons.js";
import { students, statuses } from "./data.js";

export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char]));

export const childProfiles = students.filter((student) => student.bus);

export function pageHeading(title, description, actions = "") {
  return `<header class="page-heading">
    <div><h1>${title}</h1><p>${description}</p></div>
    ${actions ? `<div class="heading-actions">${actions}</div>` : ""}
  </header>`;
}

export function avatar(person, size = "") {
  return `<span class="avatar tone-${person.tone ?? "green"} ${size}" aria-hidden="true">${escapeHtml(person.initials)}</span>`;
}

export function badge(label, tone = "neutral", dot = false) {
  return `<span class="badge tone-${tone}">${dot ? '<i class="badge-dot"></i>' : ""}${label}</span>`;
}

export function statusBadge(status) {
  const current = statuses[status];
  return badge(current.label, current.tone, true);
}

export function iconTile(name, tone = "green", cls = "") {
  return `<span class="icon-tile tone-${tone} ${cls}">${icon(name)}</span>`;
}

export function button(label, action, options = {}) {
  const { iconName, variant = "primary", value, focus, extra = "", end } = options;
  return `<button type="button" class="button ${variant}" data-action="${action}"
    ${value !== undefined ? `data-value="${escapeHtml(value)}"` : ""}
    ${focus ? `data-focus="${escapeHtml(focus)}"` : ""} ${extra}>
    ${iconName ? icon(iconName, 17) : ""}<span>${label}</span>${end ? icon(end, 16) : ""}
  </button>`;
}

export function childSelect(child, profiles = childProfiles) {
  if (profiles.length === 1) return "";
  return `<label class="profile-select">
    ${avatar(child, "small")}
    <span class="sr-only">Select student</span>
    <select data-change="child" data-focus="child-select">
      ${profiles.map((student) => `<option value="${student.id}" ${student.id === child.id ? "selected" : ""}>${student.name}</option>`).join("")}
    </select>
    ${icon("chevronDown", 15)}
  </label>`;
}

export function emptyState(name, title, description, action = "") {
  return `<div class="empty-state">${iconTile(name, "green")}<h3>${title}</h3><p>${description}</p>${action}</div>`;
}

export function money(amount) {
  return `LKR ${new Intl.NumberFormat("en-LK").format(amount)}`;
}

export function courseIcon(course) {
  return iconTile(course.icon, course.tone, "course-icon");
}

