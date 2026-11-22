import { driverViews, driverChecks, driverIssueTypes, driverScope, currentDriverRun, driverRuns, driverStudents, driverIncidents, driverRecipients } from "./driver-data.js";
import { boardingDate, boardingStatuses, visibleBoardingTrips, boardingRows } from "./boarding-data.js";
import { icon } from "./icons.js";
import { badge, button, emptyState, escapeHtml as e, pageHeading } from "./ui.js";

const time = (at) => at ? new Intl.DateTimeFormat("en-LK", { timeZone: "Asia/Colombo", hour: "2-digit", minute: "2-digit" }).format(new Date(at)) : "—";
const link = (label, href, name = "route") => `<a class="button secondary" href="${href}">${icon(name, 17)}${label}</a>`;
const footer = (label) => `<footer class="dialog-footer">${button("Cancel", "close-dialog", { variant: "secondary" })}<button class="button primary" type="submit">${label}</button></footer>`;
const tone = (status) => status === "completed" || status === "resolved" ? "green" : status === "active" || status === "in_progress" ? "blue" : "amber";
const runStatus = (run) => run?.status === "active" ? "Trip in progress" : run?.status === "completed" ? "Trip completed" : "Pre-trip preparation";

function runActions(run) {
  if (!run || run.status === "completed") return button("Prepare a trip", "driver-readiness", { iconName: "checkCircle" });
  if (run.status === "draft") return button("Review safety checks", "driver-readiness", { value: run.id, variant: "secondary", iconName: "checkCircle" }) + button("Start trip", "driver-start", { value: run.id, iconName: "play", extra: run.checks.length === 5 ? "" : 'disabled title="Complete the five safety checks first"' });
  return button("Complete trip", "driver-finish", { value: run.id, iconName: "checkCircle", extra: run.stopEvents.length === run.stops.length ? "" : 'disabled title="Confirm every stop and the school arrival first"' });
}
function metric(label, value, name) {
  return `<article class="surface driver-metric">${icon(name, 20)}<strong>${value}</strong><span>${label}</span></article>`;
}
function daily(options, scope) {
  const { state, context } = options, run = currentDriverRun(state, context), students = driverStudents(state, context);
  const trip = visibleBoardingTrips(state, context)[0], boarded = trip ? boardingRows(state, context, trip.id).filter((row) => row.status === "boarded").length : 0;
  const issues = driverIncidents(state, context).filter((item) => ["open", "in_progress"].includes(item.status));
  return `${pageHeading("Ready for today’s journey", "Your assigned bus, safety checks and passenger boarding in one place.")}
    <section class="driver-hero"><div>${badge(runStatus(run), run?.status === "completed" ? "neutral" : "green")}<p>BUS ${e(scope.bus.id)} · ${e(scope.bus.registration)} · ${e(run?.date || boardingDate())}</p><h2>${e(scope.bus.name)}</h2><span>${e(scope.branch.school)} · Morning school run</span></div><div class="driver-hero-actions">${run?.status === "active" && run.stopEvents.length < run.stops.length ? link("Continue trip & stops", "#driver/overview/route", "route") : runActions(run)}${link("Open route map", "#driver/transport", "map")}</div></section>
    <div class="driver-metrics">${metric("Assigned students", students.length, "users")}${metric("Boarded · latest NFC roster", trip ? boarded + "/" + trip.expected.length : "No roster", "badge")}${metric("Stops confirmed · trip log", run ? run.stopEvents.length + "/" + run.stops.length : "Not started", "pin")}${metric("Open reported issues", issues.length, "alert")}</div>
    <div class="driver-columns"><section class="surface driver-panel"><header><h2>Before you set off</h2>${badge((run?.checks.length || 0) + "/5 checked", run?.checks.length === 5 ? "green" : "amber")}</header><ul class="driver-checks">${Object.entries(driverChecks).map(([key, label]) => `<li>${icon(run?.checks.includes(key) ? "checkCircle" : "clock", 18)}<span>${label}</span></li>`).join("")}</ul><p>Save the checklist, then start a recorded demo trip. Use trip controls while stationary.</p></section>
    <section class="surface driver-panel"><header><h2>Student boarding</h2>${icon("badge", 22)}</header><p>${trip ? `${e(trip.date)} · ${trip.direction === "to_school" ? "To school" : "Return home"} · ${trip.phase === "boarding" ? "Pickup open" : "Pickup closed"}` : "Open an NFC trip roster to record student boarding."}</p><p>Reader taps and the vehicle trip are separate records. A missed tap needs review by the Transport Coordinator.</p>${link("Bus boarding & reader", "#driver/boarding", "badge")}<hr><h3>School coordination</h3><p>Report a delay, vehicle concern or reader issue to your school’s transport team.</p>${button("Report an issue", "driver-issue", { variant: "secondary", iconName: "alert" })}</section></div>`;
}
function route(options, scope) {
  const run = currentDriverRun(options.state, options.context), stops = run?.stops || scope.bus.stops;
  return `${pageHeading("Route & stops", "Confirm each stop in order when the bus is safely stationary.", link("View route map", "#driver/transport", "map"))}
    <section class="surface driver-panel"><header><div><h2>${e(run?.routeName || scope.bus.name)}</h2><p>${run ? e(run.date) : "Current assigned route"} · ${runStatus(run)}</p></div>${badge(run ? run.stopEvents.length + "/" + stops.length + " confirmed" : stops.length + " stops", "neutral")}</header>
    <ol class="driver-stop-list">${stops.map((name, index) => {
      const event = run?.stopEvents.find((item) => item.index === index), next = run?.status === "active" && index === run.stopEvents.length;
      return `<li class="${event ? "is-confirmed" : next ? "is-next" : ""}"><span class="driver-stop-dot">${event ? icon("check", 16) : index + 1}</span><div><h3>${e(name)}</h3><p>${event ? "Confirmed at " + time(event.at) : next ? "Next stop to confirm" : index === stops.length - 1 ? "School destination" : "Route stop"}</p></div>${next ? button(index === stops.length - 1 ? "Confirm school arrival" : "Confirm stop", "driver-stop", { value: run.id + "|" + index, variant: "secondary", iconName: "pin" }) : event ? badge("Confirmed", "green") : ""}</li>`;
    }).join("")}</ol><div class="driver-action-row">${runActions(run)}</div><p>Stop confirmations are your manual trip log. The map continues its GPS simulation; confirming a stop does not scan a student card or record a drop-off.</p></section>`;
}
function students(options) {
  const rows = driverStudents(options.state, options.context, options.driver.query);
  return `${pageHeading("Assigned students", "Only students currently allocated to your bus. Use the reader screen to record boarding.", link("Open bus boarding", "#driver/boarding", "badge"))}
    <section class="surface driver-panel"><label class="driver-search">${icon("search", 18)}<input type="search" placeholder="Search name, admission or class" aria-label="Search assigned students" value="${e(options.driver.query)}" data-change="driver-query" data-focus="driver-search"></label>
    <div class="driver-student-list">${rows.map((row) => `<article><span class="driver-person-icon">${icon("users", 21)}</span><div><h3>${e(row.name)}</h3><p>${e(row.admissionNumber)} · Class ${e(row.className)}</p><small>${row.cardReady ? "Active transport card" : "Card needs school-office attention"}</small></div>${badge(row.boarding ? boardingStatuses[row.boarding] : "No NFC trip entry", row.boarding === "boarded" ? "green" : "neutral")}</article>`).join("") || emptyState("users", "No matching students", "Student allocations are maintained by the school transport team.")}</div></section>`;
}
function issues(options) {
  const rows = driverIncidents(options.state, options.context, options.driver.issueStatus);
  return `${pageHeading("Safety & issues", "Report transport concerns and follow their coordination status.", button("Report an issue", "driver-issue", { iconName: "alert" }))}
    <section class="surface driver-panel"><p class="driver-notice">This prototype saves a school follow-up. It does not send a message or dispatch emergency assistance.</p><label class="field driver-status-filter">Reported issue status<select data-change="driver-issue-status">${Object.entries({ all: "All my issues", open: "Open", in_progress: "In progress", resolved: "Resolved", unavailable: "Follow-up unavailable" }).map(([key, label]) => `<option value="${key}" ${key === options.driver.issueStatus ? "selected" : ""}>${label}</option>`).join("")}</select></label>
    <div class="driver-issue-list">${rows.map((row) => `<article><header><div><small>${e(driverIssueTypes[row.kind])} · ${e(row.createdAt.slice(0, 10))} ${time(row.createdAt)}</small><h3>${e(row.title)}</h3></div>${badge(e(({ open: "Open", in_progress: "In progress", resolved: "Resolved", unavailable: "Unavailable" })[row.status] || row.status), tone(row.status))}</header><p>${e(row.description)}</p><small>School owner: ${e(row.owner)}</small></article>`).join("") || emptyState("checkCircle", "No reported issues", "Your submitted concerns and their school coordination status will appear here.")}</div></section>`;
}
function history(options) {
  const rows = driverRuns(options.state, options.context);
  return `${pageHeading("Trip history", "Your recorded trips and safety checks for the currently assigned bus.")}
    <section class="surface driver-panel"><div class="driver-history">${rows.map((run) => `<article><div><small>${e(run.date)} · Morning school run</small><h3>${e(run.routeName)}</h3><p>Started ${time(run.startedAt)} · Completed ${time(run.endedAt)}</p><small>${run.checks.length}/5 safety checks · ${run.stopEvents.length}/${run.stops.length} stops confirmed</small></div><div>${badge(e(run.status), tone(run.status))}${button("Download trip log", "driver-export", { value: run.id, variant: "secondary", iconName: "download" })}</div><details><summary>View stop confirmations</summary><ol>${run.stops.map((name, index) => `<li>${e(name)} <span>${time(run.stopEvents.find((item) => item.index === index)?.at)}</span></li>`).join("")}</ol></details></article>`).join("") || emptyState("file", "No recorded trips yet", "Prepare and start a trip from Daily Overview. Existing map simulations do not create historical logs.")}</div><p>History follows your current bus assignment. CSV includes trip and stop times in UTC; screen times use Sri Lanka time.</p></section>`;
}
export function driverPage(options) {
  const scope = driverScope(options.state, options.context);
  if (!scope) return `<section class="driver-portal">${pageHeading("Driver workspace", "School transport")}${options.scopeControls || ""}<section class="surface">${emptyState("bus", "No bus assigned", "Your school transport team must assign a bus before route, boarding or trip records are available.")}</section></section>`;
  const view = options.driver.view;
  return `<section class="chairman-portal section-portal driver-portal"><header class="driver-identity"><div><span class="eyebrow">DRIVER WORKSPACE</span><h1>My school transport</h1><p>${e(scope.context.account.name)} · Bus ${e(scope.bus.id)} · ${e(scope.branch.name)}</p></div>${badge("Simulated transport", "amber")}</header>${options.scopeControls || ""}<nav class="chairman-view-bar section-view-bar" aria-label="Driver views">${driverViews.map((item) => `<a href="#driver/overview/${item.id}" aria-label="${item.name}" ${item.id === view ? 'aria-current="page" class="is-active"' : ""}>${icon(item.icon, 18)}<span class="chairman-view-full">${item.name}</span><span class="chairman-view-short">${item.short}</span></a>`).join("")}</nav><div class="chairman-analytics section-analytics">${({ summary: daily, route, students, issues, history })[view](options, scope)}</div></section>`;
}
export function driverReadinessForm(state, context, id = "") {
  const scope = driverScope(state, context), current = currentDriverRun(state, context);
  const run = id ? driverRuns(state, context).find((run) => run.id === id) : current?.status === "draft" ? current : null;
  const dates = Array.from({ length: 8 }, (_, index) => "2026-11-" + (20 + index)), used = new Set(driverRuns(state, context).map((run) => run.date));
  const nextDate = dates.find((date) => date >= boardingDate() && !used.has(date)) || dates.find((date) => !used.has(date)) || boardingDate();
  return `<form data-form="driver-readiness"><div class="form-body"><input type="hidden" name="id" value="${e(run?.id || "")}"><h3>Bus ${e(scope.bus.id)} · ${e(scope.bus.name)}</h3><label class="field">Demo trip date<input type="date" name="date" min="2026-11-20" max="2026-11-27" value="${e(run?.date || nextDate)}" ${run ? "readonly" : ""} required></label><p>Morning school run · Check the vehicle while stationary.</p><fieldset class="driver-check-fields"><legend>Pre-trip safety checklist</legend>${Object.entries(driverChecks).map(([key, label]) => `<label><input type="checkbox" name="checks" value="${key}" ${run?.checks.includes(key) ? "checked" : ""}><span>${label}</span></label>`).join("")}</fieldset><p>Save incomplete checks as a draft. All five are required to start a recorded trip; these checks do not connect to vehicle sensors.</p><p class="form-error" hidden></p></div>${footer("Save safety checklist")}</form>`;
}
export function driverIssueForm(state, context) {
  const recipients = driverRecipients(state, context);
  return `<form data-form="driver-issue"><div class="form-body"><label class="field">Issue type<select name="kind">${Object.entries(driverIssueTypes).map(([key, label]) => `<option value="${key}">${label}</option>`).join("")}</select></label><label class="field">School Transport Coordinator<select name="recipient" required>${recipients.map((person) => `<option value="${e(person.id)}">${e(person.name)}</option>`).join("")}</select></label>${recipients.length ? "" : '<p class="driver-notice">No Transport Coordinator is appointed to this school. Ask the school office to assign one.</p>'}<label class="field">Issue title<input name="title" maxlength="120" required></label><label class="field">What happened?<textarea name="description" rows="4" maxlength="1000" required></textarea></label><p>Your bus and driver details are attached automatically. The coordinator reviews progress; only your submitted text and status appear in your portal.</p><p class="form-error" hidden></p></div>${footer("Record issue for coordinator")}</form>`;
}
