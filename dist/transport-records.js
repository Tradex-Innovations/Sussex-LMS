import { recordContext } from "./records.js";
import { can, withinScope } from "./access.js";

export function assignDriver(state, busId, personId, context) {
  const ctx = recordContext(state, context);
  const target = state.buses.find((bus) => bus.id === busId);
  const person = state.accounts.find((person) => person.id === personId);
  if (!(can(ctx, "roles.manage") || can(ctx, "transport.manage")) || !target || !withinScope(ctx, target)) throw new Error("Choose a bus within your assigned school.");
  if (personId && !person) throw new Error("Choose an existing driver account.");
  if (person && !can(ctx, "roles.manage") && !person.grants.some((grant) => grant.role === "driver" && grant.branch === target.branch)) throw new Error("Choose a driver appointed to this school.");
  if (person && ctx.role !== "chairman" && state.buses.some((bus) => bus.driverId === personId && bus.branch !== target.branch)) throw new Error("A driver assigned in another school must be reassigned by the Chairman.");
  const previous = state.accounts.find((person) => person.id === target.driverId);
  if (previous && previous.id !== personId) previous.grants = previous.grants.map((grant) => grant.role === "driver" && grant.bus === busId ? { ...grant, bus: "" } : grant);
  if (person) {
    for (const bus of state.buses) if (bus.driverId === personId && bus.id !== busId) { bus.driverId = ""; bus.driver = "Unassigned"; }
    person.grants = person.grants.filter((grant) => grant.role !== "driver" || grant.branch !== target.branch).map((grant) => ctx.role === "chairman" && grant.role === "driver" && grant.bus ? { ...grant, bus: "" } : grant);
    person.grants.push({ role: "driver", branch: target.branch, bus: busId });
  }
  target.driverId = person?.id || "";
  target.driver = person?.name || "Unassigned";
}

export function saveBusAssignment(state, context, input) {
  const ctx = recordContext(state, context), bus = state.buses.find((bus) => bus.id === input.id);
  if (!can(ctx, "transport.manage") || !bus || !withinScope(ctx, bus)) throw new Error("Choose an operational bus within your assigned school.");
  const name = String(input.name || "").trim(), stops = Array.isArray(input.stops) ? input.stops.map((stop) => String(stop).trim()) : [], students = input.students || [];
  const branch = state.branches.find((branch) => branch.id === bus.branch), driverId = String(input.driver || "");
  if (!name || name.length > 60 || stops.length !== bus.stops.length || stops.some((stop) => !stop || stop.length > 60)) throw new Error("Complete the route name and each stop name (up to 60 characters).");
  if (stops.at(-1) !== branch.school) throw new Error("The final stop must remain the assigned school.");
  if (!Array.isArray(students) || new Set(students).size !== students.length || !students.every((id) => state.students.some((student) => student.id === id && student.branch === bus.branch))) throw new Error("Select students from this bus’s school.");
  if (driverId && !state.accounts.some((person) => person.id === driverId && person.grants.some((grant) => grant.role === "driver" && grant.branch === bus.branch))) throw new Error("Choose a driver appointed to this school.");
  if (driverId && ctx.role !== "chairman" && state.buses.some((other) => other.driverId === driverId && other.branch !== bus.branch)) throw new Error("A driver assigned in another school must be reassigned by the Chairman.");
  // All validation precedes mutation. Moving a driver leaves their former bus unassigned.
  assignDriver(state, bus.id, driverId, ctx);
  bus.name = name; bus.stops = stops;
  for (const student of state.students.filter((student) => student.branch === bus.branch)) {
    if (students.includes(student.id)) student.bus = bus.id;
    else if (student.bus === bus.id) delete student.bus;
  }
  return bus;
}
