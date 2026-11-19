import { freshState, loadState, roles, saveState, sectionFor, sections } from "./data.js";
import { assignableRoles, branchTeachers, can, canManageGrant, contextFor, linkedChildren, visibleBuses, visibleCourses, visibleOrders, visibleStudents, canPublish } from "./access.js";
import { icon } from "./icons.js";
import { assignmentForm, coursesPage, materialForm } from "./learning.js";
import { branchBooks, bookForm, cartForm, cartFor, cartItems, catalogResults, libraryPage, orderHistory } from "./library.js";
import { accessPage, branchForm, busForm, peoplePage, roleForm, scopeLabel, studentForm } from "./management.js";
import { networkBranches, networkOverviewPage } from "./network.js";
import { rankedResults, subjects } from "./network-analytics.js";
import { SchoolNetworkMap } from "./network-map.js";
import { FleetMap } from "./map.js";
import { mountMapSummary, transportPage, updateTripDetails } from "./transport.js";
import { avatar, button, emptyState, escapeHtml as e, iconTile } from "./ui.js";
import { authenticateParent, demoPassword, loginPage, parentContext, readParentSession, saveParentSession } from "./parent-login.js";

const app = document.querySelector("#app");
const dialog = document.querySelector("#dialog");
const toasts = document.querySelector("#toasts");
const navigation = {
  overview: { label: "Overview", icon: "school" },
  transport: { label: "Bus tracking", icon: "bus" },
  courses: { label: "Courses", icon: "book" },
  people: { label: "Students & guardians", icon: "users" },
  library: { label: "Library", icon: "library" },
  access: { label: "Roles & access", icon: "badge" },
};
let state = loadState();
let parentSession = readParentSession();
let map;
let schoolMap;
let mapViewKey;
let dialogMode;
let view = getView();
const ui = { accounts: {}, branch: "all", bus: "01", filter: "all", courseId: "", grade: "all", query: "", paused: false, runningSince: performance.now(), elapsed: 0, starts: {},
  network: { subject: "mathematics", grade: 8, term: 3, selected: "", compare: null, category: "all" } };

function getView() {
  const [requestedRole, requestedPage] = location.hash.slice(1).split("/");
  const role = Object.hasOwn(roles, requestedRole) ? requestedRole : "chairman";
  const page = roles[role].pages.includes(requestedPage) ? requestedPage : roles[role].start;
  return { role, page };
}

function context() {
  if (view.role === "parent") return parentContext(state, parentSession);
  const [id, index] = (ui.accounts[view.role] || "").split("|");
  return contextFor(state, view.role, id, ui.branch, index);
}

function childFor(ctx) {
  const children = linkedChildren(state, ctx);
  return children.find((child) => child.id === state.child) || children[0];
}

function optionsFor(ctx = context()) {
  const children = linkedChildren(state, ctx);
  const child = childFor(ctx);
  return { state, context: ctx, children, child, fleet: visibleBuses(state, ctx, child), filter: ui.filter, selected: ui.bus, paused: ui.paused, progress, courseId: ui.courseId, grade: ui.grade, query: ui.query, network: ui.network };
}

function elapsed() {
  return ui.elapsed + (ui.paused ? 0 : (performance.now() - ui.runningSince) / 1000);
}

function progress(bus) {
  if (bus.status === "school") return 1;
  if (bus.status === "delayed") return bus.start;
  if (ui.starts[bus.id] !== undefined) return Math.min(0.97, 0.01 + (elapsed() - ui.starts[bus.id]) * 0.005);
  return 0.15 + (bus.start - 0.15 + elapsed() * 0.006) % 0.77;
}

function brand() {
  return `<img class="brand-logo" src="./assets/sussex-college-network-logo.png" alt=""><span class="brand-name">Sussex College<span>Network</span></span>`;
}

function navigationLinks(mobile = false) {
  return roles[view.role].pages.map((page) => `<a href="#${view.role}/${page}" class="nav-link ${page === view.page ? "is-active" : ""}" ${page === view.page ? 'aria-current="page"' : ""}>${icon(navigation[page].icon, 20)}<span>${mobile && page === "people" ? "Students" : mobile && page === "access" ? "Access" : navigation[page].label}</span></a>`).join("");
}

function sidebar(ctx) {
  const branch = state.branches.find((item) => item.id === ctx?.branch);
  return `<aside class="sidebar"><a class="brand" aria-label="Sussex College Network home" href="#${view.role}/${roles[view.role].start}">${brand()}</a>
    <nav class="sidebar-nav" aria-label="Workspace"><p>WORKSPACE</p>${navigationLinks()}</nav>
    <div class="sidebar-school"><span>${icon("school", 22)}</span><div><strong>Sussex College Network</strong><small>${e(branch?.name || "All school branches")}</small></div></div>
  </aside>`;
}

function topbar(ctx) {
  return `<header class="topbar">
    <a class="brand mobile-brand" aria-label="Sussex College Network home" href="#${view.role}/${roles[view.role].start}">${brand()}</a>
    <div class="breadcrumbs">${icon("school", 17)}<span>School portal</span>${icon("chevron", 13)}<strong>${navigation[view.page].label}</strong></div>
    <div class="topbar-actions"><span class="demo-label">${icon("spark", 14)} Demo mode</span>
      ${view.role === "parent" ? button("Log out", "parent-logout", { variant: "secondary" }) : `<details class="role-picker"><summary class="button role-button" aria-label="Switch role">${icon(roles[view.role].icon, 17)}<span>${roles[view.role].name}</span>${icon("chevronDown", 15)}</summary>
        <div class="role-menu"><p>Preview a role</p>${Object.entries(roles).map(([id, role]) => `<a href="#${id}/${role.start}" data-role-link class="${id === view.role ? "is-current" : ""}">${icon(role.icon, 17)}<span>${role.name}</span>${id === view.role ? icon("check", 15) : ""}</a>`).join("")}
          <button type="button" data-action="reset">${icon("reset", 16)} Reset demo</button>
        </div>
      </details>`}${ctx ? `<span class="account-avatar" title="${e(ctx.account.name)}">${avatar(ctx.account, "small")}</span>` : ""}
    </div>
  </header>`;
}

function scopeBar(ctx) {
  if (!ctx) return "";
  if (ctx.role === "parent") {
    const student = childFor(ctx);
    return `<section class="parent-student-bar" aria-label="Signed-in student">${avatar(student, "small")}<div><strong>${e(student.name)}</strong><span>${e(student.admissionNumber)} · Class ${e(student.className)}</span></div><span class="parent-branch-label">${e(state.branches.find((branch) => branch.id === student.branch)?.name)}</span></section>`;
  }
  const entries = state.accounts.flatMap((person) => person.grants.map((grant, index) => ({ person, grant, index }))).filter(({ grant }) => grant.role === view.role);
  const selectedIndex = ctx.account.grants.indexOf(ctx.grant);
  const selected = ctx.account.id + "|" + selectedIndex;
  return `<section class="scope-bar" aria-label="Current access scope">
    <label class="scope-account"><span>Preview account</span><span class="select-wrap"><select data-change="account" aria-label="Preview account">${entries.map(({ person, grant, index }) => `<option value="${person.id}|${index}" ${person.id + "|" + index === selected ? "selected" : ""}>${e(person.name)}${entries.length > 1 ? " · " + e(scopeLabel(grant, state)) : ""}</option>`).join("")}</select>${icon("chevronDown", 15)}</span></label>
    ${view.role === "chairman" ? `<label class="scope-branch"><span>School branch</span><span class="select-wrap"><select data-change="branch" aria-label="School branch"><option value="all">All branches</option>${state.branches.map((item) => `<option value="${item.id}" ${ctx.branch === item.id ? "selected" : ""}>${e(item.name)}</option>`).join("")}</select>${icon("chevronDown", 15)}</span></label>`
      : `<div class="scope-description">${icon("pin", 16)}<span>${e(scopeLabel(ctx.grant, state))}</span></div>`}
    <span class="scope-note">Sample accounts · Changes saved in this browser</span>
  </section>`;
}

function render(focus, { scrollTop = false } = {}) {
  const pickerOpen = app.querySelector(".network-branch-picker")?.open;
  const previousViewport = map?.viewport;
  map?.destroy();
  schoolMap?.destroy();
  schoolMap = null;
  map = null;
  const ctx = context();
  if (view.role === "parent" && !ctx) {
    parentSession = null;
    saveParentSession(null);
    document.title = "Parent Login · Sussex College Network";
    app.innerHTML = loginPage(state);
    return;
  }
  let body = `<section class="surface">${emptyState("users", "No account assigned", "Use a Principal or Chairman view to appoint someone to this role.")}</section>`;
  let options;
  if (ctx) {
    options = optionsFor(ctx);
    if (!options.fleet.some((bus) => bus.id === ui.bus)) ui.bus = options.fleet[0]?.id;
    options.selected = ui.bus;
    const pages = { overview: networkOverviewPage, courses: coursesPage, people: peoplePage, library: libraryPage, access: accessPage };
    body = view.page === "transport" ? transportPage(view.role, options) : pages[view.page](options);
  }
  document.title = `${navigation[view.page].label} · ${roles[view.role].name} · Sussex College Network`;
  const mobileNavigation = roles[view.role].pages.length > 1;
  app.innerHTML = `<div class="app-shell role-${view.role} ${mobileNavigation ? "has-mobile-nav" : ""}">
    ${sidebar(ctx)}<div class="desktop-content">${topbar(ctx)}<main id="main" class="page page-${view.page}">${scopeBar(ctx)}${body}</main></div>
    ${mobileNavigation ? `<nav class="mobile-nav" aria-label="Workspace">${navigationLinks(true)}</nav>` : ""}
  </div>`;
  const networkStage = app.querySelector("#school-network-map");
  if (networkStage) {
    const branches = networkBranches(state, ctx, ui.network);
    const results = rankedResults(branches, ui.network);
    if (!results.some((result) => result.branch.id === ui.network.selected)) ui.network.selected = results[0]?.branch.id || "";
    schoolMap = new SchoolNetworkMap(networkStage, results, ui.network.selected, selectNetworkBranch);
    const rows = app.querySelector(".ranking-rows");
    const activeRow = rows?.querySelector('[aria-pressed="true"]');
    if (activeRow) rows.scrollTop = Math.max(0, activeRow.offsetTop - rows.offsetTop - rows.clientHeight / 2 + activeRow.clientHeight / 2);
    const picker = app.querySelector(".network-branch-picker");
    if (picker && pickerOpen) picker.open = true;
  }
  const stage = app.querySelector("#map-stage");
  if (stage && options.fleet.length) {
    const fleet = options.fleet;
    const isFleet = !["parent", "driver"].includes(view.role);
    const selected = isFleet ? ui.bus : fleet[0].id;
    const bus = fleet.find((item) => item.id === selected);
    const key = `${ctx.account.id}-${ctx.branch}-${isFleet ? "fleet" : selected}`;
    const schools = state.branches.filter((branch) => fleet.some((item) => item.branch === branch.id));
    map = new FleetMap(stage, { buses: fleet, schools, selected, progress, viewport: mapViewKey === key ? previousViewport : null,
      onSelect: isFleet ? selectBus : null, onTick: () => updateTripDetails(app, bus, progress(bus)) });
    mapViewKey = key;
    if (isFleet) mountMapSummary(stage, bus, progress(bus));
  }
  if (scrollTop) window.scrollTo({ top: 0, behavior: "instant" });
  if (focus) app.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
}

function toast(message) {
  const notice = document.createElement("div");
  notice.className = "toast";
  notice.innerHTML = `${icon("checkCircle", 18)}<span>${e(message)}</span>`;
  toasts.replaceChildren(notice);
  setTimeout(() => notice.remove(), 3800);
}

function update(mutator, activity) {
  const next = structuredClone(state);
  mutator(next);
  if (activity) {
    next.activity = [{ ...activity, id: crypto.randomUUID(), actor: context()?.account.name || "Demo user", at: new Date().toISOString() }, ...(next.activity || [])].slice(0, 300);
  }
  if (!saveState(next)) { toast("The change could not be saved in this browser."); return false; }
  state = next;
  return true;
}

function showDialog(mode, title, description, content) {
  dialogMode = mode;
  dialog.innerHTML = `<header class="dialog-heading"><div><h2 id="dialog-title">${e(title)}</h2>${description ? `<p>${e(description)}</p>` : ""}</div><button type="button" class="icon-button" aria-label="Close dialog" data-action="close-dialog">${icon("x", 21)}</button></header>${content}`;
  if (!dialog.open) dialog.showModal();
}

function closeDialog() {
  dialog.close();
  dialogMode = null;
}

function confirmDialog(mode, title, description, label, action, value) {
  showDialog(mode, title, description, `<footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}${button(label, action, { value })}</footer>`);
}

function selectBus(id, focus) {
  const fleet = optionsFor().fleet;
  const bus = fleet.find((item) => item.id === id);
  if (!bus) return;
  ui.bus = id;
  if (ui.filter !== "all" && ui.filter !== bus.status) ui.filter = "all";
  render(focus);
}

function selectNetworkBranch(id, focus) {
  const ctx = context();
  if (!["chairman", "principal", "vice_principal"].includes(ctx?.role)) return;
  if (!networkBranches(state, ctx, ui.network).some((branch) => branch.id === id)) return;
  ui.network.selected = id;
  render(focus);
}

function filterBuses(status, focus) {
  const fleet = optionsFor().fleet;
  ui.filter = status;
  if (status !== "all" && !fleet.some((bus) => bus.id === ui.bus && bus.status === status)) ui.bus = fleet.find((bus) => bus.status === status)?.id || ui.bus;
  render(focus);
}

function showCart() {
  showDialog("cart", "Book bag", "Review books for school collection.", cartForm(state, context()));
}

function adjustBook(id, delta) {
  const ctx = context();
  const book = branchBooks(state, ctx).find((item) => item.id === id && item.available);
  if (!book) return;
  const quantity = Math.max(0, Math.min(10, (cartFor(state, ctx)[id] || 0) + delta));
  if (!update((next) => {
    next.carts[ctx.account.id] ??= {};
    next.carts[ctx.account.id][ctx.branch] ??= {};
    if (quantity) next.carts[ctx.account.id][ctx.branch][id] = quantity;
    else delete next.carts[ctx.account.id][ctx.branch][id];
  })) return;
  render();
  if (dialogMode === "cart") showCart();
  else toast("Book added to your bag.");
}

function placeOrder() {
  const ctx = context();
  const items = cartItems(state, ctx).map(({ id, title, price, quantity }) => ({ id, title, price, quantity }));
  if (!items.length) return;
  const number = `CW-${1001 + state.orders.length}`;
  const order = { number, parent: ctx.account.id, branch: ctx.branch, status: "pending", items,
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    date: new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", timeZone: "Asia/Colombo" }).format(new Date()) };
  if (!update((next) => { next.orders.push(order); next.carts[ctx.account.id][ctx.branch] = {}; }, { branch: ctx.branch, category: "library", message: "New library order placed." })) return;
  render();
  showDialog("receipt", "Order placed", number, `<div class="form-body order-confirmation">${iconTile("checkCircle", "green")}<p>Collect your books and pay at your school library.</p></div><footer class="dialog-actions">${button("View my orders", "orders", { iconName: "package" })}</footer>`);
}

function downloadMaterial(id) {
  const material = state.materials.find((item) => item.id === id);
  const link = document.createElement("a");
  const name = material.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "class-material";
  const href = material.file ? material.file.data : URL.createObjectURL(new Blob([`${material.title}\n${material.type} · Sussex College Network\n\n${material.content}`], { type: "text/plain;charset=utf-8" }));
  link.href = href;
  link.download = material.file?.name || name + ".txt";
  document.body.append(link);
  link.click();
  link.remove();
  if (!material.file) setTimeout(() => URL.revokeObjectURL(href), 3000);
}

function roleTarget(value) {
  const [id, index] = (value || "").split("|");
  const account = state.accounts.find((person) => person.id === id);
  return { account, index: Number(index), grant: account?.grants[index] };
}

function authorizedAction(name, value, ctx) {
  if (["reset", "confirm-reset", "close-dialog"].includes(name)) return true;
  if (name === "parent-logout") return view.role === "parent";
  if (!ctx) return false;
  const options = optionsFor(ctx);
  const course = visibleCourses(state, ctx, options.child).find((item) => item.id === value);
  const material = state.materials.find((item) => item.id === value);
  const materialCourse = visibleCourses(state, ctx, options.child).find((item) => item.id === material?.course);
  const guards = {
    "network-select": ["chairman", "principal", "vice_principal"].includes(ctx.role) && networkBranches(state, ctx, ui.network).some((branch) => branch.id === value),
    "network-open": ["chairman", "principal", "vice_principal"].includes(ctx.role) && networkBranches(state, ctx, ui.network).some((branch) => branch.id === value),
    "network-all": ctx.role === "chairman" && ctx.branch === "all",
    "network-none": ctx.role === "chairman" && ctx.branch === "all",
    "network-activity": ["chairman", "principal", "vice_principal"].includes(ctx.role) && ["all", "academic", "transport", "library", "people"].includes(value),
    "pause": roles[ctx.role].pages.includes("transport"), "bus": options.fleet.some((bus) => bus.id === value),
    "filter": roles[ctx.role].pages.includes("transport"),
    "assign": can(ctx, "courses.assign") && (!value || Boolean(course)),
    "open-course": Boolean(course), "close-course": roles[ctx.role].pages.includes("courses"),
    "add-material": course && canPublish(state, ctx, course),
    "edit-material": materialCourse && canPublish(state, ctx, materialCourse),
    "download": Boolean(materialCourse), "complete": can(ctx, "materials.complete") && Boolean(materialCourse),
    "add-book": can(ctx, "library.order"), "increase-book": can(ctx, "library.order"), "decrease-book": can(ctx, "library.order"),
    "cart": can(ctx, "library.order"), "place-order": can(ctx, "library.order"), "orders": can(ctx, "library.order"),
    "edit-book": can(ctx, "library.manage") && branchBooks(state, ctx).some((book) => book.id === value),
    "collect-order": can(ctx, "library.manage") && visibleOrders(state, ctx).some((order) => order.number === value),
    "end-trip": can(ctx, "trip.manage") && options.fleet.length > 0, "confirm-end-trip": can(ctx, "trip.manage") && options.fleet.length > 0, "start-trip": can(ctx, "trip.manage") && options.fleet.length > 0,
    "edit-bus": can(ctx, "transport.manage") && options.fleet.some((bus) => bus.id === value),
    "edit-student": can(ctx, "students.edit") && (!value || visibleStudents(state, ctx).some((student) => student.id === value)),
    "assign-role": can(ctx, "roles.manage"), "remove-role": canManageGrant(ctx, roleTarget(value).grant || {}),
    "confirm-remove-role": canManageGrant(ctx, roleTarget(value).grant || {}),
    "branch-map": roles[ctx.role].pages.includes("overview") && state.branches.some((branch) => branch.id === value && (ctx.branch === "all" || ctx.branch === value)),
    "edit-branch": can(ctx, "branch.edit"),
  };
  return Boolean(guards[name]);
}

function updateTrip(status) {
  const bus = optionsFor().fleet[0];
  if (!update((next) => { next.buses.find((item) => item.id === bus.id).status = status; }, { branch: bus.branch, category: "transport", message: `BUS ${bus.id} ${status === "route" ? "started a trip." : "completed its trip."}` })) return;
  if (status === "route") ui.starts[bus.id] = elapsed();
  closeDialog();
  render();
  toast(status === "route" ? "Trip started." : "Trip completed.");
}

function action(event) {
  const element = event.target.closest("[data-action]");
  if (!element) return;
  const { action: name, value, focus } = element.dataset;
  const loginForm = app.querySelector('[data-form="parent-login"]');
  if (loginForm && name === "fill-login" && authenticateParent(state, value, demoPassword)) {
    loginForm.elements.admissionNumber.value = value;
    loginForm.elements.password.value = demoPassword;
    loginForm.querySelector(".form-error").hidden = true;
    loginForm.querySelector('[type="submit"]').focus();
    return;
  }
  if (loginForm && name === "toggle-password") {
    const input = loginForm.elements.password;
    const visible = input.type === "password";
    input.type = visible ? "text" : "password";
    element.textContent = visible ? "Hide" : "Show";
    element.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    element.setAttribute("aria-pressed", String(visible));
    return;
  }
  const ctx = context();
  if (!authorizedAction(name, value, ctx)) return toast("This action is outside the current role’s assigned access.");
  switch (name) {
    case "network-select": selectNetworkBranch(value, focus); break;
    case "network-all": ui.network.compare = null; render(); break;
    case "network-none": ui.network.compare = []; render(); break;
    case "network-activity": ui.network.category = value; render(); break;
    case "network-open":
      if (ctx.role === "chairman") ui.branch = value;
      location.hash = `${view.role}/courses`;
      break;
    case "parent-logout":
      parentSession = null;
      saveParentSession(null);
      ui.courseId = "";
      ui.query = "";
      closeDialog();
      location.hash = "parent/login";
      render();
      break;
    case "pause":
      if (ui.paused) ui.runningSince = performance.now(); else ui.elapsed = elapsed();
      ui.paused = !ui.paused; render(focus); break;
    case "bus": selectBus(value, focus); break;
    case "filter": filterBuses(value, focus); break;
    case "assign": showDialog("assignment", "Assign course", "Choose a teacher and enroll students.", assignmentForm(value, optionsFor())); break;
    case "open-course": ui.courseId = value; render("all-courses", { scrollTop: true }); break;
    case "close-course": ui.courseId = ""; render(undefined, { scrollTop: true }); break;
    case "add-material":
    case "edit-material": {
      const item = name === "edit-material" ? state.materials.find((material) => material.id === value) : null;
      const course = state.courses.find((course) => course.id === (item?.course || value));
      showDialog("material", item ? "Edit material" : "Add course material", `${course.title} · ${course.className}`, materialForm(course, item || {})); break;
    }
    case "download": downloadMaterial(value); break;
    case "complete": {
      const child = childFor(ctx);
      const done = state.completed[child.id]?.includes(value);
      if (update((next) => { const list = next.completed[child.id] || []; next.completed[child.id] = done ? list.filter((id) => id !== value) : [...list, value]; }, { branch: child.branch, category: "academic", message: done ? "A lesson was marked incomplete." : "A lesson was marked complete." })) { render(focus); toast(done ? "Marked as incomplete." : "Marked as done."); }
      break;
    }
    case "add-book":
    case "increase-book": adjustBook(value, 1); break;
    case "decrease-book": adjustBook(value, -1); break;
    case "cart": showCart(); break;
    case "place-order": placeOrder(); break;
    case "orders": showDialog("orders", "My orders", "Your family’s library orders.", orderHistory(state, ctx)); break;
    case "edit-book": showDialog("book", "Edit book", "Manage the catalogue for this branch.", bookForm(state.books.find((book) => book.id === value))); break;
    case "collect-order":
      if (update((next) => { next.orders.find((order) => order.number === value).status = "collected"; }, { branch: state.orders.find((order) => order.number === value).branch, category: "library", message: "A library order was collected." })) { render(); toast("Order marked as collected."); } break;
    case "end-trip": confirmDialog("trip", "End this trip?", "The bus will appear as At school for the branch and assigned parents.", "End trip", "confirm-end-trip"); break;
    case "confirm-end-trip": updateTrip("school"); break;
    case "start-trip": updateTrip("route"); break;
    case "edit-bus": showDialog("bus", "Manage bus assignment", "Route, driver, and student assignments.", busForm(state.buses.find((bus) => bus.id === value), state)); break;
    case "edit-student": showDialog("student", value ? "Edit student" : "Add student", "Manage the student record and linked guardians.", studentForm(state, ctx, state.students.find((student) => student.id === value))); break;
    case "assign-role": showDialog("role", "Assign role", "Appoint an existing person or create a demo account.", roleForm(state, ctx)); break;
    case "remove-role": {
      const { account, grant } = roleTarget(value);
      confirmDialog("remove-role", "Remove this role?", `${account.name} will lose ${roles[grant.role].name} access for ${scopeLabel(grant, state)}.`, "Remove role", "confirm-remove-role", value); break;
    }
    case "confirm-remove-role": {
      const { account, index, grant } = roleTarget(value);
      if (update((next) => {
        next.accounts.find((person) => person.id === account.id).grants.splice(index, 1);
        if (grant.role === "driver") {
          const bus = next.buses.find((bus) => bus.id === grant.bus);
          if (bus?.driverId === account.id) { bus.driverId = ""; bus.driver = "Unassigned"; }
        }
      }, { branch: grant.branch, category: "people", message: "A staff role appointment was removed." })) { closeDialog(); render(); toast("Role removed."); } break;
    }
    case "branch-map": if (ctx.role === "chairman") ui.branch = value; location.hash = `${view.role}/transport`; break;
    case "edit-branch": showDialog("branch", "Edit school branch", "School branch details.", branchForm(state.branches.find((branch) => branch.id === value))); break;
    case "reset": confirmDialog("reset", "Reset the demo?", "Restore the sample roles, branches, bus assignments, courses, and orders.", "Reset demo", "confirm-reset"); break;
    case "confirm-reset":
      if (saveState(freshState())) {
        state = freshState(); Object.assign(ui, { accounts: {}, branch: "all", bus: "01", filter: "all", courseId: "", starts: {}, paused: false, runningSince: performance.now(), elapsed: 0 });
        ui.network = { subject: "mathematics", grade: 8, term: 3, selected: "", compare: null, category: "all" };
        parentSession = null;
        saveParentSession(null);
        closeDialog(); location.hash = "chairman/transport"; render(); toast("Demo reset.");
      } break;
    case "close-dialog": closeDialog(); break;
  }
}

function change(event) {
  const element = event.target;
  const name = element.dataset.change;
  const ctx = context();
  if (!ctx) return;
  switch (name) {
    case "network-subject":
    case "network-grade":
    case "network-term":
      if (!["chairman", "principal", "vice_principal"].includes(ctx.role)) return;
      if (name === "network-subject" && subjects.some((subject) => subject.id === element.value)) ui.network.subject = element.value;
      if (name === "network-grade" && [6, 8, 10, 11].includes(Number(element.value))) ui.network.grade = Number(element.value);
      if (name === "network-term" && [1, 2, 3].includes(Number(element.value))) ui.network.term = Number(element.value);
      render();
      break;
    case "network-branch-check": {
      if (ctx.role !== "chairman" || ctx.branch !== "all" || !state.branches.some((branch) => branch.id === element.value)) return;
      const selected = new Set(ui.network.compare || state.branches.map((branch) => branch.id));
      if (element.checked) selected.add(element.value); else selected.delete(element.value);
      ui.network.compare = [...selected];
      render();
      app.querySelector(`[data-change="network-branch-check"][value="${CSS.escape(element.value)}"]`)?.focus({ preventScroll: true });
      break;
    }
    case "account":
      ui.accounts[view.role] = element.value; ui.courseId = ""; ui.filter = "all"; closeDialog(); render(); break;
    case "branch":
      if (ctx.role !== "chairman") return;
      ui.branch = element.value; ui.courseId = ""; ui.filter = "all";
      if (element.value !== "all") ui.network.selected = element.value;
      closeDialog(); render(); break;
    case "child":
      if (!linkedChildren(state, ctx).some((child) => child.id === element.value)) return;
      update((next) => { next.child = element.value; }); ui.courseId = ""; render("child-select"); break;
    case "filter": filterBuses(element.value, element.dataset.focus); break;
    case "grade": ui.grade = element.value; updateCatalog(); break;
    case "assignment-course":
      if (!can(ctx, "courses.assign")) return;
      showDialog("assignment", "Assign course", "Choose a teacher and enroll students.", assignmentForm(element.value, optionsFor())); break;
    case "role-scope": {
      if (!can(ctx, "roles.manage")) return;
      const draft = Object.fromEntries(new FormData(element.form));
      showDialog("role", "Assign role", "Appoint an existing person or create a demo account.", roleForm(state, ctx, draft)); break;
    }
    case "student-branch": {
      if (!can(ctx, "students.edit")) return;
      const draft = Object.fromEntries(new FormData(element.form));
      showDialog("student", "Add student", "Manage the student record and linked guardians.", studentForm(state, ctx, { ...draft, grade: Number(draft.grade) })); break;
    }
  }
}

function updateCatalog() {
  const target = app.querySelector("#catalog-results");
  const ctx = context();
  if (target && ctx.role === "parent") target.innerHTML = catalogResults(state, ctx, ui.grade, ui.query);
}

function showError(form, message) {
  const target = form.querySelector(".form-error");
  target.textContent = message;
  target.hidden = false;
}

function fileData(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, data: reader.result });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function assignDriver(next, busId, personId) {
  const target = next.buses.find((bus) => bus.id === busId);
  const previous = next.accounts.find((person) => person.id === target.driverId);
  if (previous) previous.grants = previous.grants.filter((grant) => !(grant.role === "driver" && grant.bus === busId));
  const person = next.accounts.find((person) => person.id === personId);
  for (const bus of next.buses) {
    if (bus.driverId === personId && bus.id !== busId) { bus.driverId = ""; bus.driver = "Unassigned"; }
  }
  person.grants = person.grants.filter((grant) => grant.role !== "driver");
  person.grants.push({ role: "driver", branch: target.branch, bus: busId });
  target.driverId = personId;
  target.driver = person.name;
}

async function submit(event) {
  const form = event.target;
  const mode = form.dataset.form;
  if (!mode) return;
  event.preventDefault();
  const values = new FormData(form);
  if (mode === "parent-login") {
    const session = authenticateParent(state, values.get("admissionNumber"), values.get("password"));
    if (!session) {
      showError(form, "Admission number or password is incorrect. Check the demo details below.");
      return;
    }
    if (!saveParentSession(session)) {
      showError(form, "The demo session could not be saved. Enable browser storage and try again.");
      return;
    }
    parentSession = session;
    ui.courseId = "";
    closeDialog();
    location.hash = "parent/transport";
    render(undefined, { scrollTop: true });
    return;
  }
  const ctx = context();
  const id = values.get("id");
  const options = optionsFor(ctx);
  const allowedBranch = (branch) => state.branches.some((item) => item.id === branch) && (ctx.branch === "all" || ctx.branch === branch);
  const fail = (message = "This change is outside your assigned scope.") => showError(form, message);

  const formActivity = {
    assignment: ["academic", "Course assignments updated.", state.courses.find((course) => course.id === values.get("course"))?.branch],
    material: ["academic", id ? "Course material updated." : "New course material published.", state.courses.find((course) => course.id === values.get("course"))?.branch],
    student: ["people", id ? "Student record updated." : "New student added.", state.students.find((student) => student.id === id)?.branch || values.get("branch")],
    bus: ["transport", "Bus route and student assignments updated.", state.buses.find((bus) => bus.id === id)?.branch],
    book: ["library", "Book catalogue updated.", state.books.find((book) => book.id === id)?.branch],
    branch: ["people", "School branch details updated.", id],
    role: ["people", "Staff role assignment updated.", values.get("branch")],
  }[mode];
  const save = (mutator) => update(mutator, formActivity ? { category: formActivity[0], message: formActivity[1], branch: formActivity[2] } : undefined);


  if (mode === "assignment") {
    const course = visibleCourses(state, ctx).find((item) => item.id === values.get("course"));
    if (!can(ctx, "courses.assign") || !course) return fail();
    const teacher = can(ctx, "courses.teacher") ? values.get("teacher") : state.assignments[course.id].teacher;
    const students = values.getAll("students");
    if (!branchTeachers(state, course.branch).some((person) => person.id === teacher)) return fail("Select a teacher assigned to this branch.");
    if (!students.every((id) => state.students.some((student) => student.id === id && student.branch === course.branch && student.className === course.className && student.grade === course.grade))) return fail();
    if (!save((next) => { next.assignments[course.id] = { teacher, students }; })) return;
  } else if (mode === "material") {
    const course = state.courses.find((course) => course.id === values.get("course"));
    const existing = state.materials.find((item) => item.id === id);
    if (!canPublish(state, ctx, course) || (id && existing?.course !== course.id)) return fail();
    const title = values.get("title").trim();
    const description = values.get("description").trim();
    const file = values.get("file");
    if (!title) return fail("Enter a material title.");
    if (file.size > 2 * 1024 * 1024) return fail("Choose a file smaller than 2 MB.");
    const submitButton = form.querySelector('[type="submit"]');
    submitButton.disabled = true;
    try {
      const attachment = file.size ? await fileData(file) : existing?.file || null;
      if (!dialog.open || !form.isConnected) return;
      const item = { ...existing, id: id || "m-" + crypto.randomUUID(), course: course.id, title, description, type: values.get("type"), date: "Today", file: attachment, content: description + "\n\nReview the topic and note one question to discuss in class." };
      if (!save((next) => { if (existing) next.materials[next.materials.findIndex((material) => material.id === id)] = item; else next.materials.push(item); })) return;
    } catch { return fail("The file could not be read."); }
    finally { submitButton.disabled = false; }
  } else if (mode === "student") {
    const existing = state.students.find((student) => student.id === id);
    const branch = existing?.branch || values.get("branch");
    if (!can(ctx, "students.edit") || !allowedBranch(branch) || (id && !existing)) return fail();
    const grade = Number(values.get("grade"));
    const className = values.get("className").trim().toUpperCase();
    const name = values.get("name").trim();
    const admissionNumber = values.get("admissionNumber").trim().toUpperCase();
    const guardians = values.getAll("guardians");
    if (!name || !sectionFor(grade) || !new RegExp("^" + grade + "[A-Z]{1,2}$").test(className)) return fail("Enter a class matching the selected grade, such as 8A.");
    if (!/^[A-Z0-9][A-Z0-9-]{2,31}$/.test(admissionNumber)) return fail("Use 3–32 letters, numbers, or hyphens for the admission number.");
    if (state.students.some((student) => student.id !== id && student.admissionNumber === admissionNumber)) return fail("That admission number belongs to another student.");
    if (!guardians.every((id) => state.accounts.some((person) => person.id === id && person.grants.some((grant) => grant.role === "parent" && grant.branch === branch)))) return fail("Select guardian accounts from this branch.");
    if (!save((next) => {
      const student = { ...existing, id: id || "student-" + crypto.randomUUID(), name, admissionNumber, initials: name.split(" ").map((word) => word[0]).slice(0, 2).join(""), grade, className, branch, guardians, tone: existing?.tone || "green" };
      if (existing) next.students[next.students.findIndex((item) => item.id === id)] = student; else next.students.push(student);
      for (const course of next.courses) if (course.branch !== branch || course.grade !== grade || course.className !== className) next.assignments[course.id].students = next.assignments[course.id].students.filter((studentId) => studentId !== student.id);
    })) return;
  } else if (mode === "bus") {
    const bus = options.fleet.find((item) => item.id === id);
    if (!can(ctx, "transport.manage") || !bus) return fail();
    const driver = state.accounts.find((person) => person.id === values.get("driver") && person.grants.some((grant) => grant.role === "driver" && grant.branch === bus.branch));
    const students = values.getAll("students");
    const stops = values.getAll("stops").map((stop) => stop.trim());
    if (!driver || !values.get("name").trim() || stops.length !== bus.stops.length || stops.some((stop) => !stop)) return fail("Complete the route name, driver, and stop names.");
    if (!students.every((id) => state.students.some((student) => student.id === id && student.branch === bus.branch))) return fail();
    if (!save((next) => {
      const target = next.buses.find((item) => item.id === id);
      target.name = values.get("name").trim(); target.stops = stops;
      assignDriver(next, id, driver.id);
      for (const student of next.students.filter((student) => student.branch === bus.branch)) {
        if (students.includes(student.id)) student.bus = id;
        else if (student.bus === id) delete student.bus;
      }
    })) return;
  } else if (mode === "book") {
    const book = branchBooks(state, ctx).find((book) => book.id === id);
    if (!can(ctx, "library.manage") || !book) return fail();
    const price = Number(values.get("price"));
    const title = values.get("title").trim();
    if (!title || !Number.isInteger(price) || price < 1 || price > 100000) return fail("Enter a title and a price from LKR 1 to 100,000.");
    if (!save((next) => Object.assign(next.books.find((item) => item.id === id), { title, price, available: values.has("available") }))) return;
  } else if (mode === "branch") {
    if (!can(ctx, "branch.edit") || !state.branches.some((branch) => branch.id === id)) return fail();
    const name = values.get("name").trim(), location = values.get("location").trim();
    if (!name || !location) return fail("Enter the branch name and location.");
    if (!save((next) => {
      const school = "Sussex College " + name;
      Object.assign(next.branches.find((branch) => branch.id === id), { name, location, school });
      for (const bus of next.buses.filter((bus) => bus.branch === id)) bus.stops[bus.stops.length - 1] = school;
    })) return;
  } else if (mode === "role") {
    const role = values.get("role"), branch = values.get("branch");
    if (!assignableRoles(ctx).includes(role) || !allowedBranch(branch)) return fail();
    const newPerson = values.get("person") === "new";
    const name = values.get("name").trim();
    const person = state.accounts.find((person) => person.id === values.get("person"));
    if ((newPerson && !name) || (!newPerson && !person)) return fail("Select a person or enter a new account name.");
    const grant = { role, branch };
    if (role === "section_head") {
      if (!sections.some((section) => section.id === values.get("section"))) return fail("Select a section.");
      grant.section = values.get("section");
    }
    if (["coordinator", "class_teacher"].includes(role)) {
      grant.grade = Number(values.get("grade"));
      if (!Number.isInteger(grant.grade) || !sectionFor(grant.grade)) return fail("Choose a grade between 0 and 13.");
    }
    if (role === "class_teacher") {
      grant.className = values.get("className").trim().toUpperCase();
      if (!new RegExp("^" + grant.grade + "[A-Z]{1,2}$").test(grant.className)) return fail("The class must match the grade.");
    }
    if (role === "driver") {
      if (!state.buses.some((bus) => bus.id === values.get("bus") && bus.branch === branch)) return fail("Choose a bus in this branch.");
      grant.bus = values.get("bus");
    }
    if (person?.grants.some((item) => Object.entries(grant).every(([key, value]) => item[key] === value))) return fail("This person already has that role and scope.");
    if (!save((next) => {
      const personId = newPerson ? "person-" + crypto.randomUUID() : person.id;
      if (newPerson) next.accounts.push({ id: personId, name, initials: name.split(" ").map((word) => word[0]).slice(0, 2).join(""), grants: [], tone: "green" });
      const account = next.accounts.find((item) => item.id === personId);
      if (role === "principal") for (const item of next.accounts) item.grants = item.grants.filter((entry) => !(entry.role === "principal" && entry.branch === branch));
      if (role === "driver") assignDriver(next, grant.bus, personId);
      else account.grants.push(grant);
    })) return;
  } else return;
  closeDialog();
  render();
  toast("Changes saved.");
}

document.addEventListener("click", (event) => {
  const picker = app.querySelector(".network-branch-picker");
  if (picker?.open && !picker.contains(event.target)) picker.open = false;
  const menu = app.querySelector(".role-picker");
  if (menu?.open && (!menu.contains(event.target) || event.target.closest("[data-role-link], [data-action='reset']"))) menu.open = false;
  action(event);
});
document.addEventListener("change", change);
document.addEventListener("submit", submit);
document.addEventListener("input", (event) => {
  if (event.target.dataset.change === "book-search") { ui.query = event.target.value; updateCatalog(); }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dialog.open) {
    const menu = app.querySelector(".role-picker[open]");
    if (menu) { menu.open = false; menu.querySelector("summary").focus(); }
  }
});
dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
window.addEventListener("hashchange", () => {
  const previous = view;
  view = getView();
  if (previous.role !== view.role || previous.page !== view.page) { ui.courseId = ""; ui.filter = "all"; }
  closeDialog();
  render(undefined, { scrollTop: true });
});
window.addEventListener("storage", (event) => {
  if (event.key === "campusway-demo-v1") { state = loadState(); closeDialog(); render(); }
});
render();

