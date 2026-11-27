import { recordContext } from "./records.js";
import { linkedChildren } from "./access.js";

export const storeKinds = { books: { name: "Pupil’s books", store: "Book Store", role: "librarian", code: "BK" }, uniforms: { name: "School uniforms", store: "Uniform Store", role: "uniform_store", code: "UF" } };
export const storeViews = [
  { id: "summary", name: "Store Overview", short: "Overview", icon: "school" },
  { id: "catalogue", name: "Catalogue & Stock", short: "Stock", icon: "package" },
  { id: "reservations", name: "Reservation Requests", short: "Requests", icon: "book" },
  { id: "collections", name: "School Collection", short: "Collection", icon: "checkCircle" },
  { id: "reports", name: "Store Reports", short: "Reports", icon: "file" },
];
export const reservationStatuses = { requested: "Requested", confirmed: "Confirmed", ready: "Ready to collect", collected: "Collected", cancelled: "Cancelled", declined: "Declined" };
export const storeReportTypes = { brief: "Store activity brief", stock: "Stock availability", requests: "Reservation register", collections: "Collection register" };
export const storesDefaults = () => ({ tab: "catalogue", query: "", status: "all", grade: "all", reportType: "brief", reportId: "" });
const now = () => new Date().toISOString();
const activeStatuses = ["requested", "confirmed", "ready"];
const heldStatuses = ["confirmed", "ready"];

export function storesScope(state, context, kind) {
  if (!Object.hasOwn(storeKinds, kind)) return null;
  try {
    const ctx = recordContext(state, context);
    const parent = ctx.role === "parent", canManage = [storeKinds[kind].role, "chairman", "principal", "vice_principal"].includes(ctx.role);
    if (!parent && !canManage) return null;
    const child = parent ? linkedChildren(state, ctx).find((student) => student.id === ctx.studentId) : null;
    if (parent && !child) return null;
    const branches = state.branches.filter((branch) => branch.id === (child?.branch || ctx.branch) || !parent && ctx.role === "chairman" && ctx.branch === "all");
    return branches.length ? { context: ctx, kind, parent, child, branches, canManage,
      key: `${ctx.role}:${ctx.account.id}:${ctx.branch}:${kind}` } : null;
  } catch { return null; }
}
function requireScope(state, context, kind) {
  const scope = storesScope(state, context, kind);
  if (!scope) throw new Error("A current student or appointed store workspace is required.");
  return scope;
}
const studentInSchool = (state, request) => state.students.some((student) => student.id === request.studentId && student.branch === request.branch);
export function storeReservations(state, context, kind, input = {}) {
  const scope = storesScope(state, context, kind);
  if (!scope) return [];
  const query = String(input.query || "").trim().toLowerCase();
  return (state.storeReservations || []).filter((request) => request.kind === kind && scope.branches.some((branch) => branch.id === request.branch) && studentInSchool(state, request)
    && (!scope.parent || request.parentId === scope.context.account.id && request.studentId === scope.child.id)
    && (!input.status || input.status === "all" || request.status === input.status)
    && (!query || [request.reference, request.studentName, request.admission, ...request.items.map((item) => item.title)].join(" ").toLowerCase().includes(query)))
    .map((request) => scope.parent ? parentReservationView(request) : request);
}
export function storeStock(state, item, variant) {
  const held = (state.storeReservations || []).filter((request) => request.branch === item.branch && request.kind === item.kind && heldStatuses.includes(request.status) && studentInSchool(state, request))
    .flatMap((request) => request.items).filter((line) => line.itemId === item.id && line.variantId === variant.id).reduce((sum, line) => sum + line.quantity, 0);
  return { onHand: variant.stock, held, available: Math.max(0, variant.stock - held) };
}
export function storeCatalogue(state, context, kind, input = {}) {
  const scope = storesScope(state, context, kind);
  if (!scope) return [];
  const query = String(input.query || "").trim().toLowerCase();
  return (state.storeCatalog || []).filter((item) => item.kind === kind && scope.branches.some((branch) => branch.id === item.branch)
    && (!scope.parent || item.enabled && (kind === "uniforms" || item.grade === Number(scope.child.grade)))
    && (!input.grade || input.grade === "all" || item.grade === Number(input.grade))
    && (!query || [item.title, item.category, item.grade].join(" ").toLowerCase().includes(query)));
}
function bagKey(scope) { return [scope.context.account.id, scope.child.id, scope.child.branch, scope.kind].join("|"); }
export function reservationBag(state, context, kind) {
  const scope = requireScope(state, context, kind);
  if (!scope.parent) return [];
  const bag = state.reservationBags?.[bagKey(scope)] || [];
  const catalogue = storeCatalogue(state, context, kind);
  return bag.flatMap((line) => {
    const item = catalogue.find((item) => item.id === line.itemId), variant = item?.variants.find((variant) => variant.id === line.variantId);
    return item && variant ? [{ ...line, title: item.title, variant: variant.label, grade: item.grade, available: storeStock(state, item, variant).available }] : [{ ...line, title: "Item no longer available for this child", variant: "Review required", available: 0, invalid: true }];
  });
}
function requireParent(state, context, kind) {
  const scope = requireScope(state, context, kind);
  if (!scope.parent) throw new Error("Use the selected child’s Parent portal to reserve items.");
  return scope;
}
export function saveBagItem(state, context, input) {
  const scope = requireParent(state, context, input.kind), key = bagKey(scope), bag = state.reservationBags?.[key] || [];
  if (Number(input.quantity) === 0 && bag.some((line) => line.itemId === input.itemId && line.variantId === input.variantId)) {
    state.reservationBags[key] = bag.filter((line) => line.itemId !== input.itemId || line.variantId !== input.variantId);
    return state.reservationBags[key];
  }
  const item = storeCatalogue(state, context, input.kind).find((item) => item.id === input.itemId);
  const variant = item?.variants.find((variant) => variant.id === input.variantId), quantity = Number(input.quantity);
  if (!item || !variant || !Number.isInteger(quantity) || quantity < 0 || quantity > (input.kind === "books" ? 1 : 3)) throw new Error("Choose an eligible item, listed size/edition and valid quantity.");
  if (quantity > storeStock(state, item, variant).available) throw new Error("That quantity is not currently available. The store will confirm stock when reviewing your request.");
  state.reservationBags ??= {};
  state.reservationBags[key] = [...bag.filter((line) => line.itemId !== item.id || line.variantId !== variant.id), ...(quantity ? [{ itemId: item.id, variantId: variant.id, quantity }] : [])];
  return state.reservationBags[key];
}
export function submitStoreReservation(state, context, input) {
  const scope = requireParent(state, context, input.kind), bag = reservationBag(state, context, input.kind);
  const raw = state.reservationBags?.[bagKey(scope)] || [];
  if (!bag.length || bag.length !== raw.length || new Set(bag.map((line) => line.itemId + "|" + line.variantId)).size !== bag.length || bag.some((line) => line.invalid || line.quantity > line.available || line.quantity < 1 || !Number.isInteger(line.quantity) || line.quantity > (input.kind === "books" ? 1 : 3))) throw new Error("Review your reservation list. An item or quantity is no longer available for this child.");
  if ((state.storeReservations || []).some((request) => request.studentId === scope.child.id && request.branch === scope.child.branch && request.kind === input.kind && request.academicYear === "2027"
    && (activeStatuses.includes(request.status) || input.kind === "books" && request.status === "collected")
    && request.items.some((line) => bag.some((entry) => entry.itemId === line.itemId && (input.kind === "books" || entry.variantId === line.variantId))))) throw new Error("This pupil already has a reservation for an item in this list. Review existing reservations first.");
  const sequence = (state.storeSequence || 0) + 1, at = now();
  const request = { id: "reservation-" + crypto.randomUUID(), reference: "NET-" + storeKinds[input.kind].code + "-" + String(sequence).padStart(4, "0"),
    kind: input.kind, branch: scope.child.branch, studentId: scope.child.id, studentName: scope.child.name, admission: scope.child.admissionNumber, className: scope.child.className,
    parentId: scope.context.account.id, parentName: scope.context.account.name, academicYear: "2027", status: "requested", createdAt: at,
    items: bag.map(({ itemId, variantId, quantity, title, variant, grade }) => ({ itemId, variantId, quantity, title, variant, grade })),
    history: [{ status: "requested", at, by: scope.context.account.name }], internalNotes: [] };
  state.storeSequence = sequence; state.storeReservations = [request, ...(state.storeReservations || [])]; state.reservationBags[bagKey(scope)] = [];
  return request;
}
export function cancelParentReservation(state, context, input) {
  const scope = requireParent(state, context, input.kind), permitted = storeReservations(state, context, input.kind).find((request) => request.id === input.id);
  if (!permitted || !["requested", "confirmed"].includes(permitted.status)) throw new Error("Only your own requested or confirmed reservation can be cancelled here.");
  const request = state.storeReservations.find((request) => request.id === permitted.id);
  request.status = "cancelled"; request.history.push({ status: "cancelled", at: now(), by: scope.context.account.name });
  return request;
}
const validDate = (date) => /^2026-1[12]-\d\d$/.test(date) && date >= "2026-11-22" && date <= "2026-12-31" && !Number.isNaN(Date.parse(date + "T12:00:00Z")) && new Date(date + "T12:00:00Z").toISOString().slice(0, 10) === date;
export function updateStoreReservation(state, context, input) {
  const scope = requireScope(state, context, input.kind), request = storeReservations(state, context, input.kind).find((request) => request.id === input.id);
  if (!scope.canManage || !request) throw new Error("Choose a reservation in your school and store section.");
  const transitions = { requested: ["confirmed", "declined"], confirmed: ["ready", "cancelled"], ready: ["collected", "cancelled"] };
  if (!transitions[request.status]?.includes(input.status)) throw new Error("That reservation status change is not available.");
  const note = String(input.note || "").trim(), reason = String(input.reason || "").trim();
  if (note.length > 1000 || reason.length > 300) throw new Error("Keep internal notes under 1,000 and parent-facing reasons under 300 characters.");
  if (["declined", "cancelled"].includes(input.status) && !reason) throw new Error("Give the parent a reason for declining or cancelling this reservation.");
  const lines = request.items.map((line) => {
    const item = (state.storeCatalog || []).find((item) => item.id === line.itemId && item.kind === request.kind && item.branch === request.branch), variant = item?.variants.find((variant) => variant.id === line.variantId);
    return { line, item, variant };
  });
  if (["confirmed", "ready", "collected"].includes(input.status) && lines.some(({ item, variant }) => !item || !variant)) throw new Error("A reserved stock item is unavailable. Review it before processing.");
  if (input.status === "confirmed" && lines.some(({ line, item, variant }) => !item.enabled || storeStock(state, item, variant).available < line.quantity)) throw new Error("Insufficient available stock. Update stock or decline the request with a reason.");
  const location = String(input.location || "").trim(), window = String(input.window || "").trim(), receiver = String(input.receiver || "").trim();
  if (input.status === "ready" && (!validDate(input.date) || !location || location.length > 100 || !window || window.length > 80)) throw new Error("Set a collection date from 22 Nov–31 Dec 2026, a counter/location and collection hours.");
  if (input.status === "collected" && (String(input.reference || "").trim().toUpperCase() !== request.reference || !receiver || receiver.length > 80)) throw new Error("Match the reservation reference and enter the receiving adult’s name.");
  if (input.status === "collected" && lines.some(({ line, variant }) => variant.stock < line.quantity)) throw new Error("On-hand stock is insufficient for this collection.");
  // Validate the complete transition before mutating stock, history or request state.
  if (input.status === "collected") for (const { line, variant } of lines) variant.stock -= line.quantity;
  if (input.status === "ready") request.collection = { date: input.date, location, window };
  if (input.status === "collected") request.collected = { at: now(), receiver, by: scope.context.account.name };
  if (reason) request.reason = reason;
  if (note) request.internalNotes.push({ text: note, at: now(), by: scope.context.account.name });
  request.status = input.status; request.history.push({ status: input.status, at: now(), by: scope.context.account.name });
  return request;
}
export function saveStoreStock(state, context, input) {
  const scope = requireScope(state, context, input.kind), item = storeCatalogue(state, context, input.kind).find((item) => item.id === input.id), stock = Number(input.stock);
  const variant = item?.variants.find((variant) => variant.id === input.variantId), note = String(input.note || "").trim();
  if (!scope.canManage || !item || !variant) throw new Error("Choose a stock variant in your appointed store and school.");
  if (String(input.stock ?? "").trim() === "" || !Number.isInteger(stock) || stock < 0 || stock > 10000 || stock < storeStock(state, item, variant).held || !note || note.length > 500) throw new Error("Set whole on-hand stock at least equal to held units, and give an adjustment reason.");
  variant.changes = [...(variant.changes || []), { before: variant.stock, after: stock, note, at: now(), by: scope.context.account.name }];
  variant.stock = stock; item.enabled = input.enabled === true || input.enabled === "on";
  return item;
}
export function storeMetrics(state, context, kind) {
  const requests = storeReservations(state, context, kind), items = storeCatalogue(state, context, kind), stock = items.flatMap((item) => item.variants.map((variant) => storeStock(state, item, variant)));
  return { requests, items, pending: requests.filter((request) => request.status === "requested").length, ready: requests.filter((request) => request.status === "ready").length,
    collected: requests.filter((request) => request.status === "collected").length, available: stock.reduce((sum, value) => sum + value.available, 0), held: stock.reduce((sum, value) => sum + value.held, 0) };
}
export function parentReservationView(request) {
  const { internalNotes, ...visible } = request;
  return { ...visible, history: request.history.map(({ status, at }) => ({ status, at })), collected: request.collected ? { at: request.collected.at, receiver: request.collected.receiver } : undefined };
}
export function createStoreReport(state, context, input) {
  const scope = requireScope(state, context, input.kind);
  if (!scope.canManage || !Object.hasOwn(storeReportTypes, input.type)) throw new Error("Choose a report in your appointed store workspace.");
  const requests = storeReservations(state, context, input.kind, input), items = storeCatalogue(state, context, input.kind, input);
  const stockReport = input.type === "stock", rows = stockReport ? items.flatMap((item) => item.variants.map((variant) => {
    const stock = storeStock(state, item, variant); return [item.title, item.grade || "All", variant.label, state.branches.find((branch) => branch.id === item.branch)?.name || "School", stock.onHand, stock.held, stock.available, item.enabled ? "Listed" : "Hidden"];
  })) : requests.filter((request) => input.type !== "collections" || request.status === "collected").map((request) => [request.reference, request.studentName, request.admission, request.className, state.branches.find((branch) => branch.id === request.branch)?.name || "School", reservationStatuses[request.status], request.items.reduce((sum, line) => sum + line.quantity, 0), request.collection?.date || "", request.collected?.at || ""]);
  const report = { id: "store-report-" + crypto.randomUUID(), kind: input.kind, type: input.type, ownerKey: scope.key, branches: scope.branches.map((branch) => branch.id), createdAt: now(),
    studentIds: stockReport ? [] : requests.filter((request) => input.type !== "collections" || request.status === "collected").map((request) => [request.studentId, request.branch]),
    title: storeKinds[input.kind].store + " · " + storeReportTypes[input.type], headers: stockReport ? ["Item", "Grade", "Size / edition", "School", "On hand", "Held", "Available", "Listing"] : ["Reference", "Pupil", "Admission", "Class", "School", "Status", "Units", "Collection date", "Collected (UTC)"], rows };
  state.storeReports = [report, ...(state.storeReports || []).filter((item) => item.ownerKey === scope.key)].slice(0, 8).concat((state.storeReports || []).filter((item) => item.ownerKey !== scope.key));
  return report;
}
export function storeReports(state, context, kind) {
  const scope = storesScope(state, context, kind);
  return scope?.canManage ? (state.storeReports || []).filter((report) => report.ownerKey === scope.key && report.kind === kind && report.branches.every((id) => scope.branches.some((branch) => branch.id === id)) && report.studentIds.every(([id, branch]) => state.students.some((student) => student.id === id && student.branch === branch))) : [];
}
export function storeReportCSV(state, context, kind, id) {
  const report = storeReports(state, context, kind).find((report) => report.id === id);
  if (!report) throw new Error("This report is outside your current store workspace.");
  const safe = (value) => '"' + String(/^[\s]*[=+@-]/.test(String(value ?? "")) ? "'" + value : value ?? "").replaceAll('"', '""') + '"';
  return [report.headers, ...report.rows].map((row) => row.map(safe).join(",")).join("\r\n");
}
