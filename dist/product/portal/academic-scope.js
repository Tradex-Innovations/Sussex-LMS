import { sections, sectionFor } from "./data.js";

// Resolve the real appointment before sharing academic read models between roles.
export function academicScope(state, context) {
  if (!["section_head", "coordinator", "class_teacher"].includes(context?.role) || context.grant?.role !== context.role) return null;
  const grant = state.accounts.find((person) => person.id === context.account?.id)?.grants.find((grant) => grant.role === context.role && grant.branch === context.grant.branch &&
    (context.role === "section_head" ? grant.section === context.grant.section : (Number(grant.grade) === Number(context.grant.grade) && (context.role !== "class_teacher" || grant.className === context.grant.className))));
  const branch = state.branches.find((branch) => branch.id === grant?.branch);
  const section = sections.find((section) => section.id === (context.role === "section_head" ? grant?.section : sectionFor(grant?.grade)));
  if (!grant || !branch || !section) return null;
  if (context.role === "class_teacher" && !new RegExp("^" + Number(grant.grade) + "[A-Z]{1,2}$").test(grant.className || "")) return null;
  const grades = context.role === "section_head" ? [...section.grades] : [Number(grant.grade)];
  return { branch, section, grades, grade: context.role === "section_head" ? null : grades[0], className: context.role === "class_teacher" ? grant.className : null,
    key: context.role + ":" + branch.id + ":" + (context.role === "section_head" ? section.id : grades[0] + (context.role === "class_teacher" ? ":" + grant.className : "")),
    context: { ...context, grant, branch: grant.branch } };
}
