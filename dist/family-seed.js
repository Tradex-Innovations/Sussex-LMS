// Additive migration; never replace saved accounts, payments or user decisions.
export function migrateFamilyPortal(state) {
  if (state.familyPortalVersion) return state;
  for (const [id, login] of [["parent", "FAMILY-1001"], ["parent_l", "FAMILY-1002"]]) {
    const account = state.accounts.find((item) => item.id === id);
    if (account && !account.familyLogin) account.familyLogin = login;
  }
  state.feeInvoices ||= []; state.feePayments ||= []; state.feeCheckouts ||= [];
  state.feeReminders ||= []; state.communications ||= []; state.consentResponses ||= [];
  state.notificationReads ||= {}; state.transportAlerts ||= [];
  const demoBus = state.buses.find((bus) => bus.id === "01" && bus.branch === "colombo");
  if (demoBus && !state.transportAlerts.length) state.transportAlerts.push({ id: "bus-alert-demo-delay", branch: demoBus.branch, busId: demoBus.id, kind: "late", message: "Bus 01 is running approximately 10 minutes late. Please wait at your usual pickup point. School transport will share any further update here.", at: "2026-11-26T01:45:00.000Z", by: "Demo school transport" });
  state.trackingSettings ||= {};
  // Explicit presenter clock, independent of device timezone. Parents cannot change it.
  state.transportClock ||= { mode: "demo", date: "2026-11-26", time: "07:15" };
  for (const student of state.students) {
    const id = "fee-demo-" + student.id;
    if (state.feeInvoices.some((item) => item.id === id)) continue;
    state.feeInvoices.push({ id, branch: student.branch, studentId: student.id, title: "Term 3 school fees", due: "2026-11-25", createdAt: "2026-11-26T01:00:00.000Z", by: "Demo seed", lines: [{ title: "Tuition", amount: 2400000 }, { title: "School facilities", amount: 100000 }] });
    if (["kavin", "thevin"].includes(student.id)) state.feePayments.push({ id: "receipt-demo-" + student.id, invoiceId: id, branch: student.branch, studentId: student.id, amount: 1000000, method: "School office (demo)", status: "success", at: "2026-11-24T04:00:00.000Z", by: "Demo seed", reference: "DEMO-PART-" + student.admissionNumber });
  }
  const teacher = state.accounts.find((item) => item.id === "dilini");
  const grant = teacher?.grants.find((item) => item.role === "class_teacher" && item.branch === "colombo" && item.className === "8A");
  const students = grant ? state.students.filter((item) => item.branch === grant.branch && item.grade === grant.grade && item.className === grant.className) : [];
  if (students.length) state.communications.push({ id: "event-demo-trip8a", kind: "event", channel: "letter", title: "Grade 8 discovery trip", message: "Our class will visit the National Museum. Please confirm whether your child may participate. Bring a packed lunch and water bottle. School transport is arranged.", eventDate: "2026-12-04", deadline: "2026-12-01", location: "National Museum, Colombo", branch: grant.branch, grade: grant.grade, className: grant.className, courseId: "", author: teacher.id, by: teacher.name, audience: "whole", studentIds: students.map((item) => item.id), recipients: students.flatMap((item) => item.guardians.map((parentId) => ({ studentId: item.id, parentId }))), status: "published", at: "2026-11-26T01:00:00.000Z" });
  state.familyPortalVersion = 1;
  return state;
}
