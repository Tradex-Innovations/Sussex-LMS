import { nextAdmissionNumber, roles, sections } from "./data.js";
import { assignableRoles, can, canManageGrant, visibleStudents } from "./access.js";
import { icon } from "./icons.js";
import { avatar, badge, button, emptyState, escapeHtml as e, iconTile, pageHeading } from "./ui.js";

export function scopeLabel(grant, state) {
  const branch = state.branches.find((item) => item.id === grant.branch)?.name || "All branches";
  const section = sections.find((item) => item.id === grant.section)?.name;
  return [branch, section, grant.className ? "Class " + grant.className : grant.grade !== undefined ? "Grade " + grant.grade : "", grant.bus ? "BUS " + grant.bus : ""].filter(Boolean).join(" · ");
}

export function peoplePage({ state, context }) {
  const students = visibleStudents(state, context);
  return `${pageHeading("Students & guardians", "Student records and linked parent accounts within your assigned scope.", can(context, "students.edit") ? button("Add student", "edit-student", { iconName: "plus" }) : "")}
    <section class="surface"><header class="panel-heading"><div><h2>Student directory</h2><p>${students.length} students in your scope</p></div></header>
    <div class="table-scroll"><table class="course-table"><thead><tr><th>Student</th><th>Branch / Class</th><th>Linked guardians</th><th>Subjects</th><th>Actions</th></tr></thead><tbody>
      ${students.map((student) => {
        const guardians = state.accounts.filter((person) => student.guardians.includes(person.id));
        const assigned = state.courses.filter((course) => state.assignments[course.id].students.includes(student.id));
        const materials = state.materials.filter((item) => assigned.some((course) => course.id === item.course));
        const done = materials.filter((item) => state.completed[student.id]?.includes(item.id)).length;
        return `<tr><td><div class="teacher-cell">${avatar(student, "small")}<div><strong>${e(student.name)}</strong><div class="secondary-text">${e(student.admissionNumber)}</div></div></div></td><td>${e(state.branches.find((branch) => branch.id === student.branch)?.name)}<div class="secondary-text">Class ${e(student.className)}</div></td>
          <td>${guardians.map((person) => e(person.name)).join(", ") || "No guardian linked"}</td><td>${assigned.length} enrolled<div class="secondary-text">${done} / ${materials.length} materials done</div></td>
          <td>${can(context, "students.edit") ? button("Edit student", "edit-student", { value: student.id, variant: "secondary compact" }) : badge("View access", "neutral")}</td></tr>`;
      }).join("")}</tbody></table></div>${!students.length ? emptyState("users", "No students in this scope", "Students assigned to this section or class will appear here.") : ""}</section>`;
}

export function studentForm(state, context, student = {}) {
  const branches = state.branches.filter((branch) => context.branch === "all" || branch.id === context.branch);
  const branch = student.branch || branches[0].id;
  const guardians = state.accounts.filter((person) => person.grants.some((grant) => grant.role === "parent" && grant.branch === branch));
  return `<form data-form="student"><input type="hidden" name="id" value="${student.id || ""}"><div class="form-body">
    <label class="field">Full name<input name="name" value="${e(student.name || "")}" required maxlength="80"></label>\n    <label class="field">Admission number<input name="admissionNumber" value="${e(student.admissionNumber || nextAdmissionNumber(state.students))}" required maxlength="32" pattern="[A-Za-z0-9][A-Za-z0-9-]{2,31}" autocapitalize="characters"></label>
    <label class="field">Branch<select aria-label="Branch" name="branch" data-change="student-branch" ${student.id ? "disabled" : ""}>${branches.map((item) => `<option value="${item.id}" ${item.id === branch ? "selected" : ""}>${e(item.name)}</option>`).join("")}</select></label>
    <label class="field">Grade<select aria-label="Grade" name="grade">${Array.from({ length: 14 }, (_, grade) => `<option value="${grade}" ${grade === (student.grade ?? 8) ? "selected" : ""}>${grade === 0 ? "Preschool" : "Grade " + grade}</option>`).join("")}</select></label>
    <label class="field">Class<input name="className" value="${e(student.className || "8A")}" required maxlength="8" pattern="[0-9]{1,2}[A-Za-z]{1,2}"></label>
    ${student.id ? '<p class="chairman-filter-note">Changing grade or class removes subject enrolments that no longer match.</p>' : ""}<fieldset class="roster-picker"><legend>Linked guardian accounts</legend>${guardians.map((person) => `<label class="roster-check"><input type="checkbox" name="guardians" value="${person.id}" ${student.guardians?.includes(person.id) ? "checked" : ""}>${e(person.name)}</label>`).join("") || '<p class="secondary-text">A Principal can appoint a parent account from Roles & access.</p>'}</fieldset>
    <p class="form-error" role="alert" hidden></p></div><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button class="button primary" type="submit">Save student</button></footer></form>`;
}

export function accessPage({ state, context }) {
  const grants = state.accounts.flatMap((person) => person.grants.map((grant, index) => ({ person, grant, index })))
    .filter(({ grant }) => context.role === "chairman" ? context.branch === "all" || grant.branch === context.branch || grant.role === "chairman" : grant.branch === context.branch);
  return `${pageHeading("Roles & access", "Appointments combine a role with its branch, section, class, or bus.", button("Assign role", "assign-role", { iconName: "plus" }))}
    <section class="surface hierarchy-panel">
      <div class="hierarchy-owner">${icon("school", 20)}<strong>Chairman</strong><span>All branches</span></div><div class="hierarchy-connector"></div>
      <div class="hierarchy-principal"><strong>Principal</strong><span>Full assigned branch access</span></div>
      <div class="hierarchy-lanes">
        <div><strong>Vice Principal</strong><span>Section Heads</span><span>Grade Coordinators</span><span>Class & Subject Teachers</span></div>
        <div><strong>School Administrator</strong><span>Students & guardians</span><span>Subject enrollment</span></div>
        <div><strong>Transport Coordinator</strong><span>Bus routes & assignments</span><span>Drivers</span></div>
        <div><strong>Book Store Officer</strong><span>Pupil’s books & stock</span><span>Student reservations & collection</span></div>
      <div><strong>Uniform Store Officer</strong><span>Uniform sizes & stock</span><span>Student reservations & collection</span></div></div><p class="hierarchy-family">${icon("users", 17)} Parents access linked children’s bus trips, subjects, and their child’s book and uniform reservations.</p>
    </section>
    <section class="surface section-gap"><header class="panel-heading"><div><h2>Role assignments</h2><p>One person can hold several scoped roles</p></div></header>
      <div class="table-scroll"><table class="course-table"><thead><tr><th>Person</th><th>Role</th><th>Assigned scope</th><th>Actions</th></tr></thead><tbody>
      ${grants.map(({ person, grant, index }) => `<tr><td><div class="teacher-cell">${avatar(person, "tiny")}${e(person.name)}</div></td><td>${roles[grant.role].name}</td><td>${e(scopeLabel(grant, state))}</td><td>${canManageGrant(context, grant) ? button("Remove role", "remove-role", { value: person.id + "|" + index, variant: "secondary compact" }) : badge("Oversight", "neutral")}</td></tr>`).join("")}
      </tbody></table></div></section>`;
}

export function roleForm(state, context, draft = {}) {
  const eligible = assignableRoles(context);
  const role = eligible.includes(draft.role) ? draft.role : eligible[0];
  const branches = state.branches.filter((branch) => context.branch === "all" || branch.id === context.branch);
  const branchId = branches.some((branch) => branch.id === draft.branch) ? draft.branch : branches[0].id;
  const buses = state.buses.filter((bus) => bus.branch === branchId);
  return `<form data-form="role"><div class="form-body">
    <label class="field">Person<select aria-label="Person" name="person"><option value="new" ${!draft.person || draft.person === "new" ? "selected" : ""}>Create a demo account</option>${state.accounts.map((person) => `<option value="${person.id}" ${draft.person === person.id ? "selected" : ""}>${e(person.name)}</option>`).join("")}</select></label>
    <label class="field">Name for new account<input name="name" value="${e(draft.name || "")}" maxlength="80" placeholder="Full name"></label>
    <label class="field">Role<select aria-label="Role" name="role" data-change="role-scope">${eligible.map((id) => `<option value="${id}" ${id === role ? "selected" : ""}>${roles[id].name}</option>`).join("")}</select></label>
    <label class="field">Branch<select aria-label="Branch" name="branch" data-change="role-scope">${branches.map((branch) => `<option value="${branch.id}" ${branch.id === branchId ? "selected" : ""}>${e(branch.name)}</option>`).join("")}</select></label>
    ${role === "section_head" ? `<label class="field">Section<select aria-label="Section" name="section">${sections.map((section) => `<option value="${section.id}">${section.name}</option>`).join("")}</select></label>` : ""}
    ${["coordinator", "class_teacher"].includes(role) ? '<label class="field">Grade<input name="grade" type="number" min="0" max="13" required value="8"></label>' : ""}
    ${role === "class_teacher" ? '<label class="field">Class<input name="className" required maxlength="8" pattern="[0-9]{1,2}[A-Za-z]{1,2}" value="8A"></label>' : ""}
    ${role === "driver" ? `<label class="field">Bus<select aria-label="Bus" name="bus" required>${buses.map((bus) => `<option value="${bus.id}">BUS ${bus.id}</option>`).join("")}</select></label>` : ""}
    <p class="form-error" role="alert" hidden></p>
    </div><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button class="button primary" type="submit">Save role</button></footer></form>`;
}

export function branchForm(branch) {
  return `<form data-form="branch"><input type="hidden" name="id" value="${branch.id}"><div class="form-body">
    <label class="field">Branch name<input name="name" required maxlength="45" value="${e(branch.name)}"></label>
    <label class="field">Location<input name="location" required maxlength="60" value="${e(branch.location)}"></label>
    <p class="form-error" role="alert" hidden></p></div><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button type="submit" class="button primary">Save branch</button></footer></form>`;
}

export function busForm(bus, state) {
  const drivers = state.accounts.filter((person) => person.grants.some((grant) => grant.role === "driver" && grant.branch === bus.branch));
  const students = state.students.filter((student) => student.branch === bus.branch);
  return `<form data-form="bus"><input type="hidden" name="id" value="${bus.id}"><div class="form-body">
    <label class="field">Route name<input name="name" required maxlength="60" value="${e(bus.name)}"></label>
    <label class="field">Assigned driver<select aria-label="Assigned driver" name="driver"><option value="">No driver assigned</option>${drivers.map((person) => `<option value="${person.id}" ${person.id === bus.driverId ? "selected" : ""}>${e(person.name)}</option>`).join("")}</select></label>
    <fieldset class="roster-picker"><legend>Route stops in travel order</legend>${bus.stops.map((stop, index) => `<label class="field stop-field">Stop ${index + 1}<input name="stops" required maxlength="60" value="${e(index === bus.stops.length - 1 ? state.branches.find((branch) => branch.id === bus.branch)?.school : stop)}" ${index === bus.stops.length - 1 ? "readonly" : ""}></label>`).join("")}</fieldset>
    <p class="chairman-filter-note">A driver serves one bus at a time; moving a driver leaves their former bus unassigned. The school destination is fixed and demo map paths are illustrative.</p><fieldset class="roster-picker"><legend>Students assigned to this bus</legend>${students.map((student) => `<label class="roster-check"><input type="checkbox" name="students" value="${student.id}" ${student.bus === bus.id ? "checked" : ""}>${e(student.name)} · ${e(student.className)}</label>`).join("")}</fieldset>
    <p class="form-error" role="alert" hidden></p></div><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button type="submit" class="button primary">Save bus assignment</button></footer></form>`;
}
