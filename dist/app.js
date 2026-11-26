import { familyPage, inboxPage, morePage, trackingPage } from "./family-portal.js";
import { feesPage } from "./fees.js";
import { communicationsPage, eventsPage } from "./communications.js";
import { portalAction, portalSubmit, portalChange } from "./portal-controller.js";
import { notifications } from "./notifications-data.js";
import { protectFleet, trackingPolicy, transportNow } from "./transport-privacy.js";
import { academicClassStudents, assignStudentSubjects, visibleClassNotices, saveClassNotice, markNoticeRead, homeworkSubjects, visibleHomework, canManageHomework, saveHomework, setHomeworkDone } from "./academic-portal-data.js";
import { studentSubjectsForm, noticesPage, noticeForm, homeworkPage, homeworkForm } from "./academic-portal.js";
import { freshState, loadState, roles, saveState, sectionFor, sections } from "./data.js";
import { assignableRoles, can, canManageGrant, contextFor, linkedChildren, visibleBuses, visibleCourses, visibleStudents, canPublish } from "./access.js";
import { icon } from "./icons.js";
import { assignmentForm, coursesPage, materialForm } from "./learning.js";
import { storeKinds, storeViews, storeReportTypes, storesDefaults, storesScope, storeCatalogue, storeReservations, reservationBag, saveBagItem, submitStoreReservation, cancelParentReservation, updateStoreReservation, saveStoreStock, createStoreReport, storeReports, storeReportCSV } from "./stores-data.js";
import { booksPage, uniformsPage, storeBagForm, storeRequestDetail, storeProcessForm, storeStockForm } from "./stores.js";
import { accessPage, branchForm, busForm, peoplePage, roleForm, scopeLabel, studentForm } from "./management.js";
import { networkBranches, networkOverviewPage } from "./network.js";
import { subjects } from "./network-analytics.js";
import { SchoolNetworkMap } from "./network-map.js";
import { networkFleet } from "./network-fleet.js";
import { updateNetworkBusDetails } from "./network-transport.js";
import { chairmanOverviewPage, chairmanMapMetrics, chairmanBranchPanel, chairmanStudentPanel, chairmanStaffPanel, chairmanVacancyPanel, executiveReportHTML } from "./chairman.js";
import { chairmanDefaults, chairmanViews, chairmanBranches, studentRoster, branchStaff, branchVacancies, schoolDays, generateExecutiveReport, reportCSV, reportTypes, demoDate, isSchoolLeader, visibleExecutiveReports, reportOwnerKey, schoolLeaveRequests, isSchoolOperator } from "./chairman-data.js";
import { principalOverviewPage } from "./principal.js";
import { schoolAcademicComparison, schoolAcademicAttention } from "./principal-data.js";
import { schoolFollowups, schoolTemporaryCovers, coverTeachers, saveSchoolFollowup, saveTemporaryCover, cancelTemporaryCover, saveLeaveRecommendation, followupCategories, incomingSectionCoverRequests, declineSectionCoverRequest } from "./vice-data.js";
import { viceFollowupBoard, viceFollowupForm, temporaryCoverForm, leaveRecommendationForm, declineCoverRequestForm } from "./vice-principal.js";
import { sectionViews, sectionDefaults, sectionScope, sectionFilters, sectionReportTypes, sectionAttendance, sectionTeachers, sectionFollowups, visibleSectionReports, generateSectionReport, saveSectionFollowup, saveSectionCourseReview, requestSectionCover } from "./section-data.js";
import { sectionHeadPage, sectionStudentPanel, sectionTeacherPanel, sectionFollowupForm, sectionReviewForm, sectionCoverRequestForm, sectionReportHTML } from "./section-head.js";
import { gradeViews, gradeDefaults, gradeScope, gradeFilters, gradeReportTypes, gradeAttendance, gradeTeachers, gradeFollowups, gradeSupportRequests, sectionGradeRequests, visibleGradeReports, generateGradeReport, saveGradeFollowup, saveGradeClassUpdate, requestGradeSupport, respondGradeSupport } from "./grade-data.js";
import { gradeCoordinatorPage, gradeClassReviewForm } from "./grade-coordinator.js";
import { gradeSupportRequestForm, gradeSupportResponseForm } from "./grade-support.js";
import { classViews, classDefaults, classScope, classFilters, classReportTypes, classAttendance, classStudents, classFollowups, classDiscussionNotes, gradeClassRequests, visibleClassReports, generateClassReport, saveClassAttendance, resetClassAttendance, saveClassFollowup, saveClassDiscussion, requestClassSupport, respondClassSupport } from "./class-data.js";
import { classTeacherPage, classAttendanceForm, classFollowupForm, classDiscussionForm } from "./class-teacher.js";
import { classSupportRequestForm, classSupportResponseForm } from "./class-support.js";
import { subjectViews, subjectDefaults, subjectScope, subjectFilters, subjectEnrolments, subjectPlans, subjectReportTypes, subjectPlanStatuses, subjectReviewStatuses, gradeSubjectRequests, visibleSubjectReports, generateSubjectReport, saveSubjectPlan, saveSubjectReview, requestSubjectSupport, respondSubjectSupport } from "./subject-data.js";
import { subjectTeacherPage, subjectPlanForm, subjectReviewForm, subjectReportHTML } from "./subject-teacher.js";
import { subjectSupportRequestForm, subjectSupportResponseForm } from "./subject-support.js";
import { adminViews, adminDefaults, adminScope, adminFilters, adminClasses, adminGuardianAccounts, adminReportTypes, adminStudentStatuses, adminGuardianStatuses, adminCourseStatuses, visibleAdminReports, generateAdminReport } from "./admin-data.js";
import { schoolAdminPage, adminStudentPanel, adminGuardianPanel, adminReportHTML } from "./school-admin.js";
import { saveStudentRecord, saveCourseAssignment } from "./records.js";
import { coordinatorViews, coordinatorDefaults, coordinatorScope, coordinatorFilters, coordinatorBuses, coordinatorFleet, coordinatorTrackers, coordinatorStudents, coordinatorTasks, coordinatorReportTypes, allocationStatuses, trackerStatuses, saveCoordinatorTask, saveCoordinatorAllocation, visibleCoordinatorReports, generateCoordinatorReport } from "./coordinator-data.js";
import { transportCoordinatorPage, coordinatorTaskForm, coordinatorAllocationForm, coordinatorReportHTML, updateCoordinatorTelemetry } from "./transport-coordinator.js";
import { saveTrackerSignal, saveBusAssignment } from "./transport-records.js";
import { boardingDefaults, boardingScope, boardingFilters, boardingStudents, studentCards, visibleBoardingTrips, boardingRows, createBoardingTrip, issueBoardingCard, disableBoardingCard, simulateBoardingTap, syncBoardingReader, setBoardingReader, closeBoardingTrip, correctBoardingRecord, flagBoardingException, boardingManifest } from "./boarding-data.js";
import { boardingPage, boardingTripForm, boardingCardForm, boardingDisableForm, boardingReviewForm, boardingCardHistory } from "./boarding.js";
import { FleetMap } from "./map.js";
import { mountMapSummary, transportPage, updateTripDetails } from "./transport.js";
import { avatar, button, emptyState, escapeHtml as e, iconTile } from "./ui.js";
import { authenticateParent, demoPassword, loginPage, parentContext, readParentSession, saveParentSession } from "./parent-login.js";

const app = document.querySelector("#app");
const dialog = document.querySelector("#dialog");
const toasts = document.querySelector("#toasts");
const navigation = {
  family: { label: "Family", icon: "users" }, inbox: { label: "Inbox & to do", icon: "alert" }, events: { label: "Events & consent", icon: "calendar" }, fees: { label: "School fees", icon: "file" }, communications: { label: "Letters & email", icon: "file" }, tracking: { label: "Tracking hours & alerts", icon: "clock" }, more: { label: "More", icon: "package" },
  boarding: { label: "Bus boarding", icon: "badge" },
  overview: { label: "Overview", icon: "school" },
  transport: { label: "Bus tracking", icon: "bus" },
  courses: { label: "Subjects", icon: "book" },
  homework: { label: "Homework", icon: "book" },
  notices: { label: "Notices", icon: "file" },
  people: { label: "Students & guardians", icon: "users" },
  library: { label: "Pupil’s books", icon: "library" },
  uniforms: { label: "School uniforms", icon: "package" },
  access: { label: "Roles & access", icon: "badge" },
};
let state = loadState();
let parentSession = readParentSession();
let map;
let schoolMap;
let schoolMapKey;
let mapViewKey;
let dialogMode;
let view = getView();
const ui = { portal: {}, academicSubject: "all", stores: { books: storesDefaults(), uniforms: storesDefaults() }, boarding: boardingDefaults(), nfcFeedback: null, transportCoordinator: coordinatorDefaults(), schoolAdmin: adminDefaults(), subjectTeacher: subjectDefaults(), classTeacher: classDefaults(), gradeCoordinator: gradeDefaults(), section: sectionDefaults(), accounts: {}, branch: "all", bus: "01", filter: "all", courseId: "", grade: "all", query: "", paused: false, runningSince: performance.now(), elapsed: 0, starts: {},
  network: { subject: "mathematics", grade: 8, term: 3, selected: "", mode: "", compare: null, category: "all", tab: "transport", status: "all", busId: "", busBranch: "all" }, chairman: { ...chairmanDefaults(), ...(["principal", "vice_principal"].includes(view.role) ? { attendanceFlag: "all" } : {}) } };

function getView() {
  const [requestedRole, requestedPage, requestedModule] = location.hash.slice(1).split("/");
  const role = requestedRole === "driver" ? "transport" : Object.hasOwn(roles, requestedRole) ? requestedRole : "chairman";
  const normalizedPage = requestedPage === "subjects" ? "courses" : requestedPage;
  const page = roles[role].pages.includes(normalizedPage) ? normalizedPage : roles[role].start;
  const module = ["librarian", "uniform_store"].includes(role) && page === "overview" ? (storeViews.some((item) => item.id === requestedModule) ? requestedModule : "summary") : role === "transport" && page === "overview" ? (coordinatorViews.some((item) => item.id === requestedModule) ? requestedModule : "fleet") : role === "admin" && page === "overview" ? (adminViews.some((item) => item.id === requestedModule) ? requestedModule : "summary") : role === "teacher" && page === "overview" ? (subjectViews.some((item) => item.id === requestedModule) ? requestedModule : "summary") : role === "class_teacher" && page === "overview" ? (classViews.some((item) => item.id === requestedModule) ? requestedModule : "summary") : role === "coordinator" && page === "overview" ? (gradeViews.some((item) => item.id === requestedModule) ? requestedModule : "summary") : role === "section_head" && page === "overview" ? (sectionViews.some((item) => item.id === requestedModule) ? requestedModule : "summary") : ["chairman", "principal", "vice_principal"].includes(role) && page === "overview" && chairmanViews.some((item) => item.id === requestedModule) ? requestedModule : "transport";
  return { role, page, module };
}

function context() {
  if (view.role === "parent") return parentContext(state, parentSession);
  const [id, index] = (ui.accounts[view.role] || "").split("|");
  return contextFor(state, view.role, id, ui.branch, index);
}

function childFor(ctx) {
  const children = linkedChildren(state, ctx);
  return children.find((child) => child.id === ctx.studentId) || children.find((child) => child.id === state.child) || children[0];
}

function optionsFor(ctx = context()) {
  const children = linkedChildren(state, ctx);
  const child = childFor(ctx);
  const storeKind = view.page === "uniforms" || ctx?.role === "uniform_store" ? "uniforms" : "books";
  return { state, portal: ui.portal, stores: { ...ui.stores[storeKind], view: view.page === "overview" && ["librarian", "uniform_store"].includes(ctx?.role) ? view.module : ui.stores[storeKind].view || "catalogue" }, boarding: { ...(boardingScope(state, ctx) ? boardingFilters(state, ctx, ui.boarding) : ui.boarding), feedback: ui.nfcFeedback }, transportCoordinator: { ...(ctx?.role === "transport" && coordinatorScope(state, ctx) ? coordinatorFilters(state, ctx, ui.transportCoordinator) : ui.transportCoordinator), view: view.module }, schoolAdmin: { ...(ctx?.role === "admin" && adminScope(state, ctx) ? adminFilters(state, ctx, ui.schoolAdmin) : ui.schoolAdmin), view: view.module }, subjectTeacher: { ...(ctx?.role === "teacher" && subjectScope(state, ctx) ? subjectFilters(state, ctx, ui.subjectTeacher) : ui.subjectTeacher), view: view.module }, classTeacher: { ...(ctx?.role === "class_teacher" && classScope(state, ctx) ? classFilters(state, ctx, ui.classTeacher) : ui.classTeacher), view: view.module }, gradeCoordinator: { ...(ctx?.role === "coordinator" && gradeScope(state, ctx) ? gradeFilters(state, ctx, ui.gradeCoordinator) : ui.gradeCoordinator), view: view.module }, section: { ...(ctx?.role === "section_head" && sectionScope(state, ctx) ? sectionFilters(state, ctx, ui.section) : ui.section), view: view.module }, context: ctx, academicSubject: ui.academicSubject, children, child, fleet: protectFleet(state, visibleBuses(state, ctx, child), ctx), filter: ui.filter, selected: ui.bus, paused: ui.paused, progress, courseId: ui.courseId, grade: ui.grade, query: ui.query, network: isSchoolOperator(ctx) ? { ...ui.network, className: ui.chairman.academicClass } : ui.network, chairman: { ...ui.chairman, view: view.module } };
}

function selectFamilyChild(id) {
  const ctx = context();
  if (ctx?.role !== "parent" || !linkedChildren(state, ctx).some((child) => child.id === id)) return false;
  const session = { ...parentSession, studentId: id, selectedChildId: id };
  if (!saveParentSession(session)) { toast("Child selection could not be saved."); return false; }
  parentSession = session; ui.courseId = ""; ui.stores = { books: storesDefaults(), uniforms: storesDefaults() };
  return true;
}
function portalAPI(ctx) { return { state, ctx, ui: ui.portal, getState: () => state, update, render, showDialog, closeDialog, toast, selectChild: selectFamilyChild }; }

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
  return (mobile && view.role === "parent" ? ["family", "transport", "inbox", "fees", "more"] : roles[view.role].pages.filter((page) => page !== "more")).map((page) => `<a href="#${view.role}/${page === "courses" ? "subjects" : page}" class="nav-link ${page === view.page ? "is-active" : ""}" ${page === view.page ? 'aria-current="page"' : ""}>${icon(navigation[page].icon, 20)}<span>${mobile && page === "uniforms" ? "Uniforms" : mobile && page === "library" ? "Books" : mobile && page === "boarding" ? "Boarding" : mobile && page === "transport" ? "Buses" : mobile && page === "people" ? "Students" : mobile && page === "access" ? "Access" : (mobile && page === "inbox" ? "Inbox" : mobile && page === "fees" ? "Fees" : navigation[page].label)}</span></a>`).join("");
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
      ${["parent", "class_teacher"].includes(ctx?.role) ? `<a class="button secondary inbox-shortcut" href="#${ctx.role}/inbox" aria-label="Notifications">${icon("alert", 17)}<span>${notifications(state, ctx).filter((item) => !item.read).length}</span></a>` : ""}${view.role === "parent" ? button("Log out", "parent-logout", { variant: "secondary" }) : `<details class="role-picker"><summary class="button role-button" aria-label="Switch role">${icon(roles[view.role].icon, 17)}<span>${roles[view.role].name}</span>${icon("chevronDown", 15)}</summary>
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
    return `<div class="family-switcher">${linkedChildren(state, ctx).length > 1 ? `<label>Viewing child<select data-change="child" data-focus="child-select" aria-label="Select child">${linkedChildren(state, ctx).map((child) => `<option value="${e(child.id)}" ${child.id === student.id ? "selected" : ""}>${e(child.name)} · ${e(child.className)}</option>`).join("")}</select></label>` : ""}</div><section class="parent-identity" aria-label="Parent and student details">${avatar(student, "small")}<dl><div><dt>Parent</dt><dd>${e(ctx.account.name)}</dd></div><div><dt>Student</dt><dd>${e(student.name)}</dd></div><div><dt>Admission number</dt><dd>${e(student.admissionNumber)}</dd></div><div><dt>Class</dt><dd>${e(student.className)} · Grade ${e(student.grade)}</dd></div><div><dt>School</dt><dd>${e(state.branches.find((branch) => branch.id === student.branch)?.name)}</dd></div></dl></section>`;
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
  const reportSchoolsScroll = app.querySelector(".chairman-report-schools > section")?.scrollTop || 0;
  const previousViewport = map?.viewport;
  const previousSchoolViewport = schoolMap?.viewport;
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
    options.scopeControls = scopeBar(ctx);
    options.networkBuses = networkFleet(state, networkBranches(state, ctx, ui.network), ctx);
    options.networkElapsed = elapsed();
    if (ui.network.selected && !networkBranches(state, ctx, ui.network).some((branch) => branch.id === ui.network.selected)) {
      ui.network.selected = "";
      if (["branch", "bus"].includes(ui.network.mode)) ui.network.mode = "";
    }
    if (!options.fleet.some((bus) => bus.id === ui.bus)) ui.bus = options.fleet[0]?.id;
    options.selected = ui.bus;
    const pages = { family: familyPage, inbox: inboxPage, more: morePage, tracking: trackingPage, fees: feesPage, events: eventsPage, communications: communicationsPage, boarding: boardingPage, overview: ctx.role === "uniform_store" ? uniformsPage : ctx.role === "librarian" ? booksPage : ctx.role === "transport" ? transportCoordinatorPage : ctx.role === "admin" ? schoolAdminPage : ctx.role === "teacher" ? subjectTeacherPage : ctx.role === "class_teacher" ? classTeacherPage : ctx.role === "coordinator" ? gradeCoordinatorPage : ctx.role === "section_head" ? sectionHeadPage : ctx.role === "chairman" ? chairmanOverviewPage : isSchoolOperator(ctx) ? principalOverviewPage : networkOverviewPage, courses: coursesPage, notices: noticesPage, homework: homeworkPage, people: peoplePage, library: booksPage, uniforms: uniformsPage, access: accessPage };
    body = view.page === "transport" ? transportPage(view.role, options) : pages[view.page](options);
  }
  document.title = `${["librarian", "uniform_store"].includes(view.role) && view.page === "overview" ? storeViews.find((item) => item.id === view.module).name : view.role === "transport" && view.page === "overview" ? coordinatorViews.find((item) => item.id === view.module).name : view.role === "admin" && view.page === "overview" ? adminViews.find((item) => item.id === view.module).name : view.role === "teacher" && view.page === "overview" ? subjectViews.find((item) => item.id === view.module).name : view.role === "class_teacher" && view.page === "overview" ? classViews.find((item) => item.id === view.module).name : view.role === "coordinator" && view.page === "overview" ? gradeViews.find((item) => item.id === view.module).name : view.role === "section_head" && view.page === "overview" ? sectionViews.find((item) => item.id === view.module).name : ["chairman", "principal", "vice_principal"].includes(view.role) && view.page === "overview" ? chairmanViews.find((item) => item.id === view.module).name : navigation[view.page].label} · ${roles[view.role].name} · Sussex College Network`;
  const mobileNavigation = roles[view.role].pages.length > 1;
  app.innerHTML = `<div class="app-shell role-${view.role} ${mobileNavigation ? "has-mobile-nav" : ""}">
    ${sidebar(ctx)}<div class="desktop-content">${topbar(ctx)}<main id="main" class="page page-${view.page}">${view.page === "overview" || ["library", "uniforms"].includes(view.page) && ctx?.role !== "parent" ? "" : scopeBar(ctx)}${body}</main></div>
    ${mobileNavigation ? `<nav class="mobile-nav" aria-label="Workspace">${navigationLinks(true)}</nav>` : ""}
  </div>`;
  const coordinatorStage = app.querySelector("#coordinator-fleet-map");
  if (coordinatorStage && coordinatorScope(state, ctx)) {
    const scope = coordinatorScope(state, ctx), fleet = coordinatorFleet(state, ctx), f = options.transportCoordinator;
    const key = "coordinator:" + scope.key;
    schoolMap = new SchoolNetworkMap(coordinatorStage, { branches: [scope.branch], fleet, selected: scope.branch.id, homeBranch: scope.branch.id, metricLabel: "school routes",
      selectedBus: f.busId, status: f.status, paused: ui.paused, progress, elapsed,
      onSelect: () => schoolMap?.fitHome(), onBusSelect: selectCoordinatorBus,
      onTick: () => updateCoordinatorTelemetry(app, fleet, progress, ui.paused, elapsed()), viewport: schoolMapKey === key ? previousSchoolViewport : null });
    if (ui.transportCoordinator.mapFocus) schoolMap.focusBus(ui.transportCoordinator.mapFocus);
    else if (ui.transportCoordinator.resetMap) schoolMap.fitHome();
    ui.transportCoordinator.mapFocus = ""; ui.transportCoordinator.resetMap = false; schoolMapKey = key;
  }
  const networkStage = app.querySelector("#school-network-map");
  if (networkStage) {
    const metricView = ctx.role === "chairman" && view.module !== "transport";
    const branches = metricView ? chairmanBranches(state, ctx) : networkBranches(state, ctx, ui.network);
    const key = `${ctx.account.id}-${ctx.branch}-${view.module}-${branches.map((branch) => branch.id).join(",")}`;
    schoolMap = new SchoolNetworkMap(networkStage, { branches, fleet: metricView ? [] : options.networkBuses, selected: metricView ? ui.chairman.branchId : ui.network.selected || (isSchoolOperator(ctx) ? ctx.branch : ""), homeBranch: isSchoolOperator(ctx) ? ctx.branch : null,
      metricValues: metricView ? chairmanMapMetrics(options) : null, metricLabel: metricView ? view.module : "",
      selectedBus: ui.network.mode === "bus" ? ui.network.busId : "", status: ui.network.status, paused: ui.paused, progress, elapsed,
      onSelect: selectNetworkBranch, onBusSelect: selectNetworkBus,
      onTick: () => updateNetworkBusDetails(app, options.networkBuses, progress, ui.paused, elapsed()),
      viewport: schoolMapKey === key ? previousSchoolViewport : null });
    if (ui.network.mapFocus?.bus) schoolMap.focusBus(ui.network.mapFocus.bus);
    else if (ui.network.mapFocus?.branch) schoolMap.focusBranch(ui.network.mapFocus.branch);
    else if (ui.network.resetMap) schoolMap.fitHome();
    ui.network.mapFocus = null; ui.network.resetMap = false;
    schoolMapKey = key;
    const rows = app.querySelector(".ranking-rows");
    const activeRow = rows?.querySelector('[aria-pressed="true"]');
    if (activeRow) rows.scrollTop = Math.max(0, activeRow.offsetTop - rows.offsetTop - rows.clientHeight / 2 + activeRow.clientHeight / 2);
    const picker = app.querySelector(".network-branch-picker");
    if (picker && pickerOpen) picker.open = true;
  }
  const stage = app.querySelector("#map-stage");
  if (stage && options.fleet.some((bus) => bus.trackingVisible)) {
    const fleet = options.fleet.filter((bus) => bus.trackingVisible);
    const isFleet = view.role !== "parent";
    const selected = isFleet && fleet.some((bus) => bus.id === ui.bus) ? ui.bus : fleet[0].id;
    const bus = fleet.find((item) => item.id === selected);
    const key = `${ctx.account.id}-${ctx.branch}-${isFleet ? "fleet" : selected}`;
    const schools = state.branches.filter((branch) => fleet.some((item) => item.branch === branch.id));
    map = new FleetMap(stage, { buses: fleet, schools, selected, progress, viewport: mapViewKey === key ? previousViewport : null,
      onSelect: isFleet ? selectBus : null, onTick: () => updateTripDetails(app, bus, progress(bus)) });
    mapViewKey = key;
    if (isFleet) mountMapSummary(stage, bus, progress(bus));
  }
  if (scrollTop) window.scrollTo({ top: 0, behavior: "instant" });
  const activeView = app.querySelector('.chairman-view-bar [aria-current="page"]');
  if (activeView) activeView.parentElement.scrollLeft = Math.max(0, activeView.offsetLeft - activeView.parentElement.offsetLeft - 18);
  const reportSchools = app.querySelector(".chairman-report-schools > section");
  if (reportSchools) reportSchools.scrollTop = reportSchoolsScroll;
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
  dialog.classList.toggle("chairman-dialog", mode.startsWith("chairman-"));
  dialog.classList.toggle("class-attendance-dialog", mode === "class-attendance");
  dialog.innerHTML = `<header class="dialog-heading"><div><h2 id="dialog-title">${e(title)}</h2>${description ? `<p>${e(description)}</p>` : ""}</div><button type="button" class="icon-button" aria-label="Close dialog" data-action="close-dialog">${icon("x", 21)}</button></header>${content}`;
  if (!dialog.open) dialog.showModal();
}

function updateAttendanceDraft(form) {
  const rows = [...form.querySelectorAll("[data-attendance-student]")];
  const counts = { present: 0, absent: 0, late: 0 };
  let changes = 0;
  for (const row of rows) {
    const selected = row.querySelector("[data-attendance-status]:checked")?.value;
    if (Object.hasOwn(counts, selected)) counts[selected]++;
    if (selected !== row.dataset.originalStatus) changes++;
  }
  for (const [status, count] of Object.entries(counts)) form.querySelector(`[data-attendance-count="${status}"]`).textContent = count;
  form.querySelector("[data-attendance-draft]").textContent = changes ? `${changes} change${changes === 1 ? "" : "s"} to save` : "Review selections, then save";
}

function filterAttendanceDraft(input) {
  const form = input.closest('[data-form="class-attendance"]');
  const query = input.value.trim().toLowerCase();
  const rows = [...form.querySelectorAll("[data-attendance-student]")];
  let shown = 0;
  for (const row of rows) {
    row.hidden = Boolean(query && !row.dataset.studentSearch.includes(query));
    if (!row.hidden) shown++;
  }
  const result = form.querySelector("[data-attendance-search-result]");
  result.hidden = !query;
  result.textContent = shown ? `Showing ${shown} of ${rows.length} students. Counts and All present apply to the full list.` : "No students found. Try another name or admission number.";
}

function closeDialog() {
  dialog.close();
  dialogMode = null;
}

function confirmDialog(mode, title, description, label, action, value) {
  showDialog(mode, title, description, `<footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}${button(label, action, { value })}</footer>`);
}

function chairmanPerson(kind, id, ctx = context()) {
  if (!isSchoolLeader(ctx)) return null;
  for (const branch of chairmanBranches(state, ctx)) {
    const list = kind === "student" ? studentRoster(branch)
      : kind === "staff" ? branchStaff(state, branch, schoolDays(ui.chairman.date)[0]) : branchVacancies(state, branch);
    const person = list.find((person) => person.id === id);
    if (person) return { person, branch };
  }
  return null;
}

function permittedReport(id, ctx = context()) {
  if (ctx?.role === "transport") return visibleCoordinatorReports(state, ctx).find((report) => report.id === id);
  if (ctx?.role === "admin") return visibleAdminReports(state, ctx).find((report) => report.id === id);
  if (ctx?.role === "teacher") return visibleSubjectReports(state, ctx).find((report) => report.id === id);
  if (ctx?.role === "class_teacher") return visibleClassReports(state, ctx).find((report) => report.id === id);
  if (ctx?.role === "coordinator") return visibleGradeReports(state, ctx).find((report) => report.id === id);
  if (ctx?.role === "section_head") return visibleSectionReports(state, ctx).find((report) => report.id === id);
  if (!isSchoolLeader(ctx)) return null;
  return visibleExecutiveReports(state, ctx).find((report) => report.id === id);
}

function captureExecutiveReport(type, fromBuilder = false) {
  const settings = { ...ui.chairman, reportType: type,
    reportBranches: fromBuilder ? ui.chairman.reportBranches : null,
    reportPeriod: ["transport", "staffing", "academic"].includes(type) ? "day" : fromBuilder ? ui.chairman.reportPeriod : ui.chairman.period };
  if (type === "transport") settings.date = demoDate;
  const ctx = context();
  if (isSchoolOperator(ctx)) settings.reportBranches = [ctx.grant.branch];
  const report = generateExecutiveReport(state, ctx, settings, optionsFor(ctx).network, { progress, paused: ui.paused, elapsed: elapsed() });
  if (isSchoolOperator(ctx) && type === "academic") {
    const branch = chairmanBranches(state, ctx)[0];
    const comparison = schoolAcademicComparison(state, branch, optionsFor(ctx).network, ui.chairman.academicCompare);
    report.customColumns = comparison.columns;
    report.customRows = comparison.rows.map((row) => Object.fromEntries(comparison.columns.map(([key]) => [key, row[key]])));
    report.criteria.comparison = comparison.mode;
  }
  if (ctx.role === "vice_principal" && type === "brief") {
    const branch = chairmanBranches(state, ctx)[0];
    report.operations = {
      date: demoDate,
      followups: schoolFollowups(state, branch).map(({ title, category, status, due }) => ({ title, category, status, due })),
      covers: schoolTemporaryCovers(state, branch).filter((item) => item.status === "active").map(({ className, title, teacherName, date }) => ({ className, title, teacherName, date })),
      recommendations: schoolLeaveRequests(state, branch).filter((item) => item.recommendation && item.decision === "pending").length,
    };
  }
  if (!update((next) => {
    const key = reportOwnerKey(ctx);
    const matches = (item) => item.owner?.key === key || !item.owner && ctx.role === "chairman";
    const existing = next.executiveReports || [];
    next.executiveReports = [report, ...existing.filter(matches)].slice(0, 8).concat(existing.filter((item) => !matches(item)));
  })) return null;
  ui.chairman.reportId = report.id;
  return report;
}

function captureSectionReport(type = ui.section.reportType) {
  const ctx = context(), report = generateSectionReport(state, ctx, { ...sectionFilters(state, ctx, ui.section), reportType: type });
  if (!update((next) => {
    const existing = next.sectionReports || [], key = report.owner.key;
    next.sectionReports = [report, ...existing.filter((item) => item.owner?.key === key)].slice(0, 8).concat(existing.filter((item) => item.owner?.key !== key));
  })) return null;
  ui.section.reportId = report.id;
  return report;
}

function captureGradeReport(type = ui.gradeCoordinator.reportType) {
  const ctx = context(), report = generateGradeReport(state, ctx, { ...gradeFilters(state, ctx, ui.gradeCoordinator), reportType: type });
  if (!update((next) => {
    const previous = next.gradeReports || [], key = report.owner.key;
    next.gradeReports = [report, ...previous.filter((item) => item.owner?.key === key)].slice(0, 8).concat(previous.filter((item) => item.owner?.key !== key));
  })) return null;
  ui.gradeCoordinator.reportId = report.id;
  return report;
}

function captureClassReport(type = ui.classTeacher.reportType) {
  const ctx = context(), report = generateClassReport(state, ctx, { ...classFilters(state, ctx, ui.classTeacher), reportType: type });
  if (!update((next) => {
    const existing = next.classReports || [], key = report.owner.key;
    next.classReports = [report, ...existing.filter((item) => item.owner?.key === key)].slice(0, 8).concat(existing.filter((item) => item.owner?.key !== key));
  })) return null;
  ui.classTeacher.reportId = report.id;
  return report;
}

function captureSubjectReport() {
  const ctx = context(), report = generateSubjectReport(state, ctx, subjectFilters(state, ctx, ui.subjectTeacher));
  if (!update((next) => {
    const existing = next.subjectReports || [], key = report.owner.key;
    next.subjectReports = [report, ...existing.filter((item) => item.owner?.key === key)].slice(0, 8).concat(existing.filter((item) => item.owner?.key !== key));
  })) return null;
  ui.subjectTeacher.reportId = report.id;
  return report;
}

function captureAdminReport() {
  const ctx = context(), report = generateAdminReport(state, ctx, adminFilters(state, ctx, ui.schoolAdmin));
  if (!update((next) => {
    const existing = next.adminReports || [], key = report.owner.key;
    next.adminReports = [report, ...existing.filter((item) => item.owner?.key === key)].slice(0, 8).concat(existing.filter((item) => item.owner?.key !== key));
  })) return null;
  ui.schoolAdmin.reportId = report.id;
  return report;
}

function captureCoordinatorReport() {
  const ctx = context(), report = generateCoordinatorReport(state, ctx, coordinatorFilters(state, ctx, ui.transportCoordinator), { progress, paused: ui.paused, elapsed: elapsed() });
  if (!update((next) => {
    const existing = next.coordinatorReports || [], key = report.owner.key;
    next.coordinatorReports = [report, ...existing.filter((item) => item.owner?.key === key)].slice(0, 8).concat(existing.filter((item) => item.owner?.key !== key));
  })) return null;
  ui.transportCoordinator.reportId = report.id;
  return report;
}

async function downloadExecutiveReport(report, format = "csv", print = false) {
  try {
    let content;
    if (format === "html" || print) {
      let logo = "";
      try {
        const response = await fetch("./assets/sussex-college-network-logo.png");
        if (response.ok) {
          const blob = await response.blob();
          logo = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(blob);
          });
        }
      } catch {}
      content = report.owner?.role === "transport" ? coordinatorReportHTML(report, logo) : report.owner?.role === "admin" ? adminReportHTML(report, logo) : report.owner?.role === "teacher" ? subjectReportHTML(report, logo) : ["section_head", "coordinator", "class_teacher"].includes(report.owner?.role) ? sectionReportHTML(report, logo) : executiveReportHTML(report, logo);
    } else content = reportCSV(report);
    if (print) {
      const frame = document.createElement("iframe");
      frame.title = "Executive report print preview";
      frame.style.cssText = "position:fixed;left:-12000px;top:0;width:1120px;height:800px;border:0";
      frame.addEventListener("load", () => {
        frame.contentWindow.addEventListener("afterprint", () => frame.remove(), { once: true });
        frame.contentWindow.focus(); frame.contentWindow.print();
        setTimeout(() => frame.remove(), 60000);
      }, { once: true });
      frame.srcdoc = content;
      document.body.append(frame);
      return;
    }
    const url = URL.createObjectURL(new Blob([content], { type: format === "html" ? "text/html;charset=utf-8" : "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "sussex-" + report.type + "-SAMPLE-" + report.criteria.to + "." + format;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);
    toast("Sample report downloaded.");
  } catch { toast("The report could not be exported. Please try again."); }
}

function selectBus(id, focus) {
  const fleet = optionsFor().fleet;
  const bus = fleet.find((item) => item.id === id);
  if (!bus) return;
  ui.bus = id;
  if (ui.filter !== "all" && ui.filter !== bus.status) ui.filter = "all";
  render(focus);
}

function selectCoordinatorBus(id) {
  const ctx = context();
  if (!coordinatorScope(state, ctx) || !coordinatorBuses(state, ctx).some((bus) => bus.id === id)) return;
  ui.transportCoordinator.busId = id;
  if (ui.transportCoordinator.status !== "all" && !coordinatorBuses(state, ctx).some((bus) => bus.id === id && bus.status === ui.transportCoordinator.status)) ui.transportCoordinator.status = "all";
  ui.transportCoordinator.mapFocus = id; render();
}

function selectNetworkBranch(id, focus) {
  const ctx = context();
  if (!["chairman", "principal", "vice_principal"].includes(ctx?.role)) return;
  if (isSchoolLeader(ctx) && view.page === "overview" && view.module !== "transport") {
    const branch = chairmanBranches(state, ctx).find((branch) => branch.id === id);
    if (!branch) return;
    ui.chairman.branchId = id;
    showDialog("chairman-branch", branch.school, "Sample data · " + chairmanViews.find((item) => item.id === view.module)?.name, chairmanBranchPanel(optionsFor(ctx), branch));
    return;
  }
  if (!networkBranches(state, ctx, ui.network).some((branch) => branch.id === id)) return;
  ui.network.selected = id;
  ui.network.mode = "branch";
  ui.network.tab = focus?.startsWith("ranking-") ? "performance" : "transport";
  ui.network.busId = "";
  ui.network.mapFocus = { branch: id };
  render();
  app.querySelector("#network-inspector-title")?.focus({ preventScroll: true });
}

function selectNetworkBus(id) {
  const ctx = context();
  if (!["chairman", "principal", "vice_principal"].includes(ctx?.role)) return;
  const bus = networkFleet(state, networkBranches(state, ctx, ui.network), ctx).find((bus) => bus.id === id);
  if (!bus) return;
  ui.network.selected = bus.branch; ui.network.busId = id; ui.network.mode = "bus";
  ui.network.mapFocus = { bus: id };
  render();
  app.querySelector("#network-inspector-title")?.focus({ preventScroll: true });
}

function filterBuses(status, focus) {
  const fleet = optionsFor().fleet;
  ui.filter = status;
  if (status !== "all" && !fleet.some((bus) => bus.id === ui.bus && bus.status === status)) ui.bus = fleet.find((bus) => bus.status === status)?.id || ui.bus;
  render(focus);
}

function downloadMaterial(id) {
  const material = typeof id === "object" ? id : state.materials.find((item) => item.id === id);
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
  if (name.startsWith("academic-")) {
    if (name === "academic-assign-subjects") return academicClassStudents(state, ctx).some((student) => student.id === value);
    if (name === "academic-notice-new") return ctx.role === "class_teacher";
    if (name === "academic-notice-edit") return ctx.role === "class_teacher" && visibleClassNotices(state, ctx).some((item) => item.id === value);
    if (name === "academic-notice-read") return ctx.role === "parent" && visibleClassNotices(state, ctx, options.child).some((item) => item.id === value);
    if (name === "academic-homework-new") return ["class_teacher", "teacher"].includes(ctx.role) && homeworkSubjects(state, ctx).some((course) => !value || course.id === value);
    const item = visibleHomework(state, ctx, options.child).find((item) => item.id === value);
    if (name === "academic-homework-edit") return Boolean(item && canManageHomework(state, ctx, item));
    if (name === "academic-homework-download") return Boolean(item);
    return name === "academic-homework-done" && ctx.role === "parent" && Boolean(item);
  }
  if (name.startsWith("store-")) {
    const [kind, id, target] = String(value || "").split("|"), scope = storesScope(state, ctx, kind);
    if (!scope) return false;
    if (name === "store-tab") return (scope.parent ? ["catalogue", "reservations"] : storeViews.map((item) => item.id)).includes(id);
    if (["store-bag", "store-submit"].includes(name)) return scope.parent;
    if (name === "store-remove") return scope.parent && reservationBag(state, ctx, kind).some((line) => line.itemId === id && line.variantId === target);
    if (["store-request", "store-cancel", "store-confirm-cancel", "store-process"].includes(name)) {
      const request = storeReservations(state, ctx, kind).find((request) => request.id === id);
      if (!request) return false;
      if (name === "store-request") return true;
      if (["store-cancel", "store-confirm-cancel"].includes(name)) return scope.parent && ["requested", "confirmed"].includes(request.status);
      return scope.canManage && ({ requested: ["confirmed", "declined"], confirmed: ["ready", "cancelled"], ready: ["collected", "cancelled"] })[request.status]?.includes(target);
    }
    if (name === "store-stock") return scope.canManage && storeCatalogue(state, ctx, kind).some((item) => item.id === id && item.variants.some((variant) => variant.id === target));
    if (name === "store-report") return scope.canManage;
    if (["store-report-open", "store-report-download"].includes(name)) return scope.canManage && storeReports(state, ctx, kind).some((report) => report.id === id);
    return false;
  }
  if (name.startsWith("nfc-")) {
    const scope = boardingScope(state, ctx);
    if (!scope) return false;
    const trips = visibleBoardingTrips(state, ctx), [tripId, studentId] = String(value || "").split("|"), trip = trips.find((trip) => trip.id === tripId);
    if (name === "nfc-tab") return value === "cards" ? scope.canCards : value === "trips" && scope.canRoster;
    if (["nfc-card-issue", "nfc-card-history"].includes(name)) return scope.canCards && boardingStudents(state, ctx).some((student) => student.id === value);
    if (name === "nfc-card-disable") return scope.canCards && (state.nfcCards || []).some((card) => card.id === value && card.status === "active" && boardingStudents(state, ctx).some((student) => student.id === card.studentId));
    if (name === "nfc-new-trip") return scope.canOperate && scope.buses.length > 0;
    if (name === "nfc-quick-tap") return scope.canOperate && trip?.phase === "boarding" && /^[A-Z0-9][A-Z0-9-]{3,39}$/.test(studentId || "");
    if (["nfc-reader-offline", "nfc-reader-sync"].includes(name)) return scope.canOperate && (state.nfcReaders || []).some((reader) => reader.id === value && scope.buses.some((bus) => bus.id === reader.busId && bus.branch === reader.branch));
    if (["nfc-review", "nfc-flag"].includes(name)) return Boolean(trip?.expected.some((entry) => entry.studentId === studentId)) && (name === "nfc-review" ? scope.canReview : scope.canOperate);
    if (["nfc-close-trip", "nfc-confirm-close"].includes(name)) return scope.canReview && trip?.phase === "boarding";
    if (name === "nfc-manifest") return scope.canRoster && Boolean(trip);
    return false;
  }
  if (name.startsWith("coordinator-")) {
    const scope = coordinatorScope(state, ctx);
    if (!scope) return false;
    if (name === "coordinator-bus") return coordinatorBuses(state, ctx).some((bus) => bus.id === value);
    if (name === "coordinator-map-reset") return true;
    if (name === "coordinator-people-tab") return ["students", "trackers"].includes(value);
    if (name === "coordinator-page") return /^[1-9]\d*$/.test(value);
    if (name === "coordinator-task-new") return coordinatorBuses(state, ctx).length > 0 && (!value || coordinatorBuses(state, ctx).some((bus) => bus.id === value));
    if (name === "coordinator-task-edit") return coordinatorTasks(state, ctx).some((task) => task.id === value);
    if (name === "coordinator-allocate") return coordinatorBuses(state, ctx).length > 0 && coordinatorStudents(state, ctx).some((row) => row.student.id === value);
    if (name === "coordinator-tracker-signal") return coordinatorBuses(state, ctx).some((bus) => bus.id === String(value).split("|")[0]);
    if (name === "coordinator-generate-report") return true;
    if (["coordinator-open-report", "coordinator-download-report", "coordinator-print-report"].includes(name)) return Boolean(permittedReport(value, ctx));
    return false;
  }
  if (name.startsWith("admin-")) {
    const scope = adminScope(state, ctx);
    if (!scope) return false;
    if (name === "admin-student") return state.students.some((student) => student.id === value && student.branch === scope.branch.id);
    if (name === "admin-guardian") return adminGuardianAccounts(state, ctx).some((person) => person.id === value);
    if (name === "admin-page") return /^[1-9]\d*$/.test(value);
    if (name === "admin-generate-report") return true;
    if (["admin-open-report", "admin-download-report", "admin-print-report"].includes(name)) return Boolean(permittedReport(value, ctx));
    return false;
  }
  if (name.startsWith("subject-")) {
    const scope = subjectScope(state, ctx);
    if (!scope) return false;
    if (name === "subject-plan-new" || name === "subject-support") return scope.courses.length > 0 && (!value || scope.courses.some((course) => course.id === value));
    if (name === "subject-plan-edit") return subjectPlans(state, ctx).some((item) => item.id === value);
    if (name === "subject-review") return subjectEnrolments(state, ctx).some((row) => row.course.id + "|" + row.student.id === value);
    if (name === "subject-generate-report") return true;
    if (["subject-open-report", "subject-download-report", "subject-print-report"].includes(name)) return Boolean(permittedReport(value, ctx));
    return false;
  }
  if (name.startsWith("class-")) {
    const scope = classScope(state, ctx);
    if (!scope) return false;
    if (["class-student", "class-followup-new"].includes(name)) return classAttendance(state, ctx).roster.some((student) => student.id === value);
    if (name === "class-attendance-all-present") return can(ctx, "attendance.mark") && dialog.open && dialogMode === "class-attendance" && Boolean(dialog.querySelector('[data-form="class-attendance"]'));
    if (name === "class-mark-attendance") return can(ctx, "attendance.mark") && (!value || classAttendance(state, ctx).roster.some((student) => student.id === value));
    if (["class-reset-attendance", "class-confirm-reset-attendance"].includes(name)) return can(ctx, "attendance.mark") && /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (name === "class-followup-edit") return classFollowups(state, ctx).some((item) => item.id === value);
    if (name === "class-discussion-new") return classStudents(state, ctx).some((student) => student.id === value);
    if (name === "class-discussion-edit") return classDiscussionNotes(state, ctx).some((item) => item.id === value);
    if (name === "class-support") return !value || visibleCourses(state, scope.context).some((course) => course.id === value);
    if (name === "class-page") return /^[1-9]\d?$/.test(value);
    if (name === "class-export") return Object.hasOwn(classReportTypes, value);
    if (name === "class-generate-report") return true;
    if (["class-open-report", "class-download-report", "class-print-report"].includes(name)) return Boolean(permittedReport(value, ctx));
    return false;
  }
  if (name.startsWith("grade-")) {
    const scope = gradeScope(state, ctx);
    if (!scope) return false;
    if (["grade-student", "grade-followup-new"].includes(name)) return gradeAttendance(state, ctx).roster.some((student) => student.id === value);
    if (name === "grade-followup-edit") return gradeFollowups(state, ctx).some((item) => item.id === value);
    if (name === "grade-subject-response") return gradeSubjectRequests(state, ctx).some((item) => item.id === value);
    if (name === "grade-class-response") return gradeClassRequests(state, ctx).some((item) => item.id === value);
    if (name === "grade-teacher") return gradeTeachers(state, ctx).some((person) => person.id === value);
    if (name === "grade-support") return visibleCourses(state, scope.context).some((course) => course.id === value);
    if (["grade-open-class", "grade-class-review"].includes(name)) return scope.grade > 0 && [scope.grade + "A", scope.grade + "B"].includes(value);
    if (name === "grade-page") return /^[1-9]\d?$/.test(value);
    if (name === "grade-export") return Object.hasOwn(gradeReportTypes, value);
    if (name === "grade-generate-report") return true;
    if (["grade-open-report", "grade-download-report", "grade-print-report"].includes(name)) return Boolean(permittedReport(value, ctx));
    return false;
  }
  if (name.startsWith("section-")) {
    const scope = sectionScope(state, ctx);
    if (!scope) return false;
    if (["section-student", "section-followup-new"].includes(name)) return sectionAttendance(state, ctx).roster.some((student) => student.id === value);
    if (name === "section-followup-edit") return sectionFollowups(state, ctx).some((item) => item.id === value);
    if (name === "section-grade-response") return sectionGradeRequests(state, ctx).some((item) => item.id === value);
    if (name === "section-teacher") return sectionTeachers(state, ctx).some((person) => person.id === value);
    if (["section-review", "section-request-cover"].includes(name)) return visibleCourses(state, scope.context).some((course) => course.id === value);
    if (name === "section-attendance-class") return /^(?:[1-9]|1[0-3])[AB]$/.test(value) && scope.grades.includes(Number(value.slice(0, -1)));
    if (name === "section-page") return /^[1-9]\d?$/.test(value);
    if (name === "section-export") return Object.hasOwn(sectionReportTypes, value);
    if (name === "section-generate-report") return true;
    if (["section-open-report", "section-download-report", "section-print-report"].includes(name)) return Boolean(permittedReport(value, ctx));
    return false;
  }
  const course = visibleCourses(state, ctx, options.child).find((item) => item.id === value);
  const material = state.materials.find((item) => item.id === value);
  const materialCourse = visibleCourses(state, ctx, options.child).find((item) => item.id === material?.course);
  const viceBranch = ctx.role === "vice_principal" ? chairmanBranches(state, ctx)[0] : null;
  const guards = {
    "vice-cover-request": Boolean(viceBranch) && incomingSectionCoverRequests(state, ctx).some((item) => item.id === value),
    "vice-decline-cover-request": Boolean(viceBranch) && incomingSectionCoverRequests(state, ctx).some((item) => item.id === value),
    "vice-followups": Boolean(viceBranch),
    "vice-new-followup": Boolean(viceBranch) && Object.hasOwn(followupCategories, value),
    "vice-edit-followup": Boolean(viceBranch) && schoolFollowups(state, viceBranch).some((item) => item.id === value),
    "vice-student-followup": Boolean(viceBranch) && Boolean(chairmanPerson("student", value, ctx)),
    "vice-bus-followup": Boolean(viceBranch) && networkFleet(state, [viceBranch]).some((bus) => bus.id === value),
    "vice-cover": Boolean(viceBranch) && (!value || Boolean(course)),
    "vice-cancel-cover": Boolean(viceBranch) && schoolTemporaryCovers(state, viceBranch).some((item) => item.id === value && item.status === "active"),
    "vice-leave-recommend": Boolean(viceBranch) && schoolLeaveRequests(state, viceBranch).some((item) => item.id === value && item.decision === "pending"),
    "principal-pulse": isSchoolOperator(ctx) && ["academic", "attendance", "staffing", "transport"].includes(value),
    "principal-class": isSchoolOperator(ctx) && new RegExp("^" + ui.network.grade + "[AB]$").test(value),
    "principal-grade": isSchoolOperator(ctx) && [6, 8, 10, 11].includes(Number(value)),
    "principal-subject": isSchoolOperator(ctx) && subjects.some((subject) => subject.id === value),
    "principal-attendance-class": isSchoolOperator(ctx) && /^(?:[1-9]|1[0-3])[AB]$/.test(value),
    "principal-course": isSchoolOperator(ctx) && Boolean(course),
    "principal-review-leave": ctx.role === "principal" && ["approved", "declined"].includes(value?.split("|")[1]) && schoolLeaveRequests(state, chairmanBranches(state, ctx)[0]).some((request) => request.id === value?.split("|")[0]),
    "chairman-student": isSchoolLeader(ctx) && name === "chairman-student" && Boolean(chairmanPerson("student", value, ctx)),
    "chairman-staff": isSchoolLeader(ctx) && name === "chairman-staff" && Boolean(chairmanPerson("staff", value, ctx)),
    "chairman-vacancy": isSchoolLeader(ctx) && name === "chairman-vacancy" && Boolean(chairmanPerson("vacancy", value, ctx)),
    "chairman-review-vacancy": isSchoolLeader(ctx) && name === "chairman-review-vacancy" && Boolean(chairmanPerson("vacancy", value, ctx)),
    "chairman-manage-staff": can(ctx, "roles.manage") && chairmanBranches(state, ctx).some((branch) => branch.id === value),
    "chairman-staff-tab": isSchoolLeader(ctx) && (["people", "vacancies"].includes(value) || isSchoolOperator(ctx) && value === "leave"),
    "chairman-page": isSchoolLeader(ctx) && /^(staff|student)\|[1-9]\d*$/.test(value),
    "chairman-alert": isSchoolLeader(ctx) && chairmanViews.some((item) => item.id === value?.split("|")[0]) && chairmanBranches(state, ctx).some((branch) => branch.id === value?.split("|")[1]),
    "chairman-export": isSchoolLeader(ctx) && Object.hasOwn(reportTypes, value),
    "chairman-generate-report": isSchoolLeader(ctx),
    "chairman-open-report": isSchoolLeader(ctx) && Boolean(permittedReport(value, ctx)),
    "chairman-download-report": isSchoolLeader(ctx) && Boolean(permittedReport(value, ctx)),
    "chairman-print-report": isSchoolLeader(ctx) && Boolean(permittedReport(value, ctx)),
    "chairman-report-all": isSchoolLeader(ctx),
    "chairman-report-none": isSchoolLeader(ctx),
    "network-select": ["chairman", "principal", "vice_principal"].includes(ctx.role) && networkBranches(state, ctx, ui.network).some((branch) => branch.id === value),
    "network-open": ["chairman", "principal", "vice_principal"].includes(ctx.role) && networkBranches(state, ctx, ui.network).some((branch) => branch.id === value),
    "network-all": ctx.role === "chairman" && ctx.branch === "all",
    "network-none": ctx.role === "chairman" && ctx.branch === "all",
    "network-activity": ["chairman", "principal", "vice_principal"].includes(ctx.role) && ["all", "academic", "transport", "library", "people"].includes(value),
    "network-performance": ["chairman", "principal", "vice_principal"].includes(ctx.role),
    "network-close": ["chairman", "principal", "vice_principal"].includes(ctx.role),
    "network-fleet": ["chairman", "principal", "vice_principal"].includes(ctx.role),
    "network-tab": ["chairman", "principal", "vice_principal"].includes(ctx.role) && ["transport", "performance"].includes(value),
    "network-fleet-status": ["chairman", "principal", "vice_principal"].includes(ctx.role) && ["all", "route", "school", "delayed"].includes(value),
    "network-bus": ["chairman", "principal", "vice_principal"].includes(ctx.role) && networkFleet(state, networkBranches(state, ctx, ui.network), ctx).some((bus) => bus.id === value),
    "pause": roles[ctx.role].pages.includes("transport"), "bus": options.fleet.some((bus) => bus.id === value),
    "filter": roles[ctx.role].pages.includes("transport"),
    "assign": can(ctx, "courses.assign") && (!value || Boolean(course)),
    "open-course": Boolean(course), "close-course": roles[ctx.role].pages.includes("courses"),
    "add-material": course && canPublish(state, ctx, course),
    "edit-material": materialCourse && canPublish(state, ctx, materialCourse),
    "download": Boolean(materialCourse), "complete": can(ctx, "materials.complete") && Boolean(materialCourse),
    "edit-bus": can(ctx, "transport.manage") && options.fleet.some((bus) => bus.id === value),
    "edit-student": can(ctx, "students.edit") && (!value || visibleStudents(state, ctx).some((student) => student.id === value)),
    "assign-role": can(ctx, "roles.manage"), "remove-role": canManageGrant(ctx, roleTarget(value).grant || {}),
    "confirm-remove-role": canManageGrant(ctx, roleTarget(value).grant || {}),
    "branch-map": roles[ctx.role].pages.includes("overview") && state.branches.some((branch) => branch.id === value && (ctx.branch === "all" || ctx.branch === value)),
    "edit-branch": can(ctx, "branch.edit"),
  };
  return Boolean(guards[name]);
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
  if (name.startsWith("portal-") || name.startsWith("family-")) { if (ctx) portalAction(name, value, portalAPI(ctx)); return; }
  if (!authorizedAction(name, value, ctx)) return toast("This action is outside the current role’s assigned access.");
  switch (name) {
    case "academic-assign-subjects": showDialog("academic-subjects", "Assign student subjects", "Class " + ctx.grant.className, studentSubjectsForm(optionsFor(ctx), academicClassStudents(state, ctx).find((student) => student.id === value))); break;
    case "academic-notice-new": showDialog("academic-notice", "New class notice", "For every parent in Class " + ctx.grant.className, noticeForm()); break;
    case "academic-notice-edit": showDialog("academic-notice", "Edit class notice", "Class " + ctx.grant.className, noticeForm(visibleClassNotices(state, ctx).find((item) => item.id === value))); break;
    case "academic-notice-read": try { if (update((next) => markNoticeRead(next, ctx, childFor(ctx), value))) render(); } catch (error) { toast(error.message); } break;
    case "academic-homework-new": showDialog("academic-homework", "Give homework", "Choose the subject and class", homeworkForm(optionsFor(ctx), {}, value)); break;
    case "academic-homework-edit": showDialog("academic-homework", "Edit homework", "Subject and class stay fixed", homeworkForm(optionsFor(ctx), visibleHomework(state, ctx).find((item) => item.id === value))); break;
    case "academic-homework-done": try { if (update((next) => setHomeworkDone(next, ctx, childFor(ctx), value))) render(); } catch (error) { toast(error.message); } break;
    case "academic-homework-download": {
      const item = visibleHomework(state, ctx, childFor(ctx)).find((item) => item.id === value), course = state.courses.find((course) => course.id === item.course);
      downloadMaterial({ title: item.title, type: "Homework", content: `${course.title} · Class ${item.className}\nDue: ${item.due}\n\n${item.instructions}` }); break;
    }
    case "store-tab": { const [kind, tab] = value.split("|"); ui.stores[kind].tab = tab; ui.stores[kind].view = tab; ui.stores[kind].query = ""; ui.stores[kind].status = "all"; render(); break; }
    case "store-bag": showDialog("store-bag", "Reservation list", storeKinds[value].store + " · school collection", storeBagForm(state, ctx, value)); break;
    case "store-remove": {
      const [kind, itemId, variantId] = value.split("|");
      try { if (update((next) => saveBagItem(next, ctx, { kind, itemId, variantId, quantity: 0 }))) { render(); showDialog("store-bag", "Reservation list", storeKinds[kind].store + " · school collection", storeBagForm(state, ctx, kind)); } } catch (error) { toast(error.message); } break;
    }
    case "store-submit": {
      let request;
      try { if (update((next) => { request = submitStoreReservation(next, ctx, { kind: value }); }, { branch: ctx.branch, category: "stores", message: "A parent submitted a school collection reservation." })) {
        ui.stores[value].tab = "reservations"; ui.stores[value].query = ""; ui.stores[value].status = "all"; render();
        showDialog("store-request", "Reservation requested", request.reference, storeRequestDetail(state, ctx, value, request.id)); toast("Request recorded for the school’s " + storeKinds[value].store + ".");
      } } catch (error) { toast(error.message); } break;
    }
    case "store-request": { const [kind, id] = value.split("|"); showDialog("store-request", "Reservation details", storeKinds[kind].store + " · school collection", storeRequestDetail(state, ctx, kind, id)); break; }
    case "store-cancel": confirmDialog("store-cancel", "Cancel this reservation?", "Any units held for this request will be released. You can submit a new request later.", "Cancel reservation", "store-confirm-cancel", value); break;
    case "store-confirm-cancel": {
      const [kind, id] = value.split("|"); try { if (update((next) => cancelParentReservation(next, ctx, { kind, id }))) { closeDialog(); render(); toast("Reservation cancelled."); } } catch (error) { toast(error.message); } break;
    }
    case "store-process": { const [kind, id, status] = value.split("|"); showDialog("store-process", "Update reservation", storeKinds[kind].store, storeProcessForm(state, ctx, kind, id, status)); break; }
    case "store-stock": { const [kind, id, variant] = value.split("|"); showDialog("store-stock", "Update store stock", storeKinds[kind].store, storeStockForm(state, ctx, kind, id, variant)); break; }
    case "store-report": {
      let report; try { if (update((next) => { report = createStoreReport(next, ctx, { kind: value, type: ui.stores[value].reportType }); })) { ui.stores[value].reportId = report.id; render(); toast("Store snapshot saved."); } } catch (error) { toast(error.message); } break;
    }
    case "store-report-open": { const [kind, id] = value.split("|"); ui.stores[kind].reportId = id; render(); break; }
    case "store-report-download": {
      const [kind, id] = value.split("|"); try { const csv = storeReportCSV(state, ctx, kind, id), url = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })); const a = document.createElement("a"); a.href = url; a.download = "sussex-" + kind + "-" + id + ".csv"; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); } catch (error) { toast(error.message); } break;
    }
    case "nfc-tab": ui.boarding.tab = value; ui.boarding.query = ""; ui.nfcFeedback = null; render(); break;
    case "nfc-new-trip": showDialog("nfc-trip", "Open a boarding trip roster", "Simulated NFC transport", boardingTripForm(optionsFor(ctx))); break;
    case "nfc-card-issue": {
      const student = boardingStudents(state, ctx).find((student) => student.id === value);
      showDialog("nfc-card", "Issue / replace transport card", "Demo card registration", boardingCardForm(optionsFor(ctx), student)); break;
    }
    case "nfc-card-disable": showDialog("nfc-card", "Record lost or inactive card", "Preserves past boarding events", boardingDisableForm(state.nfcCards.find((card) => card.id === value))); break;
    case "nfc-card-history": showDialog("nfc-history", "Transport card history", "Current school student", boardingCardHistory(optionsFor(ctx), boardingStudents(state, ctx).find((student) => student.id === value))); break;
    case "nfc-review":
    case "nfc-flag": {
      const [tripId, studentId] = value.split("|");
      showDialog("nfc-review", name === "nfc-review" ? "Review transport boarding" : "Flag a boarding concern", "Transport status only", boardingReviewForm(optionsFor(ctx), tripId, studentId, name === "nfc-flag")); break;
    }
    case "nfc-close-trip": confirmDialog("nfc-close", "Close the pickup window?", "Untapped students will need review. This does not confirm absence or change classroom attendance. Queued reader events can still sync.", "Close pickup window", "nfc-confirm-close", value); break;
    case "nfc-confirm-close":
      try { if (update((next) => closeBoardingTrip(next, ctx, { tripId: value }), { branch: visibleBoardingTrips(state, ctx).find((trip) => trip.id === value).branch, category: "transport", message: "NFC demo pickup window closed for review." })) { closeDialog(); render(); toast("Pickup closed. Review untapped students before confirming not boarded."); } } catch (error) { toast(error.message); } break;
    case "nfc-quick-tap": {
      const [tripId, token] = value.split("|"); let result;
      try { if (update((next) => { result = simulateBoardingTap(next, ctx, { tripId, token }); })) { ui.nfcFeedback = { ...result, tripId }; render(); } } catch (error) { toast(error.message); } break;
    }
    case "nfc-reader-offline":
      try { if (update((next) => setBoardingReader(next, ctx, { readerId: value, online: false }))) { ui.nfcFeedback = null; render(); toast("Demo reader offline. Taps will queue locally."); } } catch (error) { toast(error.message); } break;
    case "nfc-reader-sync": {
      let results;
      try { if (update((next) => { results = syncBoardingReader(next, ctx, { readerId: value }); })) { const tripId = optionsFor(ctx).boarding.tripId; ui.nfcFeedback = { tripId, code: "synced", message: "Reader online. " + results.length + " stored tap(s) reconciled; " + results.filter((item) => item.code === "boarded").length + " boarding(s) confirmed. Review the event history for exceptions." }; render(); } } catch (error) { toast(error.message); } break;
    }
    case "nfc-manifest": downloadExecutiveReport(boardingManifest(state, ctx, value)); break;
    case "coordinator-bus": selectCoordinatorBus(value); break;
    case "coordinator-map-reset": ui.transportCoordinator.resetMap = true; render(); break;
    case "coordinator-people-tab": ui.transportCoordinator.peopleTab = value; ui.transportCoordinator.query = ""; ui.transportCoordinator.page = 1; render(); break;
    case "coordinator-page": ui.transportCoordinator.page = Number(value); render(); break;
    case "coordinator-task-new":
    case "coordinator-task-edit": {
      const previous = name === "coordinator-task-edit" ? coordinatorTasks(state, ctx).find((task) => task.id === value) : null;
      showDialog("coordinator-task", previous ? "Update transport issue" : "Record transport issue", "Shared school Follow-up board", coordinatorTaskForm(optionsFor(ctx), previous, value)); break;
    }
    case "coordinator-allocate":
      showDialog("coordinator-allocation", "Assign to a school bus", "School transport records", coordinatorAllocationForm(optionsFor(ctx), value)); break;
    case "coordinator-tracker-signal": { const [id, status] = value.split("|"); try { if (update(next => saveTrackerSignal(next, ctx, { id, status }))) { render(); toast("GPS tracker demo signal updated."); } } catch (error) { toast(error.message); } break; }
    case "coordinator-generate-report":
      try { if (captureCoordinatorReport()) { render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); toast("Transport report saved."); } } catch (error) { toast(error.message); } break;
    case "coordinator-open-report": ui.transportCoordinator.reportId = value; render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); break;
    case "coordinator-download-report": downloadExecutiveReport(permittedReport(value, ctx), ui.transportCoordinator.reportFormat); break;
    case "coordinator-print-report": downloadExecutiveReport(permittedReport(value, ctx), "html", true); break;
    case "admin-student": {
      const student = state.students.find((student) => student.id === value);
      showDialog("admin-student", "Student admission record", adminScope(state, ctx).branch.school, adminStudentPanel(optionsFor(ctx), student)); break;
    }
    case "admin-guardian": {
      const person = adminGuardianAccounts(state, ctx).find((person) => person.id === value);
      showDialog("admin-guardian", "Guardian access links", "Existing school parent account", adminGuardianPanel(optionsFor(ctx), person)); break;
    }
    case "admin-page": ui.schoolAdmin.page = Number(value); render(); break;
    case "admin-generate-report":
      try { if (captureAdminReport()) { render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); toast("Administration report saved."); } } catch (error) { toast(error.message); } break;
    case "admin-open-report": ui.schoolAdmin.reportId = value; render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); break;
    case "admin-download-report": downloadExecutiveReport(permittedReport(value, ctx), ui.schoolAdmin.reportFormat); break;
    case "admin-print-report": downloadExecutiveReport(permittedReport(value, ctx), "html", true); break;
    case "subject-plan-new":
    case "subject-plan-edit": {
      const previous = name === "subject-plan-edit" ? subjectPlans(state, ctx).find((item) => item.id === value) : null;
      showDialog("subject-plan", previous ? "Update lesson plan" : "New lesson plan", "Assigned teaching subjects", subjectPlanForm(optionsFor(ctx), previous, value)); break;
    }
    case "subject-review": {
      const row = subjectEnrolments(state, ctx).find((row) => row.course.id + "|" + row.student.id === value);
      showDialog("subject-review", "Review student learning", "Internal staff learning record", subjectReviewForm(row)); break;
    }
    case "subject-support": showDialog("subject-support", "Request Grade Coordinator support", "Your subject’s school and grade", subjectSupportRequestForm(optionsFor(ctx), value)); break;
    case "subject-generate-report":
      try { if (captureSubjectReport()) { render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); toast("Subject report saved."); } } catch (error) { toast(error.message); } break;
    case "subject-open-report": ui.subjectTeacher.reportId = value; render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); break;
    case "subject-download-report": downloadExecutiveReport(permittedReport(value, ctx), ui.subjectTeacher.reportFormat); break;
    case "subject-print-report": downloadExecutiveReport(permittedReport(value, ctx), "html", true); break;
    case "grade-subject-response": {
      const request = gradeSubjectRequests(state, ctx).find((item) => item.id === value);
      showDialog("grade-subject-response", "Respond to Subject Teacher", "Class " + request.className, subjectSupportResponseForm(request)); break;
    }
    case "class-student": {
      const student = classAttendance(state, ctx).roster.find((item) => item.id === value), options = optionsFor(ctx);
      showDialog("chairman-class-student", "Class student attendance", "Illustrative register · Class " + classScope(state, ctx).className, sectionStudentPanel({ ...options, section: options.classTeacher }, student, "class-followup-new")); break;
    }
    case "class-attendance-all-present": {
      const form = dialog.querySelector('[data-form="class-attendance"]');
      for (const radio of form.querySelectorAll('[data-attendance-status][value="present"]')) radio.checked = true;
      updateAttendanceDraft(form); break;
    }
    case "class-mark-attendance": showDialog("class-attendance", "Mark class attendance", "Illustrative students · Class " + classScope(state, ctx).className, classAttendanceForm(optionsFor(ctx), value)); break;
    case "class-reset-attendance": confirmDialog("class-reset", "Restore generated attendance?", "Restore only this class and school day to the generated sample. Saved reports remain unchanged.", "Restore sample", "class-confirm-reset-attendance", value); break;
    case "class-confirm-reset-attendance":
      try { if (update((next) => resetClassAttendance(next, ctx, value), { branch: ctx.grant.branch, category: "people", message: "Class attendance restored to generated sample." })) { closeDialog(); render(); toast("Generated class register restored."); } } catch (error) { toast(error.message); } break;
    case "class-followup-new":
    case "class-followup-edit": {
      const previous = name === "class-followup-edit" ? classFollowups(state, ctx).find((item) => item.id === value) : null;
      const student = classAttendance(state, ctx).roster.find((item) => item.id === (previous?.student || value));
      showDialog("class-followup", previous ? "Update class follow-up" : "New class attendance follow-up", "Class " + classScope(state, ctx).className, classFollowupForm(student, previous)); break;
    }
    case "class-discussion-new":
    case "class-discussion-edit": {
      const previous = name === "class-discussion-edit" ? classDiscussionNotes(state, ctx).find((item) => item.id === value) : null;
      const student = classStudents(state, ctx).find((item) => item.id === (previous?.student || value));
      showDialog("class-discussion", previous ? "Update parent discussion" : "Record parent discussion", "Local class record · No messages sent", classDiscussionForm(optionsFor(ctx), student, previous)); break;
    }
    case "class-support": showDialog("class-support", "Request Grade Coordinator support", "Class " + classScope(state, ctx).className, classSupportRequestForm(optionsFor(ctx), value)); break;
    case "class-page": ui.classTeacher.page = Number(value); render(); break;
    case "class-generate-report":
      try { if (captureClassReport()) { render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); toast("Class report saved."); } } catch (error) { toast(error.message); } break;
    case "class-export":
      try { const report = captureClassReport(value); if (report) downloadExecutiveReport(report); } catch (error) { toast(error.message); } break;
    case "class-open-report": ui.classTeacher.reportId = value; render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); break;
    case "class-download-report": downloadExecutiveReport(permittedReport(value, ctx), ui.classTeacher.reportFormat); break;
    case "class-print-report": downloadExecutiveReport(permittedReport(value, ctx), "html", true); break;
    case "grade-class-response": {
      const request = gradeClassRequests(state, ctx).find((item) => item.id === value);
      showDialog("grade-class-response", "Respond to Class Teacher", "Class " + request.className, classSupportResponseForm(request)); break;
    }
    case "grade-student": {
      const student = gradeAttendance(state, ctx).roster.find((item) => item.id === value), options = optionsFor(ctx);
      showDialog("chairman-grade-student", "Grade student attendance", "Sample records · Grade " + gradeScope(state, ctx).grade, sectionStudentPanel({ ...options, section: options.gradeCoordinator }, student, "grade-followup-new")); break;
    }
    case "grade-followup-new":
    case "grade-followup-edit": {
      const previous = name === "grade-followup-edit" ? gradeFollowups(state, ctx).find((item) => item.id === value) : null;
      const student = gradeAttendance(state, ctx).roster.find((item) => item.id === (previous?.student || value));
      showDialog("grade-followup", previous ? "Update grade follow-up" : "New grade attendance follow-up", "Grade " + gradeScope(state, ctx).grade, sectionFollowupForm(optionsFor(ctx), student, previous)); break;
    }
    case "grade-class-review": showDialog("grade-class-review", "Class coordination review", "Grade " + gradeScope(state, ctx).grade, gradeClassReviewForm(optionsFor(ctx), value)); break;
    case "grade-teacher": {
      const person = gradeTeachers(state, ctx, { date: ui.gradeCoordinator.date }).find((item) => item.id === value);
      showDialog("chairman-grade-teacher", "Grade teaching profile", "Workload within your appointed grade", sectionTeacherPanel(optionsFor(ctx), person)); break;
    }
    case "grade-support": showDialog("grade-support", "Request Section Head support", "Grade " + gradeScope(state, ctx).grade, gradeSupportRequestForm(optionsFor(ctx), value)); break;
    case "grade-open-class":
      ui.gradeCoordinator.className = value; ui.gradeCoordinator.flag = "all"; ui.gradeCoordinator.query = ""; ui.gradeCoordinator.page = 1;
      if (view.module === "attendance") render(); else location.hash = "coordinator/overview/attendance"; break;
    case "grade-page": ui.gradeCoordinator.page = Number(value); render(); break;
    case "grade-generate-report":
      try { if (captureGradeReport()) { render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); toast("Grade report saved."); } } catch (error) { toast(error.message); } break;
    case "grade-export":
      try { const report = captureGradeReport(value); if (report) downloadExecutiveReport(report); } catch (error) { toast(error.message); } break;
    case "grade-open-report": ui.gradeCoordinator.reportId = value; render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); break;
    case "grade-download-report": downloadExecutiveReport(permittedReport(value, ctx), ui.gradeCoordinator.reportFormat); break;
    case "grade-print-report": downloadExecutiveReport(permittedReport(value, ctx), "html", true); break;
    case "section-grade-response": {
      const request = sectionGradeRequests(state, ctx).find((item) => item.id === value);
      showDialog("section-grade-response", "Respond to Grade Coordinator", "Grade " + request.grade, gradeSupportResponseForm(request)); break;
    }
    case "section-student": {
      const student = sectionAttendance(state, ctx).roster.find((item) => item.id === value);
      showDialog("chairman-section-student", "Section student attendance", "Sample records · Your assigned school and section", sectionStudentPanel(optionsFor(ctx), student)); break;
    }
    case "section-followup-new":
    case "section-followup-edit": {
      const previous = name === "section-followup-edit" ? sectionFollowups(state, ctx).find((item) => item.id === value) : null;
      const student = sectionAttendance(state, ctx).roster.find((item) => item.id === (previous?.student || value));
      showDialog("section-followup", previous ? "Update section follow-up" : "New attendance follow-up", sectionScope(state, ctx).section.name, sectionFollowupForm(optionsFor(ctx), student, previous)); break;
    }
    case "section-teacher": {
      const teacher = sectionTeachers(state, ctx, { date: ui.section.date }).find((person) => person.id === value);
      showDialog("chairman-section-teacher", "Section teaching profile", "Workload within your section", sectionTeacherPanel(optionsFor(ctx), teacher)); break;
    }
    case "section-review": {
      const course = visibleCourses(state, ctx).find((item) => item.id === value);
      showDialog("section-review", "Review lecture materials", sectionScope(state, ctx).section.name, sectionReviewForm(optionsFor(ctx), course)); break;
    }
    case "section-request-cover": {
      const course = visibleCourses(state, ctx).find((item) => item.id === value);
      showDialog("section-cover-request", "Request temporary cover", "For Vice Principal coordination", sectionCoverRequestForm(course)); break;
    }
    case "section-attendance-class": ui.section.grade = value.slice(0, -1); ui.section.className = value; ui.section.page = 1; ui.section.flag = "all"; ui.section.query = ""; render(); break;
    case "section-page": ui.section.page = Number(value); render(); break;
    case "section-generate-report":
      try { if (captureSectionReport()) { render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); toast("Section report saved."); } } catch (error) { toast(error.message); } break;
    case "section-export":
      try { const report = captureSectionReport(value); if (report) downloadExecutiveReport(report); } catch (error) { toast(error.message); } break;
    case "section-open-report": ui.section.reportId = value; render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); break;
    case "section-download-report": downloadExecutiveReport(permittedReport(value, ctx), ui.section.reportFormat); break;
    case "section-print-report": downloadExecutiveReport(permittedReport(value, ctx), "html", true); break;
    case "vice-cover-request": {
      const request = incomingSectionCoverRequests(state, ctx).find((item) => item.id === value), branch = chairmanBranches(state, ctx)[0];
      showDialog("vice-cover", "Assign requested teaching cover", request.sectionName + " · " + request.reason, temporaryCoverForm(optionsFor(ctx), branch, request.course, request.id)); break;
    }
    case "vice-decline-cover-request": {
      const request = incomingSectionCoverRequests(state, ctx).find((item) => item.id === value);
      showDialog("vice-decline-cover", "Decline cover request", request.title + " · Class " + request.className, declineCoverRequestForm(request)); break;
    }
    case "vice-followups": {
      const branch = chairmanBranches(state, ctx)[0];
      showDialog("chairman-vice-board", "School follow-up board", "Owners, due dates and progress for your assigned school", viceFollowupBoard(optionsFor(ctx), branch));
      break;
    }
    case "vice-new-followup":
    case "vice-student-followup":
    case "vice-bus-followup":
    case "vice-edit-followup": {
      const branch = chairmanBranches(state, ctx)[0];
      const item = name === "vice-edit-followup" ? schoolFollowups(state, branch).find((item) => item.id === value) : null;
      const student = name === "vice-student-followup" ? chairmanPerson("student", value, ctx).person : null;
      const bus = name === "vice-bus-followup" ? networkFleet(state, [branch]).find((item) => item.id === value) : null;
      const category = student ? "attendance" : bus ? "transport" : name === "vice-new-followup" ? value : item?.category;
      const title = student ? "Attendance: " + student.name + " · " + student.admission : bus ? "Transport: BUS " + bus.label + " · " + bus.name : "";
      showDialog("vice-followup", item ? "Update school follow-up" : "New school follow-up", branch.school, viceFollowupForm(optionsFor(ctx), branch, item, category, title));
      break;
    }
    case "vice-cover": {
      const branch = chairmanBranches(state, ctx)[0];
      showDialog("vice-cover", "Assign temporary teaching cover", branch.school, temporaryCoverForm(optionsFor(ctx), branch, value));
      break;
    }
    case "vice-cancel-cover": {
      try {
        if (update((next) => cancelTemporaryCover(next, ctx, value), { branch: ctx.branch, category: "academic", message: "Temporary teaching cover cancelled." })) { render(); toast("Temporary cover cancelled."); }
      } catch (error) { toast(error.message); }
      break;
    }
    case "vice-leave-recommend": {
      const branch = chairmanBranches(state, ctx)[0], request = schoolLeaveRequests(state, branch).find((item) => item.id === value);
      showDialog("vice-leave", "Leave recommendation", "For Principal review · " + branch.name, leaveRecommendationForm(request));
      break;
    }
    case "principal-pulse": {
      const branch = chairmanBranches(state, ctx)[0];
      ui.chairman.date = demoDate;
      if (value === "attendance") { ui.chairman.audience = "students"; ui.chairman.attendanceFlag = "all"; ui.chairman.period = "day"; ui.chairman.attendanceGrade = "all"; ui.chairman.attendanceClass = "all"; ui.chairman.studentQuery = ""; ui.chairman.studentPage = 1; }
      if (value === "staffing") { ui.chairman.staffGroup = "teachers"; ui.chairman.staffStatus = "unavailable"; ui.chairman.staffingTab = "people"; ui.chairman.staffQuery = ""; ui.chairman.staffPage = 1; }
      if (value === "academic") {
        const weakest = schoolAcademicAttention(state, branch)[0];
        ui.network.subject = weakest.subjectId; ui.network.grade = weakest.grade; ui.network.term = 3;
        ui.chairman.academicClass = weakest.className; ui.chairman.academicCompare = "classes";
      }
      if (value === "transport") { ui.network.status = "delayed"; ui.pendingPulseTransport = view.module !== value; }
      if (view.module === value) render(); else location.hash = view.role + "/overview/" + value;
      break;
    }
    case "principal-class": ui.chairman.academicClass = value; render(); break;
    case "principal-subject": ui.network.subject = value; ui.chairman.academicCompare = "classes"; render(); break;
    case "principal-grade": ui.network.grade = Number(value); ui.chairman.academicClass = "all"; ui.chairman.academicCompare = "classes"; render(); break;
    case "principal-attendance-class":
      ui.chairman.attendanceGrade = value.slice(0, -1); ui.chairman.attendanceClass = value; ui.chairman.attendanceFlag = "all"; ui.chairman.studentPage = 1; render(); break;
    case "principal-course":
      ui.pendingCourse = value; closeDialog(); location.hash = view.role + "/courses"; break;
    case "principal-review-leave": {
      const [id, decision] = value.split("|"), branch = chairmanBranches(state, ctx)[0];
      const request = schoolLeaveRequests(state, branch).find((request) => request.id === id);
      if (update((next) => {
        next.principalLeaveReviews ??= {};
        next.principalLeaveReviews[id] = { decision, by: ctx.account.name, at: new Date().toISOString() };
      }, { branch: branch.id, category: "people", message: "Leave " + decision + " for " + request.name + "." })) { render(); toast("Leave request " + decision + "."); }
      break;
    }
    case "chairman-student":
    case "chairman-staff":
    case "chairman-vacancy": {
      const kind = name.slice(9), { person, branch } = chairmanPerson(kind, value, ctx);
      const content = kind === "student" ? chairmanStudentPanel(optionsFor(ctx), person, branch)
        : kind === "staff" ? chairmanStaffPanel(optionsFor(ctx), person, branch) : chairmanVacancyPanel(optionsFor(ctx), person);
      showDialog(name, kind === "vacancy" ? "Vacancy review" : kind === "staff" ? "Staff profile" : "Student attendance", "Sample data · " + branch.name, content);
      break;
    }
    case "chairman-review-vacancy": {
      const { person, branch } = chairmanPerson("vacancy", value, ctx);
      if (update((next) => {
        next.executiveReviews ??= {};
        if (next.executiveReviews[value]) delete next.executiveReviews[value]; else next.executiveReviews[value] = new Date().toISOString();
      }, { branch: branch.id, category: "people", message: person.subject + " vacancy review " + (person.reviewed ? "reopened." : "completed.") })) {
        render();
        showDialog("chairman-vacancy", "Vacancy review", "Sample data · " + branch.name, chairmanVacancyPanel(optionsFor(ctx), chairmanPerson("vacancy", value, ctx).person));
      }
      break;
    }
    case "chairman-manage-staff": if (ctx.role === "chairman") ui.branch = value; closeDialog(); location.hash = view.role + "/access"; break;
    case "chairman-staff-tab": ui.chairman.staffingTab = value; render(); break;
    case "chairman-page": {
      const [kind, page] = value.split("|"); ui.chairman[kind === "student" ? "studentPage" : "staffPage"] = Number(page); render(); break;
    }
    case "chairman-alert": {
      const [module, branch] = value.split("|"); if (ctx.role === "chairman") ui.branch = branch; ui.chairman.reportBranches = null;
      if (view.module === module) render(); else location.hash = view.role + "/overview/" + module;
      break;
    }
    case "chairman-report-all": ui.chairman.reportBranches = null; render(); break;
    case "chairman-report-none": ui.chairman.reportBranches = []; render(); break;
    case "chairman-generate-report": {
      try { if (captureExecutiveReport(ui.chairman.reportType, true)) { render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); toast("Sample report generated and saved."); } }
      catch (error) { toast(error.message); }
      break;
    }
    case "chairman-export": {
      try { const report = captureExecutiveReport(value); if (report) downloadExecutiveReport(report); }
      catch (error) { toast(error.message); }
      break;
    }
    case "chairman-open-report": ui.chairman.reportId = value; render(); app.querySelector(".chairman-report-result")?.scrollIntoView({ block: "start", behavior: "smooth" }); break;
    case "chairman-download-report": downloadExecutiveReport(permittedReport(value, ctx), ui.chairman.reportFormat); break;
    case "chairman-print-report": downloadExecutiveReport(permittedReport(value, ctx), "html", true); break;
    case "network-select": selectNetworkBranch(value, focus); break;
    case "network-bus": selectNetworkBus(value); break;
    case "network-fleet": ui.network.mode = "fleet"; ui.network.busBranch = "all"; render(); break;
    case "network-fleet-status": ui.network.status = value; render(); break;
    case "network-tab": if (isSchoolOperator(ctx) && value === "performance") location.hash = view.role + "/overview/academic"; else { ui.network.tab = value; render(); } break;
    case "network-performance":
      if (isSchoolOperator(ctx)) { location.hash = view.role + "/overview/academic"; break; }
      ui.network.mode = "comparison"; render();
      app.querySelector("#network-inspector-title")?.focus({ preventScroll: true });
      break;
    case "network-close": {
      const branch = ui.network.selected;
      ui.network.mode = ""; ui.network.selected = ""; ui.network.compare = null; ui.network.busId = ""; ui.network.resetMap = true; render("network-pin-" + branch); break;
    }
    case "network-all": ui.network.compare = null; render(); break;
    case "network-none": ui.network.compare = []; render(); break;
    case "network-activity": ui.network.category = value; render(); break;
    case "network-open":
      if (ctx.role === "chairman") ui.branch = value;
      location.hash = `${view.role}/courses`;
      break;
    case "parent-logout":
      ui.portal = {};
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
    case "assign": showDialog("assignment", "Assign subject", "Choose a teacher and enroll students.", assignmentForm(value, optionsFor())); break;
    case "open-course": ui.courseId = value; render("all-courses", { scrollTop: true }); break;
    case "close-course": ui.courseId = ""; render(undefined, { scrollTop: true }); break;
    case "add-material":
    case "edit-material": {
      const item = name === "edit-material" ? state.materials.find((material) => material.id === value) : null;
      const course = state.courses.find((course) => course.id === (item?.course || value));
      showDialog("material", item ? "Edit material" : "Add subject material", `${course.title} · ${course.className}`, materialForm(course, item || {})); break;
    }
    case "download": downloadMaterial(value); break;
    case "complete": {
      const child = childFor(ctx);
      const done = state.completed[child.id]?.includes(value);
      if (update((next) => { const list = next.completed[child.id] || []; next.completed[child.id] = done ? list.filter((id) => id !== value) : [...list, value]; }, { branch: child.branch, category: "academic", message: done ? "A lesson was marked incomplete." : "A lesson was marked complete." })) { render(focus); toast(done ? "Marked as incomplete." : "Marked as done."); }
      break;
    }
    case "edit-bus": showDialog("bus", "Manage bus assignment", "GPS tracker, route and student assignments.", busForm(state.buses.find((bus) => bus.id === value), state)); break;
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

      }, { branch: grant.branch, category: "people", message: "A staff role appointment was removed." })) { closeDialog(); render(); toast("Role removed."); } break;
    }
    case "branch-map": if (ctx.role === "chairman") ui.branch = value; location.hash = `${view.role}/transport`; break;
    case "edit-branch": showDialog("branch", "Edit school branch", "School branch details.", branchForm(state.branches.find((branch) => branch.id === value))); break;
    case "reset": confirmDialog("reset", "Reset the demo?", "Restore the sample roles, branches, bus assignments, subjects, stock and reservations.", "Reset demo", "confirm-reset"); break;
    case "confirm-reset":
      if (saveState(freshState())) {
        state = freshState(); Object.assign(ui, { portal: {}, accounts: {}, branch: "all", bus: "01", filter: "all", courseId: "", starts: {}, paused: false, runningSince: performance.now(), elapsed: 0 });
        ui.network = { subject: "mathematics", grade: 8, term: 3, selected: "", mode: "", compare: null, category: "all", tab: "transport", status: "all", busId: "", busBranch: "all" };
        ui.chairman = chairmanDefaults();
        parentSession = null;
        saveParentSession(null);
        closeDialog(); location.hash = "chairman/transport"; render(); toast("Demo reset.");
      } break;
    case "close-dialog": closeDialog(); break;
  }
}

function change(event) {
  const element = event.target;
  if (element.dataset.change?.startsWith("portal-")) { if (context()) portalChange(element.dataset.change, element, portalAPI(context())); return; }
  const name = element.dataset.change;
  const ctx = context();
  if (name === "academic-subject") { ui.academicSubject = element.value; render(); return; }
  if (!ctx) return;
  if (element.matches("[data-attendance-status]") && element.closest('[data-form="class-attendance"]')) {
    if (classScope(state, ctx) && can(ctx, "attendance.mark")) updateAttendanceDraft(element.form);
    return;
  }
  if (name?.startsWith("store-")) {
    const kind = element.dataset.kind, scope = storesScope(state, ctx, kind);
    if (!scope) return;
    if (name === "store-status" && ["all", "requested", "confirmed", "ready", "collected", "cancelled", "declined"].includes(element.value)) ui.stores[kind].status = element.value;
    else if (name === "store-grade" && scope.canManage && ["all", ...Array.from({ length: 13 }, (_, index) => String(index + 1))].includes(element.value)) ui.stores[kind].grade = element.value;
    else if (name === "store-report-type" && scope.canManage && Object.hasOwn(storeReportTypes, element.value)) ui.stores[kind].reportType = element.value;
    else return;
    render(); return;
  }
  if (name?.startsWith("nfc-")) {
    const scope = boardingScope(state, ctx);
    if (!scope) return;
    if (name === "nfc-bus" && scope.buses.some((bus) => bus.id === element.value)) { ui.boarding.busId = element.value; ui.boarding.tripId = ""; }
    else if (name === "nfc-trip" && visibleBoardingTrips(state, ctx).some((trip) => trip.id === element.value)) { const trip = visibleBoardingTrips(state, ctx).find((trip) => trip.id === element.value); ui.boarding.tripId = trip.id; ui.boarding.busId = trip.busId; }
    else if (name === "nfc-status" && ["all", "pending", "boarded", "unverified", "not_boarded", "excused"].includes(element.value)) ui.boarding.status = element.value;
    else return;
    ui.nfcFeedback = null; render(); return;
  }
  if (name?.startsWith("coordinator-")) {
    if (!coordinatorScope(state, ctx)) return;
    const rules = { "coordinator-status": ["status", ["all", "route", "school", "delayed"]], "coordinator-bus-filter": ["busFilter", ["all", ...coordinatorBuses(state, ctx).map((bus) => bus.id)]],
      "coordinator-allocation": ["allocation", Object.keys(allocationStatuses)], "coordinator-tracker-status": ["trackerStatus", Object.keys(trackerStatuses)], "coordinator-task-status": ["taskStatus", ["all", "open", "in_progress", "resolved"]],
      "coordinator-report-type": ["reportType", Object.keys(coordinatorReportTypes)], "coordinator-report-format": ["reportFormat", ["csv", "html"]] };
    if (!rules[name]?.[1].includes(element.value)) return;
    ui.transportCoordinator[rules[name][0]] = element.value;
    if (name === "coordinator-report-type") ui.transportCoordinator.query = "";
    ui.transportCoordinator = coordinatorFilters(state, ctx, ui.transportCoordinator); ui.transportCoordinator.page = 1; render(); return;
  }
  if (name?.startsWith("admin-")) {
    if (!adminScope(state, ctx)) return;
    const rules = { "admin-grade": ["grade", ["all", ...Array.from({ length: 14 }, (_, grade) => String(grade))]], "admin-class": ["className", ["all", ...adminClasses(state, ctx, ui.schoolAdmin.grade)]],
      "admin-student-status": ["studentStatus", Object.keys(adminStudentStatuses)], "admin-guardian-status": ["guardianStatus", Object.keys(adminGuardianStatuses)], "admin-course-status": ["courseStatus", Object.keys(adminCourseStatuses)],
      "admin-report-type": ["reportType", Object.keys(adminReportTypes)], "admin-report-format": ["reportFormat", ["csv", "html"]] };
    if (!rules[name]?.[1].includes(element.value)) return;
    ui.schoolAdmin[rules[name][0]] = element.value;
    if (name === "admin-grade") ui.schoolAdmin.className = "all";
    if (name === "admin-report-type") ui.schoolAdmin.query = "";
    ui.schoolAdmin = adminFilters(state, ctx, ui.schoolAdmin); ui.schoolAdmin.page = 1; ui.courseId = ""; render(); return;
  }
  if (name?.startsWith("subject-")) {
    if (!subjectScope(state, ctx)) return;
    const rules = { "subject-course": ["course", ["all", ...subjectScope(state, ctx).courses.map((course) => course.id)]],
      "subject-review-filter": ["review", ["all", "unreviewed", ...Object.keys(subjectReviewStatuses)]],
      "subject-plan-filter": ["planStatus", ["all", ...Object.keys(subjectPlanStatuses)]],
      "subject-report-type": ["reportType", Object.keys(subjectReportTypes)], "subject-report-format": ["reportFormat", ["csv", "html"]] };
    if (!rules[name]?.[1].includes(element.value)) return;
    ui.subjectTeacher[rules[name][0]] = element.value;
    ui.subjectTeacher = subjectFilters(state, ctx, ui.subjectTeacher); ui.courseId = ""; render(); return;
  }
  if (name?.startsWith("class-")) {
    if (!classScope(state, ctx)) return;
    const rules = { "class-term": ["term", ["1", "2", "3"]], "class-subject": ["subject", subjects.map((subject) => subject.id)],
      "class-period": ["period", ["day", "week", "month"]], "class-flag": ["flag", ["all", "repeated", "absent", "late"]],
      "class-report-type": ["reportType", Object.keys(classReportTypes)], "class-report-format": ["reportFormat", ["csv", "html"]] };
    if (name === "class-date") {
      const date = element.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2026-10-12" || date > demoDate || Number.isNaN(Date.parse(date + "T12:00Z")) || new Date(date + "T12:00Z").toISOString().slice(0, 10) !== date) { element.value = ui.classTeacher.date; return; }
      ui.classTeacher.date = date;
    } else if (rules[name]?.[1].includes(element.value)) ui.classTeacher[rules[name][0]] = element.value;
    else return;
    ui.classTeacher = classFilters(state, ctx, ui.classTeacher); ui.classTeacher.page = 1; ui.courseId = ""; render(); return;
  }
  if (name?.startsWith("grade-")) {
    const scope = gradeScope(state, ctx);
    if (!scope) return;
    const rules = {
      "grade-class": ["className", ["all", scope.grade + "A", scope.grade + "B"]], "grade-subject": ["subject", subjects.map((subject) => subject.id)],
      "grade-term": ["term", ["1", "2", "3"]], "grade-period": ["period", ["day", "week", "month"]],
      "grade-compare": ["compare", ["classes", "subjects", "teachers"]], "grade-flag": ["flag", ["all", "repeated", "absent", "late"]],
      "grade-report-type": ["reportType", Object.keys(gradeReportTypes)], "grade-report-format": ["reportFormat", ["csv", "html"]],
    };
    if (name === "grade-date") {
      const date = element.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2026-10-12" || date > demoDate || Number.isNaN(Date.parse(date + "T12:00Z")) || new Date(date + "T12:00Z").toISOString().slice(0, 10) !== date) { element.value = ui.gradeCoordinator.date; return; }
      ui.gradeCoordinator.date = date;
    } else if (rules[name]?.[1].includes(element.value)) ui.gradeCoordinator[rules[name][0]] = element.value;
    else return;
    ui.gradeCoordinator = gradeFilters(state, ctx, ui.gradeCoordinator); ui.gradeCoordinator.page = 1; ui.courseId = ""; render(); return;
  }
  if (name?.startsWith("section-")) {
    const scope = sectionScope(state, ctx);
    if (!scope) return;
    const rules = {
      "section-grade": ["grade", ["all", ...scope.grades.map(String)]], "section-class": ["className", ["all", ui.section.grade + "A", ui.section.grade + "B"]],
      "section-subject": ["subject", subjects.map((subject) => subject.id)], "section-term": ["term", ["1", "2", "3"]],
      "section-compare": ["compare", ["classes", "grades", "subjects", "teachers"]], "section-period": ["period", ["day", "week", "month"]],
      "section-flag": ["flag", ["all", "repeated", "absent", "late"]], "section-report-type": ["reportType", Object.keys(sectionReportTypes)],
      "section-report-format": ["reportFormat", ["csv", "html"]],
    };
    if (name === "section-date") {
      const date = element.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2026-10-12" || date > demoDate || Number.isNaN(Date.parse(date + "T12:00Z")) || new Date(date + "T12:00Z").toISOString().slice(0, 10) !== date) { element.value = ui.section.date; return; }
      ui.section.date = date;
    } else if (rules[name]?.[1].includes(element.value)) ui.section[rules[name][0]] = element.value;
    else return;
    if (name === "section-grade") ui.section.className = "all";
    ui.section = sectionFilters(state, ctx, ui.section); ui.section.page = 1; ui.courseId = ""; render(); return;
  }
  if (name === "vice-cover-course") {
    if (ctx.role !== "vice_principal") return;
    const branch = chairmanBranches(state, ctx)[0];
    const course = state.courses.find((item) => item.id === element.value && item.branch === branch.id);
    if (!course) return;
    const select = dialog.querySelector('[name="teacher"]');
    select.innerHTML = coverTeachers(state, branch).filter((person) => person.id !== state.assignments[course.id]?.teacher).map((person) => '<option value="' + e(person.id) + '">' + e(person.name + (person.sample ? " · Sample teacher" : "")) + '</option>').join("");
    return;
  }
  if (name?.startsWith("principal-")) {
    if (!isSchoolOperator(ctx)) return;
    if (name === "principal-academic-class" && (element.value === "all" || new RegExp("^" + ui.network.grade + "[AB]$").test(element.value))) ui.chairman.academicClass = element.value;
    else if (name === "principal-compare" && ["classes", "subjects", "grades", "teachers"].includes(element.value)) {
      ui.chairman.academicCompare = element.value;
      if (element.value === "grades") ui.chairman.academicClass = "all";
    } else if (name === "principal-attendance-class" && (element.value === "all" || new RegExp("^" + ui.chairman.attendanceGrade + "[AB]$").test(element.value))) ui.chairman.attendanceClass = element.value;
    else return;
    ui.chairman.studentPage = 1; render(); return;
  }
  if (name?.startsWith("chairman-")) {
    if (!isSchoolLeader(ctx)) return;
    if (name === "chairman-report-branch") {
      const branches = chairmanBranches(state, ctx);
      if (!branches.some((branch) => branch.id === element.value)) return;
      const selected = new Set(ui.chairman.reportBranches || branches.map((branch) => branch.id));
      if (element.checked) selected.add(element.value); else selected.delete(element.value);
      ui.chairman.reportBranches = [...selected]; render(); return;
    }
    const rules = {
      "chairman-period": ["period", ["day", "week", "month"]], "chairman-audience": ["audience", ["students", "staff"]],
      "chairman-grade": ["attendanceGrade", ["all", ...Array.from({ length: 13 }, (_, i) => String(i + 1))]],
      "chairman-staff-group": ["staffGroup", ["all", "leadership", "teachers", "support"]],
      "chairman-staff-status": ["staffStatus", ["all", "present", "absent", "leave", "unavailable"]],
      "chairman-attendance-flag": ["attendanceFlag", ["all", "repeated", "absent", "late"]],
      "chairman-attendance-sort": ["attendanceSort", ["rate", "lowest"]],
      "chairman-academic-sort": ["academicSort", ["average", "pass", "change"]],
      "chairman-report-type": ["reportType", Object.keys(reportTypes)],
      "chairman-report-period": ["reportPeriod", ["day", "week", "month"]],
      "chairman-report-format": ["reportFormat", ["csv", "html"]],
    };
    if (name === "chairman-date") {
      const date = element.value;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "2026-10-12" || date > demoDate || new Date(date + "T12:00Z").toISOString().slice(0, 10) !== date) { element.value = ui.chairman.date; return; }
      ui.chairman.date = date;
    } else if (rules[name]?.[1].includes(element.value)) ui.chairman[rules[name][0]] = element.value;
    else return;
    ui.chairman.staffPage = 1; ui.chairman.studentPage = 1;
    if (name === "chairman-grade") ui.chairman.attendanceClass = "all";
    render(); return;
  }
  switch (name) {
    case "network-fleet-branch":
      if (!["chairman", "principal", "vice_principal"].includes(ctx.role)) return;
      if (element.value === "all" || networkBranches(state, ctx, ui.network).some((branch) => branch.id === element.value)) {
        ui.network.busBranch = element.value; render();
      }
      break;
    case "network-map-branch":
      if (element.value) selectNetworkBranch(element.value);
      break;
    case "network-subject":
    case "network-grade":
    case "network-term":
      if (!["chairman", "principal", "vice_principal"].includes(ctx.role)) return;
      if (name === "network-subject" && subjects.some((subject) => subject.id === element.value)) ui.network.subject = element.value;
      if (name === "network-grade" && [6, 8, 10, 11].includes(Number(element.value))) { ui.network.grade = Number(element.value); ui.chairman.academicClass = "all"; }
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
      ui.portal = {};
      ui.stores = { books: storesDefaults(), uniforms: storesDefaults() }; ui.boarding = boardingDefaults(); ui.nfcFeedback = null; ui.transportCoordinator = coordinatorDefaults(); ui.schoolAdmin = adminDefaults(); ui.subjectTeacher = subjectDefaults(); ui.classTeacher = classDefaults(); ui.gradeCoordinator = gradeDefaults(); ui.section = sectionDefaults();
      ui.accounts[view.role] = element.value; ui.courseId = ""; ui.academicSubject = "all"; ui.filter = "all"; ui.chairman = chairmanDefaults();
      if (isSchoolOperator(ctx)) ui.chairman.attendanceFlag = "all";
      ui.network.selected = ""; ui.network.mode = ""; ui.network.busId = ""; ui.network.compare = null; ui.network.status = "all"; ui.network.busBranch = "all"; ui.network.mapFocus = null; schoolMapKey = null;
      closeDialog(); render(); break;
    case "branch":
      ui.portal = {};
      ui.stores = { books: storesDefaults(), uniforms: storesDefaults() }; ui.boarding = boardingDefaults(); ui.nfcFeedback = null;
      if (ctx.role !== "chairman") return;
      ui.branch = element.value; ui.courseId = ""; ui.filter = "all";
      ui.chairman.reportBranches = null; ui.chairman.staffPage = 1; ui.chairman.studentPage = 1; ui.chairman.branchId = "";
      if (element.value !== "all") ui.network.selected = element.value;
      closeDialog(); render(); break;
    case "child":
      if (!linkedChildren(state, ctx).some((child) => child.id === element.value)) return;
      selectFamilyChild(element.value); ui.courseId = ""; render("child-select"); break;
    case "filter": filterBuses(element.value, element.dataset.focus); break;
    case "assignment-course":
      if (!can(ctx, "courses.assign")) return;
      showDialog("assignment", "Assign subject", "Choose a teacher and enroll students.", assignmentForm(element.value, optionsFor())); break;
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
    ui.portal = {};
    ui.stores = { books: storesDefaults(), uniforms: storesDefaults() };
    ui.courseId = "";
    closeDialog();
    location.hash = "parent/family";
    render(undefined, { scrollTop: true });
    return;
  }
  const ctx = context();
  if (mode.startsWith("portal-")) { if (ctx) portalSubmit(mode, form, portalAPI(ctx)); return; }
  const id = values.get("id");
  const options = optionsFor(ctx);
  const allowedBranch = (branch) => state.branches.some((item) => item.id === branch) && (ctx.branch === "all" || ctx.branch === branch);
  const fail = (message = "This change is outside your assigned scope.") => showError(form, message);
  if (["academic-subjects", "academic-notice", "academic-homework"].includes(mode)) {
    const input = { ...Object.fromEntries(values), subjects: values.getAll("subjects") }, saveAction = { "academic-subjects": assignStudentSubjects, "academic-notice": saveClassNotice, "academic-homework": saveHomework }[mode];
    const message = mode === "academic-subjects" ? "Student subjects updated." : mode === "academic-notice" ? "Class notice saved in parent portals." : "Homework saved for this subject and class.";
    try { if (update((next) => saveAction(next, ctx, input), { branch: ctx.branch, category: "academic", message })) { closeDialog(); render(); toast(message); } } catch (error) { fail(error.message); }
    return;
  }


  if (["store-add", "store-process", "store-stock"].includes(mode)) {
    const input = Object.fromEntries(values), scope = storesScope(state, ctx, input.kind);
    if (!scope || mode === "store-add" && !scope.parent || mode !== "store-add" && !scope.canManage) return fail();
    const save = mode === "store-add" ? saveBagItem : mode === "store-process" ? updateStoreReservation : saveStoreStock;
    try { if (update((next) => save(next, ctx, input))) { if (mode !== "store-add") closeDialog(); render(); toast(mode === "store-add" ? "Reservation list updated." : "Store record saved."); } } catch (error) { fail(error.message); }
    return;
  }
  if (mode === "book") return fail("The earlier book-order form is no longer available.");
  if (["nfc-create-trip", "nfc-issue-card", "nfc-disable-card", "nfc-tap", "nfc-correct", "nfc-flag"].includes(mode)) {
    if (!boardingScope(state, ctx)) return fail();
    const saveAction = { "nfc-create-trip": createBoardingTrip, "nfc-issue-card": issueBoardingCard, "nfc-disable-card": disableBoardingCard, "nfc-tap": simulateBoardingTap, "nfc-correct": correctBoardingRecord, "nfc-flag": flagBoardingException }[mode];
    let result;
    try {
      if (update((next) => { result = saveAction(next, ctx, Object.fromEntries(values)); })) {
        if (mode === "nfc-create-trip") { ui.boarding.busId = result.busId; ui.boarding.tripId = result.id; ui.boarding.status = "all"; ui.boarding.query = ""; }
        if (mode === "nfc-tap") ui.nfcFeedback = { ...result, tripId: values.get("tripId") };
        else { closeDialog(); ui.nfcFeedback = null; }
        render(); if (mode !== "nfc-tap") toast("NFC demo record saved.");
      }
    } catch (error) { fail(error.message); }
    return;
  }
  if (["coordinator-task", "coordinator-allocation"].includes(mode)) {
    const scope = coordinatorScope(state, ctx);
    if (!scope) return fail();
    const saveAction = mode === "coordinator-task" ? saveCoordinatorTask : saveCoordinatorAllocation;
    const message = mode === "coordinator-task" ? "Transport follow-up updated for school coordination." : "School bus allocation updated.";
    try { if (update((next) => saveAction(next, ctx, Object.fromEntries(values)), { branch: scope.branch.id, category: "transport", message })) { closeDialog(); render(); toast(message); } } catch (error) { fail(error.message); }
    return;
  }
  if (["subject-plan", "subject-review", "subject-support"].includes(mode)) {
    const scope = subjectScope(state, ctx);
    if (!scope) return fail();
    const saveAction = { "subject-plan": saveSubjectPlan, "subject-review": saveSubjectReview, "subject-support": requestSubjectSupport }[mode];
    const message = mode === "subject-plan" ? "Lesson plan saved." : mode === "subject-review" ? "Internal learning review saved." : "Teaching request recorded for the Grade Coordinator.";
    try { if (update((next) => saveAction(next, ctx, Object.fromEntries(values)), { branch: scope.branch.id, category: "academic", message })) { closeDialog(); render(); toast(message); } } catch (error) { fail(error.message); }
    return;
  }
  if (["class-attendance", "class-followup", "class-discussion", "class-support"].includes(mode)) {
    const scope = classScope(state, ctx);
    if (!scope) return fail();
    const saveAction = { "class-attendance": saveClassAttendance, "class-followup": saveClassFollowup, "class-discussion": saveClassDiscussion, "class-support": requestClassSupport }[mode];
    const input = Object.fromEntries(values);
    if (mode === "class-attendance") input.entries = values.getAll("student").map((student) => ({ student, status: values.get("status_" + student) }));
    const message = mode === "class-attendance" ? "Class attendance saved and leadership totals updated." : mode === "class-followup" ? "Class attendance follow-up saved." : mode === "class-discussion" ? "Private class discussion record saved." : "Support request recorded for the Grade Coordinator.";
    try { if (update((next) => saveAction(next, ctx, input), { branch: scope.branch.id, grade: scope.grade, className: scope.className, category: mode === "class-support" ? "academic" : "people", message })) { closeDialog(); render(); toast(message); } } catch (error) { fail(error.message); }
    return;
  }
  if (["grade-followup", "grade-class-review", "grade-support", "grade-class-response", "grade-subject-response"].includes(mode)) {
    const scope = gradeScope(state, ctx);
    if (!scope) return fail();
    const saveAction = { "grade-followup": saveGradeFollowup, "grade-class-review": saveGradeClassUpdate, "grade-support": requestGradeSupport, "grade-class-response": respondClassSupport, "grade-subject-response": respondSubjectSupport }[mode];
    const message = mode === "grade-subject-response" ? "Response saved for the Subject Teacher." : mode === "grade-class-response" ? "Response saved for the Class Teacher." : mode === "grade-followup" ? "Grade attendance follow-up saved." : mode === "grade-class-review" ? "Class coordination review saved." : "Support request recorded for the Section Head.";
    try { if (update((next) => saveAction(next, ctx, Object.fromEntries(values)), { branch: scope.branch.id, grade: scope.grade, category: mode === "grade-followup" ? "people" : "academic", message })) { closeDialog(); render(); toast(message); } } catch (error) { fail(error.message); }
    return;
  }
  if (["section-followup", "section-review", "section-cover-request", "section-grade-response"].includes(mode)) {
    if (!sectionScope(state, ctx)) return fail();
    const saveAction = { "section-followup": saveSectionFollowup, "section-review": saveSectionCourseReview, "section-cover-request": requestSectionCover, "section-grade-response": respondGradeSupport }[mode];
    const message = mode === "section-grade-response" ? "Response saved for the Grade Coordinator." : mode === "section-followup" ? "Section attendance follow-up saved." : mode === "section-review" ? "Material review saved for the teacher." : "Cover request recorded for the Vice Principal.";
    try { if (update((next) => saveAction(next, ctx, Object.fromEntries(values)), { branch: ctx.grant.branch, section: ctx.grant.section, category: mode === "section-followup" ? "people" : "academic", message })) { closeDialog(); render(); toast(message); } }
    catch (error) { fail(error.message); }
    return;
  }
  if (["vice-followup", "vice-cover", "vice-leave", "vice-decline-cover"].includes(mode)) {
    if (ctx?.role !== "vice_principal") return fail();
    const input = Object.fromEntries(values);
    const saveAction = { "vice-followup": saveSchoolFollowup, "vice-cover": saveTemporaryCover, "vice-leave": saveLeaveRecommendation, "vice-decline-cover": declineSectionCoverRequest }[mode];
    const category = ["vice-cover", "vice-decline-cover"].includes(mode) ? "academic" : mode === "vice-leave" ? "people" : Object.hasOwn(followupCategories, input.category) ? input.category : "people";
    const message = mode === "vice-decline-cover" ? "Section cover request declined." : mode === "vice-cover" ? "Temporary teaching cover assigned." : mode === "vice-leave" ? "Leave recommendation recorded for Principal review." : "School follow-up updated.";
    try {
      if (update((next) => saveAction(next, ctx, input), { branch: ctx.grant.branch, category, message })) { closeDialog(); render(); toast(message); }
    } catch (error) { fail(error.message); }
    return;
  }

  const formActivity = {
    assignment: ["academic", "Subject assignments updated.", state.courses.find((course) => course.id === values.get("course"))?.branch],
    material: ["academic", id ? "Subject material updated." : "New subject material published.", state.courses.find((course) => course.id === values.get("course"))?.branch],
    student: ["people", id ? "Student record updated." : "New student added.", state.students.find((student) => student.id === id)?.branch || values.get("branch")],
    bus: ["transport", "Bus route and student assignments updated.", state.buses.find((bus) => bus.id === id)?.branch],
    branch: ["people", "School branch details updated.", id],
    role: ["people", "Staff role assignment updated.", values.get("branch")],
  }[mode];
  const save = (mutator) => update(mutator, formActivity ? { category: formActivity[0], message: formActivity[1], branch: formActivity[2] } : undefined);


  if (mode === "assignment") {
    try { if (!save((next) => saveCourseAssignment(next, ctx, { course: values.get("course"), teacher: values.get("teacher"), students: values.getAll("students") }))) return; }
    catch (error) { return fail(error.message); }
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
    try { if (!save((next) => saveStudentRecord(next, ctx, { ...Object.fromEntries(values), guardians: values.getAll("guardians") }))) return; }
    catch (error) { return fail(error.message); }
  } else if (mode === "bus") {
    try { if (!save((next) => saveBusAssignment(next, ctx, { ...Object.fromEntries(values), stops: values.getAll("stops"), students: values.getAll("students") }))) return; }
    catch (error) { return fail(error.message); }
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
    if (person?.grants.some((item) => Object.entries(grant).every(([key, value]) => item[key] === value))) return fail("This person already has that role and scope.");
    if (!save((next) => {
      const personId = newPerson ? "person-" + crypto.randomUUID() : person.id;
      if (newPerson) next.accounts.push({ id: personId, name, initials: name.split(" ").map((word) => word[0]).slice(0, 2).join(""), grants: [], tone: "green" });
      const account = next.accounts.find((item) => item.id === personId);
      if (role === "principal") for (const item of next.accounts) item.grants = item.grants.filter((entry) => !(entry.role === "principal" && entry.branch === branch));
      account.grants.push(grant);
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
  const key = event.target.dataset.change;
  if (key === "class-attendance-search" && dialogMode === "class-attendance" && classScope(state, context())) {
    filterAttendanceDraft(event.target); return;
  }
  if (key === "store-query") {
    const kind = event.target.dataset.kind;
    if (storesScope(state, context(), kind)) { ui.stores[kind].query = event.target.value.slice(0, 80); render("store-search"); }
    return;
  }
  if (key === "nfc-query" && boardingScope(state, context())) { ui.boarding.query = event.target.value.slice(0, 80); render("nfc-search"); return; }
  if (context()?.role === "transport" && key === "coordinator-query") {
    ui.transportCoordinator.query = event.target.value.slice(0, 80); ui.transportCoordinator.page = 1; render("coordinator-search"); return;
  }
  if (context()?.role === "admin" && key === "admin-query") {
    ui.schoolAdmin.query = event.target.value.slice(0, 80); ui.schoolAdmin.page = 1; render("admin-search"); return;
  }
  if (context()?.role === "teacher" && key === "subject-query") {
    ui.subjectTeacher.query = event.target.value.slice(0, 80); render("subject-search"); return;
  }
  if (context()?.role === "class_teacher" && key === "class-query") {
    ui.classTeacher.query = event.target.value.slice(0, 80); ui.classTeacher.page = 1; render("class-search"); return;
  }
  if (context()?.role === "coordinator" && key === "grade-query") {
    ui.gradeCoordinator.query = event.target.value.slice(0, 80); ui.gradeCoordinator.page = 1; render("grade-search"); return;
  }
  if (context()?.role === "section_head" && ["section-query", "section-teacher-query"].includes(key)) {
    ui.section[key === "section-query" ? "query" : "teacherQuery"] = event.target.value.slice(0, 80); ui.section.page = 1;
    render(key === "section-query" ? "section-search" : "section-teacher-search"); return;
  }
  if (isSchoolLeader(context()) && ["chairman-staff-search", "chairman-student-search"].includes(key)) {
    ui.chairman[key === "chairman-staff-search" ? "staffQuery" : "studentQuery"] = event.target.value.slice(0, 80);
    ui.chairman.staffPage = 1; ui.chairman.studentPage = 1; render(key);
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target.matches('[data-change="class-attendance-search"]')) { event.preventDefault(); return; }
  if (event.key === "Escape" && !dialog.open) {
    const menu = app.querySelector(".role-picker[open]");
    if (menu) { menu.open = false; menu.querySelector("summary").focus(); }
    else if (view.page === "overview" && ui.network.mode) {
      const branch = ui.network.selected;
      ui.network.mode = ""; ui.network.selected = ""; ui.network.compare = null; ui.network.busId = ""; ui.network.resetMap = true; render("network-pin-" + branch);
    }
  }
});
dialog.addEventListener("click", (event) => { if (event.target === dialog) closeDialog(); });
window.addEventListener("hashchange", () => {
  const previous = view;
  view = getView();
  if (previous.role !== view.role || previous.page !== view.page) { ui.courseId = ""; ui.academicSubject = "all"; ui.filter = "all"; }
  if (view.page === "overview" && (previous.role !== view.role || previous.page !== view.page || previous.module !== view.module)) {
    ui.network.selected = ""; ui.network.mode = ""; ui.network.compare = null; ui.network.busId = ""; ui.network.status = "all"; schoolMapKey = null;
  }
  if (previous.role !== view.role) { ui.portal = {}; ui.stores = { books: storesDefaults(), uniforms: storesDefaults() }; ui.boarding = boardingDefaults(); ui.nfcFeedback = null; ui.transportCoordinator = coordinatorDefaults(); ui.schoolAdmin = adminDefaults(); ui.subjectTeacher = subjectDefaults(); ui.classTeacher = classDefaults(); ui.gradeCoordinator = gradeDefaults(); ui.section = sectionDefaults(); ui.chairman = chairmanDefaults(); if (["principal", "vice_principal"].includes(view.role)) ui.chairman.attendanceFlag = "all"; }
  if (["section_head", "coordinator", "class_teacher", "teacher", "admin"].includes(view.role) && previous.module !== view.module) ui.courseId = "";
  if (view.role === "transport" && previous.module !== view.module) { ui.transportCoordinator.query = ""; ui.transportCoordinator.page = 1; }
  if (["librarian", "uniform_store"].includes(view.role) && previous.module !== view.module) { ui.stores[view.role === "librarian" ? "books" : "uniforms"].query = ""; ui.stores[view.role === "librarian" ? "books" : "uniforms"].status = "all"; }
  if (view.role === "admin" && previous.module !== view.module) { ui.schoolAdmin.query = ""; ui.schoolAdmin.page = 1; }
  if (ui.pendingPulseTransport && view.module === "transport") { ui.network.status = "delayed"; }
  ui.pendingPulseTransport = false;
  if (ui.pendingCourse && view.page === "courses") {
    if (visibleCourses(state, context()).some((course) => course.id === ui.pendingCourse)) ui.courseId = ui.pendingCourse;
    ui.pendingCourse = "";
  }
  closeDialog();
  render(undefined, { scrollTop: true });
});
window.addEventListener("storage", (event) => {
  if (event.key === "campusway-demo-v1") { state = loadState(); closeDialog(); render(); }
});
render();


let privacyClockKey = transportNow(state).date + transportNow(state).time;
setInterval(() => { const clock = transportNow(state), key = clock.date + clock.time; if (key !== privacyClockKey) { privacyClockKey = key; render(); } }, 15000);
