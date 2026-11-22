import { recordContext } from "./records.js";
import { boardingDate, visibleBoardingTrips, boardingRows, activeStudentCard } from "./boarding-data.js";

export const driverViews = [
  { id: "summary", name: "Daily Overview", short: "Today", icon: "school" },
  { id: "route", name: "Route & Stops", short: "Route", icon: "route" },
  { id: "students", name: "Assigned Students", short: "Students", icon: "users" },
  { id: "issues", name: "Safety & Issues", short: "Issues", icon: "alert" },
  { id: "history", name: "Trip History", short: "History", icon: "file" },
];
export const driverChecks = {
  vehicle: "Tyres, brakes, lights and mirrors checked",
  exits: "Doors, seat belts and emergency exits checked",
  equipment: "First-aid kit and safety equipment checked",
  route: "Assigned route and student list reviewed",
  reader: "Reader and boarding arrangements checked",
};
export const driverIssueTypes = { delay: "Route delay", vehicle: "Vehicle concern", reader: "Card / reader problem", student: "Student transport concern", other: "Other transport issue" };
export const driverDefaults = () => ({ query: "", issueStatus: "all" });

export function driverScope(state, context) {
  if (context?.role !== "driver") return null;
  try {
    const ctx = recordContext(state, context);
    const branch = state.branches.find((item) => item.id === ctx.branch);
    const bus = state.buses.find((item) => item.id === ctx.grant.bus && item.branch === ctx.branch && item.driverId === ctx.account.id);
    return branch && bus ? { context: ctx, branch, bus } : null;
  } catch { return null; }
}
function requireDriver(state, context) {
  const scope = driverScope(state, context);
  if (!scope) throw new Error("A current Driver appointment for this bus is required.");
  return scope;
}
const stamp = () => new Date().toISOString();
const routeKey = (state, bus) => JSON.stringify([bus.name, bus.registration, bus.stops,
  state.students.filter((student) => student.branch === bus.branch && student.bus === bus.id).map((student) => [student.id, student.name, student.className]).sort((a, b) => a[0].localeCompare(b[0]))]);
const validDate = (date) => /^2026-11-(?:20|2[1-7])$/.test(date);

export function driverRuns(state, context) {
  const scope = driverScope(state, context);
  if (!scope) return [];
  return (state.driverRuns || []).filter((run) => run.driverId === scope.context.account.id && run.busId === scope.bus.id && run.branch === scope.branch.id);
}
export function currentDriverRun(state, context) {
  const runs = driverRuns(state, context);
  return runs.find((run) => run.status === "active") || runs.find((run) => run.status === "draft") || runs[0] || null;
}
export function driverStudents(state, context, query = "") {
  const scope = requireDriver(state, context), search = String(query).trim().toLowerCase();
  const trip = visibleBoardingTrips(state, context)[0];
  const rows = trip ? boardingRows(state, context, trip.id) : [];
  return state.students.filter((student) => student.branch === scope.branch.id && student.bus === scope.bus.id)
    .filter((student) => !search || [student.name, student.admissionNumber, student.className].join(" ").toLowerCase().includes(search))
    .map((student) => ({ id: student.id, name: student.name, admissionNumber: student.admissionNumber, className: student.className,
      cardReady: Boolean(activeStudentCard(state, student.id)), boarding: rows.find((row) => row.studentId === student.id)?.status || null }));
}
export function saveDriverReadiness(state, context, input) {
  const scope = requireDriver(state, context), date = String(input.date || "");
  const existing = input.id ? driverRuns(state, context).find((run) => run.id === input.id) : driverRuns(state, context).find((run) => run.date === date);
  if (input.id && !existing) throw new Error("Choose your own current-bus trip record.");
  if (!validDate(date)) throw new Error("Choose a demo date from 20 to 27 November 2026.");
  if (existing && (existing.status !== "draft" || existing.date !== date)) throw new Error("A trip already exists for this date. Only its unstarted checklist can be changed; otherwise choose another demo date.");
  if (driverRuns(state, context).some((run) => run.status === "active")) throw new Error("Complete the current trip before preparing another.");
  if (!Array.isArray(input.checks) || new Set(input.checks).size !== input.checks.length || input.checks.some((key) => !Object.hasOwn(driverChecks, key))) throw new Error("Choose the listed safety checks.");
  const run = { ...existing, id: existing?.id || "driver-run-" + crypto.randomUUID(), driverId: scope.context.account.id,
    branch: scope.branch.id, busId: scope.bus.id, date, direction: "to_school", status: "draft", routeName: scope.bus.name,
    registration: scope.bus.registration, stops: [...scope.bus.stops], routeKey: routeKey(state, scope.bus), checks: [...input.checks],
    updatedAt: stamp(), createdAt: existing?.createdAt || stamp(), stopEvents: [] };
  state.driverRuns = [run, ...(state.driverRuns || []).filter((item) => item.id !== run.id)];
  return run;
}
export function startDriverRun(state, context, input) {
  const scope = requireDriver(state, context), run = driverRuns(state, context).find((item) => item.id === input.id);
  if (!run || run.status !== "draft" || driverRuns(state, context).some((item) => item.status === "active")) throw new Error("Choose an unstarted trip checklist for your current bus.");
  if (run.routeKey !== routeKey(state, scope.bus)) throw new Error("The route or assigned student list changed. Review and save the safety checklist again.");
  if (!Object.keys(driverChecks).every((key) => run.checks.includes(key))) throw new Error("Complete all five pre-trip checks before starting.");
  run.status = "active"; run.startedAt = stamp(); run.updatedAt = run.startedAt;
  scope.bus.status = "route";
  return run;
}
export function confirmDriverStop(state, context, input) {
  requireDriver(state, context);
  const run = driverRuns(state, context).find((item) => item.id === input.id), index = Number(input.index);
  if (!run || run.status !== "active" || !Number.isInteger(index) || index !== run.stopEvents.length || index >= run.stops.length) throw new Error("Confirm the next stop on your active trip, in order.");
  run.stopEvents.push({ index, name: run.stops[index], at: stamp() }); run.updatedAt = stamp();
  return run;
}
export function finishDriverRun(state, context, input = {}) {
  const scope = requireDriver(state, context), active = driverRuns(state, context).find((run) => run.status === "active");
  if (input.id && active?.id !== input.id) throw new Error("Choose your active current-bus trip.");
  if (active && active.stopEvents.length !== active.stops.length) throw new Error("Confirm each route stop and the school arrival before completing this trip.");
  if (active) { active.status = "completed"; active.endedAt = stamp(); active.updatedAt = active.endedAt; }
  // Existing seeded map trips can still end without inventing a checklist or journey history.
  scope.bus.status = "school";
  return active || null;
}
export function driverRecipients(state, context) {
  const scope = requireDriver(state, context);
  return state.accounts.filter((person) => person.grants.some((grant) => grant.role === "transport" && grant.branch === scope.branch.id));
}
export function driverIncidents(state, context, status = "all") {
  const scope = driverScope(state, context);
  if (!scope) return [];
  return (state.driverIncidents || []).filter((item) => item.driverId === scope.context.account.id && item.busId === scope.bus.id && item.branch === scope.branch.id)
    .map((item) => {
      const task = (state.viceFollowups || []).find((task) => task.id === item.taskId && task.branch === scope.branch.id && task.busId === scope.bus.id && task.category === "transport");
      const owner = state.accounts.find((person) => person.id === task?.assignee && person.grants.some((grant) => grant.branch === scope.branch.id && ["transport", "vice_principal"].includes(grant.role)));
      // A driver sees own submitted text and status only, never internal follow-up notes.
      return { ...item, status: task?.status || "unavailable", owner: owner?.name || "School coordination", available: Boolean(task) };
    }).filter((item) => status === "all" || item.status === status);
}
export function saveDriverIncident(state, context, input) {
  const scope = requireDriver(state, context), recipient = driverRecipients(state, context).find((person) => person.id === input.recipient);
  if (!recipient) throw new Error("Choose a Transport Coordinator currently appointed to your school.");
  if (!Object.hasOwn(driverIssueTypes, input.kind)) throw new Error("Choose a transport issue type.");
  const title = String(input.title || "").trim(), description = String(input.description || "").trim();
  if (!title || title.length > 120 || !description || description.length > 1000) throw new Error("Enter an issue title and a description of up to 1,000 characters.");
  const id = "driver-incident-" + crypto.randomUUID(), at = stamp(), run = currentDriverRun(state, context);
  const incident = { id, driverId: scope.context.account.id, branch: scope.branch.id, busId: scope.bus.id,
    runId: run?.status === "active" ? run.id : "", kind: input.kind, title, description, createdAt: at, taskId: "followup-" + id };
  const task = { id: incident.taskId, branch: scope.branch.id, busId: scope.bus.id, category: "transport", title: "Driver: " + title,
    assignee: recipient.id, due: boardingDate(), status: "open", driverIncidentId: id,
    notes: [{ text: driverIssueTypes[input.kind] + ": " + description, by: scope.context.account.name, at }] };
  state.driverIncidents = [incident, ...(state.driverIncidents || [])];
  state.viceFollowups = [task, ...(state.viceFollowups || [])];
  return incident;
}
export function driverTripCSV(state, context, id) {
  const run = driverRuns(state, context).find((item) => item.id === id);
  if (!run) throw new Error("Choose your own current-bus trip record.");
  const safe = (value) => '"' + String(/^[\s]*[=+@-]/.test(String(value ?? "")) ? "'" + value : value ?? "").replaceAll('"', '""') + '"';
  const rows = [["Date", "Bus", "Route", "Status", "Started (UTC)", "Completed (UTC)", "Stop", "Confirmed (UTC)"],
    ...run.stops.map((name, index) => [run.date, run.busId, run.routeName, run.status, run.startedAt || "", run.endedAt || "", name, run.stopEvents.find((item) => item.index === index)?.at || ""])];
  return rows.map((row) => row.map(safe).join(",")).join("\r\n");
}
