import { linkedChildren } from "./access.js";
import { notifications, markNotification, saveTransportAlert } from "./notifications-data.js";
import { saveTrackingPolicy, completeTrackingTrip } from "./transport-privacy.js";
import { feeInvoices, saveFeeInvoice, beginFeeCheckout, prepareFeeCard, finishFeeCheckout, recordOfficePayment, sendFeeReminders, feesCSV } from "./fees-data.js";
import { invoiceDetails, invoiceForm, officeForm, checkoutView, checkoutProcessingView, receiptText } from "./fees.js";
import { publishCommunication, cancelCommunication, respondConsent, remindEvent, eventCSV } from "./communications-data.js";
import { composeForm, communicationPreview, consentForm, letterHTML } from "./communications.js";
import { escapeHtml as e, button } from "./ui.js";
function download(content, filename, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([content], { type: type + ";charset=utf-8" })), link = document.createElement("a"); link.href = url; link.download = filename; link.click(); setTimeout(() => URL.revokeObjectURL(url), 3000);
}
export function portalAction(name, value, api) {
  const { state, ctx, ui, update, render, showDialog, closeDialog, toast, selectChild } = api;
  try {
    const save = (fn, message) => { if (update(fn)) { closeDialog(); render(); if (message) toast(message); return true; } return false; };
    if (name === "family-child" || name === "family-bus") { if (selectChild(value)) { location.hash = "parent/" + (name === "family-bus" ? "transport" : "subjects"); render(); } }
    else if (name === "portal-complete-trip") save((next) => completeTrackingTrip(next, ctx, value), "Trip completed. GPS location hidden.");
    else if (name === "portal-read" || name === "portal-open") { const item = notifications(state, ctx).find((item) => item.id === value); if (!item) throw new Error("Notification no longer available."); if (save((next) => markNotification(next, ctx, value)) && name === "portal-open") { selectChild(item.studentIds[0]); location.hash = ctx.role + "/" + item.page; render(); } }
    else if (name === "portal-inbox-filter") { ui.inbox = value; render(); }
    else if (name === "portal-fee-tab") { ui.feeTab = value; render(); }
    else if (name === "portal-invoice-new" && ctx.role === "admin") showDialog("portal-invoice-new", "Issue school fee invoice", "Browser-local demo", invoiceForm(state, ctx));
    else if (name === "portal-invoice") showDialog("portal-invoice", "School fee invoice", "Demo school fees", invoiceDetails(state, ctx, value));
    else if (name === "portal-office" && ctx.role === "admin") showDialog("portal-office", "Record office payment", "Demo payment only", invoiceDetails(state, ctx, value) + officeForm(value));
    else if (name === "portal-pay") { let checkout; if (update((next) => { checkout = beginFeeCheckout(next, ctx, value); })) { render(); showDialog("portal-checkout", "Online school fee payment", "Visa & Mastercard · Debit or credit card", checkoutView(api.getState(), ctx, checkout.id)); } }
    else if (name === "portal-checkout-step") { const [id, step] = value.split("|"); if (!["review", "card", "card-visa", "card-mastercard", "card-declined", "verify"].includes(step)) return; showDialog("portal-checkout", "Online school fee payment", "Visa & Mastercard · Debit or credit card", checkoutView(state, ctx, id, step)); }
    else if (name === "portal-checkout-cancel") save((next) => finishFeeCheckout(next, ctx, { id: value, outcome: "cancelled" }), "Checkout cancelled. No payment recorded.");
    else if (name === "portal-receipt") download(receiptText(state, ctx, value), "school-demo-receipt.txt");
    else if (name === "portal-fees-export") download(feesCSV(state, ctx), "school-demo-fee-register.csv", "text/csv");
    else if (name === "portal-reminders-confirm") { let count = 0; if (save((next) => { count = sendFeeReminders(next, ctx, JSON.parse(value)).length; })) toast(count + " new portal reminders recorded. Duplicates or missing guardians were skipped."); }
    else if (name === "portal-compose") { if (!["class_teacher", "teacher"].includes(ctx.role)) throw new Error("Use a teaching workspace."); showDialog("portal-compose", value === "event" ? "Create event / trip" : "Compose email or letter", "Current teaching class only", composeForm(state, ctx, value)); }
    else if (name === "portal-consent") { const [id, childId] = value.split("|"); if (ctx.role !== "parent") throw new Error("Use the Parent portal."); showDialog("portal-consent", "Event consent", "Response for one child", consentForm(state, ctx, id, childId)); }
    else if (name === "portal-event-remind") { let created; if (save((next) => { created = remindEvent(next, ctx, value); })) toast(created ? "Pending parents reminded in their portal." : "Already reminded today."); }
    else if (name === "portal-cancel-communication") showDialog("portal-cancel", "Withdraw this communication?", "Parents will see it as cancelled. Previous responses remain recorded.", button("Confirm withdrawal", "portal-cancel-confirm", { value }));
    else if (name === "portal-cancel-confirm") save((next) => cancelCommunication(next, ctx, value), "Communication withdrawn.");
    else if (name === "portal-event-export") download(eventCSV(state, ctx, value), "school-demo-consent-register.csv", "text/csv");
    else if (name === "portal-letter") download(letterHTML(state, ctx, value), "school-letter.html", "text/html");
  } catch (error) { toast(error.message); }
}
export async function portalSubmit(mode, form, api) {
  const { state, ctx, update, render, showDialog, closeDialog, toast } = api, fd = new FormData(form), input = { ...Object.fromEntries(fd), students: fd.getAll("students") };
  const save = (fn, message) => { if (!update(fn)) return false; closeDialog(); render(); toast(message); return true; };
  try {
    if (mode === "portal-compose") { const preview = publishCommunication(structuredClone(state), ctx, input); showDialog("portal-preview", "Review communication", "Confirm the recipients before publishing", communicationPreview(state, preview, input)); }
    else if (mode === "portal-publish") save((next) => publishCommunication(next, ctx, input), "Shared with eligible guardian portals. External email is simulated.");
    else if (mode === "portal-consent") save((next) => respondConsent(next, ctx, input), "Consent response recorded for this child.");
    else if (mode === "portal-tracking") save((next) => saveTrackingPolicy(next, ctx, input), "Tracking hours updated.");
    else if (mode === "portal-transport-alert") save((next) => saveTransportAlert(next, ctx, input), "Alert added to family and class teacher inboxes.");
    else if (mode === "portal-invoice-new") save((next) => saveFeeInvoice(next, ctx, input), "Demo school fee invoice issued.");
    else if (mode === "portal-office") save((next) => recordOfficePayment(next, ctx, input), "Demo office payment recorded.");
    else if (mode === "portal-card-details") { prepareFeeCard(structuredClone(state), ctx, input); if (update(next => prepareFeeCard(next, ctx, input))) { render(); showDialog("portal-checkout", "Online school fee payment", "Visa & Mastercard · Debit or credit card", checkoutView(api.getState(), ctx, input.id, "verify")); } }
    else if (mode === "portal-checkout") {
      finishFeeCheckout(structuredClone(state), ctx, input);
      showDialog("portal-checkout", "Card payment", "", checkoutProcessingView());
      await new Promise(resolve => setTimeout(resolve, 750));
      const active = api.getContext();
      if (active?.role !== "parent" || active.account.id !== ctx.account.id) return;
      if (update(next => finishFeeCheckout(next, ctx, input))) { render(); showDialog("portal-checkout", "Payment confirmation", "", checkoutView(api.getState(), ctx, input.id)); }
      else { closeDialog(); render(); }
    }
    else if (mode === "portal-fee-reminders") {
      const ids = fd.getAll("invoiceIds"); sendFeeReminders(structuredClone(state), ctx, ids);
      const invoices = feeInvoices(state, ctx).filter((item) => ids.includes(item.id));
      showDialog("portal-reminder-preview", "Review fee reminders", "Delivered inside the Parent portal only", `<div class="portal-card">${invoices.map((invoice) => { const student = state.students.find((item) => item.id === invoice.studentId); const guardians = student.guardians.filter((id) => state.accounts.some((person) => person.id === id && person.grants.some((grant) => grant.role === "parent" && grant.branch === student.branch))); return `<p><strong>${e(student.name)}</strong> · LKR ${(invoice.balance / 100).toLocaleString("en-LK")}<br>${guardians.length ? guardians.length + " linked guardian(s)" : "No linked guardian — school follow-up required"}</p>`; }).join("")}${button("Send portal reminders", "portal-reminders-confirm", { value: JSON.stringify(ids) })}</div>`);
    }
  } catch (error) { const target = form.querySelector(".form-error"); if (target?.isConnected) { target.textContent = error.message; target.hidden = false; } else toast(error.message); }
}
export function portalChange(key, element, api) {
  const { state, ctx, ui, render, showDialog } = api;
  if (key === "portal-compose-class") { const values = Object.fromEntries(new FormData(element.form)); showDialog("portal-compose", "Compose class communication", "Current teaching class only", composeForm(state, ctx, values.kind, values)); }
  else if (key === "portal-compose-audience") element.form.querySelector(".recipient-list").hidden = element.value !== "selected";
  else { const field = { "portal-fee-child": "feeChild", "portal-fee-status": "feeStatus", "portal-fee-query": "feeQuery" }[key]; if (field) { ui[field] = element.value.slice(0, 120); render(); } }
}
