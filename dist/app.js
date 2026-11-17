import { books, courses, freshState, loadState, roles, saveState, teachers } from "./data.js";
import { icon } from "./icons.js";
import { assignmentForm, coursesPage, materialForm } from "./learning.js";
import { cartForm, cartItems, catalogResults, libraryPage, orderHistory } from "./library.js";
import { FleetMap } from "./map.js";
import { activeFleet, mountMapSummary, transportPage, updateTripDetails } from "./transport.js";
import { avatar, button, childProfiles, escapeHtml as e, iconTile } from "./ui.js";

const app = document.querySelector("#app");
const dialog = document.querySelector("#dialog");
const toasts = document.querySelector("#toasts");
const navigation = {
  transport: { admin: "Bus tracking", parent: "Bus tracking", driver: "My trip", icon: "bus" },
  courses: { admin: "Course management", teacher: "My courses", parent: "My courses", icon: "book" },
  library: { admin: "Library orders", parent: "Library", icon: "library" },
};

let state = loadState();
let map;
let mapViewKey;
let dialogMode;
let view = getView();

const ui = {
  bus: "01",
  filter: "all",
  courseId: "",
  grade: "all",
  query: "",
  paused: false,
  runningSince: performance.now(),
  elapsed: 0,
  driverStartAt: null,
};

function getView() {
  const [role, page] = location.hash.slice(1).split("/");
  const safeRole = Object.hasOwn(roles, role) ? role : "admin";
  const person = roles[safeRole];
  return { role: safeRole, page: person.pages.includes(page) ? page : person.start };
}

function profile() {
  return childProfiles.find((student) => student.id === state.child) ?? childProfiles[0];
}

function teacherProfile() {
  return teachers.find((person) => person.id === state.teacher) ?? teachers[0];
}

function activePerson() {
  return view.role === "teacher" ? teacherProfile() : { name: roles[view.role].person, initials: roles[view.role].initials };
}

function elapsed() {
  return ui.elapsed + (ui.paused ? 0 : (performance.now() - ui.runningSince) / 1000);
}

function progress(bus) {
  if (bus.status === "school") return 1;
  if (bus.status === "delayed") return bus.start;
  if (bus.id === "01" && ui.driverStartAt !== null) return Math.min(0.97, 0.01 + (elapsed() - ui.driverStartAt) * 0.005);
  const start = 0.15;
  return start + (bus.start - start + elapsed() * 0.006) % 0.77;
}

function brand() {
  return `<span class="brand-mark">${icon("brand", 25)}</span><span class="brand-name">Campusway</span>`;
}

function navigationLinks(mobile = false) {
  return roles[view.role].pages.map((page) => {
    const entry = navigation[page];
    const label = mobile ? (page === "transport" ? view.role === "driver" ? "My trip" : "Transport" : page === "courses" ? "Courses" : "Library") : entry[view.role];
    return `<a href="#${view.role}/${page}" class="nav-link ${page === view.page ? "is-active" : ""}" ${page === view.page ? 'aria-current="page"' : ""}>${icon(entry.icon, 20)} <span>${label}</span></a>`;
  }).join("");
}

function sidebar() {
  return `<aside class="sidebar">
    <a class="brand" href="#${view.role}/${roles[view.role].start}" aria-label="Campusway home">${brand()}</a>
    <nav class="sidebar-nav" aria-label="Workspace">
      <p>WORKSPACE</p>${navigationLinks()}
    </nav>
    <div class="sidebar-school">
      <span>${icon("school", 22)}</span><div><strong>Greenfield Academy</strong><small>Colombo, Sri Lanka</small></div>
    </div>
  </aside>`;
}

function topbar() {
  const role = roles[view.role];
  const person = activePerson();
  return `<header class="topbar">
    <a class="brand mobile-brand" href="#${view.role}/${role.start}" aria-label="Campusway home">${brand()}</a>
    <div class="breadcrumbs">${icon("school", 17)} <span>School portal</span> ${icon("chevron", 13)} <strong>${navigation[view.page][view.role]}</strong></div>
    <div class="topbar-actions">
      <span class="demo-label">${icon("spark", 14)} Demo mode</span>
      <details class="role-picker">
        <summary class="button role-button" data-focus="role-switch" aria-label="Switch role, current role ${role.name}">${icon(role.icon, 17)}<span>${role.name} view</span>${icon("chevronDown", 15)}</summary>
        <div class="role-menu">
          <p>Switch portal view</p>
          ${Object.entries(roles).map(([id, item]) => `<a href="#${id}/${item.start}" data-role-link class="${id === view.role ? "is-current" : ""}">
            ${icon(item.icon, 17)}<span>${item.name}</span>${id === view.role ? icon("check", 15) : ""}
          </a>`).join("")}
          <button type="button" data-action="reset">${icon("reset", 16)} Reset demo</button>
        </div>
      </details>
      <span class="account-avatar" title="${e(person.name)}">${avatar(person, "small")}</span>
    </div>
  </header>`;
}

function render(focus, { scrollTop = false } = {}) {
  const previousViewport = map?.viewport;
  map?.destroy();
  map = null;
  const fleet = activeFleet(state);
  const options = {
    state, fleet, filter: ui.filter, selected: ui.bus,
    paused: ui.paused, progress, child: profile(), teacher: teacherProfile(), courseId: ui.courseId,
    grade: ui.grade, query: ui.query,
  };
  const body = view.page === "transport" ? transportPage(view.role, options)
    : view.page === "courses" ? coursesPage(view.role, options) : libraryPage(view.role, options);
  document.title = `${navigation[view.page][view.role]} · Campusway`;
  app.innerHTML = `<div class="app-shell role-${view.role}">
    ${sidebar()}
    <div class="desktop-content">
      ${topbar()}
      <main id="main" class="page page-${view.page}">${body}</main>
    </div>
    ${roles[view.role].pages.length > 1 ? `<nav class="mobile-nav" aria-label="Workspace">${navigationLinks(true)}</nav>` : ""}
  </div>`;

  const stage = document.querySelector("#map-stage");
  if (stage) {
    const selected = view.role === "parent" ? options.child.bus : view.role === "driver" ? "01" : ui.bus;
    const bus = fleet.find((item) => item.id === selected);
    const isFleet = view.role === "admin";
    const mapBuses = isFleet ? fleet : [bus];
    const key = isFleet ? "fleet" : `${view.role}-${selected}`;
    map = new FleetMap(stage, {
      buses: mapBuses,
      selected,
      progress,
      viewport: mapViewKey === key ? previousViewport : null,
      onSelect: isFleet ? selectBus : null,
      onTick: () => updateTripDetails(app, bus, progress(bus)),
    });
    mapViewKey = key;
    if (isFleet) mountMapSummary(stage, bus, progress(bus));
  }

  if (scrollTop) window.scrollTo({ top: 0, behavior: "instant" });
  if (focus) app.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
}

function selectBus(id, focus) {
  ui.bus = id;
  const match = activeFleet(state).find((bus) => bus.id === id);
  if (ui.filter !== "all" && match.status !== ui.filter) ui.filter = "all";
  render(focus);
}

function filterBuses(status, focus) {
  ui.filter = status;
  const fleet = activeFleet(state);
  if (status !== "all" && fleet.find((bus) => bus.id === ui.bus)?.status !== status) {
    ui.bus = fleet.find((bus) => bus.status === status)?.id ?? ui.bus;
  }
  render(focus);
}

function toast(message) {
  const notice = document.createElement("div");
  notice.className = "toast";
  notice.innerHTML = `${icon("checkCircle", 18)} <span>${e(message)}</span>`;
  toasts.append(notice);
  setTimeout(() => notice.remove(), 3800);
}

function persist(next) {
  if (!saveState(next)) return false;
  state = next;
  return true;
}

function update(mutator) {
  const draft = structuredClone(state);
  mutator(draft);
  return persist(draft);
}

function showDialog(mode, title, description, content) {
  dialogMode = mode;
  dialog.innerHTML = `<header class="dialog-heading">
    <div><h2 id="dialog-title">${title}</h2>${description ? `<p>${description}</p>` : ""}</div>
    <button type="button" class="icon-button" aria-label="Close dialog" data-action="close-dialog">${icon("x", 21)}</button>
  </header>${content}`;
  if (!dialog.open) dialog.showModal();
}

function closeDialog() {
  if (dialog.open) dialog.close();
  dialogMode = null;
}

function confirmDialog(mode, title, description, label, action) {
  showDialog(mode, title, description, `<footer class="dialog-actions">
    ${button("Cancel", "close-dialog", { variant: "secondary" })}
    ${button(label, action, { iconName: mode === "reset" ? "reset" : "check" })}
  </footer>`);
}

function showCart(focus) {
  showDialog("cart", "Book bag", "Review your books before placing your order.", cartForm(state));
  if (focus) {
    const target = dialog.querySelector(`[data-focus="${CSS.escape(focus)}"]:not(:disabled)`);
    (target ?? dialog.querySelector(".icon-button"))?.focus();
  }
}

function adjustBook(id, delta, focus) {
  const book = books.find((item) => item.id === id);
  if (!book) return;
  const quantity = Math.max(0, Math.min(10, (state.cart[id] ?? 0) + delta));
  if (quantity === state.cart[id]) return toast("Limit of 10 copies per book.");
  const success = update((next) => {
    if (quantity) next.cart[id] = quantity;
    else delete next.cart[id];
  });
  if (!success) return toast("The book bag could not be saved.");
  render(focus);
  if (dialogMode === "cart") showCart(focus);
  else toast(`${book.title} added to your book bag.`);
}

function placeOrder() {
  const items = cartItems(state).map(({ id, title, price, quantity }) => ({ id, title, price, quantity }));
  if (!items.length) return;
  const number = `CW-${1001 + state.orders.length}`;
  const order = { number, items, total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    date: new Intl.DateTimeFormat("en-LK", { day: "numeric", month: "short", timeZone: "Asia/Colombo" }).format(new Date()) };
  const success = update((next) => {
    next.orders.push(order);
    next.cart = {};
  });
  if (!success) return toast("The order could not be saved.");
  render();
  showDialog("order-placed", "Order placed", "", `<div class="form-body order-confirmation">
    ${iconTile("checkCircle", "green")}
    <h3>${number}</h3><p>Collect your books at the school library. Payment is due at collection.</p>
  </div><footer class="dialog-actions">${button("Done", "close-dialog", { variant: "secondary" })}${button("View my orders", "orders", { iconName: "package" })}</footer>`);
  dialog.querySelector(".button.primary")?.focus();
}

function downloadMaterial(id) {
  const material = state.materials.find((item) => item.id === id);
  if (!material) return;
  const name = material.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "class-material";
  const link = document.createElement("a");
  const text = `${material.title}\n${material.type} · Greenfield Academy\n\n${material.content}`;
  const href = material.file ? material.file.data : URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  link.href = href;
  link.download = material.file?.name ?? `${name}.txt`;
  document.body.append(link);
  link.click();
  link.remove();
  if (!material.file) setTimeout(() => URL.revokeObjectURL(href), 3000);
}

function markComplete(id, focus) {
  const child = profile().id;
  const done = state.completed[child]?.includes(id);
  const success = update((next) => {
    const list = next.completed[child] ?? [];
    next.completed[child] = done ? list.filter((material) => material !== id) : [...list, id];
  });
  if (!success) return toast("Progress could not be saved.");
  render(focus);
  toast(done ? "Marked as incomplete." : "Marked as done.");
}

function toggleSimulation(focus) {
  if (ui.paused) ui.runningSince = performance.now();
  else ui.elapsed = elapsed();
  ui.paused = !ui.paused;
  render(focus);
}

function updateTrip(status) {
  if (!update((next) => { next.trip = status; })) return toast("The trip status could not be saved.");
  ui.driverStartAt = status === "route" ? elapsed() : null;
  closeDialog();
  render("driver-trip");
  toast(status === "route" ? "Trip started. Bus status is now On route." : "Trip ended. Bus status is now At school.");
}

function resetDemo() {
  if (!persist(freshState())) return toast("The demo could not be reset.");
  Object.assign(ui, {
    bus: "01", filter: "all", courseId: "", grade: "all", query: "",
    paused: false, runningSince: performance.now(), elapsed: 0, driverStartAt: null,
  });
  mapViewKey = null;
  closeDialog();
  if (view.role !== "admin" || view.page !== "transport") location.hash = "admin/transport";
  else render("role-switch", { scrollTop: true });
  toast("Demo reset to its starting state.");
}

function action(event) {
  const element = event.target.closest("[data-action]");
  if (!element) return;
  const { action: name, value, focus } = element.dataset;
  switch (name) {
    case "pause": toggleSimulation(focus); break;
    case "bus": selectBus(value, focus); break;
    case "filter": filterBuses(value, focus); break;
    case "assign": showDialog("assignment", "Assign course", "Choose a teacher and enroll students in this course.", assignmentForm(value, state)); break;
    case "open-course": ui.courseId = value; render("all-courses", { scrollTop: true }); break;
    case "close-course": {
      const opened = ui.courseId;
      ui.courseId = "";
      render(`open-${opened}`, { scrollTop: true });
      break;
    }
    case "add-material": {
      const course = courses.find((item) => item.id === value);
      showDialog("material", "Add course material", `${course.title} · Grade ${course.grade}`, materialForm(course));
      dialog.querySelector('input[name="title"]').focus();
      break;
    }
    case "complete": markComplete(value, focus); break;
    case "download": downloadMaterial(value); break;
    case "add-book":
    case "increase-book": adjustBook(value, 1, focus); break;
    case "decrease-book": adjustBook(value, -1, focus); break;
    case "cart": showCart(); break;
    case "orders": showDialog("orders", "My orders", "Track your school library orders.", orderHistory(state)); break;
    case "place-order": placeOrder(); break;
    case "end-trip": confirmDialog("end-trip", "End the morning trip?", "BUS 01 will appear as At school in the admin and parent views.", "End trip", "confirm-end-trip"); break;
    case "confirm-end-trip": updateTrip("school"); break;
    case "start-trip": updateTrip("route"); break;
    case "reset": confirmDialog("reset", "Reset the demo?", "Restore the sample bus statuses, assignments, materials, and orders.", "Reset demo", "confirm-reset"); break;
    case "confirm-reset": resetDemo(); break;
    case "close-dialog": {
      const mode = dialogMode;
      closeDialog();
      if (mode === "order-placed" || mode === "cart") app.querySelector('[data-focus="cart"]')?.focus();
      break;
    }
  }
}

function change(event) {
  const element = event.target;
  const { change: name, focus } = element.dataset;
  switch (name) {
    case "filter": filterBuses(element.value, focus); break;
    case "child":
    case "teacher":
      if (!update((next) => { next[name] = element.value; })) return toast("Your selection could not be saved.");
      ui.courseId = "";
      render(focus);
      break;
    case "grade":
      ui.grade = element.value;
      document.querySelector("#catalog-results").innerHTML = catalogResults(ui.grade, ui.query);
      break;
    case "assignment-course":
      showDialog("assignment", "Assign course", "Choose a teacher and enroll students in this course.", assignmentForm(element.value, state));
      dialog.querySelector('select[name="course"]').focus();
      break;
  }
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

async function submit(event) {
  const form = event.target;
  const mode = form.dataset.form;
  if (!mode) return;
  event.preventDefault();
  const values = new FormData(form);
  const course = values.get("course");

  if (mode === "assignment") {
    const success = update((next) => {
      next.assignments[course] = { teacher: values.get("teacher"), students: values.getAll("students") };
    });
    if (!success) return showError(form, "The assignment could not be saved in this browser.");
    closeDialog();
    render(`assign-${course}`);
    toast("Course assignment saved.");
    return;
  }

  const title = values.get("title").trim();
  const description = values.get("description").trim();
  const file = values.get("file");
  if (!title) return showError(form, "Enter a material title.");
  if (file.size > 2 * 1024 * 1024) return showError(form, "Choose a file smaller than 2 MB.");
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.disabled = true;
  try {
    const attachment = file.size ? await fileData(file) : null;
    if (!dialog.open || !form.isConnected) return;
    const item = { id: `m-${crypto.randomUUID()}`, course, title, description, type: values.get("type"),
      date: "Today", file: attachment, content: `${description ? description + "\n\n" : ""}Review the topic in class. Write a short summary and note one question to discuss in the next lesson.` };
    const success = update((next) => next.materials.push(item));
    if (!success) return showError(form, "Browser storage is full. Try a smaller file or use a sample handout.");
    closeDialog();
    render("add-material");
    toast("Material published for enrolled students.");
  } catch {
    showError(form, "The file could not be read. Choose it again or publish a sample handout.");
  } finally {
    submitButton.disabled = false;
  }
}

document.addEventListener("click", (event) => {
  const roleMenu = app.querySelector(".role-picker");
  if (roleMenu?.open && (!roleMenu.contains(event.target) || event.target.closest("[data-role-link], [data-action='reset']"))) roleMenu.open = false;
  action(event);
});
document.addEventListener("change", change);
document.addEventListener("submit", submit);
document.addEventListener("input", (event) => {
  if (event.target.dataset.change !== "book-search") return;
  ui.query = event.target.value;
  document.querySelector("#catalog-results").innerHTML = catalogResults(ui.grade, ui.query);
});
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape" || dialog.open) return;
  const menu = app.querySelector(".role-picker[open]");
  if (menu) {
    menu.open = false;
    menu.querySelector("summary").focus();
  }
});
dialog.addEventListener("close", () => { if (!dialog.open) dialogMode = null; });
dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });

window.addEventListener("hashchange", () => {
  const previousPage = view;
  view = getView();
  if (previousPage.page !== view.page || previousPage.role !== view.role) ui.courseId = "";
  closeDialog();
  render(undefined, { scrollTop: true });
});

render();

