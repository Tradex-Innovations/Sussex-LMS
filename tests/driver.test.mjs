import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, roles, loadState, saveState } from '../dist/data.js';
import { contextFor } from '../dist/access.js';
import { driverScope, driverChecks, driverViews, driverRuns, currentDriverRun, driverStudents, saveDriverReadiness, startDriverRun, confirmDriverStop, finishDriverRun, driverRecipients, saveDriverIncident, driverIncidents, driverTripCSV } from '../dist/driver-data.js';
import { assignDriver } from '../dist/transport-records.js';
import { createBoardingTrip, simulateBoardingTap, activeStudentCard } from '../dist/boarding-data.js';
import { coordinatorTasks, saveCoordinatorTask } from '../dist/coordinator-data.js';
import { driverPage } from '../dist/driver.js';
const setup = () => { const state = freshState(); return { state, context: contextFor(state, 'driver', 'driver_01') }; };
const readiness = { date: '2026-11-22', checks: Object.keys(driverChecks) };
const issue = { kind: 'reader', recipient: 'transport_c', title: 'Reader battery concern', description: 'DRIVER_SUBMITTED_NOTE' };
function active(state, context) { const run = saveDriverReadiness(state, context, readiness); startDriverRun(state, context, { id: run.id }); return run; }

test('Driver starts in a five-view workspace; scope resolves actual account and current bus', () => {
  const { state, context } = setup(); assert.equal(roles.driver.start, 'overview'); assert.equal(driverViews.length, 5);
  assert.deepEqual(roles.driver.pages, ['overview', 'transport', 'boarding']);
  assert.equal(driverScope(state, { ...context, branch: 'lakeside' }).bus.id, '01');
  assert.equal(driverScope(state, { ...context, grant: { ...context.grant, bus: '07' } }), null);
  for (const role of ['transport', 'principal', 'parent', 'teacher', 'admin']) assert.equal(driverScope(state, contextFor(state, role)), null);
});

test('Readiness drafts require all checks to start and preserve unrelated records', () => {
  const { state, context } = setup(), attendance = JSON.stringify(state.classAttendance), courses = JSON.stringify(state.assignments);
  const run = saveDriverReadiness(state, context, { ...readiness, checks: ['vehicle'] });
  assert.equal(run.status, 'draft'); assert.throws(() => startDriverRun(state, context, { id: run.id }), /five/);
  saveDriverReadiness(state, context, { ...readiness, id: run.id }); startDriverRun(state, context, { id: run.id });
  assert.equal(currentDriverRun(state, context).status, 'active'); assert.equal(state.buses[0].status, 'route');
  assert.equal(JSON.stringify(state.classAttendance), attendance); assert.equal(JSON.stringify(state.assignments), courses); assert.equal(state.nfcEvents.length, 0);
  assert.throws(() => saveDriverReadiness(state, context, { ...readiness, date: '2026-11-23' }), /Complete/);
  assert.throws(() => startDriverRun(state, context, { id: run.id }), /unstarted/);
});

test('Readiness validates dates/checks/foreign records before any mutation', () => {
  const { state, context } = setup(), before = JSON.stringify(state);
  for (const input of [{ ...readiness, date: '2026-11-28' }, { ...readiness, checks: ['bogus'] }, { ...readiness, checks: ['vehicle', 'vehicle'] }, { ...readiness, id: 'foreign' }]) {
    assert.throws(() => saveDriverReadiness(state, context, input)); assert.equal(JSON.stringify(state), before);
  }
});

test('Route or passenger reassignment invalidates an unstarted checklist; active trip retains route snapshot', () => {
  const { state, context } = setup(); let run = saveDriverReadiness(state, context, readiness);
  state.buses[0].stops[0] = 'Changed pickup'; assert.throws(() => startDriverRun(state, context, { id: run.id }), /changed/);
  run = saveDriverReadiness(state, context, { ...readiness, id: run.id });
  state.students.find((student) => student.id === 'lohith').bus = '01'; assert.throws(() => startDriverRun(state, context, { id: run.id }), /student list changed/);
  run = saveDriverReadiness(state, context, { ...readiness, id: run.id }); startDriverRun(state, context, { id: run.id });
  state.buses[0].stops[0] = 'Later edit'; assert.equal(run.stops[0], 'Changed pickup');
});

test('Stop confirmations are sequential/idempotent and completion requires school arrival', () => {
  const { state, context } = setup(), run = active(state, context);
  assert.throws(() => confirmDriverStop(state, context, { id: run.id, index: 1 }), /in order/);
  assert.throws(() => finishDriverRun(state, context, { id: run.id }), /each route stop/);
  run.stops.forEach((_, index) => { confirmDriverStop(state, context, { id: run.id, index }); assert.throws(() => confirmDriverStop(state, context, { id: run.id, index }), /in order/); });
  finishDriverRun(state, context, { id: run.id }); assert.equal(run.status, 'completed'); assert.ok(run.endedAt); assert.equal(state.buses[0].status, 'school');
  assert.throws(() => finishDriverRun(state, context, { id: run.id }), /active/);
  assert.throws(() => saveDriverReadiness(state, context, readiness), /unstarted/);
  const next = saveDriverReadiness(state, context, { ...readiness, date: '2026-11-23' }); assert.equal(next.status, 'draft');
});

test('Ending a seeded route keeps compatibility without fabricating a historical trip', () => {
  const { state, context } = setup(); finishDriverRun(state, context); assert.equal(state.buses[0].status, 'school'); assert.deepEqual(driverRuns(state, context), []);
});

test('Reassigned and stale drivers lose old bus, run, issue, export and stop access', () => {
  const { state, context } = setup(), run = active(state, context); const incident = saveDriverIncident(state, context, issue);
  assignDriver(state, '01', 'driver_02', contextFor(state, 'transport', 'transport_c'));
  assert.equal(driverScope(state, context), null); assert.deepEqual(driverRuns(state, context), []); assert.deepEqual(driverIncidents(state, context), []);
  const before = JSON.stringify(state);
  for (const write of [() => saveDriverReadiness(state, context, readiness), () => confirmDriverStop(state, context, { id: run.id, index: 0 }), () => finishDriverRun(state, context), () => saveDriverIncident(state, context, issue)]) { assert.throws(write); assert.equal(JSON.stringify(state), before); }
  assert.throws(() => driverTripCSV(state, context, run.id));
  const replacement = contextFor(state, 'driver', 'driver_02'); assert.equal(driverScope(state, replacement).bus.id, '01'); assert.deepEqual(driverRuns(state, replacement), []); assert.ok(!driverIncidents(state, replacement).some((row) => row.id === incident.id));
});

test('Other-school and other-bus record IDs cannot be replayed by a current driver', () => {
  const { state, context } = setup(), foreign = contextFor(state, 'driver', 'driver_07'), run = active(state, foreign), before = JSON.stringify(state);
  assert.throws(() => startDriverRun(state, context, { id: run.id })); assert.throws(() => confirmDriverStop(state, context, { id: run.id, index: 0 }));
  assert.throws(() => finishDriverRun(state, context, { id: run.id })); assert.throws(() => driverTripCSV(state, context, run.id)); assert.equal(JSON.stringify(state), before);
  assert.deepEqual(driverStudents(state, context).map((row) => row.id), ['amaya']); assert.deepEqual(driverRecipients(state, context).map((person) => person.id), ['transport_c']);
});

test('Student list shows current bus and latest NFC status without guardian details or card codes', () => {
  const { state, context } = setup(), coordinator = contextFor(state, 'transport', 'transport_c');
  const trip = createBoardingTrip(state, coordinator, { busId: '01', date: readiness.date, direction: 'to_school' });
  simulateBoardingTap(state, context, { tripId: trip.id, token: activeStudentCard(state, 'amaya').token });
  const rows = driverStudents(state, context, 'SCN-1001'); assert.equal(rows[0].boarding, 'boarded'); assert.equal(rows[0].cardReady, true);
  assert.ok(!JSON.stringify(rows).includes('guardians')); assert.ok(!JSON.stringify(rows).includes('SCN-NFC')); assert.equal(driverStudents(state, context, 'meera').length, 0);
  state.students.find((student) => student.id === 'amaya').bus = '02'; assert.equal(driverStudents(state, context).length, 0);
});

test('Driver issues reach real school coordinator and VP follow-up records; status updates remain private', () => {
  const { state, context } = setup(), coordinator = contextFor(state, 'transport', 'transport_c');
  const incident = saveDriverIncident(state, context, issue), task = coordinatorTasks(state, coordinator).find((task) => task.id === incident.taskId);
  assert.equal(task.busId, '01'); assert.equal(task.driverIncidentId, incident.id); assert.match(task.notes[0].text, /DRIVER_SUBMITTED_NOTE/);
  saveCoordinatorTask(state, coordinator, { id: task.id, status: 'in_progress', note: 'PRIVATE_COORDINATOR_NOTE' });
  assert.equal(driverIncidents(state, context)[0].status, 'in_progress'); assert.ok(!JSON.stringify(driverIncidents(state, context)).includes('PRIVATE_COORDINATOR_NOTE'));
  saveCoordinatorTask(state, coordinator, { id: task.id, status: 'resolved', note: 'INTERNAL_RESOLUTION_NOTE' }); assert.equal(driverIncidents(state, context, 'resolved').length, 1);
  assert.equal(driverIncidents(state, context, 'open').length, 0); assert.equal(state.buses[0].status, 'route');
});

test('Issue routing rejects foreign/unappointed coordinator, invalid types and text atomically', () => {
  const { state, context } = setup(), before = JSON.stringify(state);
  for (const input of [{ ...issue, recipient: 'transport_l' }, { ...issue, recipient: 'principal_c' }, { ...issue, kind: 'invalid' }, { ...issue, description: '' }, { ...issue, title: 'x'.repeat(121) }]) { assert.throws(() => saveDriverIncident(state, context, input)); assert.equal(JSON.stringify(state), before); }
  state.accounts.find((person) => person.id === 'transport_c').grants = []; assert.throws(() => saveDriverIncident(state, context, issue), /currently appointed/);
});

test('Driver issue hides internal follow-up details after recategorisation and other drivers see no report', () => {
  const { state, context } = setup(), incident = saveDriverIncident(state, context, issue);
  assert.deepEqual(driverIncidents(state, contextFor(state, 'driver', 'driver_02')), []);
  state.viceFollowups.find((task) => task.id === incident.taskId).category = 'academic'; assert.equal(driverIncidents(state, context)[0].status, 'unavailable');
});

test('Trip CSV uses captured route and formula safety and excludes passenger/card/private issue data', () => {
  const { state, context } = setup(); state.buses[0].name = '=HYPERLINK("bad")'; const run = active(state, context); saveDriverIncident(state, context, issue);
  const csv = driverTripCSV(state, context, run.id); assert.match(csv, /'=HYPERLINK/); assert.match(csv, /Confirmed \(UTC\)/);
  for (const value of ['SCN-1001', 'SCN-NFC', 'DRIVER_SUBMITTED_NOTE', 'parent']) assert.ok(!csv.includes(value));
});

test('Browser state adds empty Driver collections without resetting existing edits or NFC records', () => {
  const { state, context } = setup(), run = active(state, context); saveDriverIncident(state, context, issue); state.buses[0].name = 'PERSISTED_ROUTE';
  const store = new Map(); globalThis.localStorage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) };
  assert.ok(saveState(state)); const loaded = loadState(); assert.equal(loaded.driverRuns[0].id, run.id); assert.equal(loaded.driverIncidents.length, 1); assert.equal(loaded.buses[0].name, 'PERSISTED_ROUTE');
  delete state.driverRuns; delete state.driverIncidents; saveState(state); assert.deepEqual(loadState().driverRuns, []); assert.deepEqual(loadState().driverIncidents, []); assert.equal(loadState().nfcCards.length, state.nfcCards.length);
  delete globalThis.localStorage;
});

test('All Driver views render within scope and unassigned appointment gets a useful empty state', () => {
  const { state, context } = setup(); active(state, context); saveDriverIncident(state, context, issue);
  for (const item of driverViews) { const html = driverPage({ state, context, driver: { view: item.id, query: '', issueStatus: 'all' } }); assert.match(html, /Driver views/); assert.ok(!html.includes('Meera Fernando')); }
  assignDriver(state, '01', '', contextFor(state, 'transport', 'transport_c')); assert.match(driverPage({ state, context, driver: { view: 'summary' } }), /No bus assigned/);
});
