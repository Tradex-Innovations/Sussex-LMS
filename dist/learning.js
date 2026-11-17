import { courses, students, teachers } from "./data.js";
import { icon } from "./icons.js";
import { avatar, badge, button, childSelect, courseIcon, emptyState, escapeHtml as e, iconTile, pageHeading } from "./ui.js";

export function courseMaterials(state, courseId) {
  return state.materials.filter((item) => item.course === courseId);
}

function rosterAvatars(ids) {
  const roster = ids.map((id) => students.find((person) => person.id === id)).filter(Boolean);
  return `<span class="roster-avatars">${roster.slice(0, 3).map((person) => avatar(person, "tiny")).join("")}<span>${roster.length} ${roster.length === 1 ? "student" : "students"}</span></span>`;
}

function adminCourses(state) {
  return `
    ${pageHeading("Course management", "Assign teachers and students to the school’s courses.", button("Assign course", "assign", { iconName: "plus", focus: "assign-main" }))}
    <section class="surface">
      <header class="panel-heading"><div><h2>School courses</h2><p>${courses.length} courses across grades 6 and 8</p></div>${iconTile("book", "green", "small-tile")}</header>
      <div class="table-scroll">
        <table class="course-table">
          <thead><tr><th scope="col">Course</th><th scope="col">Assigned teacher</th><th scope="col">Students</th><th scope="col">Materials</th><th scope="col"><span class="sr-only">Actions</span></th></tr></thead>
          <tbody>${courses.map((course) => {
            const entry = state.assignments[course.id];
            const teacher = teachers.find((item) => item.id === entry.teacher);
            return `<tr>
              <td><div class="item-cell">${courseIcon(course)}<div><strong>${course.title}</strong><span>Grade ${course.grade} · ${course.code}</span></div></div></td>
              <td>${teacher ? `<div class="teacher-cell">${avatar(teacher, "tiny")}${teacher.name}</div>` : "Unassigned"}</td>
              <td>${rosterAvatars(entry.students)}</td>
              <td>${courseMaterials(state, course.id).length}</td>
              <td>${button("Edit assignment", "assign", { value: course.id, variant: "secondary compact", iconName: "edit", focus: `assign-${course.id}` })}</td>
            </tr>`;
          }).join("")}</tbody>
        </table>
      </div>
    </section>`;
}

function teacherSelect(teacher) {
  return `<label class="profile-select">
    ${avatar(teacher, "small")}
    <span class="sr-only">Preview as teacher</span>
    <select data-change="teacher" data-focus="teacher-select">
      ${teachers.map((person) => `<option value="${person.id}" ${person.id === teacher.id ? "selected" : ""}>${person.name}</option>`).join("")}
    </select>
    ${icon("chevronDown", 15)}
  </label>`;
}

function courseCard(course, state, child) {
  const materialCount = courseMaterials(state, course.id).length;
  const teacher = teachers.find((person) => person.id === state.assignments[course.id].teacher);
  const done = child ? courseMaterials(state, course.id).filter((material) => state.completed[child.id]?.includes(material.id)).length : 0;
  return `<article class="surface course-card">
    <div class="course-card-banner tone-${course.tone}">${courseIcon(course)}${badge(`Grade ${course.grade}`, "white")}</div>
    <div class="course-card-body">
      <h2>${course.title}</h2>
      <p>${course.summary}</p>
      ${child ? `<div class="course-meta">${icon("user", 16)} ${teacher?.name ?? "Teacher unassigned"}</div>
        <div class="course-progress"><progress value="${done}" max="${materialCount || 1}" aria-label="Course progress"></progress><span>${done} of ${materialCount} done</span></div>`
        : `<div class="course-meta">${icon("users", 16)} ${state.assignments[course.id].students.length} enrolled <span>·</span> ${materialCount} ${materialCount === 1 ? "material" : "materials"}</div>`}
      ${button(child ? "View materials" : "Manage materials", "open-course", { value: course.id, variant: "secondary", end: "arrowRight", focus: `open-${course.id}` })}
    </div>
  </article>`;
}

function materialRow(item, state, child) {
  const done = child && state.completed[child.id]?.includes(item.id);
  const fileLabel = item.file?.name?.split(".").at(-1)?.toUpperCase() || "TXT";
  return `<article class="material-row">
    ${iconTile("file", "neutral", "small-tile")}
    <div class="material-info">
      <strong>${e(item.title)}</strong>
      <span>${e(item.type)} · ${e(fileLabel)} · ${e(item.date)}</span>
      ${item.description ? `<p>${e(item.description)}</p>` : ""}
    </div>
    <div class="material-actions">
      ${button("Download", "download", { value: item.id, variant: "secondary compact", iconName: "download", extra: `aria-label="Download ${e(item.title)}"` })}
      ${child ? button(done ? "Done" : "Mark done", "complete", { value: item.id, iconName: done ? "check" : "circleDot", variant: done ? "completed compact" : "secondary compact", focus: `done-${item.id}`, extra: `aria-pressed="${Boolean(done)}"` }) : ""}
    </div>
  </article>`;
}

function courseDetail(course, state, child) {
  const items = courseMaterials(state, course.id);
  const teacher = teachers.find((person) => person.id === state.assignments[course.id].teacher);
  const done = child ? items.filter((item) => state.completed[child.id]?.includes(item.id)).length : 0;
  return `
    ${button("All courses", "close-course", { iconName: "back", variant: "back-link", focus: "all-courses" })}
    ${pageHeading(course.title, `Grade ${course.grade} · ${teacher?.name ?? "Teacher unassigned"}`,
      child ? childSelect(child) : button("Add material", "add-material", { value: course.id, iconName: "plus", focus: "add-material" }))}
    <section class="surface materials-card">
      <header class="panel-heading"><div><h2>Course materials</h2><p>${child ? `${done} of ${items.length} completed` : `${items.length} published`}</p></div>${courseIcon(course)}</header>
      ${child && items.length ? `<div class="material-progress"><progress value="${done}" max="${items.length}" aria-label="Course progress"></progress></div>` : ""}
      <div class="materials-list">
        ${items.length ? items.map((item) => materialRow(item, state, child)).join("") : emptyState("file", "No materials yet", child ? "Your teacher’s materials will appear here." : "Add lecture notes, slides, or a worksheet for this class.")}
      </div>
    </section>`;
}

export function coursesPage(role, { state, teacher, child, courseId }) {
  if (role === "admin") return adminCourses(state);
  const isParent = role === "parent";
  const visible = courses.filter((course) => {
    const item = state.assignments[course.id];
    return isParent ? item.students.includes(child.id) : item.teacher === teacher.id;
  });
  const current = visible.find((course) => course.id === courseId);
  if (current) return courseDetail(current, state, isParent ? child : null);
  return `
    ${pageHeading(isParent ? "My courses" : "Teaching workspace", isParent ? "Download class materials and keep track of completed lessons." : "Manage lecture notes, worksheets, and slides for your classes.", isParent ? childSelect(child) : teacherSelect(teacher))}
    ${visible.length ? `<div class="course-grid">${visible.map((course) => courseCard(course, state, isParent ? child : null)).join("")}</div>`
      : `<section class="surface">${emptyState("book", "No courses assigned", "Assigned courses will appear here.")}</section>`}`;
}

export function assignmentForm(courseId, state) {
  const course = courses.find((item) => item.id === courseId) || courses[0];
  const current = state.assignments[course.id];
  return `<form data-form="assignment">
    <div class="form-body">
      <label class="field">Course
        <select name="course" data-change="assignment-course">
          ${courses.map((item) => `<option value="${item.id}" ${item.id === course.id ? "selected" : ""}>${item.title} · Grade ${item.grade}</option>`).join("")}
        </select>
      </label>
      <label class="field">Assigned teacher
        <select name="teacher" required>
          ${teachers.map((teacher) => `<option value="${teacher.id}" ${teacher.id === current.teacher ? "selected" : ""}>${teacher.name}</option>`).join("")}
        </select>
      </label>
      <fieldset class="roster-picker">
        <legend>Enrolled students · Grade ${course.grade}</legend>
        ${students.filter((student) => student.grade === course.grade).map((student) => `<label class="roster-check">
          <input type="checkbox" name="students" value="${student.id}" ${current.students.includes(student.id) ? "checked" : ""}>
          ${avatar(student, "tiny")}<span>${student.name}</span>
        </label>`).join("")}
      </fieldset>
      <p class="form-error" role="alert" hidden></p>
    </div>
    <footer class="dialog-actions">
      ${button("Cancel", "close-dialog", { variant: "secondary" })}
      <button type="submit" class="button primary">${icon("check", 17)} Save assignment</button>
    </footer>
  </form>`;
}

export function materialForm(course) {
  return `<form data-form="material">
    <input type="hidden" name="course" value="${course.id}">
    <div class="form-body">
      <label class="field">Material title<input type="text" name="title" placeholder="e.g. Fractions and ratios" required maxlength="100"></label>
      <label class="field">Type<select name="type"><option>Lecture notes</option><option>Worksheet</option><option>Slides</option><option>Reading</option></select></label>
      <label class="field">Description <span class="field-optional">Optional</span><textarea name="description" placeholder="What students should review" maxlength="320" rows="3"></textarea></label>
      <label class="field file-field">
        <span>${icon("upload", 17)} Attach a file <span class="field-optional">Optional</span></span>
        <input type="file" name="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.png,.jpg,.jpeg">
        <small>Up to 2 MB. Leave blank to publish a sample handout.</small>
      </label>
      <p class="form-error" role="alert" hidden></p>
    </div>
    <footer class="dialog-actions">
      ${button("Cancel", "close-dialog", { variant: "secondary" })}
      <button type="submit" class="button primary">${icon("upload", 17)} Publish material</button>
    </footer>
  </form>`;
}

