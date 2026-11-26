import { recordContext } from './records.js';
import { can, withinScope } from './access.js';
function validatedTracker(state, bus, input) {
  if ('driver' in input || 'driverId' in input) throw new Error('Driver accounts have been retired. Reload and configure the bus GPS tracker.');
  const trackerId = String(input.trackerId ?? bus.trackerId ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9-]{3,39}$/.test(trackerId)) throw new Error('Enter a GPS tracker ID of 4–40 letters, numbers or hyphens.');
  if (state.buses.some(other => other.id !== bus.id && other.trackerId === trackerId)) throw new Error('This GPS tracker is already paired to another bus.');
  const trackerStatus = input.trackerStatus ?? bus.trackerStatus ?? 'online';
  if (!['online','offline'].includes(trackerStatus)) throw new Error('Choose an online or offline demo tracker signal.');
  return { trackerId, trackerStatus, trackerEnabled: true };
}
export function saveBusAssignment(state, context, input) {
  const ctx = recordContext(state, context), bus = state.buses.find(bus => bus.id === input.id);
  if (!can(ctx, 'transport.manage') || !bus || !withinScope(ctx, bus)) throw new Error('Choose an operational bus within your assigned school.');
  const name = String(input.name || '').trim(), stops = Array.isArray(input.stops) ? input.stops.map(stop => String(stop).trim()) : [], students = input.students || [];
  const branch = state.branches.find(branch => branch.id === bus.branch), tracker = validatedTracker(state, bus, input);
  if (!name || name.length > 60 || stops.length !== bus.stops.length || stops.some(stop => !stop || stop.length > 60)) throw new Error('Complete the route name and each stop name (up to 60 characters).');
  if (stops.at(-1) !== branch.school) throw new Error('The final stop must remain the assigned school.');
  if (!Array.isArray(students) || new Set(students).size !== students.length || !students.every(id => state.students.some(student => student.id === id && student.branch === bus.branch))) throw new Error('Select students from this bus’s school.');
  Object.assign(bus, tracker, { name, stops });
  if (tracker.trackerStatus === 'offline') bus.status = 'delayed'; else if (bus.status === 'delayed') bus.status = 'route';
  for (const student of state.students.filter(student => student.branch === bus.branch)) {
    if (students.includes(student.id)) student.bus = bus.id; else if (student.bus === bus.id) delete student.bus;
  }
  return bus;
}
export function saveTrackerSignal(state, context, input) {
  const ctx = recordContext(state, context), bus = state.buses.find(bus => bus.id === input.id);
  if (!can(ctx, 'transport.manage') || !bus || !withinScope(ctx, bus)) throw new Error('Choose an operational bus within your assigned school.');
  if (!bus.trackerId || bus.trackerEnabled === false || !['online','offline'].includes(input.status)) throw new Error('Configure a GPS tracker before simulating its signal.');
  bus.trackerStatus = input.status; bus.lastTrackerAt = new Date().toISOString(); bus.trackerMessages = (bus.trackerMessages || 0) + 1;
  if (input.status === 'offline') bus.status = 'delayed'; else if (bus.status === 'delayed') bus.status = 'route';
  return bus;
}
