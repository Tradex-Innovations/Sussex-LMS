import { can, branchTeachers, visibleCourses, withinScope } from "./access.js";
import { sectionFor } from "./data.js";

// Resolve the active appointment against current state before any record write.
export function recordContext(state, context) {
  if (context?.grant?.role !== context?.role) throw new Error("A current appointment is required to change records.");
  const account = state.accounts.find((person) => person.id === context?.account?.id);
  const grant = account?.grants.find((grant) => grant.role === context?.role && grant.branch === context.grant?.branch &&
    grant.section === context.grant?.section && grant.grade === context.grant?.grade && grant.className === context.grant?.className && grant.bus === context.grant?.bus);
  if (!grant) throw new Error("A current appointment is required to change records.");
  const branch = context.role === "chairman" ? context.branch : grant.branch;
  if (branch !== "all" && !state.branches.some((item) => item.id === branch)) throw new Error("Choose an appointed school.");
  return { ...context, account, grant, branch };
}
export function saveStudentRecord(state, context, input) {
  const ctx = recordContext(state, context), existing = input.id ? state.students.find((student) => student.id === input.id) : null;
  if (!can(ctx, "students.edit")) throw new Error("Student record permission is required.");
  if (input.id && !existing) throw new Error("Choose an existing student in your school.");
  const branch = existing?.branch || input.branch;
  if (!state.branches.some((item) => item.id === branch) || !withinScope(ctx, { branch })) throw new Error("This student is outside your assigned school.");
  const grade = Number(input.grade), className = String(input.className || "").trim().toUpperCase(), name = String(input.name || "").trim(), admissionNumber = String(input.admissionNumber || "").trim().toUpperCase();
  if (!name || name.length > 80) throw new Error("Enter a student name of up to 80 characters.");
  if (!Number.isInteger(grade) || !sectionFor(grade) || !new RegExp("^" + grade + "[A-Z]{1,2}$").test(className)) throw new Error("Enter a class matching the selected grade, such as 8A.");
  if (!/^[A-Z0-9][A-Z0-9-]{2,31}$/.test(admissionNumber)) throw new Error("Use 3–32 letters, numbers, or hyphens for the admission number.");
  if (state.students.some((student) => student.id !== input.id && student.admissionNumber?.trim().toUpperCase() === admissionNumber)) throw new Error("That admission number belongs to another student.");
  if (input.guardians !== undefined && !Array.isArray(input.guardians)) throw new Error("Select valid guardian accounts.");
  const guardians = [...new Set(input.guardians || [])];
  if (!guardians.every((id) => state.accounts.some((person) => person.id === id && person.grants.some((grant) => grant.role === "parent" && grant.branch === branch)))) throw new Error("Select guardian accounts from this branch.");
  const student = { ...existing, id: existing?.id || "student-" + crypto.randomUUID(), name, admissionNumber, initials: name.split(/\s+/).map((word) => word[0]).slice(0, 2).join(""), grade, className, branch, guardians, tone: existing?.tone || "green" };
  if (existing) state.students[state.students.findIndex((item) => item.id === existing.id)] = student; else state.students.push(student);
  for (const course of state.courses) if (course.branch !== branch || course.grade !== grade || course.className !== className) state.assignments[course.id].students = state.assignments[course.id].students.filter((id) => id !== student.id);
  return student;
}
export function saveCourseAssignment(state, context, input) {
  const ctx = recordContext(state, context), course = visibleCourses(state, ctx).find((course) => course.id === input.course);
  if (!can(ctx, "courses.assign") || !course) throw new Error("Choose a course within your assigned academic scope.");
  const teacher = can(ctx, "courses.teacher") ? input.teacher : state.assignments[course.id].teacher, students = input.students || [];
  if (!branchTeachers(state, course.branch).some((person) => person.id === teacher)) throw new Error("Select a teacher assigned to this branch.");
  if (!Array.isArray(students) || new Set(students).size !== students.length || !students.every((id) => state.students.some((student) => student.id === id && student.branch === course.branch && student.grade === course.grade && student.className === course.className))) throw new Error("Select matching-class students from this course’s school.");
  state.assignments[course.id] = { ...state.assignments[course.id], teacher, students: [...students] };
  return state.assignments[course.id];
}
