import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, loadState } from '../dist/data.js';
import { contextFor, linkedChildren, visibleCourses } from '../dist/access.js';
import { authenticateParent, parentContext } from '../dist/parent-login.js';
import { migrateFamilyPortal } from '../dist/family-seed.js';
import { feeToday, feeInvoices, beginFeeCheckout, finishFeeCheckout, recordOfficePayment, sendFeeReminders, saveFeeInvoice, feesCSV } from '../dist/fees-data.js';
import { communicationClasses, communicationStudents, communications, publishCommunication, respondConsent, consentFor, cancelCommunication, remindEvent, eventCSV } from '../dist/communications-data.js';
import { letterHTML } from '../dist/communications.js';
import { notifications, markNotification, saveTransportAlert } from '../dist/notifications-data.js';
import { trackingPolicy, saveTrackingPolicy, completeTrackingTrip } from '../dist/transport-privacy.js';
import { networkFleet, networkTelemetry } from '../dist/network-fleet.js';
import { generateCoordinatorReport, visibleCoordinatorReports } from '../dist/coordinator-data.js';
import { saveCoordinatorTask } from '../dist/coordinator-data.js';
const setup = () => { const state = freshState(); return { state, parent: parentContext(state, authenticateParent(state, 'FAMILY-1001', '1234')), other: parentContext(state, authenticateParent(state, 'FAMILY-1002', '1234')), admin: contextFor(state, 'admin', 'admin_c'), teacher: contextFor(state, 'class_teacher', 'dilini'), subject: contextFor(state, 'teacher', 'nuwan'), transport: contextFor(state, 'transport', 'transport_c') }; };
const eventInput = (extra = {}) => ({ classId: 'class', audience: 'whole', students: [], kind: 'event', channel: 'letter', title: 'Class trip', message: 'Please confirm attendance.', eventDate: '2099-12-12', deadline: '2099-12-01', location: 'Colombo Museum', ...extra });
const policyInput = (extra = {}) => ({ pickupStart: '06:00', pickupEnd: '08:30', dropoffStart: '13:00', dropoffEnd: '16:00', mode: 'demo', date: '2026-11-26', time: '07:15', ...extra });

test('Family ID and old admission aliases expose siblings but never another family; cross-school links need a current grant', () => {
 const { state, parent, other } = setup(); assert.deepEqual(linkedChildren(state, parent).map(c => c.id), ['amaya', 'kavin']); assert.equal(parent.studentId, 'amaya');
 assert.equal(parentContext(state, authenticateParent(state, 'SCN-1002', '1234')).studentId, 'kavin'); assert.equal(authenticateParent(state, 'FAMILY-1001', 'bad'), null);
 assert.ok(linkedChildren(state, other).every(c => !linkedChildren(state, parent).includes(c)));
 const meera = state.students.find(s => s.id === 'meera'); meera.guardians.push('parent'); assert.ok(!linkedChildren(state, parent).includes(meera));
 state.accounts.find(a => a.id === 'parent').grants.push({ role: 'parent', branch: 'lakeside' }); assert.ok(linkedChildren(state, parent).includes(meera));
 const selected = parentContext(state, { parentId: 'parent', selectedChildId: 'meera' }); assert.equal(selected.branch, 'lakeside'); assert.ok(visibleCourses(state, selected, meera).length);
 meera.guardians = []; assert.equal(parentContext(state, { parentId: 'parent', selectedChildId: 'meera' }), null);
});
test('Family migration preserves stored decisions, accounts, invoice edits and payment records without reseeding', () => {
 const { state } = setup(); state.feeInvoices[0].title = 'Custom invoice'; state.feePayments.push({ id: 'keep-payment' }); state.communications = []; state.accounts.find(a => a.id === 'parent').familyLogin = 'CUSTOM-FAMILY';
 migrateFamilyPortal(state); assert.equal(state.communications.length, 0); assert.equal(state.feeInvoices[0].title, 'Custom invoice');
 globalThis.localStorage = { getItem: () => JSON.stringify(state) }; const loaded = loadState(); assert.equal(loaded.accounts.find(a => a.id === 'parent').familyLogin, 'CUSTOM-FAMILY'); assert.ok(loaded.feePayments.some(p => p.id === 'keep-payment'));
 delete globalThis.localStorage;
});
test('School fees enforce parent family, administrative school and read-only leadership scopes', () => {
 const { state, parent, other, admin, teacher } = setup(); assert.equal(feeInvoices(state, parent).length, 2); assert.equal(feeInvoices(state, other).length, 2); assert.equal(feeInvoices(state, teacher).length, 0);
 const principal = contextFor(state, 'principal', 'principal_c'); assert.ok(feeInvoices(state, principal).every(i => i.branch === 'colombo'));
 assert.throws(() => saveFeeInvoice(state, principal, { studentId: 'amaya', title: 'Fee', amount: 100, due: feeToday() }), /Administrator/);
 const before = structuredClone(state); assert.throws(() => saveFeeInvoice(state, admin, { studentId: 'meera', title: 'Fee', amount: 100, due: feeToday() })); assert.deepEqual(state, before);
 const created = saveFeeInvoice(state, admin, { studentId: 'amaya', title: '=Unsafe CSV title', amount: '123.45', due: feeToday() }); assert.equal(created.lines[0].amount, 12345); assert.match(feesCSV(state, admin), /'=Unsafe CSV title/); assert.throws(() => feesCSV(state, parent), /staff only/);
});
test('Successful checkout is idempotent and only the owning family can settle it', () => {
 const { state, parent, other } = setup(), invoice = feeInvoices(state, parent)[0], checkout = beginFeeCheckout(state, parent, invoice.id);
 assert.equal(beginFeeCheckout(state, parent, invoice.id).id, checkout.id); const before = structuredClone(state);
 assert.throws(() => finishFeeCheckout(state, other, { id: checkout.id, method: 'Demo card', outcome: 'success' })); assert.deepEqual(state, before);
 const payment = finishFeeCheckout(state, parent, { id: checkout.id, method: 'Demo card', outcome: 'success' }); assert.match(payment.reference, /^DEMO-/); assert.equal(feeInvoices(state, parent)[0].balance, 0);
 assert.equal(finishFeeCheckout(state, parent, { id: checkout.id, method: 'Demo card', outcome: 'success' }).id, payment.id); assert.equal(state.feePayments.filter(p => p.checkoutId === checkout.id).length, 1);
 assert.throws(() => beginFeeCheckout(state, parent, invoice.id), /unpaid/); assert.ok(!JSON.stringify(state.feePayments).includes('4242'));
});
test('Declined/cancelled payments do not reduce fees; changed balances reject stale checkout and prevent overpayment', () => {
 const { state, parent, admin } = setup(), invoice = feeInvoices(state, parent)[0];
 for (const outcome of ['declined', 'cancelled']) { const checkout = beginFeeCheckout(state, parent, invoice.id); finishFeeCheckout(state, parent, { id: checkout.id, method: 'Demo bank', outcome }); assert.equal(feeInvoices(state, parent)[0].balance, invoice.balance); }
 const checkout = beginFeeCheckout(state, parent, invoice.id); recordOfficePayment(state, admin, { invoiceId: invoice.id, amount: 10, reference: 'office-test' });
 assert.throws(() => finishFeeCheckout(state, parent, { id: checkout.id, method: 'Demo card', outcome: 'success' }), /balance changed/);
 finishFeeCheckout(state, parent, { id: checkout.id, method: 'Demo card', outcome: 'cancelled' }); assert.equal(checkout.status, 'cancelled');
 assert.throws(() => recordOfficePayment(state, admin, { invoiceId: invoice.id, amount: 999999, reference: 'overpay' }));
 assert.throws(() => recordOfficePayment(state, admin, { invoiceId: invoice.id, amount: 10, reference: 'office-test' }), /already/);
});
test('Fee reminders validate the entire batch, skip missing guardians, deduplicate and reach only linked families', () => {
 const { state, admin, parent, other } = setup(), invoices = feeInvoices(state, admin), own = invoices.find(i => i.studentId === 'amaya'), missing = invoices.find(i => i.studentId === 'lohith'), foreign = state.feeInvoices.find(i => i.studentId === 'meera');
 const before = structuredClone(state); assert.throws(() => sendFeeReminders(state, admin, [own.id, foreign.id])); assert.deepEqual(state, before);
 assert.equal(sendFeeReminders(state, admin, [own.id, missing.id]).length, 1); assert.equal(sendFeeReminders(state, admin, [own.id]).length, 0);
 assert.ok(notifications(state, parent).some(n => n.title.includes('reminder'))); assert.ok(!notifications(state, other).some(n => n.title.includes('reminder')));
});
test('Whole-class and selected-student letters enforce exact class and current teacher assignments', () => {
 const { state, teacher, subject, parent, other } = setup();
 assert.deepEqual(communicationClasses(state, subject).map(c => c.id), ['science8', 'science8b']); assert.ok(communicationStudents(state, subject, 'science8b').every(s => s.className === '8B'));
 const selected = publishCommunication(state, teacher, eventInput({ kind: 'message', channel: 'email', audience: 'selected', students: ['amaya'] }));
 assert.deepEqual(selected.studentIds, ['amaya']); assert.equal(communications(state, parent, 'message').length, 1); assert.equal(communications(state, other, 'message').length, 0);
 const before = structuredClone(state); assert.throws(() => publishCommunication(state, teacher, eventInput({ audience: 'selected', students: ['amaya', 'kavin'] }))); assert.deepEqual(state, before);
 assert.throws(() => publishCommunication(state, subject, eventInput({ classId: 'science8b', audience: 'selected', students: ['amaya'] })));
 const item = publishCommunication(state, subject, eventInput({ classId: 'science8' })); state.assignments.science8.teacher = 'dilini'; assert.ok(!communications(state, subject).some(i => i.id === item.id));
 assert.doesNotMatch(letterHTML(state, parent, selected.id), /Lohith|Sara|parent_l/);
});
test('Consent is per child, rechecks guardian/class scope, retains response history and rejects expired or cancelled events', () => {
 const { state, teacher, parent, other } = setup(), event = publishCommunication(state, teacher, eventInput());
 assert.throws(() => respondConsent(state, other, { eventId: event.id, studentId: 'amaya', decision: 'yes', signature: other.account.name }));
 assert.throws(() => respondConsent(state, parent, { eventId: event.id, studentId: 'kavin', decision: 'yes', signature: parent.account.name }));
 respondConsent(state, parent, { eventId: event.id, studentId: 'amaya', decision: 'yes', signature: parent.account.name }); respondConsent(state, parent, { eventId: event.id, studentId: 'amaya', decision: 'no', signature: parent.account.name });
 assert.equal(consentFor(state, event.id, 'amaya').history[0].decision, 'yes'); assert.match(eventCSV(state, teacher, event.id), /Amaya Perera/); assert.doesNotMatch(eventCSV(state, teacher, event.id), /Kavin|Meera/);
 assert.equal(remindEvent(state, teacher, event.id), true); assert.equal(remindEvent(state, teacher, event.id), false);
 cancelCommunication(state, teacher, event.id); assert.throws(() => respondConsent(state, parent, { eventId: event.id, studentId: 'amaya', decision: 'yes', signature: parent.account.name }));
 const second = publishCommunication(state, teacher, eventInput()); second.deadline = '2000-01-01'; assert.throws(() => respondConsent(state, parent, { eventId: second.id, studentId: 'amaya', decision: 'yes', signature: parent.account.name }));
});
test('Transport alerts reach affected families and class teachers; staff issues never reveal private notes', () => {
 const { state, transport, parent, other, teacher } = setup(); const alert = saveTransportAlert(state, transport, { busId: '01', kind: 'breakdown', message: 'Replacement transport is being arranged.' });
 assert.ok(notifications(state, parent).some(n => n.id === alert.id)); assert.ok(notifications(state, teacher).some(n => n.id === alert.id)); assert.ok(!notifications(state, other).some(n => n.id === alert.id));
 saveCoordinatorTask(state, transport, { busId: '01', title: 'PRIVATE_TITLE', note: 'PRIVATE_NOTE', due: '2026-11-27', status: 'open' });
 assert.doesNotMatch(JSON.stringify(notifications(state, parent)), /PRIVATE_/); assert.ok(notifications(state, teacher).some(n => n.title.includes('breakdown')));
 markNotification(state, parent, alert.id); assert.ok(notifications(state, parent).find(n => n.id === alert.id).read); assert.ok(!notifications(state, teacher).find(n => n.id === alert.id).read);
 assert.throws(() => markNotification(state, other, alert.id)); assert.throws(() => saveTransportAlert(state, transport, { busId: '07', kind: 'late', message: 'Wrong school' }));
 state.students.find(s => s.id === 'amaya').bus = '02'; assert.ok(!notifications(state, parent).some(n => n.id === alert.id));
});
test('Tracking suppresses coordinates and routes outside weekday pickup/drop-off windows and after completion', () => {
 const { state, transport, parent } = setup(), bus = state.buses[0];
 for (const [time, visible] of [['05:59', false], ['06:00', true], ['08:30', false], ['13:00', true], ['16:00', false]]) { saveTrackingPolicy(state, transport, policyInput({ time })); assert.equal(trackingPolicy(state, bus).visible, visible, time); const fleet = networkFleet(state, state.branches); const current = fleet.find(b => b.id === bus.id); assert.equal(Boolean(networkTelemetry(current).position), visible); if (!visible) assert.equal(current.route, null); }
 saveTrackingPolicy(state, transport, policyInput({ date: '2026-11-28' })); assert.equal(trackingPolicy(state, bus).visible, false);
 saveTrackingPolicy(state, transport, policyInput({ time: '13:30' })); completeTrackingTrip(state, transport, bus.id); assert.equal(trackingPolicy(state, bus).visible, false);
 assert.throws(() => saveTrackingPolicy(state, parent, policyInput())); const before = structuredClone(state); assert.throws(() => saveTrackingPolicy(state, transport, policyInput({ pickupEnd: '14:00' }))); assert.deepEqual(state, before);
});
test('Management reports retain scoped coordinates outside Parent tracking hours', () => {
 const { state, transport } = setup(); const report = generateCoordinatorReport(state, transport, { reportType: 'fleet' }); state.coordinatorReports = [report];
 assert.ok(report.customRows.some(row => Number(row.lat) > 5)); saveTrackingPolicy(state, transport, policyInput({ time: '18:00' })); const visible = visibleCoordinatorReports(state, transport)[0]; assert.ok(visible.customRows.every(row => Number(row.lat) > 5 && Number(row.lon) > 79)); assert.ok(report.customRows.some(row => Number(row.lat) > 5));
});
test('Removed active appointments revoke fee and communications writes without state changes', () => {
 const { state, admin, teacher } = setup(); state.accounts.find(a => a.id === admin.account.id).grants = []; state.accounts.find(a => a.id === teacher.account.id).grants = [];
 const before = structuredClone(state); assert.throws(() => saveFeeInvoice(state, admin, { studentId: 'amaya', title: 'Fee', due: feeToday(), amount: 10 }), /appointment/); assert.throws(() => publishCommunication(state, teacher, eventInput()), /appointment/); assert.deepEqual(state, before);
});
