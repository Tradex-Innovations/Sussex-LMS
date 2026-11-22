import test from 'node:test';
import assert from 'node:assert/strict';
import { freshState, loadState, saveState, roles } from '../dist/data.js';
import { contextFor, can, assignableRoles } from '../dist/access.js';
import { storesScope, storeCatalogue, storeStock, reservationBag, saveBagItem, submitStoreReservation, storeReservations, updateStoreReservation, cancelParentReservation, saveStoreStock, storeMetrics, createStoreReport, storeReports, storeReportCSV } from '../dist/stores-data.js';
import { booksPage, uniformsPage, storeRequestDetail } from '../dist/stores.js';
const setup = () => { const state = freshState(); const parent = { ...contextFor(state, 'parent', 'parent'), studentId: 'amaya' }; return { state, parent, books: contextFor(state, 'librarian', 'librarian_c'), uniforms: contextFor(state, 'uniform_store', 'uniform_c') }; };
function add(state, parent, kind = 'books', quantity = 1) { const item = storeCatalogue(state, parent, kind)[0], variant = item.variants[0]; saveBagItem(state, parent, { kind, itemId: item.id, variantId: variant.id, quantity }); return { item, variant }; }
function reserve(state, parent, kind = 'books') { add(state, parent, kind); return submitStoreReservation(state, parent, { kind }); }
function process(state, context, request, status, extra = {}) { return updateStoreReservation(state, context, { id: request.id, kind: request.kind, status, ...extra }); }
const pickup = { date: '2026-11-23', location: 'School collection counter', window: '8:00 AM – 2:00 PM' };

test('Book and Uniform Store roles have isolated school workspaces and no online-payment permission', () => {
 const { state, books, uniforms, parent } = setup(); assert.equal(roles.librarian.name, 'Book Store Officer'); assert.equal(roles.uniform_store.name, 'Uniform Store Officer');
 assert.ok(assignableRoles(contextFor(state, 'principal')).includes('uniform_store')); assert.ok(roles.parent.pages.includes('uniforms')); assert.equal(can(parent, 'library.order'), false);
 assert.equal(storesScope(state, books, 'uniforms'), null); assert.equal(storesScope(state, uniforms, 'books'), null); assert.equal(storesScope(state, { ...books, branch: 'lakeside' }, 'books').branches[0].id, 'colombo');
 assert.equal(storesScope(state, { ...uniforms, grant: { ...uniforms.grant, branch: 'lakeside' } }, 'uniforms'), null);
 for (const role of ['driver', 'transport', 'teacher', 'admin', 'section_head']) assert.equal(storesScope(state, contextFor(state, role), 'books'), null);
 assert.equal(storesScope(state, { ...parent, studentId: 'meera' }, 'books'), null);
});

test('Parent book catalogue is pupil grade only and uniform variants have listed sizes', () => {
 const { state, parent } = setup(); assert.equal(storeCatalogue(state, parent, 'books').length, 3); assert.ok(storeCatalogue(state, parent, 'books').every(item => item.grade === 8 && item.branch === 'colombo'));
 assert.ok(storeCatalogue(state, parent, 'uniforms').every(item => item.variants.length > 1)); assert.equal(storeCatalogue(state, parent, 'books', { query: 'Additional' }).length, 0);
 const kavin = { ...parent, studentId: 'kavin' }; assert.ok(storeCatalogue(state, kavin, 'books').every(item => item.grade === 6));
});

test('Reservation bags are separated by pupil, parent, school and book/uniform section', () => {
 const { state, parent } = setup(); add(state, parent); add(state, parent, 'uniforms', 2);
 assert.equal(reservationBag(state, parent, 'books').length, 1); assert.equal(reservationBag(state, parent, 'uniforms')[0].quantity, 2);
 assert.deepEqual(reservationBag(state, { ...parent, studentId: 'kavin' }, 'books'), []);
 const foreign = storeCatalogue(state, { ...contextFor(state, 'parent', 'parent_l'), studentId: 'meera' }, 'books')[0], before = JSON.stringify(state);
 assert.throws(() => saveBagItem(state, parent, { kind: 'books', itemId: foreign.id, variantId: foreign.variants[0].id, quantity: 1 })); assert.equal(JSON.stringify(state), before);
});

test('Invalid variants, wrong grade and invalid quantities cannot enter a reservation bag', () => {
 const { state, parent } = setup(), item = storeCatalogue(state, parent, 'books')[0], before = JSON.stringify(state);
 for (const input of [{ kind: 'books', itemId: item.id, variantId: 'forged', quantity: 1 }, { kind: 'books', itemId: item.id, variantId: item.variants[0].id, quantity: 2 }, { kind: 'books', itemId: item.id, variantId: item.variants[0].id, quantity: 1.5 }]) { assert.throws(() => saveBagItem(state, parent, input)); assert.equal(JSON.stringify(state), before); }
});

test('Submitting reservation routes it to one school/store with student snapshots and no financial fields', () => {
 const { state, parent, books, uniforms } = setup(), request = reserve(state, parent), uniform = reserve(state, parent, 'uniforms');
 assert.equal(request.status, 'requested'); assert.equal(request.studentId, 'amaya'); assert.equal(request.admission, 'SCN-1001'); assert.equal(request.academicYear, '2027');
 assert.equal(storeReservations(state, books, 'books')[0].id, request.id); assert.equal(storeReservations(state, uniforms, 'uniforms')[0].id, uniform.id); assert.deepEqual(reservationBag(state, parent, 'books'), []);
 for (const key of ['price', 'total', 'payment', 'paid']) assert.ok(!Object.hasOwn(request, key));
 assert.deepEqual(storeReservations(state, contextFor(state, 'librarian', 'librarian_l'), 'books'), []);
 assert.deepEqual(storeReservations(state, { ...parent, studentId: 'kavin' }, 'books'), []);
});

test('Requested items do not hold stock; confirmation holds, collection consumes exactly once', () => {
 const { state, parent, books } = setup(), { item, variant } = add(state, parent), request = submitStoreReservation(state, parent, { kind: 'books' });
 assert.equal(storeStock(state, item, variant).held, 0); process(state, books, request, 'confirmed'); assert.deepEqual(storeStock(state, item, variant), { onHand: 24, held: 1, available: 23 });
 process(state, books, request, 'ready', pickup); process(state, books, request, 'collected', { reference: request.reference, receiver: 'Receiving parent' });
 assert.deepEqual(storeStock(state, item, variant), { onHand: 23, held: 0, available: 23 }); assert.throws(() => process(state, books, request, 'collected', { reference: request.reference, receiver: 'Receiving parent' }));
 assert.equal(variant.stock, 23); assert.equal(request.history.length, 4);
});

test('Concurrent pupil requests cannot overbook stock at confirmation', () => {
 const { state, parent, books } = setup(), { item, variant } = add(state, parent); variant.stock = 1;
 const first = submitStoreReservation(state, parent, { kind: 'books' });
 const secondParent = { ...parent, studentId: 'kavin' }; state.students.find(s => s.id === 'kavin').grade = 8;
 saveBagItem(state, secondParent, { kind: 'books', itemId: item.id, variantId: variant.id, quantity: 1 }); const second = submitStoreReservation(state, secondParent, { kind: 'books' });
 process(state, books, first, 'confirmed'); const before = JSON.stringify(state); assert.throws(() => process(state, books, second, 'confirmed'), /Insufficient/); assert.equal(JSON.stringify(state), before);
});

test('Parent and store cancellation release held units and require correct stage/reason', () => {
 const { state, parent, books } = setup(), { item, variant } = add(state, parent), request = submitStoreReservation(state, parent, { kind: 'books' });
 process(state, books, request, 'confirmed'); cancelParentReservation(state, parent, { kind: 'books', id: request.id }); assert.equal(storeStock(state, item, variant).held, 0);
 const again = reserve(state, parent); process(state, books, again, 'confirmed'); process(state, books, again, 'ready', pickup);
 assert.throws(() => cancelParentReservation(state, parent, { kind: 'books', id: again.id })); assert.throws(() => process(state, books, again, 'cancelled'), /reason/);
 process(state, books, again, 'cancelled', { reason: 'Collection no longer needed.' }); assert.equal(storeStock(state, item, variant).held, 0);
});

test('Duplicate pupil-book reservations are prevented, including across linked guardians and collected books', () => {
 const { state, parent, books } = setup(), request = reserve(state, parent); add(state, parent); assert.throws(() => submitStoreReservation(state, parent, { kind: 'books' }), /already/);
 const guardian = { id: 'second_parent', name: 'Second guardian', grants: [{ role: 'parent', branch: 'colombo' }] }; state.accounts.push(guardian); state.students.find(s => s.id === 'amaya').guardians.push(guardian.id);
 const second = { ...contextFor(state, 'parent', guardian.id), studentId: 'amaya' }; add(state, second); assert.throws(() => submitStoreReservation(state, second, { kind: 'books' }), /already/);
 assert.deepEqual(storeReservations(state, second, 'books'), []);
 process(state, books, request, 'confirmed'); process(state, books, request, 'ready', pickup); process(state, books, request, 'collected', { reference: request.reference, receiver: 'Parent' });
 assert.throws(() => submitStoreReservation(state, parent, { kind: 'books' }), /already/);
});

test('Ready and collected transitions validate pickup details/reference before any stock/history mutation', () => {
 const { state, parent, books } = setup(), request = reserve(state, parent); assert.throws(() => process(state, books, request, 'ready', pickup), /status change/); process(state, books, request, 'confirmed');
 for (const data of [{ ...pickup, date: '2026-11-31' }, { ...pickup, date: '2027-01-01' }, { ...pickup, window: '' }, { ...pickup, location: '' }]) { const before = JSON.stringify(state); assert.throws(() => process(state, books, request, 'ready', data)); assert.equal(JSON.stringify(state), before); }
 process(state, books, request, 'ready', pickup); const before = JSON.stringify(state); assert.throws(() => process(state, books, request, 'collected', { reference: 'wrong', receiver: 'Parent' })); assert.equal(JSON.stringify(state), before);
});

test('Parent reads omit internal staff notes and attribution; public reasons remain visible', () => {
 const { state, parent, books } = setup(), request = reserve(state, parent); process(state, books, request, 'declined', { reason: 'Next distribution is pending.', note: 'PRIVATE_STAFF_ONLY' });
 const view = storeReservations(state, parent, 'books')[0]; assert.ok(!JSON.stringify(view).includes('PRIVATE_STAFF_ONLY')); assert.ok(!JSON.stringify(view).includes('Hasini')); assert.equal(view.reason, 'Next distribution is pending.');
 const html = storeRequestDetail(state, parent, 'books', request.id); assert.ok(!html.includes('PRIVATE_STAFF_ONLY')); assert.ok(html.includes('Next distribution'));
 assert.ok(JSON.stringify(storeReservations(state, books, 'books')).includes('PRIVATE_STAFF_ONLY'));
});

test('Store type, school and stale appointment reject fulfilment and stock writes atomically', () => {
 const { state, parent, books, uniforms } = setup(), request = reserve(state, parent), uniform = reserve(state, parent, 'uniforms'), before = JSON.stringify(state);
 for (const [ctx, req] of [[uniforms, request], [books, uniform], [contextFor(state, 'librarian', 'librarian_l'), request], [parent, request]]) { assert.throws(() => process(state, ctx, req, 'confirmed')); assert.equal(JSON.stringify(state), before); }
 state.accounts.find(account => account.id === 'librarian_c').grants = []; assert.throws(() => process(state, books, request, 'confirmed')); assert.deepEqual(storeReservations(state, books, 'books'), []);
});

test('Stock adjustments cannot consume held stock and listing changes permit existing fulfilment', () => {
 const { state, parent, books } = setup(), { item, variant } = add(state, parent), request = submitStoreReservation(state, parent, { kind: 'books' }); process(state, books, request, 'confirmed');
 assert.throws(() => saveStoreStock(state, books, { kind: 'books', id: item.id, variantId: variant.id, stock: 0, note: 'Too low', enabled: 'on' }));
 saveStoreStock(state, books, { kind: 'books', id: item.id, variantId: variant.id, stock: 5, note: 'Stock count checked', enabled: false });
 assert.equal(storeCatalogue(state, parent, 'books').some(row => row.id === item.id), false); assert.equal(variant.changes.length, 1); process(state, books, request, 'ready', pickup);
});

test('Stale unavailable bag entries remain removable instead of trapping the parent', () => {
 const { state, parent, books } = setup(), { item, variant } = add(state, parent); saveStoreStock(state, books, { kind: 'books', id: item.id, variantId: variant.id, stock: 24, note: 'Hidden for review', enabled: false });
 assert.equal(reservationBag(state, parent, 'books')[0].invalid, true); assert.throws(() => submitStoreReservation(state, parent, { kind: 'books' }), /Review/);
 saveBagItem(state, parent, { kind: 'books', itemId: item.id, variantId: variant.id, quantity: 0 }); assert.deepEqual(reservationBag(state, parent, 'books'), []);
});

test('Student changes hide foreign-school reservation data and release inaccessible stock holds', () => {
 const { state, parent, books } = setup(), { item, variant } = add(state, parent), request = submitStoreReservation(state, parent, { kind: 'books' }); process(state, books, request, 'confirmed');
 state.students.find(student => student.id === 'amaya').branch = 'lakeside'; assert.deepEqual(storeReservations(state, books, 'books'), []); assert.equal(storeStock(state, item, variant).held, 0); assert.equal(storesScope(state, parent, 'books'), null);
});

test('Uniform workflow holds selected size and quantity without touching book inventory', () => {
 const { state, parent, uniforms } = setup(), { item, variant } = add(state, parent, 'uniforms', 2), request = submitStoreReservation(state, parent, { kind: 'uniforms' }), booksBefore = JSON.stringify(state.storeCatalog.filter(item => item.kind === 'books'));
 process(state, uniforms, request, 'confirmed'); assert.equal(storeStock(state, item, variant).held, 2); process(state, uniforms, request, 'ready', pickup); process(state, uniforms, request, 'collected', { reference: request.reference, receiver: 'Parent' });
 assert.equal(variant.stock, 14); assert.equal(JSON.stringify(state.storeCatalog.filter(item => item.kind === 'books')), booksBefore);
});

test('Store reports retain snapshots and separate owner, school and section, with safe CSV/no private notes', () => {
 const { state, parent, books, uniforms } = setup(), request = reserve(state, parent); request.studentName = '=HYPERLINK("bad")'; process(state, books, request, 'confirmed', { note: 'PRIVATE_REPORT_NOTE' });
 const report = createStoreReport(state, books, { kind: 'books', type: 'requests' }); const csv = storeReportCSV(state, books, 'books', report.id); assert.match(csv, /'=HYPERLINK/); assert.ok(!csv.includes('PRIVATE_REPORT_NOTE')); assert.ok(!csv.includes('receiver'));
 process(state, books, request, 'ready', pickup); assert.equal(report.rows[0][5], 'Confirmed'); assert.deepEqual(storeReports(state, uniforms, 'uniforms'), []); assert.throws(() => storeReportCSV(state, contextFor(state, 'librarian', 'librarian_l'), 'books', report.id));
 for (let i = 0; i < 9; i++) createStoreReport(state, books, { kind: 'books', type: 'stock' }); assert.equal(storeReports(state, books, 'books').length, 8);
});

test('New and existing empty schools never borrow another school catalogue or requests', () => {
 const { state } = setup(); state.accounts.push({ id: 'galle_store', name: 'Galle officer', grants: [{ role: 'uniform_store', branch: 'galle' }] });
 const ctx = contextFor(state, 'uniform_store', 'galle_store'); assert.deepEqual(storeCatalogue(state, ctx, 'uniforms'), []); assert.deepEqual(storeReservations(state, ctx, 'uniforms'), []); assert.equal(storeMetrics(state, ctx, 'uniforms').pending, 0);
});

test('Stores migration preserves previous orders, carts, academic/driver/NFC edits and does not resurrect removed accounts', () => {
 const state = freshState(), oldOrders = [{ number: 'CW-1001', parent: 'parent', branch: 'colombo', status: 'pending', items: [] }]; state.orders = oldOrders; state.carts = { parent: { colombo: { b1: 2 } } }; state.buses[0].name = 'PERSISTED_BUS';
 delete state.storesVersion; delete state.storeCatalog; state.accounts = state.accounts.filter(person => !person.id.startsWith('uniform_'));
 const memory = new Map(); globalThis.localStorage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) }; saveState(state); const migrated = loadState();
 assert.deepEqual(migrated.orders, oldOrders); assert.equal(migrated.carts.parent.colombo.b1, 2); assert.equal(migrated.buses[0].name, 'PERSISTED_BUS'); assert.deepEqual(migrated.nfcCards, state.nfcCards); assert.ok(migrated.accounts.some(person => person.id === 'uniform_c'));
 migrated.accounts = migrated.accounts.filter(person => person.id !== 'uniform_c'); migrated.storeCatalog[0].variants[0].stock = 9; saveState(migrated); assert.ok(!loadState().accounts.some(person => person.id === 'uniform_c')); assert.equal(loadState().storeCatalog[0].variants[0].stock, 9); delete globalThis.localStorage;
});

test('Current parent book/uniform UIs have reservation controls without prices or checkout and escape text', () => {
 const { state, parent } = setup(), options = { state, context: parent, stores: { tab: 'catalogue', query: '', status: 'all' } };
 for (const render of [booksPage, uniformsPage]) { const html = render(options); assert.ok(html.includes('Reservation list')); assert.ok(!/LKR|price|checkout|place-order|Add to order/.test(html)); }
 const item = storeCatalogue(state, parent, 'books')[0]; item.title = '<script>bad</script>'; assert.ok(booksPage(options).includes('&lt;script&gt;bad&lt;/script&gt;'));
});
