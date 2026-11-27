// One-time browser migration: retain existing enrolments and user edits.
export function migrateAcademicPortal(state) {
  if (state.academicPortalVersion) return state;
  const existingStudents = new Set(state.students.map((student) => student.id));
  const science = state.courses.find((item) => item.id === "science8");
  if (science && state.accounts.some((person) => person.id === "nuwan" && person.grants.some((grant) => grant.role === "teacher" && grant.branch === science.branch)) && !state.courses.some((item) => item.id === "science8b")) {
    state.courses.push({ ...science, id: "science8b", code: "SCI 08 B", className: "8B" });
    const used = new Set(state.students.map((student) => student.admissionNumber));
    const ids = ["dineth8b", "senuli8b"], names = ["Dineth Senanayake", "Senuli Herath"];
    ids.forEach((id, index) => {
      if (state.students.some((student) => student.id === id)) return;
      let number = 1010; while (used.has("NET-" + number)) number++;
      used.add("NET-" + number);
      state.students.push({ id, name: names[index], admissionNumber: "NET-" + number, initials: index ? "SH" : "DS", grade: 8, className: "8B", branch: science.branch, guardians: [], tone: "blue" });
    });
    state.assignments.science8b = { teacher: "nuwan", students: ids.filter((id) => state.students.some((student) => student.id === id && student.branch === science.branch && student.className === "8B" && student.grade === 8)) };
  }
  state.studentSubjects = Object.fromEntries(state.students.map((student) => [student.id, {
    branch: student.branch, grade: student.grade, className: student.className,
    subjects: state.courses.filter((course) => existingStudents.has(student.id) && course.branch === student.branch && course.grade === student.grade && course.className === student.className && state.assignments[course.id]?.students.includes(student.id)).map((course) => course.id),
    by: "Imported demo enrolment", source: "migration", at: "2026-11-23T03:00:00.000Z",
  }]));
  state.classNotices = [];
  const classes = new Set();
  for (const account of state.accounts) for (const grant of account.grants.filter((grant) => grant.role === "class_teacher")) {
    const key = [grant.branch, grant.grade, grant.className].join(":");
    if (classes.has(key)) continue;
    classes.add(key);
    state.classNotices.push({ id: "notice-demo-" + key, branch: grant.branch, grade: grant.grade, className: grant.className, title: "This week in our class", message: "Please check your child’s subjects and homework in the parent portal. Bring the pupil’s books and a water bottle each school day.", author: account.id, by: account.name, status: "published", createdAt: "2026-11-23T03:00:00.000Z", updatedAt: "2026-11-23T03:00:00.000Z" });
  }
  state.homework = [
    ["math8", "Practise linear equations", "Complete questions 1–5 from the equations worksheet. Show each step in your exercise book.", "2026-11-24"],
    ["science8", "Label a plant cell", "Draw a plant cell and label the nucleus, cell wall, cell membrane and chloroplasts.", "2026-11-25"],
    ["science8b", "Compare animal and plant cells", "Write three differences between an animal cell and a plant cell in your exercise book.", "2026-11-26"],
  ].filter(([id]) => state.courses.some((course) => course.id === id)).map(([course, title, instructions, due]) => {
    const subject = state.courses.find((item) => item.id === course), author = state.accounts.find((person) => person.id === state.assignments[course]?.teacher);
    return { id: "homework-demo-" + course, course, branch: subject.branch, grade: subject.grade, className: subject.className, title, instructions, due, author: author?.id || "", by: author?.name || "Demo teacher", status: "published", createdAt: "2026-11-23T03:00:00.000Z", updatedAt: "2026-11-23T03:00:00.000Z" };
  });
  state.homeworkCompleted = {};
  state.noticeReads = {};
  state.academicPortalVersion = 1;
  return state;
}
