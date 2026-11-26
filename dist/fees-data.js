import { recordContext } from "./records.js";
import { linkedChildren, withinScope } from "./access.js";
export const feeToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const now = () => new Date().toISOString();
const fail = (message) => { throw new Error(message); };
function ctxFor(state, context) { const ctx = recordContext(state, context); if (!["parent", "admin", "principal", "chairman"].includes(ctx.role)) fail("School fee access is not assigned to this role."); return ctx; }
export function feeStudents(state, context) {
  let ctx; try { ctx = ctxFor(state, context); } catch { return []; }
  return ctx.role === "parent" ? linkedChildren(state, ctx) : state.students.filter((student) => withinScope(ctx, student));
}
export function feeInvoices(state, context) {
  const students = feeStudents(state, context);
  return (state.feeInvoices || []).filter((invoice) => students.some((student) => student.id === invoice.studentId && student.branch === invoice.branch)).map((invoice) => {
    const payments = (state.feePayments || []).filter((item) => item.invoiceId === invoice.id && item.status === "success" && item.branch === invoice.branch && item.studentId === invoice.studentId);
    const total = invoice.lines.reduce((sum, line) => sum + line.amount, 0), paid = payments.reduce((sum, item) => sum + item.amount, 0), balance = total - paid;
    return { ...invoice, total, paid, balance, payments, status: balance === 0 ? "paid" : invoice.due < feeToday() ? "overdue" : paid ? "part-paid" : "unpaid" };
  });
}
export function saveFeeInvoice(state, context, input) {
  const ctx = ctxFor(state, context); if (ctx.role !== "admin") fail("Only the School Administrator issues fee invoices.");
  const student = feeStudents(state, ctx).find((item) => item.id === input.studentId);
  const amount = Number(input.amount), title = String(input.title || "").trim();
  if (!student || !title || title.length > 120 || !Number.isSafeInteger(Math.round(amount * 100)) || Math.round(amount * 100) <= 0 || Math.abs(amount * 100 - Math.round(amount * 100)) > 0.000001 || amount > 1000000 || !/^\d{4}-\d{2}-\d{2}$/.test(input.due) || Number.isNaN(Date.parse(input.due))) fail("Choose a school student, valid fee title, due date and amount up to LKR 1,000,000.");
  const invoice = { id: "fee-" + crypto.randomUUID(), branch: student.branch, studentId: student.id, title, due: input.due, lines: [{ title, amount: Math.round(amount * 100) }], by: ctx.account.name, createdAt: now() };
  state.feeInvoices ||= []; state.feeInvoices.push(invoice); return invoice;
}
export function beginFeeCheckout(state, context, invoiceId) {
  const ctx = ctxFor(state, context), invoice = feeInvoices(state, ctx).find((item) => item.id === invoiceId);
  if (ctx.role !== "parent" || !invoice || invoice.balance <= 0) fail("Choose an unpaid invoice for your linked child.");
  const existing = (state.feeCheckouts || []).find((item) => item.invoiceId === invoiceId && item.parentId === ctx.account.id && item.status === "pending" && item.amount === invoice.balance);
  if (existing) return existing;
  const checkout = { id: "checkout-" + crypto.randomUUID(), parentId: ctx.account.id, invoiceId, amount: invoice.balance, status: "pending", at: now() };
  state.feeCheckouts ||= []; state.feeCheckouts.push(checkout); return checkout;
}
export function finishFeeCheckout(state, context, input) {
  const ctx = ctxFor(state, context), checkout = (state.feeCheckouts || []).find((item) => item.id === input.id && item.parentId === ctx.account.id), invoice = feeInvoices(state, ctx).find((item) => item.id === checkout?.invoiceId);
  if (ctx.role !== "parent" || !checkout || !invoice) fail("This checkout is outside your family.");
  if (checkout.status === "success") return state.feePayments.find((item) => item.checkoutId === checkout.id);
  if (checkout.status !== "pending") fail("Start a new checkout to try again.");
  if (!["success", "declined", "cancelled"].includes(input.outcome) || !["Demo card", "Demo bank"].includes(input.method)) fail("Choose a demo payment method and outcome.");
  if (input.outcome === "success" && (invoice.balance !== checkout.amount || invoice.balance <= 0)) fail("The balance changed. Close this checkout and review the invoice again.");
  checkout.status = input.outcome; checkout.method = input.method; checkout.finishedAt = now();
  if (input.outcome !== "success") return checkout;
  const payment = { id: "receipt-" + crypto.randomUUID(), reference: "DEMO-" + crypto.randomUUID().slice(0, 8).toUpperCase(), checkoutId: checkout.id, invoiceId: invoice.id, studentId: invoice.studentId, branch: invoice.branch, parentId: ctx.account.id, amount: checkout.amount, method: input.method, status: "success", at: now(), by: ctx.account.name };
  state.feePayments ||= []; state.feePayments.push(payment); return payment;
}
export function recordOfficePayment(state, context, input) {
  const ctx = ctxFor(state, context), invoice = feeInvoices(state, ctx).find((item) => item.id === input.invoiceId), amount = Math.round(Number(input.amount) * 100), reference = String(input.reference || "").trim();
  if (ctx.role !== "admin" || !invoice || !Number.isSafeInteger(amount) || amount <= 0 || Math.abs(Number(input.amount) * 100 - amount) > 0.000001 || amount > invoice.balance || !reference || reference.length > 80) fail("Enter an office reference and a payment within the outstanding school balance.");
  if ((state.feePayments || []).some((item) => item.branch === invoice.branch && item.reference === reference)) fail("That office reference has already been recorded.");
  const payment = { id: "receipt-" + crypto.randomUUID(), reference, invoiceId: invoice.id, studentId: invoice.studentId, branch: invoice.branch, amount, method: "School office (demo)", status: "success", at: now(), by: ctx.account.name };
  state.feePayments ||= []; state.feePayments.push(payment); return payment;
}
export function sendFeeReminders(state, context, ids) {
  const ctx = ctxFor(state, context); if (ctx.role !== "admin" || !Array.isArray(ids) || !ids.length || new Set(ids).size !== ids.length) fail("Select unpaid school invoices.");
  const invoices = feeInvoices(state, ctx); if (!ids.every((id) => invoices.some((item) => item.id === id && item.balance > 0))) fail("Select only unpaid invoices in your school.");
  const reminders = ids.flatMap((id) => { const invoice = invoices.find((item) => item.id === id), student = state.students.find((item) => item.id === invoice.studentId);
    return student.guardians.filter((parentId) => state.accounts.some((person) => person.id === parentId && person.grants.some((grant) => grant.role === "parent" && grant.branch === student.branch))).flatMap((parentId) => (state.feeReminders || []).some((item) => item.invoiceId === id && item.parentId === parentId && item.day === feeToday()) ? [] : [{ id: "reminder-" + crypto.randomUUID(), invoiceId: id, studentId: student.id, parentId, branch: student.branch, day: feeToday(), at: now(), by: ctx.account.name }]); });
  state.feeReminders ||= []; state.feeReminders.push(...reminders); return reminders;
}
export function feesCSV(state, context) {
  const ctx = ctxFor(state, context); if (ctx.role === "parent") fail("School register exports are staff only.");
  const quote = (value) => '"' + String(/^[\s]*[=+@-]/.test(String(value)) ? "'" + value : value).replaceAll('"', '""') + '"';
  const rows = [["DEMO school fee register", "Student", "Admission", "Class", "Due", "Total LKR", "Paid LKR", "Unpaid LKR", "Status"], ...feeInvoices(state, ctx).map((invoice) => { const student = state.students.find((item) => item.id === invoice.studentId); return [invoice.title, student.name, student.admissionNumber, student.className, invoice.due, invoice.total / 100, invoice.paid / 100, invoice.balance / 100, invoice.status]; })];
  return rows.map((row) => row.map(quote).join(",")).join("\r\n");
}
