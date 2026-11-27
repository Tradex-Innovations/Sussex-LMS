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
export const feeCardMethods = ["Debit card", "Credit card"];
export const demoFeeCards = {
  visa: { number: "4242 4242 4242 4242", brand: "Visa", last4: "4242", outcome: "success" },
  mastercard: { number: "5555 5555 5555 4444", brand: "Mastercard", last4: "4444", outcome: "success" },
  declined: { number: "4000 0000 0000 0002", brand: "Visa", last4: "0002", outcome: "declined" },
};
export function feePaymentMethod(payment) {
  if (payment.method === "Demo bank") return "Previous payment";
  if (payment.method === "Demo card") return "Card (earlier prototype)";
  return payment.method + (payment.card ? " · " + payment.card.brand + " •••• " + payment.card.last4 : "");
}
function ownCheckout(state, context, id) {
  const ctx = ctxFor(state, context), checkout = (state.feeCheckouts || []).find(item => item.id === id && item.parentId === ctx.account.id), invoice = feeInvoices(state, ctx).find(item => item.id === checkout?.invoiceId);
  if (ctx.role !== "parent" || !checkout || !invoice) fail("This checkout is outside your family.");
  return { ctx, checkout, invoice };
}
export function prepareFeeCard(state, context, input) {
  const { checkout, invoice } = ownCheckout(state, context, input.id);
  if (checkout.status !== "pending") fail("Start a new checkout to try again.");
  if (invoice.balance !== checkout.amount || invoice.balance <= 0) fail("The balance changed. Close this checkout and review the invoice again.");
  const number = String(input.cardNumber || ""), card = Object.values(demoFeeCards).find(card => card.number.replaceAll(" ", "") === number.replaceAll(" ", ""));
  if (!feeCardMethods.includes(input.method)) fail("Choose Debit card or Credit card.");
  if (!card || !/^[\d ]+$/.test(number)) fail("Use one of the supplied demo Visa or Mastercard numbers. Do not enter a real card.");
  if (!String(input.cardholder || "").trim() || String(input.cardholder).length > 80) fail("Enter the name on the demo card.");
  if (input.expiry !== "12/30" || input.cvv !== "123") fail("Use the demo expiry 12/30 and security code 123.");
  // Retain only a masked display summary. PAN, CVV, holder input and verification code never enter stored state.
  checkout.method = input.method; checkout.card = { brand: card.brand, last4: card.last4 }; checkout.gatewayOutcome = card.outcome; checkout.stage = "verification";
  return checkout;
}
export function finishFeeCheckout(state, context, input) {
  const { ctx, checkout, invoice } = ownCheckout(state, context, input.id);
  if (input.method && !feeCardMethods.includes(input.method)) fail("Choose Debit card or Credit card.");
  if (checkout.status === "success") return state.feePayments.find(item => item.checkoutId === checkout.id);
  if (checkout.status !== "pending") fail("Start a new checkout to try again.");
  const cancelled = input.outcome === "cancelled";
  if (!cancelled) {
    if (invoice.balance !== checkout.amount || invoice.balance <= 0) fail("The balance changed. Close this checkout and review the invoice again.");
    if (checkout.stage !== "verification" || !feeCardMethods.includes(checkout.method) || !checkout.card) fail("Complete the card details before paying.");
    if (input.method && input.method !== checkout.method) fail("The selected card method changed. Review the card details again.");
    if (input.otp !== "123456") fail("Enter the six-digit demo verification code 123456.");
    if (!["success", "declined"].includes(checkout.gatewayOutcome) || input.outcome && input.outcome !== checkout.gatewayOutcome) fail("Use the supplied card to determine the simulated payment result.");
  }
  checkout.status = cancelled ? "cancelled" : checkout.gatewayOutcome; checkout.finishedAt = now();
  if (checkout.status !== "success") return checkout;
  const payment = { id: "receipt-" + crypto.randomUUID(), reference: "DEMO-" + crypto.randomUUID().slice(0, 8).toUpperCase(), checkoutId: checkout.id, invoiceId: invoice.id, studentId: invoice.studentId, branch: invoice.branch, parentId: ctx.account.id, amount: checkout.amount, method: checkout.method, card: { ...checkout.card }, status: "success", at: now(), by: ctx.account.name };
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
