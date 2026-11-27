import { migrateGpsTransport } from "./gps-seed.js";
import { migrateFamilyPortal } from "./family-seed.js";
import { migrateAcademicPortal } from "./academic-seed.js";
import { storesSeed, storeOfficerAccounts } from "./stores-seed.js";
import { boardingSeed } from "./boarding-seed.js";
import { branchDirectory } from "./network-data.js";

export const roles = {
  chairman: { name: "Chairman", icon: "school", start: "overview", pages: ["overview", "fees", "transport", "courses", "people", "library", "uniforms", "access", "boarding"] },
  principal: { name: "Principal", icon: "badge", start: "overview", pages: ["overview", "fees", "transport", "courses", "people", "library", "uniforms", "access", "boarding"] },
  vice_principal: { name: "Vice Principal", icon: "badge", start: "overview", pages: ["overview", "transport", "courses", "people", "library", "uniforms", "boarding"] },
  section_head: { name: "Section Head", icon: "users", start: "overview", pages: ["overview", "courses", "people"] },
  coordinator: { name: "Grade Coordinator", icon: "users", start: "overview", pages: ["overview", "courses", "people"] },
  class_teacher: { name: "Class Teacher", icon: "book", start: "overview", pages: ["overview", "inbox", "communications", "events", "courses", "homework", "notices", "people"] },
  teacher: { name: "Subject Teacher", icon: "book", start: "overview", pages: ["overview", "communications", "events", "courses", "homework"] },
  admin: { name: "School Administrator", icon: "settings", start: "overview", pages: ["overview", "fees", "transport", "people", "courses", "boarding"] },
  transport: { name: "Transport Coordinator", icon: "route", start: "overview", pages: ["overview", "transport", "tracking", "boarding"] },
  librarian: { name: "Book Store Officer", icon: "library", start: "overview", pages: ["overview", "library"] },
  uniform_store: { name: "Uniform Store Officer", icon: "package", start: "overview", pages: ["overview", "uniforms"] },
  parent: { name: "Parent", icon: "user", start: "family", pages: ["family", "transport", "inbox", "events", "fees", "communications", "courses", "homework", "notices", "library", "uniforms", "boarding", "more"] },
};

export const sections = [
  { id: "preschool", name: "Preschool", grades: [0] },
  { id: "primary", name: "Primary", grades: [1, 2, 3, 4, 5] },
  { id: "middle", name: "Middle School", grades: [6, 7, 8, 9] },
  { id: "senior", name: "Senior School", grades: [10, 11, 12, 13] },
];

export function sectionFor(grade) {
  return sections.find((section) => section.grades.includes(Number(grade)))?.id;
}

export const branches = branchDirectory;

export const students = [
  { id: "amaya", name: "Amaya Perera", grade: 8, initials: "AP", tone: "violet", bus: "01" },
  { id: "kavin", name: "Kavin Perera", grade: 6, initials: "KP", tone: "blue", bus: "02" },
  { id: "lohith", name: "Lohith Jayasekara", grade: 8, initials: "LJ", tone: "green" },
  { id: "sara", name: "Sara Mendis", grade: 8, initials: "SM", tone: "amber" },
  { id: "riya", name: "Riya Silva", grade: 6, initials: "RS", tone: "rose" },
  { id: "niluka", name: "Niluka De Zoysa", grade: 6, initials: "ND", tone: "green" },
];

export const teachers = [
  { id: "dilini", name: "Dilini Silva", initials: "DS", tone: "green" },
  { id: "nuwan", name: "Nuwan Gamage", initials: "NG", tone: "blue" },
  { id: "rihana", name: "Rihana Farook", initials: "RF", tone: "rose" },
];

export const courses = [
  { id: "math8", code: "MAT 08", title: "Mathematics", grade: 8, tone: "blue", icon: "math", summary: "Algebra, geometry, and problem solving." },
  { id: "science8", code: "SCI 08", title: "Science", grade: 8, tone: "green", icon: "science", summary: "Explore living systems, matter, and energy." },
  { id: "english6", code: "ENG 06", title: "English", grade: 6, tone: "amber", icon: "text", summary: "Reading, creative writing, and grammar." },
  { id: "ict6", code: "ICT 06", title: "ICT", grade: 6, tone: "violet", icon: "computer", summary: "Computing fundamentals and digital skills." },
];

const assignments = {
  math8: { teacher: "dilini", students: ["amaya", "lohith", "sara"] },
  science8: { teacher: "nuwan", students: ["amaya", "lohith", "sara"] },
  english6: { teacher: "rihana", students: ["kavin", "riya", "niluka"] },
  ict6: { teacher: "dilini", students: ["riya", "niluka"] },
};

const materials = [
  { id: "m1", course: "math8", title: "Introduction to algebra", type: "Lecture notes", date: "12 Nov", description: "Use variables to describe a pattern and write simple expressions.", content: "A variable is a letter that represents a number. An expression combines numbers, variables, and operations.\n\nExample: If a number is doubled and then increased by 3, write 2x + 3.\n\nPractice: Write expressions for three consecutive numbers and for the total cost of n books priced at Rs. 250 each." },
  { id: "m2", course: "math8", title: "Solving linear equations", type: "Worksheet", date: "14 Nov", description: "Practise solving one-step and two-step equations.", content: "Keep an equation balanced by performing the same operation on each side.\n\n1. x + 8 = 15\n2. 4x = 28\n3. 2x + 3 = 19\n4. 3(x - 2) = 21\n\nCheck each solution by substituting it into the original equation." },
  { id: "m3", course: "math8", title: "Angles and parallel lines", type: "Lecture notes", date: "16 Nov", description: "Identify corresponding, alternate, and co-interior angles.", content: "A transversal crosses two or more lines. When it crosses parallel lines, corresponding and alternate angles are equal. Co-interior angles add to 180 degrees.\n\nPractice: Sketch two parallel lines and a transversal. Label an angle 70 degrees and work out the remaining angles." },
  { id: "s1", course: "science8", title: "Cells and their functions", type: "Lecture notes", date: "13 Nov", description: "Compare the basic structures of plant and animal cells.", content: "The nucleus contains genetic information. The cell membrane controls what enters and leaves a cell. A plant cell has a cell wall and often contains chloroplasts.\n\nActivity: Draw a labelled plant cell and compare it with an animal cell." },
  { id: "e1", course: "english6", title: "Writing a character description", type: "Lecture notes", date: "13 Nov", description: "Build a character using actions, dialogue, and specific details.", content: "Readers learn about a character from what they do, how they speak, and how others respond to them.\n\nActivity: Describe a character arriving late to a lesson. Show how they feel through their actions and dialogue." },
  { id: "i1", course: "ict6", title: "Hardware and software", type: "Lecture notes", date: "12 Nov", description: "Learn how computer parts and programs work together.", content: "Hardware is the physical part of a computer. Software is the set of instructions it follows.\n\nActivity: List three examples of each, then explain how a keyboard, an operating system, and a word processor work together." },
];

export const books = [
  { id: "b1", title: "Mathematics 8", subtitle: "Practice & Revision", category: "Mathematics", grade: 8, price: 1450, art: "math" },
  { id: "b2", title: "Everyday Science", subtitle: "The Living World", category: "Science", grade: 8, price: 1850, art: "science" },
  { id: "b3", title: "English Reader 6", subtitle: "Stories & Activities", category: "English", grade: 6, price: 1200, art: "english" },
  { id: "b4", title: "Digital Skills 6", subtitle: "Computing Essentials", category: "ICT", grade: 6, price: 1650, art: "ict" },
];

export const buses = [
  { id: "01", name: "Nugegoda Loop", registration: "WP NB-4521", status: "route", color: "#168467", start: 0.55, stops: ["Nugegoda Junction", "Nawala Junction", "Rajagiriya", "School Management Platform"], stopProgress: [0, 0.67, 0.94, 1] },
  { id: "02", name: "Battaramulla Line", registration: "WP NB-3692", status: "route", color: "#386bc7", start: 0.32, stops: ["Battaramulla", "Diyatha Uyana", "Rajagiriya", "School Management Platform"], stopProgress: [0, 0.41, 0.84, 1] },
  { id: "03", name: "Dehiwala Express", registration: "WP ND-7104", status: "route", color: "#785db6", start: 0.33, stops: ["Dehiwala Junction", "Kohuwala", "Narahenpita", "School Management Platform"], stopProgress: [0, 0.34, 0.71, 1] },
  { id: "04", name: "Kotte Shuttle", registration: "WP NE-8406", status: "school", color: "#60796f", stops: ["Pita Kotte", "Etul Kotte", "School Management Platform"] },
  { id: "05", name: "Thalawathugoda Line", registration: "WP NC-8259", status: "school", color: "#60796f", stops: ["Thalawathugoda", "Battaramulla", "School Management Platform"] },
  { id: "06", name: "Maharagama Loop", registration: "WP ND-1960", status: "delayed", color: "#b26a21", start: 0.44, stops: ["Maharagama", "Pita Kotte", "Etul Kotte", "School Management Platform"], stopProgress: [0, 0.64, 0.82, 1] },
];

export const statuses = {
  route: { label: "On route", tone: "green" },
  school: { label: "At school", tone: "neutral" },
  delayed: { label: "Signal delayed", tone: "amber" },
};

const storageKey = "school-product-demo-v1";

function seedAccounts() {
  const account = (id, name, grants) => ({ id, name, initials: name.split(" ").map((word) => word[0]).slice(0, 2).join(""), tone: "green", grants });
  const grant = (role, branch = "colombo", extra = {}) => ({ role, branch, ...extra });
  return [
    account("chairman", "Duminda Wijesinghe", [grant("chairman", "all")]),
    account("principal_c", "Malini Senanayake", [grant("principal")]),
    account("principal_l", "Suresh Jayawardena", [grant("principal", "lakeside")]),
    account("vice_c", "Roshani Fernando", [grant("vice_principal")]),
    account("vice_l", "Dilan Mendis", [grant("vice_principal", "lakeside")]),
    account("dilini", "Dilini Silva", [grant("section_head", "colombo", { section: "middle" }), grant("teacher"), grant("class_teacher", "colombo", { grade: 8, className: "8A" })]),
    account("nuwan", "Nuwan Gamage", [grant("coordinator", "colombo", { grade: 8 }), grant("teacher")]),
    account("coordinator6_c", "Tharushi Jayasekara", [grant("coordinator", "colombo", { grade: 6 })]),
    account("coordinator8_l", "Kasun Perera", [grant("coordinator", "lakeside", { grade: 8 })]),
    account("class_teacher6_c", "Sanduni Rathnayake", [grant("class_teacher", "colombo", { grade: 6, className: "6A" })]),
    account("class_teacher8_l", "Chamodi Senanayake", [grant("class_teacher", "lakeside", { grade: 8, className: "8A" })]),
    account("rihana", "Rihana Farook", [grant("teacher")]),
    account("asha", "Asha Wickramasinghe", [grant("section_head", "colombo", { section: "primary" }), grant("teacher")]),
    account("lakshmi", "Lakshmi Fernando", [grant("section_head", "lakeside", { section: "middle" }), grant("teacher", "lakeside")]),
    account("admin_c", "Anjali Fernando", [grant("admin")]),
    account("admin_l", "Shanika Dias", [grant("admin", "lakeside")]),
    account("transport_c", "Nimal Rathnayake", [grant("transport")]),
    account("transport_l", "Chamara Silva", [grant("transport", "lakeside")]),
    account("librarian_c", "Hasini Perera", [grant("librarian")]),
    account("librarian_l", "Kumari Rodrigo", [grant("librarian", "lakeside")]),
    ...structuredClone(storeOfficerAccounts),
    account("parent", "Nadeesha Perera", [grant("parent")]),
    account("parent_l", "Tharushi Fernando", [grant("parent", "lakeside")]),
  ];
}

export function nextAdmissionNumber(records) {
  const used = new Set(records.map((student) => student.admissionNumber?.trim().toUpperCase()));
  let number = 1001;
  while (used.has("NET-" + number)) number += 1;
  return "NET-" + number;
}

function withAdmissionNumbers(records) {
  const students = records.map((student) => ({ ...student }));
  for (const student of students) {
    student.admissionNumber = student.admissionNumber?.trim().toUpperCase() || nextAdmissionNumber(students);
  }
  return students;
}

export function freshState() {
  const scopedStudents = students.map((student) => ({
    ...student, branch: "colombo", className: student.grade + "A",
    guardians: ["amaya", "kavin"].includes(student.id) ? ["parent"] : [],
  }));
  scopedStudents.push(
    { id: "anuki", name: "Anuki Ramanayake", initials: "AR", grade: 4, className: "4A", branch: "colombo", tone: "rose", guardians: [] },
    { id: "meera", name: "Meera Fernando", initials: "MF", grade: 8, className: "8A", branch: "lakeside", tone: "amber", guardians: ["parent_l"], bus: "07" },
    { id: "thevin", name: "Thevin Fernando", initials: "TF", grade: 6, className: "6A", branch: "lakeside", tone: "blue", guardians: ["parent_l"], bus: "08" },
  );
  const scopedCourses = courses.map((course) => ({ ...course, branch: "colombo", className: course.grade + "A" }));
  scopedCourses.push(
    { id: "math4", code: "MAT 04", title: "Mathematics", grade: 4, className: "4A", branch: "colombo", tone: "blue", icon: "math", summary: "Number patterns, fractions, and shapes." },
    ...courses.map((course) => ({ ...course, id: "lake-" + course.id, branch: "lakeside", className: course.grade + "A" })),
  );
  const scopedAssignments = { ...structuredClone(assignments), math4: { teacher: "asha", students: ["anuki"] } };
  for (const course of courses) scopedAssignments["lake-" + course.id] = { teacher: "lakshmi", students: [course.grade === 8 ? "meera" : "thevin"] };
  return migrateGpsTransport(migrateFamilyPortal(migrateAcademicPortal({
    version: 2,
    ...storesSeed(),
    networkVersion: 1,
    gradeCoordinatorVersion: 1,
    classTeacherVersion: 1,
    ...boardingSeed(withAdmissionNumbers(scopedStudents), buses.map((bus) => ({ ...bus, branch: "colombo" })).concat([{ id: "07", branch: "lakeside" }, { id: "08", branch: "lakeside" }])),
    activity: [],
    branches: structuredClone(branches),
    accounts: seedAccounts(),
    students: withAdmissionNumbers(scopedStudents),
    courses: scopedCourses,
    assignments: scopedAssignments,
    materials: [
      ...structuredClone(materials),
      { id: "p1", course: "math4", title: "Fractions in everyday life", type: "Lecture notes", date: "18 Nov", description: "Understand halves, quarters, and equal parts.", content: "Draw a circle and divide it into four equal parts. Shade one quarter, then one half." },
      ...materials.map((material) => ({ ...material, id: "lake-" + material.id, course: "lake-" + material.course })),
    ],
    completed: { amaya: ["m1"], kavin: [], meera: ["lake-m1"] },
    child: "amaya",
    teacher: "dilini",
    cart: {},
    carts: {},
    orders: [],
    buses: [
      ...buses.map((bus) => ({ ...bus, stops: [...bus.stops.slice(0, -1), "Campus Nugegoda"], branch: "colombo" })),
      { id: "07", name: "Rajagiriya Link", branch: "lakeside", registration: "WP NE-4528", status: "route", color: "#cb6655", start: 0.15, stops: ["Rajagiriya", "Diyatha Uyana", "Campus Malabe"] },
      { id: "08", name: "Nugegoda Link", branch: "lakeside", registration: "WP NF-3172", status: "route", color: "#277c96", start: 0.42, stops: ["Nugegoda Junction", "Nawala Junction", "Rajagiriya", "Diyatha Uyana", "Campus Malabe"] },
    ],
    books: branches.flatMap((branch) => books.map((book) => ({ ...book, id: branch.id === "colombo" ? book.id : "lake-" + book.id, branch: branch.id, available: true }))),
  })));
}

function migrateSchoolLabel(label) {
  return label.replace(/^Greenfield Academy$/, "School Management Platform")
    .replace(/^Greenfield\b/, "Campus")
    .replace(/^Campus Colombo$/, "Campus Nugegoda")
    .replace(/^Campus Lakeside$/, "Campus Malabe");
}

function migratedDemoAccounts(saved, defaults) {
  const accounts = [...(saved.accounts || defaults.accounts)];
  const additions = [...(!saved.storesVersion ? ["uniform_c", "uniform_l"] : []), ...(!saved.gradeCoordinatorVersion ? ["coordinator6_c", "coordinator8_l"] : []), ...(!saved.classTeacherVersion ? ["class_teacher6_c", "class_teacher8_l"] : [])];
  for (const person of defaults.accounts.filter((person) => additions.includes(person.id))) if (!accounts.some((existing) => existing.id === person.id)) accounts.push(person);
  return accounts;
}

function loadStoredState() {
  const defaults = freshState();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || "null");
    if (!saved) return defaults;
    if (saved.version === 2) {
      return {
        ...defaults,
        ...saved,
        academicPortalVersion: saved.academicPortalVersion || 0,
        familyPortalVersion: saved.familyPortalVersion || 0,
        gpsTransportVersion: saved.gpsTransportVersion || 0,
        ...(!saved.storesVersion ? storesSeed() : {}),
        ...(!saved.nfcVersion ? boardingSeed(saved.students || defaults.students, saved.buses || defaults.buses) : {}),
        networkVersion: 1,
        gradeCoordinatorVersion: 1,
        classTeacherVersion: 1,
        accounts: migratedDemoAccounts(saved, defaults),
        students: withAdmissionNumbers(saved.students || defaults.students),
        branches: defaults.branches.map((branch) => {
          const existing = saved.branches.find((item) => item.id === branch.id);
          return saved.networkVersion && existing ? { ...branch, ...existing, school: migrateSchoolLabel(existing.school) } : { ...existing, ...branch };
        }),
        buses: saved.buses.map((bus) => ({ ...bus, stops: bus.stops.map(migrateSchoolLabel) })),
      };
    }
    return {
      ...defaults,
      academicPortalVersion: 0,
      assignments: { ...defaults.assignments, ...saved.assignments },
      materials: [...defaults.materials.filter((item) => item.course === "math4" || item.course.startsWith("lake-")), ...(saved.materials || materials)],
      completed: { ...defaults.completed, ...saved.completed },
      child: saved.child || defaults.child,
      carts: { parent: { colombo: saved.cart || {} } },
      orders: (saved.orders || []).map((order) => ({ ...order, branch: "colombo", parent: "parent", status: "pending" })),
      buses: defaults.buses.map((bus) => bus.id === "01" ? { ...bus, status: saved.trip || bus.status } : bus),
    };
  } catch {
    return defaults;
  }
}

export function loadState() { return migrateGpsTransport(migrateFamilyPortal(migrateAcademicPortal(loadStoredState()))); }

export function saveState(state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
