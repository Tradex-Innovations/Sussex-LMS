import { sections, sectionFor } from "./data.js";

// Resolve the real appointment before sharing academic read models between roles.
export function academicScope(state, context) {
  if (!["section_head", "coordinator"].includes(context?.role) || context.grant?.role !== context.role) return null;
  const grant = state.accounts.find((person) => person.id === context.account?.id)?.grants.find((grant) => grant.role === context.role && grant.branch === context.grant.branch &&
    (context.role === "section_head" ? grant.section === context.grant.section : Number(grant.grade) === Number(context.grant.grade)));
  const branch = state.branches.find((branch) => branch.id === grant?.branch);
  const section = sections.find((section) => section.id === (context.role === "section_head" ? grant?.section : sectionFor(grant?.grade)));
  if (!grant || !branch || !section) return null;
  const grades = context.role === "coordinator" ? [Number(grant.grade)] : [...section.grades];
  return { branch, section, grades, grade: context.role === "coordinator" ? grades[0] : null,
    key: context.role + ":" + branch.id + ":" + (context.role === "coordinator" ? grades[0] : section.id),
    context: { ...context, grant, branch: grant.branch } };
}
