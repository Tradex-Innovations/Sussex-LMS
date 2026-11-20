import { assessmentResult, subjects } from "./network-analytics.js";
import { branchStaff, round } from "./chairman-data.js";

export function schoolClassResults(state, branch, academic) {
  const staff = branchStaff(state, branch);
  const subject = subjects.find((item) => item.id === academic.subject)?.name || "Subject";
  return ["A", "B"].map((letter, index) => {
    const className = academic.grade + letter;
    const result = assessmentResult(branch, { ...academic, className });
    const course = state.courses.find((course) => course.branch === branch.id && course.grade === Number(academic.grade) && course.className === className && course.title === subject);
    const assigned = course && staff.find((person) => person.id === state.assignments[course.id]?.teacher);
    const candidates = staff.filter((person) => person.category === "teachers" && person.subject.includes(subject));
    const teacher = assigned || candidates[index % (candidates.length || 1)] || staff.find((person) => person.category === "teachers");
    return { ...result, className, teacher, course, subject, name: className };
  }).filter((row) => !academic.className || academic.className === "all" || academic.className === row.className);
}

export function schoolAcademicComparison(state, branch, academic, mode = "classes") {
  const classes = schoolClassResults(state, branch, academic);
  let rows;
  if (mode === "subjects") rows = subjects.map((subject) => ({ ...assessmentResult(branch, { ...academic, subject: subject.id }), key: subject.id, name: subject.name }));
  else if (mode === "grades") rows = [6, 8, 10, 11].map((grade) => ({ ...assessmentResult(branch, { ...academic, grade, className: "all" }), key: String(grade), name: "Grade " + grade }));
  else if (mode === "teachers") {
    const groups = new Map();
    for (const row of classes) {
      const key = row.teacher.id;
      if (!groups.has(key)) groups.set(key, { teacher: row.teacher, classes: [], marks: [] });
      groups.get(key).classes.push(row.className); groups.get(key).marks.push(...row.marks);
    }
    rows = [...groups].map(([key, group]) => ({ key, name: group.teacher.name, teacher: group.teacher, detail: group.classes.join(", "),
      mean: round(group.marks.reduce((sum, mark) => sum + mark, 0) / group.marks.length),
      passRate: round(group.marks.filter((mark) => mark >= 50).length / group.marks.length * 100), count: group.marks.length }));
  } else rows = classes.map((row) => ({ ...row, key: row.className, name: "Class " + row.className, detail: row.teacher.name }));
  const columns = [["school", "School"], ["name", { classes: "Class", subjects: "Subject", grades: "Grade", teachers: "Teacher" }[mode] || "Class"]];
  if (["classes", "teachers"].includes(mode)) columns.push(["detail", mode === "teachers" ? "Classes" : "Teacher"]);
  columns.push(["mean", "Average mark %"], ["passRate", "Pass rate %"], ["count", "Assessed"]);
  return { mode, rows: rows.map((row) => ({ ...row, school: branch.name })), columns };
}

export function schoolAcademicAttention(state, branch) {
  const rows = [];
  for (const grade of [6, 8, 10, 11]) for (const subject of subjects) {
    rows.push(...schoolClassResults(state, branch, { grade, subject: subject.id, term: 3, className: "all" }).map((row) => ({ ...row, grade, subjectId: subject.id })));
  }
  return rows.sort((a, b) => a.mean - b.mean);
}
