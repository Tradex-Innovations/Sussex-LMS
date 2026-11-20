import { rankedResults, networkSummary, performanceTone, assessmentResult, branchActivity, subjects } from "./network-analytics.js";
import { icon } from "./icons.js";
import { networkFleetOverlay, networkFleetPage, branchTransportPage, networkBusPage } from "./network-transport.js";
import { networkFleet } from "./network-fleet.js";
import { badge, button, emptyState, escapeHtml as e, iconTile } from "./ui.js";

export function networkBranches(state, context, network) {
  const scoped = state.branches.filter((branch) => context.branch === "all" || branch.id === context.branch);
  return context.branch !== "all" || network.compare === null ? scoped : scoped.filter((branch) => network.compare.includes(branch.id));
}

function selectFilter(label, key, values, selected) {
  return `<label class="network-filter"><span>${label}</span><span class="select-wrap"><select data-change="${key}" aria-label="${label}">${values.map(([value, name]) => `<option value="${value}" ${String(value) === String(selected) ? "selected" : ""}>${name}</option>`).join("")}</select>${icon("chevronDown", 15)}</span></label>`;
}

function picker(state, context, network) {
  if (context.role !== "chairman" || context.branch !== "all") return "";
  const count = network.compare === null ? state.branches.length : network.compare.length;
  return `<details class="network-branch-picker">
    <summary class="button secondary">${icon("school", 17)} Choose schools <span class="selection-count">${count}</span>${icon("chevronDown", 15)}</summary>
    <div class="network-picker-panel">
      <div class="network-picker-tools">${button("Select all", "network-all", { variant: "secondary compact" })}${button("Clear", "network-none", { variant: "secondary compact" })}</div>
      <div class="network-picker-list">${state.branches.map((branch) => `<label><input type="checkbox" data-change="network-branch-check" value="${branch.id}" ${network.compare === null || network.compare.includes(branch.id) ? "checked" : ""}><span>${e(branch.name)}</span></label>`).join("")}</div>
    </div>
  </details>`;
}

function metric(label, value, description, name, tone = "green") {
  return `<article class="surface network-metric">${iconTile(name, tone)}<div><span>${label}</span><strong>${value}</strong><small>${description}</small></div></article>`;
}

function activityFeed(state, branch, network) {
  const entries = branchActivity(state, branch.id, network.category);
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Colombo" });
  const categories = [["all", "All activity"], ["academic", "Learning"], ["transport", "Transport"], ["library", "Library"], ["people", "People"]];
  const icons = { academic: "book", transport: "bus", library: "library", people: "users" };
  return `<section class="surface network-activity">
    <header class="panel-heading"><div><h2>School activity</h2><p>Updates for ${e(branch.name)}</p></div></header>
    <div class="activity-filters">${categories.map(([id, label]) => `<button type="button" data-action="network-activity" data-value="${id}" aria-pressed="${network.category === id}" class="${network.category === id ? "is-active" : ""}">${label}</button>`).join("")}</div>
    <div class="activity-feed">${entries.map((entry) => `<article class="activity-entry">${iconTile(icons[entry.category] || "school", "green", "small-tile")}<div><strong>${e(entry.message)}</strong><span>${e(entry.actor)} · ${date.format(new Date(entry.at))}${entry.sample ? " · Sample" : ""}</span></div></article>`).join("") || emptyState("clock", "No activity in this category", "Choose another category to see this school’s updates.")}</div>
  </section>`;
}

function branchDetail(state, context, result, network) {
  const branch = result.branch;
  const metrics = [
    ["Students in demo", state.students.filter((student) => student.branch === branch.id).length],
    ["Assigned teachers", state.accounts.filter((person) => person.grants.some((grant) => ["teacher", "class_teacher"].includes(grant.role) && grant.branch === branch.id)).length],
    ["Course classes", state.courses.filter((course) => course.branch === branch.id).length],
    ["Buses in demo", networkFleet(state, [branch]).length],
    ["Library orders", state.orders.filter((order) => order.branch === branch.id).length],
    ["Lessons completed", state.students.filter((student) => student.branch === branch.id).reduce((sum, student) => sum + (state.completed[student.id]?.length || 0), 0)],
  ];
  return `<section class="selected-school-heading">
    <div><h2>${e(branch.school)}</h2><p>${e(branch.address)}</p></div>
    <div class="branch-report-actions"><a class="button secondary" href="${e(branch.source)}" target="_blank" rel="noopener noreferrer">Official school page</a>${button(["principal", "vice_principal"].includes(context.role) ? "Open academics" : "Compare schools", "network-performance", { variant: "secondary", iconName: "school" })}</div>
  </section>
  ${assessmentFilters(network)}
  <div class="selected-school-grid">
    <section class="surface subject-breakdown"><header class="panel-heading"><div><h2>Learning performance</h2><p>Grade ${network.grade} · Term ${network.term} · Sample marks</p></div></header>
      <div class="subject-bars">${subjects.map((subject) => {
        const assessment = assessmentResult(branch, { ...network, subject: subject.id });
        return `<div><span>${subject.name}</span><strong>${assessment.mean.toFixed(1)}%</strong><progress value="${assessment.mean}" max="100" aria-label="${subject.name} sample average"></progress></div>`;
      }).join("")}</div>
      <div class="assessment-facts"><span>Pass mark <strong>50%</strong></span><span>High-score threshold <strong>75%</strong></span><span>Students assessed <strong>${result.count}</strong></span></div>
    </section>
    ${activityFeed(state, branch, network)}
  </div>
  <section class="surface branch-workspace">
    <header class="panel-heading"><div><h2>Branch workspace</h2><p>Records and actions available in this prototype</p></div>${button("Open this branch", "network-open", { value: branch.id, variant: "secondary" })}</header>
    <dl class="workspace-counts">${metrics.map(([label, count]) => `<div><dt>${label}</dt><dd>${count}</dd></div>`).join("")}</dl>
  </section>`;
}


function assessmentFilters(network, includeSubject = false) {
  return `<div class="network-toolbar">
    ${includeSubject ? selectFilter("Subject", "network-subject", subjects.map((subject) => [subject.id, subject.name]), network.subject) : ""}
    ${selectFilter("Grade", "network-grade", [6, 8, 10, 11].map((grade) => [grade, "Grade " + grade]), network.grade)}
    ${selectFilter("Assessment", "network-term", [1, 2, 3].map((term) => [term, "Term " + term]), network.term)}
  </div>`;
}

function comparisonPanel(options, results) {
  const { state, context, network } = options;
  const summary = networkSummary(results);
  const subject = subjects.find((subject) => subject.id === network.subject);
  return `${options.scopeControls || ""}
    ${assessmentFilters(network, true)}
    ${picker(state, context, network)}
    <p class="network-data-note">Marks and activity are sample data for this demonstration.</p>
    <div class="network-metrics">
      ${metric("Schools in view", results.length, "20 schools in the network", "school", "neutral")}
      ${metric("Average mark", summary.mean.toFixed(1) + "%", subject.name + " · Weighted by students", "book")}
      ${metric("Pass rate", summary.passRate.toFixed(1) + "%", summary.count + " sample students assessed", "checkCircle", "blue")}
      ${metric("Highest average", results[0] ? e(results[0].branch.name) : "—", results[0] ? results[0].mean.toFixed(1) + "% · Sample results" : "Select schools to compare", "spark", "amber")}
    </div>
    <section class="surface network-ranking">
      <header class="panel-heading"><div><h2>${subject.name} comparison</h2><p>Grade ${network.grade} · Term ${network.term} · Common sample assessment</p></div></header>
      <div class="ranking-head"><span>School</span><span>Average</span><span>Change</span></div>
      <div class="ranking-rows">${results.map((result) => `<button type="button" class="ranking-row ${network.selected === result.branch.id ? "is-selected" : ""}" data-action="network-select" data-value="${result.branch.id}" data-focus="ranking-${result.branch.id}" aria-pressed="${network.selected === result.branch.id}">
        <span class="ranking-number">${result.rank}</span><span class="ranking-school"><strong>${e(result.branch.name)}</strong><span>${result.count} assessed · ${e(result.branch.province)}</span><span class="ranking-bar"><i class="tone-${performanceTone(result.mean)}" style="width:${result.mean}%"></i></span></span>
        <strong class="ranking-value">${result.mean.toFixed(1)}%</strong><span class="ranking-change">${result.change === null ? "—" : (result.change > 0 ? "+" : "") + result.change.toFixed(1) + " pp"}</span>
      </button>`).join("") || emptyState("school", "Choose schools to compare", "Use Choose schools to select branches.", button("Select all schools", "network-all", { variant: "secondary" }))}</div>
      <footer class="ranking-footer">Ranked within selected schools by average mark. Change is against the previous term.</footer>
    </section>`;
}


export function networkOverviewPage(options) {
  const { state, context, network, networkBuses } = options;
  const results = rankedResults(networkBranches(state, context, network), network);
  const selected = results.find((result) => result.branch.id === network.selected);
  const bus = networkBuses.find((bus) => bus.id === network.busId);
  const mode = ["comparison", "fleet"].includes(network.mode) ? network.mode
    : network.mode === "bus" && bus ? "bus" : network.mode === "branch" && selected ? "branch" : "";
  const titles = { branch: "Branch overview", comparison: "Compare schools", fleet: "Network bus activity", bus: "Bus activity" };
  return `<section class="network-experience ${mode ? "has-inspector" : ""}">
    <div class="network-map-viewport">
      <h1 class="sr-only">Sri Lanka school transport map</h1>
      <div id="school-network-map" class="school-network-map" tabindex="0" role="region" aria-label="Sri Lanka school branch map"></div>
      ${networkFleetOverlay(networkBuses, network, options.paused, context)}
    </div>
    ${mode ? `<aside class="network-inspector" aria-labelledby="network-inspector-title">
      <header class="network-inspector-header"><div><span>Sussex College Network</span><h2 id="network-inspector-title" tabindex="-1">${titles[mode]}</h2></div>
        <button type="button" class="icon-button" data-action="network-close" aria-label="Close panel">${icon("x", 21)}</button>
      </header>
      ${mode === "branch" ? `<nav class="branch-panel-tabs" aria-label="Branch details"><button type="button" data-action="network-tab" data-value="transport" aria-pressed="${network.tab === "transport"}">${icon("bus", 17)} Bus activity</button><button type="button" data-action="network-tab" data-value="performance" aria-pressed="${network.tab === "performance"}">${icon("book", 17)} Performance</button></nav>` : ""}
      <div class="network-inspector-content">
        ${mode === "bus" ? networkBusPage(options, bus) : mode === "fleet" ? networkFleetPage(options) : mode === "branch" ? network.tab === "transport" ? branchTransportPage(options, selected.branch) : `${badge("Sample results", "amber")}${branchDetail(state, context, selected, network)}` : comparisonPanel(options, results)}
      </div>
    </aside>` : ""}
  </section>`;
}
