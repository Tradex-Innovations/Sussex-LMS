import { recordContext } from "./records.js";
const defaults = { pickupStart: "06:00", pickupEnd: "08:30", dropoffStart: "13:00", dropoffEnd: "16:00" };
const timeOK = (value) => /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value);
export function transportNow(state, now = new Date()) {
  if (state.transportClock?.mode === "demo") return { ...state.transportClock, demo: true };
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Colombo", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (key) => parts.find((part) => part.type === key)?.value;
  return { date: `${get("year")}-${get("month")}-${get("day")}`, time: `${get("hour")}:${get("minute")}`, demo: false };
}
export function trackingPolicy(state, bus, now) {
  const clock = transportNow(state, now), settings = { ...defaults, ...state.trackingSettings?.[bus.branch] };
  const weekday = new Date(clock.date + "T12:00:00+05:30").getUTCDay();
  const direction = clock.time >= settings.pickupStart && clock.time < settings.pickupEnd ? "pickup" : clock.time >= settings.dropoffStart && clock.time < settings.dropoffEnd ? "dropoff" : "";
  const completed = Boolean(state.trackingCompleted?.[[bus.branch, bus.id, clock.date, direction].join(":")]) || (state.driverRuns || []).some((run) => run.busId === bus.id && run.branch === bus.branch && run.date === clock.date && run.status === "completed" && direction === "pickup");
  const visible = Boolean(direction && weekday > 0 && weekday < 6 && !completed && !(direction === "pickup" && bus.status === "school"));
  return { visible, clock, settings, direction, reason: visible ? "School transport window open" : completed || direction === "pickup" && bus.status === "school" ? "School trip completed" : "Outside pickup / drop-off hours" };
}
export function protectFleet(state, fleet) {
  return fleet.map((bus) => { const policy = trackingPolicy(state, bus); return { ...bus, trackingVisible: policy.visible, trackingPolicy: policy, ...(!policy.visible ? { route: null } : {}) }; });
}
export function saveTrackingPolicy(state, context, input) {
  const ctx = recordContext(state, context);
  if (ctx.role !== "transport") throw new Error("Use your Transport Coordinator workspace.");
  const next = Object.fromEntries(Object.keys(defaults).map((key) => [key, String(input[key] || "")]));
  if (!Object.values(next).every(timeOK) || !(next.pickupStart < next.pickupEnd && next.pickupEnd <= next.dropoffStart && next.dropoffStart < next.dropoffEnd)) throw new Error("Enter ordered, non-overlapping pickup and drop-off hours.");
  if (!["demo", "live"].includes(input.mode) || input.mode === "demo" && (!timeOK(input.time) || !/^\d{4}-\d{2}-\d{2}$/.test(input.date) || Number.isNaN(Date.parse(input.date)))) throw new Error("Choose a valid clock and demonstration time.");
  state.trackingSettings ||= {}; state.trackingSettings[ctx.branch] = next;
  state.transportClock = { mode: input.mode, time: input.time, date: input.date };
  return next;
}

export function completeTrackingTrip(state, context, busId) {
  const ctx = recordContext(state, context), bus = state.buses.find((item) => item.id === busId && item.branch === ctx.branch);
  if (ctx.role !== "transport" || !bus) throw new Error("Choose a bus in your appointed school.");
  const policy = trackingPolicy(state, bus);
  if (!policy.visible) throw new Error("There is no visible current school trip to complete.");
  state.trackingCompleted ||= {}; state.trackingCompleted[[bus.branch, bus.id, policy.clock.date, policy.direction].join(":")] = new Date().toISOString();
}
