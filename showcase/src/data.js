import { branchDirectory } from '../../dist/network-data.js';
import { islandPolygons } from '../../dist/sri-lanka-land.js';
export { islandPolygons };
export const branches = branchDirectory.map(({ id, name, school, lat, lon }, directoryIndex) => ({ id, name, school, lat, lon, directoryIndex }));
export const chapters = [
  { id: 'network', label: 'Connected transport', scene: 'map', title: ['Every bus.', 'Every branch.', 'One clear view.'], accent: 2, note: 'Introduce transport across the 20-school network. The Chairman sees all branches or selected schools on the Sri Lanka map; school management sees only its assigned school. Select a branch, then open the actual Chairman or Principal transport screen. Branch coordinates are approximate and the routes and vehicles are illustrative, not a claim about the current Sussex fleet.' },
  { id: 'tracker', label: 'The GPS connection', scene: 'tracker', title: ['On the bus.', 'Always connected.'], accent: 1, note: 'A bus-mounted GPS tracker sends location over its mobile-data connection to the system, independently of a driver phone or login. The intended device feed runs 24/7. Match each tracker to its bus and school. Explain last-known location and signal loss without presenting stale data as live. Try the signal interruption and recovery. The prototype simulates this feed; hardware, SIM coverage, telemetry ingestion and monitoring must be connected and tested in the pilot.' },
  { id: 'journey', label: 'The parent journey', scene: 'bus', title: ['Their bus.', 'In your hands.'], accent: 1, note: 'One family account lists all linked children. Select the intended child to see only their allocated bus, route and stops during the school viewing window. Show the actual mobile Parent transport screen and boarding status, then advance the illustrative Nugegoda Bus 01 route. This is a route-progress illustration, not a verified ETA calculation. Choosing another school on the introduction does not invent a route for that school.' },
  { id: 'privacy', label: 'The right visibility', scene: 'bus', title: ['24-hour oversight.', 'School-time sharing.'], accent: 1, note: 'GPS reporting continues 24/7. Chairman sees buses across selected branches; Principal, Vice Principal, School Administrator and Transport Coordinator see only their appointed school, including after hours. Parents see only their selected child’s bus during the Transport Coordinator’s school weekday pickup/drop-off windows. Defaults: 06:00–08:30 and 13:00–16:00 Asia/Colombo. Try 07:15, 14:30, 18:00, the weekend and a completed Parent trip. Hidden Parent views contain no route, marker or coordinates. Alerts remain accessible. Parents cannot change these rules; Class Teachers receive scoped alerts rather than full fleet-map access.' },
  { id: 'alerts', label: 'Keep everyone informed', scene: 'bus', title: ['A delay.', 'An update.', 'Everyone informed.'], accent: 2, note: 'Transport Coordinator selects the affected bus and sends Late, Breakdown, Other issue or Resolved updates. Allocated families and current Class Teachers of those students receive in-portal notifications. An affected student/class scope is used, not a network-wide message. Show both actual inboxes and try the alert flow. Alerts remain readable outside Parent GPS hours. This presentation does not send messages; SMS, email, push delivery and automatic incident detection are separate production integrations.' },
  { id: 'boarding', label: 'Every boarding recorded', scene: 'nfc', title: ['Tap the card.', 'Know who boarded.'], accent: 1, note: 'School staff issue a transport NFC card linked to a student; a bus-mounted reader records boarding against the bus/date/direction roster. Show the staff roster, Parent status and card management. Tap, repeat, go offline, reconnect and sync. Unknown, inactive or wrong-bus cards need review. Closing pickup with no confirmed tap means Needs review, never automatic classroom absence. Coordinators record reasoned corrections and export manifests. NFC closure does not stop the 24/7 GPS feed or itself close Parent GPS visibility. The hardware reader is not yet connected.' },
  { id: 'operations', label: 'Transport control', scene: 'map', title: ['Routes aligned.', 'Issues followed.', 'Decisions clear.'], accent: 2, note: 'The Transport Coordinator works inside one school: fleet activity, routes/stops, tracker and student allocations, issues/follow-ups and transport reports. Demonstrate GPS signal status, route membership and student/bus allocation, the issue board and scoped CSV/HTML/print reports. Vice Principal supports school follow-ups. Private coordination notes are separate from Parent alerts. There is no Driver account, dispatch workflow or manual driver trip start. Show actual workspaces rather than claiming automatic route optimisation or predictive analytics.' },
  { id: 'pilot', label: 'Start with one bus', scene: 'bus', title: ['One school.', 'One bus.', 'Ready to begin.'], accent: 2, note: 'Agree one school, one bus, a small student-card group and named school owners. Install a compatible GPS tracker, mobile-data SIM and NFC reader; validate real routes, signal loss/recovery, offline tap sync, duplicates/exceptions, Parent time windows, notification recipients and management scope. Train staff and families, review accuracy and usability, then expand. Open Pilot plan for the stages. The full System map remains available with every role and capability unchanged. The transport presentation does not remove academic, fee or collection functionality from the LMS.' },
];
export function prototypeBaseFor(href) {
  const page = new URL(href);
  if (page.pathname.endsWith('/showcase')) page.pathname += '/';
  return new URL('../', page).href;
}
// Retain the current host and project prefix, including GitHub Pages subpaths.
export const prototypeBase = prototypeBaseFor(globalThis.location?.href || 'http://localhost/showcase/');
export const roleTours = [
  { id: 'chairman', label: 'Chairman', category: 'Leadership', scope: 'All 20 branches or a selected school', icon: 'network', route: 'chairman/overview/transport', tour: ['See network transport activity', 'Compare sample Mathematics results', 'Open an executive report'], detail: 'Transport, academic performance, attendance, staffing and executive reports across the school network.' },
  { id: 'principal', label: 'Principal', category: 'Leadership', scope: 'The assigned school', icon: 'school', route: 'principal/overview/transport', tour: ['Inspect the school’s transport', 'Review attendance and staffing', 'Coordinate school operations'], detail: 'School oversight, staff appointments and school-level coordination within the assigned branch.' },
  { id: 'vice_principal', label: 'Vice Principal', category: 'Leadership', scope: 'Daily coordination in the assigned school', icon: 'users', route: 'vice_principal/overview/transport', detail: 'Follow-ups, temporary teaching cover, recommendations and daily school operations.' },
  { id: 'section_head', label: 'Section Head', category: 'Academic', scope: 'One section in the appointed school', icon: 'book', route: 'section_head/overview/summary', detail: 'Section subjects, attendance, teaching coordination, support requests and reports.' },
  { id: 'coordinator', label: 'Grade Coordinator', category: 'Academic', scope: 'The appointed grade and school', icon: 'users', route: 'coordinator/overview/summary', detail: 'Grade overview, class coordination, subject enrolment and support requests.' },
  { id: 'class_teacher', label: 'Class Teacher', category: 'Academic', scope: 'The appointed class', icon: 'check', route: 'class_teacher/overview/summary', detail: 'Select subjects per student, publish common class notices, give homework and mark class attendance.' },
  { id: 'teacher', label: 'Subject Teacher', category: 'Academic', scope: 'Assigned subjects and enrolled pupils', icon: 'book', route: 'teacher/overview/summary', detail: 'Manage separate classes for a subject; publish lecture materials and homework, plan lessons and review learning.' },
  { id: 'admin', label: 'School Administrator', category: 'Operations', scope: 'Actual records in the appointed school', icon: 'school', route: 'admin/overview/summary', detail: 'Admissions, guardian links, subject assignments and student transport-card administration.' },
  { id: 'transport', label: 'Transport Coordinator', category: 'Operations', scope: 'The school’s operational fleet', icon: 'bus', route: 'transport/overview/fleet', detail: 'Bus/GPS tracker and student allocations, route coordination, NFC roster review and transport reports.' },
  { id: 'librarian', label: 'Book Store Officer', category: 'Operations', scope: 'The school’s pupil-book reservations', icon: 'book', route: 'librarian/overview/summary', detail: 'Confirm stock, prepare pupil’s books for collection and record handover at the school.' },
  { id: 'uniform_store', label: 'Uniform Store Officer', category: 'Operations', scope: 'The school’s uniform reservations', icon: 'shirt', route: 'uniform_store/overview/summary', detail: 'Manage sizes and stock, prepare confirmed requests and record uniform collection.' },
  { id: 'parent', label: 'Parent', category: 'Family', scope: 'All children linked to this guardian', icon: 'phone', route: 'parent/login', tour: ['Open the family dashboard', 'Review events and give consent', 'Pay school fees in the demo'], detail: 'All linked children, transport alerts, consent, demo fee payments, subjects, homework and school collection.' },
];
export const stops = ['Nugegoda Junction', 'Nawala Junction', 'Rajagiriya', 'School'];
export const initialDemo = { branchId: 'colombo', journey: 0.28, signal: true, audience: 'parent', time: '07:15', weekday: true, tripClosed: false, issue: 'late', alert: '', boarding: 'pending', offline: false, queued: false, tapMessage: '', operation: 'fleet' };
export function parentLocationVisible(state) {
  if (!state.weekday || state.tripClosed) return false;
  const minute = Number(state.time.slice(0,2)) * 60 + Number(state.time.slice(3));
  return (minute >= 360 && minute <= 510) || (minute >= 780 && minute <= 960);
}
export function locationVisible(state) { return state.audience === 'management' || parentLocationVisible(state); }
export const alertLabels = { late: 'Bus running late', breakdown: 'Bus breakdown', other: 'Transport update', resolved: 'Issue resolved' };
export function demoReducer(state, action) {
  switch (action.type) {
    case 'branch': return branches.some(branch => branch.id === action.id) ? { ...state, branchId: action.id } : state;
    case 'advance': return { ...state, journey: Math.min(1, state.journey + 0.24) };
    case 'restart-journey': return { ...state, journey: 0.04 };
    case 'signal': return { ...state, signal: !state.signal };
    case 'audience': return ['parent','management'].includes(action.value) ? { ...state, audience: action.value } : state;
    case 'time': return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(action.value) ? { ...state, time: action.value } : state;
    case 'weekday': return { ...state, weekday: !state.weekday };
    case 'trip-closed': return { ...state, tripClosed: !state.tripClosed };
    case 'issue': return Object.hasOwn(alertLabels,action.value) ? { ...state, issue: action.value } : state;
    case 'notify': return { ...state, alert: state.issue };
    case 'operation': return ['fleet','routes','allocations','issues','reports'].includes(action.value) ? { ...state, operation: action.value } : state;
    case 'reader': return { ...state, offline: !state.offline, tapMessage: state.offline ? 'Reader reconnected. Sync queued taps to confirm boarding.' : 'Reader offline. New taps will be queued.' };
    case 'tap':
      if (state.offline) return { ...state, queued: true, tapMessage: 'Tap captured offline. Boarding is not confirmed until sync.' };
      if (state.boarding === 'boarded') return { ...state, tapMessage: 'Already boarded. Repeated tap ignored.' };
      return { ...state, boarding: 'boarded', tapMessage: 'Amaya’s boarding recorded. Parent status: Boarded.' };
    case 'sync': return state.offline ? { ...state, tapMessage: 'Reconnect the reader before syncing.' } : state.queued ? { ...state, queued: false, boarding: 'boarded', tapMessage: 'Queued tap synced once. Boarding confirmed.' } : { ...state, tapMessage: 'Reader is up to date. No queued taps.' };
    case 'missed': return { ...state, boarding: state.boarding === 'boarded' ? 'boarded' : 'review', tapMessage: state.boarding === 'boarded' ? 'Confirmed boarding retained.' : 'Pickup closed without a confirmed tap. Needs review by the Transport Coordinator.' };
    case 'reset-boarding': return { ...state, boarding: 'pending', queued: false, offline: false, tapMessage: '' };
    case 'reset': return { ...initialDemo };
    default: return state;
  }
}
export function chapterFromHash(hash) { const index = chapters.findIndex(chapter => chapter.id === String(hash).replace(/^#/, '')); return index < 0 ? 0 : index; }
export function prototypeURL(roleId) { const role = roleTours.find(role => role.id === roleId); return role ? prototypeBase + '#' + role.route : prototypeBase; }
export const chapterScene = index => chapters[index]?.scene || 'map';
