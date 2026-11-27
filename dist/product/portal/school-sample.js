// Shared illustrative enrolment model; these are not School's real enrolment figures.
export function sampleEnrollment(branch) {
  return 390 + ((branch.directoryIndex * 47 + 73) % 420);
}

export function sampleGradeEnrollment(branch, grade) {
  const total = sampleEnrollment(branch);
  return Math.floor(total / 13) + (Number(grade) <= total % 13 ? 1 : 0);
}
