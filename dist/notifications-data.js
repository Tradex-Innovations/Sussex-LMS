import { recordContext } from "./records.js";
import { linkedChildren, withinScope } from "./access.js";
import { communications, communicationChildren, consentFor } from "./communications-data.js";
import { feeInvoices, feeToday } from "./fees-data.js";
import { visibleClassNotices, visibleHomework } from "./academic-portal-data.js";
export function saveTransportAlert(state, context, input) {
  const ctx = recordContext(state, context), bus = state.buses.find((item) => item.id === input.busId && withinScope(ctx, item));
  if (ctx.role !== "transport" || !bus || !["late", "breakdown", "other", "resolved"].includes(input.kind)) throw new Error("Choose your school bus and an alert type.");
  const message = String(input.message || "").trim();
  if (!message || message.length > 500) throw new Error("Enter a parent-facing update of up to 500 characters.");
  state.transportAlerts ||= []; const alert = { id: "bus-alert-" + crypto.randomUUID(), branch: bus.branch, busId: bus.id, kind: input.kind, message, at: new Date().toISOString(), by: ctx.account.name };
  state.transportAlerts.push(alert); return alert;
}
export function notifications(state, context) {
  let ctx; try { ctx = recordContext(state, context); } catch { return []; }
  if (!["parent", "class_teacher"].includes(ctx.role)) return [];
  const children = ctx.role === "parent" ? linkedChildren(state, ctx) : state.students.filter((student) => withinScope(ctx, student));
  const items = [];
  const pushBus = (id, bus, title, message, at, revision = "") => {
    const students = children.filter((student) => student.bus === bus.id && student.branch === bus.branch);
    if (students.length) items.push({ id: id + revision, title, message, at, category: "Transport", urgent: true, page: ctx.role === "parent" ? "transport" : "inbox", studentIds: students.map((student) => student.id) });
  };
  for (const bus of state.buses) if (bus.status === "delayed") pushBus("signal-" + bus.branch + bus.id, bus, "Bus " + bus.id + " · signal delayed", "The bus location signal is delayed. School transport is checking for an update.", "2026-11-26T01:00:00.000Z");
  for (const task of state.viceFollowups || []) {
    const bus = state.buses.find((item) => item.id === task.busId && item.branch === task.branch);
    if (task.category !== "transport" || !bus) continue;
    const incident = (state.driverIncidents || []).find((item) => item.taskId === task.id);
    const kind = incident?.kind === "breakdown" ? "breakdown" : incident?.kind === "delay" ? "delay" : "transport issue";
    pushBus("task-" + task.id, bus, `Bus ${bus.id} · ${task.status === "resolved" ? "issue resolved" : kind}`, task.status === "resolved" ? "School transport has marked this issue resolved." : "A transport concern has been reported to school. Please watch for further updates.", task.notes?.[0]?.at || incident?.createdAt || "2026-11-26T01:00:00.000Z", ":" + task.status);
  }
  for (const alert of state.transportAlerts || []) {
    const bus = state.buses.find((item) => item.id === alert.busId && item.branch === alert.branch);
    if (bus) pushBus(alert.id, bus, `Bus ${bus.id} · ${{ late: "running late", breakdown: "breakdown", other: "travel update", resolved: "issue resolved" }[alert.kind]}`, alert.message, alert.at);
  }
  if (ctx.role === "parent") {
    for (const event of communications(state, ctx)) for (const child of communicationChildren(state, ctx, event)) {
      const response = consentFor(state, event.id, child.id), pending = event.kind === "event" && event.status === "published" && !response && feeToday() <= event.deadline;
      items.push({ id: event.id + ":" + child.id + ":" + event.status + ":" + (pending ? event.reminders?.at(-1) || "initial" : "responded"), title: event.title, message: event.status === "cancelled" ? "This communication / event was cancelled." : event.kind === "event" ? `Consent ${response ? "recorded" : "requested"} · ${event.eventDate} · Respond by ${event.deadline}` : `${event.channel === "email" ? "Email" : "Letter"} from ${event.by}`, category: event.kind === "event" ? "Events" : "Letters & email", at: event.at, page: event.kind === "event" ? "events" : "communications", todo: pending, studentIds: [child.id] });
    }
    for (const child of children) {
      for (const notice of visibleClassNotices(state, ctx, child)) items.push({ id: notice.id + ":" + child.id + ":" + notice.updatedAt, title: notice.title, message: "Class notice from " + notice.by, category: "Notices", at: notice.updatedAt, page: "notices", studentIds: [child.id] });
      for (const homework of visibleHomework(state, ctx, child)) if (!state.homeworkCompleted?.[child.id]?.[homework.id]) items.push({ id: homework.id + ":" + child.id, title: homework.title, message: "Homework due " + homework.due, category: "Homework", at: homework.updatedAt, page: "homework", todo: true, studentIds: [child.id] });
    }
    for (const invoice of feeInvoices(state, ctx).filter((item) => item.balance > 0)) {
      const reminder = (state.feeReminders || []).filter((item) => item.invoiceId === invoice.id && item.parentId === ctx.account.id).at(-1);
      items.push({ id: "fee-" + invoice.id + ":" + (reminder?.id || "initial"), title: invoice.title + (reminder ? " · reminder" : ""), message: `LKR ${(invoice.balance / 100).toLocaleString("en-LK")} outstanding · Due ${invoice.due}`, category: "Fees", page: "fees", at: reminder?.at || invoice.createdAt, todo: true, studentIds: [invoice.studentId] });
    }
  }
  return items.map((item) => ({ ...item, read: Boolean(state.notificationReads?.[ctx.role + ":" + ctx.account.id + ":" + item.id]) })).sort((a, b) => Number(b.urgent || false) - Number(a.urgent || false) || String(b.at).localeCompare(String(a.at)));
}
export function markNotification(state, context, id) {
  const ctx = recordContext(state, context); if (!notifications(state, ctx).some((item) => item.id === id)) throw new Error("This notification is outside your current access.");
  state.notificationReads ||= {}; state.notificationReads[ctx.role + ":" + ctx.account.id + ":" + id] = new Date().toISOString();
}
