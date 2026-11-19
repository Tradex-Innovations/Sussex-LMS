import { can, canPublish, branchTeachers, visibleCourses } from "./access.js";
import { icon } from "./icons.js";
import { avatar, badge, button, childSelect, courseIcon, emptyState, escapeHtml as e, pageHeading } from "./ui.js";

export function courseMaterials(state, courseId) {
  return state.materials.filter((item) => item.course === courseId);
}

function courseTitle(course, state) {
  return `Grade ${course.grade} · ${course.className} · ${state.branches.find((branch) => branch.id === course.branch)?.name}`;
}

function courseCard(course, { state, context, child }) {
  const items = courseMaterials(state, course.id);
  const teacher = state.accounts.find((person) => person.id === state.assignments[course.id].teacher);
  const done = child ? items.filter((material) => state.completed[child.id]?.includes(material.id)).length : 0;
  const enrolled = state.assignments[course.id].students.length;
  return `<article class="surface course-card">
    <div class="course-card-banner tone-${course.tone}">${courseIcon(course)}${badge(`Grade ${course.grade}`, "white")}</div>
    <div class="course-card-body">
      <h2>${course.title}</h2><p>${course.summary}</p>
      <div class="course-meta">${icon("user", 16)} ${e(teacher?.name ?? "Teacher unassigned")}</div>
      ${context.role === "parent" ? `<div class="course-progress"><progress value="${done}" max="${items.length || 1}" aria-label="Course progress"></progress><span>${done} of ${items.length} done</span></div>`
        : `<div class="course-meta">${enrolled} enrolled · ${items.length} materials</div>`}
      ${button("View materials", "open-course", { value: course.id, variant: "secondary", focus: `open-${course.id}` })}
    </div>
  </article>`;
}

function materialRow(item, { state, context, child }, course) {
  const done = child && state.completed[child.id]?.includes(item.id);
  const fileLabel = item.file?.name?.split(".").at(-1)?.toUpperCase() || "TXT";
  return `<article class="material-row">
    <span class="icon-tile tone-neutral small-tile">${icon("file")}</span>
    <div class="material-info"><strong>${e(item.title)}</strong>
      <span>${e(item.type)} · ${e(fileLabel)} · ${e(item.date)}</span>
      ${item.description ? `<p>${e(item.description)}</p>` : ""}
    </div>
    <div class="material-actions">
      ${button("Download", "download", { value: item.id, variant: "secondary compact", iconName: "download", extra: `aria-label="Download ${e(item.title)}"` })}
      ${context.role === "parent" ? button(done ? "Done" : "Mark done", "complete", { value: item.id, iconName: done ? "check" : "circleDot", variant: done ? "completed compact" : "secondary compact", focus: `done-${item.id}`, extra: `aria-pressed="${Boolean(done)}"` }) : ""}
      ${canPublish(state, context, course) ? button("Edit", "edit-material", { value: item.id, variant: "secondary compact", iconName: "edit", extra: `aria-label="Edit ${e(item.title)}"` }) : ""}
    </div>
  </article>`;
}

function progressTable(course, state) {
  const items = courseMaterials(state, course.id);
  const roster = state.students.filter((person) => state.assignments[course.id].students.includes(person.id));
  return `<section class="surface section-gap">
    <header class="panel-heading"><div><h2>Student progress</h2><p>Completion recorded through the parent portal</p></div></header>
    <div class="progress-roster">${roster.map((student) => {
      const done = items.filter((item) => state.completed[student.id]?.includes(item.id)).length;
      return `<div class="progress-student">${avatar(student, "small")}<strong>${e(student.name)}</strong><span>${done} / ${items.length} done</span><progress value="${done}" max="${items.length || 1}" aria-label="${e(student.name)} progress"></progress></div>`;
    }).join("") || emptyState("users", "No students enrolled", "Assign students to this course to review their progress.")}</div>
  </section>`;
}

function detail(course, options) {
  const { state, context, child, children } = options;
  const items = courseMaterials(state, course.id);
  const isParent = context.role === "parent";
  return `
    ${button("All courses", "close-course", { variant: "back-link", focus: "all-courses" })}
    ${pageHeading(course.title, courseTitle(course, state), isParent ? childSelect(child, children) : canPublish(state, context, course) ? button("Add material", "add-material", { value: course.id, iconName: "plus", focus: "add-material" }) : "")}
    <section class="surface materials-card">
      <header class="panel-heading"><div><h2>Course materials</h2><p>${items.length} published materials</p></div>${courseIcon(course)}</header>
      <div class="materials-list">${items.map((item) => materialRow(item, options, course)).join("") || emptyState("file", "No materials yet", "Published course materials will appear here.")}</div>
    </section>
    ${!isParent ? progressTable(course, state) : ""}`;
}

function assignmentsTable(options, visible) {
  const { state, context } = options;
  return `
    ${pageHeading("Course management", "Assign teachers and enroll students within your assigned scope.", visible.length ? button("Assign course", "assign", { iconName: "plus", focus: "assign-main" }) : "")}
    <section class="surface"><header class="panel-heading"><div><h2>Assigned scope</h2><p>${visible.length} courses available</p></div></header>
    <div class="table-scroll"><table class="course-table">
      <thead><tr><th scope="col">Course</th><th scope="col">Teacher</th><th scope="col">Students</th><th scope="col">Actions</th></tr></thead>
      <tbody>${visible.map((course) => {
        const assignment = state.assignments[course.id];
        const teacher = state.accounts.find((person) => person.id === assignment.teacher);
        return `<tr><td><div class="item-cell">${courseIcon(course)}<div><strong>${course.title}</strong><span>${courseTitle(course, state)}</span></div></div></td>
          <td>${e(teacher?.name ?? "Unassigned")}</td><td>${assignment.students.length}</td>
          <td><div class="table-actions">${button("Materials & progress", "open-course", { value: course.id, variant: "secondary compact" })}${button("Edit assignment", "assign", { value: course.id, iconName: "edit", variant: "secondary compact", focus: `assign-${course.id}` })}</div></td></tr>`;
      }).join("")}</tbody>
    </table></div>${!visible.length ? emptyState("book", "No courses in this scope", "Select another assigned account or scope to continue.") : ""}</section>`;
}

export function coursesPage(options) {
  const { state, context, child, children, courseId } = options;
  const visible = visibleCourses(state, context, child);
  const current = visible.find((course) => course.id === courseId);
  if (current) return detail(current, options);
  if (can(context, "courses.assign")) return assignmentsTable(options, visible);
  const isParent = context.role === "parent";
  return `${pageHeading(isParent ? "My courses" : "Teaching workspace", isParent ? "Download class materials and keep track of completed lessons." : "Course materials and progress for your assigned classes.", isParent && child ? childSelect(child, children) : "")}
    ${visible.length ? `<div class="course-grid">${visible.map((course) => courseCard(course, options)).join("")}</div>` : `<section class="surface">${emptyState("book", "No courses assigned", "Assigned courses will appear here.")}</section>`}`;
}

export function assignmentForm(courseId, options) {
  const { state, context } = options;
  const visible = visibleCourses(state, context);
  const course = visible.find((item) => item.id === courseId) || visible[0];
  if (!course) return emptyState("book", "No courses available", "Your scope has no course assignments.");
  const current = state.assignments[course.id];
  const teachers = branchTeachers(state, course.branch);
  return `<form data-form="assignment"><div class="form-body">
    <label class="field">Course<select name="course" data-change="assignment-course">${visible.map((item) => `<option value="${item.id}" ${item.id === course.id ? "selected" : ""}>${item.title} · ${courseTitle(item, state)}</option>`).join("")}</select></label>
    <label class="field">Assigned teacher<select name="teacher" ${can(context, "courses.teacher") ? "" : "disabled"} required>
      <option value="">Select teacher</option>${teachers.map((person) => `<option value="${person.id}" ${person.id === current.teacher ? "selected" : ""}>${e(person.name)}</option>`).join("")}
    </select></label>
    <fieldset class="roster-picker"><legend>Students · Class ${course.className}</legend>
      ${state.students.filter((student) => student.branch === course.branch && student.className === course.className && student.grade === course.grade).map((student) => `<label class="roster-check"><input type="checkbox" name="students" value="${student.id}" ${current.students.includes(student.id) ? "checked" : ""}>${avatar(student, "tiny")}<span>${e(student.name)}</span></label>`).join("")}
    </fieldset><p class="form-error" role="alert" hidden></p></div>
    <footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button type="submit" class="button primary">Save assignment</button></footer>
  </form>`;
}

export function materialForm(course, item = {}) {
  return `<form data-form="material"><input type="hidden" name="course" value="${course.id}"><input type="hidden" name="id" value="${item.id || ""}">
    <div class="form-body">
      <label class="field">Material title<input type="text" name="title" value="${e(item.title || "")}" placeholder="e.g. Fractions and ratios" required maxlength="100"></label>
      <label class="field">Type<select name="type">${["Lecture notes", "Worksheet", "Slides", "Reading"].map((type) => `<option ${item.type === type ? "selected" : ""}>${type}</option>`).join("")}</select></label>
      <label class="field">Description<textarea name="description" placeholder="What students should review" maxlength="320" rows="3">${e(item.description || "")}</textarea></label>
      <label class="field file-field"><span>${icon("upload", 17)} Attach a file</span><input type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg"><small>Up to 2 MB. ${item.file ? "Current attachment " + e(item.file.name) : "Publish a sample handout by leaving this blank."}</small></label>
      <p class="form-error" role="alert" hidden></p>
    </div><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button type="submit" class="button primary">${item.id ? "Save material" : "Publish material"}</button></footer>
  </form>`;
}
