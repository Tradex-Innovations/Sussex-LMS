import { contextFor } from "./access.js";
import { icon } from "./icons.js";
import { escapeHtml as e } from "./ui.js";

export const demoPassword = "1234";
const sessionKey = "school-product-parent-demo-session";

export function parentContext(state, session) {
  if (!session) return null;
  const parent = state.accounts.find((person) => person.id === session.parentId);
  if (!parent) return null;
  const children = state.students.filter((student) => student.guardians.includes(parent.id) && parent.grants.some((grant) => grant.role === "parent" && grant.branch === student.branch));
  const student = children.find((item) => item.id === (session.selectedChildId || session.studentId));
  if (!student) return null;
  const grantIndex = parent.grants.findIndex((grant) => grant.role === "parent" && grant.branch === student.branch);
  return { ...contextFor(state, "parent", parent.id, student.branch, grantIndex), family: true, studentId: student.id };
}

export function authenticateParent(state, admissionNumber, password) {
  if (password !== demoPassword) return null;
  const number = String(admissionNumber).trim().toUpperCase();
  const family = state.accounts.find((person) => String(person.familyLogin || "").toUpperCase() === number && person.familyLogin);
  const student = family ? state.students.find((item) => item.guardians.includes(family.id) && family.grants.some((grant) => grant.role === "parent" && grant.branch === item.branch)) : state.students.find((item) => item.admissionNumber === number);
  if (!student) return null;
  for (const parentId of family ? [family.id] : student.guardians) {
    const session = { studentId: student.id, parentId };
    if (parentContext(state, session)) return session;
  }
  return null;
}

export function readParentSession() {
  try {
    return JSON.parse(sessionStorage.getItem(sessionKey) || "null");
  } catch {
    return null;
  }
}

export function saveParentSession(session) {
  try {
    if (session) sessionStorage.setItem(sessionKey, JSON.stringify(session));
    else sessionStorage.removeItem(sessionKey);
    return true;
  } catch {
    return false;
  }
}

export function loginPage(state) {
  const demoStudents = state.accounts.filter((person) => person.familyLogin && authenticateParent(state, person.familyLogin, demoPassword)).map((person) => ({ name: person.name, admissionNumber: person.familyLogin }));
  return `<main class="parent-login">
    <header class="login-header">
      <a class="login-brand" href="#parent/login" aria-label="School Management Platform parent login"><span>School<span>Platform</span></span></a>
      <a class="button secondary" href="#chairman/transport">Staff demo</a>
    </header>
    <section class="login-layout">
      <div class="login-intro">
        <span class="login-eyebrow">PARENT PORTAL</span>
        <h1>Stay close to their school day.</h1>
        <p>Follow the school bus, check subjects, homework and class notices, and reserve school essentials.</p>
        <div class="login-benefits">
          <div>${icon("bus", 22)}<span><strong>Follow their journey</strong><span>Bus updates during pickup and drop-off hours.</span></span></div>
          <div>${icon("book", 22)}<span><strong>Keep learning on track</strong><span>View assigned subjects, download notes and track homework.</span></span></div>
          <div>${icon("library", 22)}<span><strong>Get ready for class</strong><span>Reserve pupil’s books and uniforms for school collection.</span></span></div>
        </div>
      </div>
      <div class="login-card">
        <header><span class="login-form-icon">${icon("users", 24)}</span><h2>Welcome, parent</h2><p>One family account. All your linked children.</p></header>
        <form data-form="parent-login">
          <label class="field" for="admission-number">Family ID or admission number</label>
          <input id="admission-number" class="login-input" name="admissionNumber" autocomplete="username" placeholder="e.g. FAMILY-1001" autocapitalize="characters" spellcheck="false" required maxlength="32" aria-describedby="login-error">
          <label class="field login-password-label" for="parent-password">Password</label>
          <div class="login-password">
            <input id="parent-password" class="login-input" type="password" name="password" autocomplete="current-password" placeholder="Enter your password" required aria-describedby="login-error">
            <button type="button" data-action="toggle-password" aria-label="Show password" aria-pressed="false">Show</button>
          </div>
          <p id="login-error" class="form-error" role="alert" hidden></p>
          <button type="submit" class="button primary login-submit">Sign in</button>
        </form>
        <section class="login-demo" aria-label="Demo login details">
          <div class="login-demo-heading"><strong>Try a family account</strong><span>Demo password <b>${demoPassword}</b></span></div>
          <div class="login-demo-students">${demoStudents.map((student) => `<button type="button" data-action="fill-login" data-value="${e(student.admissionNumber)}" aria-label="Use ${e(student.name)} demo login"><span>${e(student.name)}</span><strong>${e(student.admissionNumber)}</strong></button>`).join("")}</div>
        </section>
        <p class="login-prototype-note">Prototype demonstration · Sample family accounts</p>
      </div>
    </section>
  </main>`;
}
