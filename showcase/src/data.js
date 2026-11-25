import { branchDirectory } from '../../dist/network-data.js';
import { islandPolygons } from '../../dist/sri-lanka-land.js';
import { rankedResults } from '../../dist/network-analytics.js';
export { islandPolygons };
export const branches = branchDirectory.map(({ id, name, school, lat, lon }, directoryIndex) => ({ id, name, school, lat, lon, directoryIndex }));
export const chapters = [
  { id: 'network', label: 'The network', kicker: 'ONE CONNECTED SCHOOL DAY', title: ['One network.', 'Every school day,', 'connected.'], accent: 2, description: 'From the first pickup to the final lesson. A shared view of transport, learning and school life for Sussex College Network.', note: 'Open with the network: 20 schools, one shared product, access shaped around each person’s responsibility. Select a branch, then follow a school day.', time: '1 min' },
  { id: 'journey', label: 'The journey', kicker: '07:00 AM · THE SCHOOL JOURNEY', title: ['A clearer journey.', 'For every family.'], accent: 1, description: 'Follow the assigned bus, see its next stop and give the school transport team the same picture.', note: 'Transport is the centre of this proposal. Move the bus along the route and show the parent view. Try a delayed signal: the last update remains visible rather than pretending the position is live.', time: '2 min' },
  { id: 'boarding', label: 'The tap', kicker: '07:20 AM · STUDENT BOARDING', title: ['One small tap.', 'A recorded arrival', 'on the bus.'], accent: 1, description: 'Connect each student’s card to the trip roster. Give parents a clear boarding status and staff a way to review exceptions.', note: 'Tap the sample card. Repeat it to show duplicate handling. Switch the reader offline, tap and reconnect. A missed scan means Needs review, never automatic absence. Physical NFC hardware remains a future integration.', time: '2 min' },
  { id: 'learning', label: 'The classroom', kicker: '08:00 AM · LEARNING CONTINUES', title: ['School and home.', 'On the same page.'], accent: 1, description: 'Class Teachers select student subjects and share class notices. Teachers give class-specific homework and lecture notes.', note: 'Begin with the admission-selected parent and student identity. Show only Class Teacher-selected subjects, separate homework and common class notices. Subject Teachers manage each teaching class separately. In Try demo, change Science 8A/8B, publish notes/homework, select Amaya’s subjects, publish a class notice and mark attendance. Completion does not create assessment marks.', time: '1 min' },
  { id: 'leadership', label: 'The bigger picture', kicker: '10:00 AM · SCHOOL LEADERSHIP', title: ['Every branch.', 'A clearer picture.'], accent: 1, description: 'Move from the whole network to one school. Explore sample academic results alongside the people and operations behind them.', note: 'Switch between Mathematics, Science and English. The comparison reuses the LMS’s illustrative Grade 8 Term 3 assessment model. It is not Sussex’s real performance. Choose a school and show how leadership can investigate.', time: '1 min' },
  { id: 'collection', label: 'School essentials', kicker: '02:00 PM · PARENT CONVENIENCE', title: ['Reserve online.', 'Collect at school.'], accent: 1, description: 'Pupil’s books go to the Book Store. Sized uniforms go to the Uniform Store. Parents follow each request through to collection.', note: 'Choose pupil’s books or uniforms, then walk the request through confirmation, ready and collected. Requested stock is not held until the store confirms it. There is no buying or online payment.', time: '1 min' },
  { id: 'roles', label: 'Your next chapter', kicker: 'ONE PRODUCT · THIRTEEN ROLES', title: ['The right view.', 'For every role.'], accent: 1, description: 'One connected school day, with access that follows each person’s responsibility. Start with a focused pilot, then build towards the network.', note: 'Explore the four guided role tours, or open any of the thirteen role previews in the existing prototype. Close with the proposed pilot: one school, one bus and a small card group before expanding.', time: '2 min' },
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
  { id: 'transport', label: 'Transport Coordinator', category: 'Operations', scope: 'The school’s operational fleet', icon: 'bus', route: 'transport/overview/fleet', detail: 'Bus and driver allocations, route coordination, NFC roster review and transport reports.' },
  { id: 'driver', label: 'Driver', category: 'Operations', scope: 'The currently assigned bus', icon: 'bus', route: 'driver/overview/summary', tour: ['Complete the pre-trip checks', 'Follow the route and record boarding', 'Report a concern to transport staff'], detail: 'Safety checks, route stops, assigned students, simulated boarding and own trip history.' },
  { id: 'librarian', label: 'Book Store Officer', category: 'Operations', scope: 'The school’s pupil-book reservations', icon: 'book', route: 'librarian/overview/summary', detail: 'Confirm stock, prepare pupil’s books for collection and record handover at the school.' },
  { id: 'uniform_store', label: 'Uniform Store Officer', category: 'Operations', scope: 'The school’s uniform reservations', icon: 'shirt', route: 'uniform_store/overview/summary', detail: 'Manage sizes and stock, prepare confirmed requests and record uniform collection.' },
  { id: 'parent', label: 'Parent', category: 'Family', scope: 'The admission-selected linked child', icon: 'phone', route: 'parent/login', tour: ['Follow the child’s assigned bus', 'Download notes and mark learning done', 'Reserve pupil’s books and uniforms'], detail: 'Parent/student identity, bus and boarding, Class Teacher-selected subjects, homework, class notices and school collection.' },
];
export const focusedTours = ['chairman', 'principal', 'parent', 'driver'];
export const stops = ['Nugegoda Junction', 'Nawala Junction', 'Rajagiriya', 'School'];
export const initialDemo = { branchId: 'colombo', journey: 0.28, delayed: false, boarding: 'pending', offline: false, queued: false, tapMessage: '', published: false, completed: false, subjectEnabled: true, noticePublished: false, teachingClass: '8A', classWork: {}, homeworkPublished: false, homeworkDone: false, attendance: '', learningRole: 'teacher', subject: 'mathematics', compareAll: false, supply: 'books', size: '10', reservation: 'none', roleId: 'chairman', tourStep: 0 };
export function demoReducer(state, action) {
  switch (action.type) {
    case 'branch': return branches.some(branch => branch.id === action.id) ? { ...state, branchId: action.id } : state;
    case 'advance': return { ...state, journey: Math.min(1, state.journey + 0.24) };
    case 'restart-journey': return { ...state, journey: 0.04, delayed: false };
    case 'delay': return { ...state, delayed: !state.delayed };
    case 'reader': return { ...state, offline: !state.offline, tapMessage: state.offline ? 'Reader reconnected. Sync queued taps to confirm boarding.' : 'Reader offline. New taps will be queued.' };
    case 'tap':
      if (state.offline) return { ...state, queued: true, tapMessage: 'Tap captured offline. Boarding is not confirmed until sync.' };
      if (state.boarding === 'boarded') return { ...state, tapMessage: 'Already boarded. Repeated tap ignored.' };
      return { ...state, boarding: 'boarded', tapMessage: 'Amaya’s boarding recorded. The parent view now shows Boarded.' };
    case 'sync': return state.offline ? { ...state, tapMessage: 'Reconnect the reader before syncing.' } : state.queued ? { ...state, queued: false, boarding: 'boarded', tapMessage: 'Queued tap synced once. Boarding confirmed.' } : { ...state, tapMessage: 'Reader is up to date. No queued taps.' };
    case 'missed': return { ...state, boarding: 'review', tapMessage: 'Pickup closed without a confirmed tap. Needs review by the Transport Coordinator.' };
    case 'reset-boarding': return { ...state, boarding: 'pending', queued: false, offline: false, tapMessage: '' };
    case 'teaching-class': return ['8A', '8B'].includes(action.value) ? { ...state, teachingClass: action.value } : state;
    case 'student-subject': return { ...state, subjectEnabled: !state.subjectEnabled };
    case 'class-notice': return { ...state, noticePublished: true };
    case 'publish': return { ...state, published: state.teachingClass === '8A' || state.published, classWork: { ...state.classWork, [state.teachingClass]: { ...state.classWork[state.teachingClass], notes: true } } };
    case 'complete': return state.published && state.subjectEnabled ? { ...state, completed: !state.completed } : state;
    case 'give-homework': return { ...state, homeworkPublished: state.teachingClass === '8A' || state.homeworkPublished, classWork: { ...state.classWork, [state.teachingClass]: { ...state.classWork[state.teachingClass], homework: true } } };
    case 'homework-done': return state.homeworkPublished && state.subjectEnabled ? { ...state, homeworkDone: !state.homeworkDone } : state;
    case 'attendance': return ['present', 'absent', 'late'].includes(action.value) ? { ...state, attendance: action.value } : state;
    case 'learning-role': return ['teacher', 'class_teacher', 'parent', 'subjects', 'notices'].includes(action.value) ? { ...state, learningRole: action.value } : state;
    case 'subject': return ['mathematics', 'science', 'english'].includes(action.value) ? { ...state, subject: action.value } : state;
    case 'compare': return { ...state, compareAll: !state.compareAll };
    case 'supply': return ['books', 'uniforms'].includes(action.value) ? { ...state, supply: action.value, reservation: 'none' } : state;
    case 'size': return ['6', '8', '10', '12', '14', '16'].includes(action.value) && state.reservation === 'none' ? { ...state, size: action.value } : state;
    case 'reserve': { const sequence = ['none', 'requested', 'confirmed', 'ready', 'collected']; const index = sequence.indexOf(state.reservation); return { ...state, reservation: sequence[Math.min(index + 1, sequence.length - 1)] }; }
    case 'reset-reservation': return { ...state, reservation: 'none' };
    case 'role': return roleTours.some(role => role.id === action.id) ? { ...state, roleId: action.id, tourStep: 0 } : state;
    case 'tour-step': return { ...state, tourStep: Math.max(0, Math.min(2, Number(action.value) || 0)) };
    case 'reset': return { ...initialDemo };
    default: return state;
  }
}
export function comparison(state) {
  const selected = state.compareAll ? branches : branches.filter(branch => ['colombo', 'lakeside', state.branchId, 'kandy'].includes(branch.id));
  return rankedResults(selected, { subject: state.subject, grade: 8, term: 3 });
}
export function chapterFromHash(hash) { const index = chapters.findIndex(chapter => chapter.id === String(hash).replace(/^#/, '')); return index < 0 ? 0 : index; }
export function prototypeURL(roleId) { const role = roleTours.find(role => role.id === roleId); return role ? prototypeBase + '#' + role.route : prototypeBase; }
export const chapterScene = (index) => index === 1 ? 'bus' : index === 2 ? 'nfc' : index === 3 ? 'learning' : index === 5 ? 'supplies' : 'map';

export const tourDetails = {
 chairman: [
  { route: 'chairman/overview/transport', text: 'Begin with the Sri Lanka network map, select a school and inspect its simulated bus activity.' },
  { route: 'chairman/overview/academic', text: 'Choose Mathematics and compare the sample subject results across branches. Open a school to investigate.' },
  { route: 'chairman/overview/reports', text: 'Generate a scoped executive snapshot for discussion with school leadership.' },
 ],
 principal: [
  { route: 'principal/overview/transport', text: 'The Principal sees the assigned school’s routes and operational fleet.' },
  { route: 'principal/overview/attendance', text: 'Review school attendance, then explore staffing availability and follow-up priorities.' },
  { route: 'principal/overview/reports', text: 'Capture school reports and coordinate actions within the assigned school.' },
 ],
 parent: [
  { route: 'parent/login', text: 'Use demo admission SCN-1001 and password 1234 to open Amaya’s assigned bus and learning portal.' },
  { route: 'parent/subjects', text: 'After admission login, download assigned notes and mark materials done for the selected child.' },
  { route: 'parent/library', text: 'Reserve pupil’s books or switch to School uniforms, then track the school collection status.' },
 ],
 driver: [
  { route: 'driver/overview/summary', text: 'Prepare the dated demo trip and complete the five pre-trip safety checks.' },
  { route: 'driver/boarding', text: 'Open the assigned bus’s latest roster and try the NFC reader simulation.' },
  { route: 'driver/overview/issues', text: 'Report a transport concern to the school coordinator and follow its status.' },
 ],
};
