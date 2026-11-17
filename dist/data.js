export const roles = {
  admin: { name: "Admin", person: "Anjali Fernando", initials: "AF", icon: "badge", start: "transport", pages: ["transport", "courses", "library"] },
  teacher: { name: "Teacher", person: "Dilini Silva", initials: "DS", icon: "book", start: "courses", pages: ["courses"] },
  parent: { name: "Parent", person: "Nadeesha Perera", initials: "NP", icon: "users", start: "transport", pages: ["transport", "courses", "library"] },
  driver: { name: "Driver", person: "Kasun Dias", initials: "KD", icon: "bus", start: "transport", pages: ["transport"] },
};

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
  { id: "01", name: "Nugegoda Loop", driver: "Kasun Dias", registration: "WP NB-4521", status: "route", color: "#168467", start: 0.55, stops: ["Nugegoda Junction", "Nawala Junction", "Rajagiriya", "Greenfield Academy"], stopProgress: [0, 0.67, 0.94, 1] },
  { id: "02", name: "Battaramulla Line", driver: "Ruwan Peries", registration: "WP NB-3692", status: "route", color: "#386bc7", start: 0.32, stops: ["Battaramulla", "Diyatha Uyana", "Rajagiriya", "Greenfield Academy"], stopProgress: [0, 0.41, 0.84, 1] },
  { id: "03", name: "Dehiwala Express", driver: "Sanjeewa Rathnayake", registration: "WP ND-7104", status: "route", color: "#785db6", start: 0.33, stops: ["Dehiwala Junction", "Kohuwala", "Narahenpita", "Greenfield Academy"], stopProgress: [0, 0.34, 0.71, 1] },
  { id: "04", name: "Kotte Shuttle", driver: "Indika Perera", registration: "WP NE-8406", status: "school", color: "#60796f", stops: ["Pita Kotte", "Etul Kotte", "Greenfield Academy"] },
  { id: "05", name: "Thalawathugoda Line", driver: "Dinesh Fernando", registration: "WP NC-8259", status: "school", color: "#60796f", stops: ["Thalawathugoda", "Battaramulla", "Greenfield Academy"] },
  { id: "06", name: "Maharagama Loop", driver: "Saman Jayasinghe", registration: "WP ND-1960", status: "delayed", color: "#b26a21", start: 0.44, stops: ["Maharagama", "Pita Kotte", "Etul Kotte", "Greenfield Academy"], stopProgress: [0, 0.64, 0.82, 1] },
];

export const statuses = {
  route: { label: "On route", tone: "green" },
  school: { label: "At school", tone: "neutral" },
  delayed: { label: "Signal delayed", tone: "amber" },
};

const storageKey = "campusway-demo-v1";

export function freshState() {
  return {
    assignments: structuredClone(assignments),
    materials: structuredClone(materials),
    completed: { amaya: ["m1"], kavin: [] },
    child: "amaya",
    teacher: "dilini",
    cart: {},
    orders: [],
    trip: "route",
  };
}

export function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved ? { ...freshState(), ...JSON.parse(saved) } : freshState();
  } catch {
    return freshState();
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

