import { roles, sectionFor } from "./data.js";

const permissions = {
  chairman: ["branch.edit", "roles.manage", "students.edit", "courses.assign", "courses.teacher", "materials.publish", "transport.manage", "library.manage", "stores.books.manage", "stores.uniforms.manage"],
  principal: ["roles.manage", "students.edit", "courses.assign", "courses.teacher", "materials.publish", "transport.manage", "library.manage", "stores.books.manage", "stores.uniforms.manage"],
  vice_principal: ["students.edit", "courses.assign", "courses.teacher", "materials.publish", "transport.manage", "library.manage", "stores.books.manage", "stores.uniforms.manage"],
  section_head: ["courses.assign", "courses.teacher"],
  coordinator: ["courses.assign"],
  class_teacher: ["attendance.mark"],
  teacher: [],
  admin: ["students.edit", "courses.assign", "courses.teacher"],
  transport: ["transport.manage"],
  librarian: ["library.manage", "stores.books.manage"],
  uniform_store: ["stores.uniforms.manage"],
  parent: ["materials.complete", "stores.reserve"],
};

export function can(context, permission) {
  return Boolean(context && permissions[context.role]?.includes(permission));
}

export function contextFor(state, role, accountId, branchId, grantIndex) {
  if (!Object.hasOwn(roles, role)) return null;
  const eligible = state.accounts.filter((person) => person.grants.some((grant) => grant.role === role));
  const account = eligible.find((person) => person.id === accountId) || eligible[0];
  if (!account) return null;
  const requested = account.grants[grantIndex];
  const grant = requested?.role === role ? requested : account.grants.find((item) => item.role === role);
  const branch = role === "chairman" ? (branchId === "all" || state.branches.some((item) => item.id === branchId) ? branchId : "all") : grant.branch;
  return { role, account, grant, branch, name: roles[role].name };
}

export function withinScope(context, record) {
  if (!context || !record) return false;
  const branch = context.role === "chairman" ? context.branch : context.grant?.branch || context.branch;
  if (branch !== "all" && record.branch !== branch) return false;
  if (context.role === "section_head") return sectionFor(record.grade) === context.grant.section;
  if (context.role === "coordinator") return Number(record.grade) === Number(context.grant.grade);
  if (context.role === "class_teacher") return record.className === context.grant.className && Number(record.grade) === Number(context.grant.grade);
  return true;
}

export function linkedChildren(state, context) {
  return context?.role === "parent" ? state.students.filter((student) => student.guardians.includes(context.account.id) && (context.family ? state.accounts.find((person) => person.id === context.account.id)?.grants.some((grant) => grant.role === "parent" && grant.branch === student.branch) : withinScope(context, student) && (!context.studentId || student.id === context.studentId))) : [];
}

export function visibleStudents(state, context) {
  if (context.role === "parent") return linkedChildren(state, context);
  const visible = state.students.filter((student) => withinScope(context, student));
  if (context.role !== "teacher") return visible;
  const courses = visibleCourses(state, context);
  return visible.filter((student) => courses.some((course) => course.branch === student.branch && course.grade === student.grade && course.className === student.className && state.assignments[course.id].students.includes(student.id)));
}

export function visibleCourses(state, context, child) {
  return state.courses.filter((course) => {
    const assignment = state.assignments[course.id];
    if (context.role === "parent") {
      const student = linkedChildren(state, context).find((student) => student.id === child?.id), selection = state.studentSubjects?.[student?.id];
      return Boolean(student && selection && selection.branch === student.branch && selection.grade === student.grade && selection.className === student.className && selection.subjects.includes(course.id) && assignment?.students.includes(student.id) && course.branch === student.branch && course.grade === student.grade && course.className === student.className);
    }
    if (!withinScope(context, course)) return false;
    return context.role !== "teacher" || assignment.teacher === context.account.id;
  });
}

export function canPublish(state, context, course) {
  return withinScope(context, course) && (can(context, "materials.publish") ||
    (["teacher", "class_teacher"].includes(context.role) && state.assignments[course.id]?.teacher === context.account.id));
}

export function visibleBuses(state, context, child) {
  if (!context || !roles[context.role]?.pages.includes("transport")) return [];
  if (context.role === "parent") {
    const linked = linkedChildren(state, context).find((student) => student.id === child?.id);
    return state.buses.filter((bus) => linked && bus.id === linked.bus && bus.branch === linked.branch);
  }
  return state.buses.filter((bus) => withinScope(context, bus));
}

export function branchTeachers(state, branch) {
  return state.accounts.filter((person) => person.grants.some((grant) => ["teacher", "class_teacher"].includes(grant.role) && grant.branch === branch));
}

export function visibleOrders(state, context) {
  return state.orders.filter((order) => context.role === "parent" ? order.parent === context.account.id : context.branch === "all" || order.branch === context.branch);
}

export function assignableRoles(context) {
  const all = Object.keys(roles).filter((role) => role !== "chairman");
  return context.role === "chairman" ? all : context.role === "principal" ? all.filter((role) => role !== "principal") : [];
}

export function canManageGrant(context, grant) {
  return can(context, "roles.manage") && assignableRoles(context).includes(grant.role) &&
    (context.role === "chairman" || grant.branch === context.branch);
}
