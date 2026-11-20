import { sampleGradeEnrollment } from "./school-sample.js";

export const subjects = [
  { id: "mathematics", name: "Mathematics" },
  { id: "science", name: "Science" },
  { id: "english", name: "English" },
  { id: "ict", name: "ICT" },
];

const sampleAverages = [77, 70, 80, 74, 79, 84, 86, 78, 88, 81, 83, 85, 87, 91, 82, 89, 85, 83, 78, 79];
const round = (value) => Math.round(value * 10) / 10;

export function assessmentResult(branch, options) {
  const index = branch.directoryIndex;
  const subjectIndex = subjects.findIndex((subject) => subject.id === options.subject);
  const cohort = Math.min(sampleGradeEnrollment(branch, options.grade), 36 + ((index * 7 + options.grade * 3) % 35));
  const variation = subjectIndex === 0 ? 0 : ((index * 3 + subjectIndex * 7) % 17) - 8;
  const termDip = options.term === 3 && index % 6 === 1 ? -8 : 0;
  const baseline = sampleAverages[index] + variation + termDip - (3 - options.term) * (2 + index % 3) - (options.grade - 8) * 0.4;
  const allMarks = Array.from({ length: cohort }, (_, student) => Math.max(12, Math.min(100, Math.round(baseline + ((student * 11 + index * 3) % 57) - 28))));
  const classMatch = String(options.className || "").match(/^(\d+)([AB])$/);
  const marks = classMatch && Number(classMatch[1]) === Number(options.grade) ? allMarks.filter((_, index) => index % 2 === (classMatch[2] === "A" ? 0 : 1)) : allMarks;
  const count = marks.length;
  return {
    branch,
    count,
    mean: round(marks.reduce((sum, mark) => sum + mark, 0) / count),
    passRate: round(marks.filter((mark) => mark >= 50).length / count * 100),
    distinctionRate: round(marks.filter((mark) => mark >= 75).length / count * 100),
    passed: marks.filter((mark) => mark >= 50).length,
    marks,
  };
}

export function rankedResults(branches, options) {
  return branches.map((branch) => {
    const result = assessmentResult(branch, options);
    const previous = options.term > 1 ? assessmentResult(branch, { ...options, term: options.term - 1 }) : null;
    return { ...result, change: previous ? round(result.mean - previous.mean) : null };
  }).sort((a, b) => b.mean - a.mean || a.branch.name.localeCompare(b.branch.name)).map((result, index) => ({ ...result, rank: index + 1 }));
}

export function networkSummary(results) {
  const count = results.reduce((sum, result) => sum + result.count, 0);
  return {
    count,
    mean: count ? round(results.reduce((sum, result) => sum + result.marks.reduce((total, mark) => total + mark, 0), 0) / count) : 0,
    passRate: count ? round(results.reduce((sum, result) => sum + result.passed, 0) / count * 100) : 0,
  };
}

export function performanceTone(mean) {
  return mean >= 85 ? "green" : mean >= 75 ? "blue" : "amber";
}

export function branchActivity(state, branchId, category = "all") {
  const sample = [
    { id: "sample-notes-" + branchId, branch: branchId, category: "academic", message: "Mathematics revision notes published for Grade 8.", actor: "Sample teacher", at: "2026-11-19T03:20:00Z", sample: true },
    { id: "sample-trip-" + branchId, branch: branchId, category: "transport", message: "Morning transport check completed.", actor: "Sample transport team", at: "2026-11-19T02:45:00Z", sample: true },
    { id: "sample-library-" + branchId, branch: branchId, category: "library", message: "Library book orders prepared for school collection.", actor: "Sample librarian", at: "2026-11-18T08:30:00Z", sample: true },
  ];
  return [...(state.activity || []).filter((entry) => entry.branch === branchId), ...sample]
    .filter((entry) => category === "all" || entry.category === category)
    .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 12);
}

