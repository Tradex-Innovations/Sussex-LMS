import { contextFor } from "./access.js";
import { icon } from "./icons.js";
import { escapeHtml as e } from "./ui.js";

export const demoPassword = "1234";
const sessionKey = "sussex-parent-demo-session";

export function parentContext(state, session) {
  if (!session) return null;
  const student = state.students.find((item) => item.id === session.studentId);
  const parent = state.accounts.find((person) => person.id === session.parentId);
  if (!student || !parent || !student.guardians.includes(parent.id)) return null;
  const grantIndex = parent.grants.findIndex((grant) => grant.role === "parent" && grant.branch === student.branch);
  if (grantIndex < 0) return null;
  return { ...contextFor(state, "parent", parent.id, student.branch, grantIndex), studentId: student.id };
}

export function authenticateParent(state, admissionNumber, password) {
  if (password !== demoPassword) return null;
  const number = String(admissionNumber).trim().toUpperCase();
  const student = state.students.find((item) => item.admissionNumber === number);
  if (!student) return null;
  for (const parentId of student.guardians) {
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
  const demoStudents = state.students.filter((student) => authenticateParent(state, student.admissionNumber, demoPassword));
  return `<main class="parent-login">
    <header class="login-header">
      <a class="login-brand" href="#parent/login" aria-label="Sussex College Network parent login"><img src="./assets/sussex-college-network-logo.png" alt=""><span>Sussex College<span>Network</span></span></a>
      <a class="button secondary" href="#chairman/transport">Staff demo</a>
    </header>
    <section class="login-layout">
      <div class="login-intro">
        <span class="login-eyebrow">PARENT PORTAL</span>
        <h1>Stay close to their school day.</h1>
        <p>Follow the school bus, keep up with class materials, and order books for your child.</p>
        <div class="login-benefits">
          <div>${icon("bus", 22)}<span><strong>Follow their journey</strong><span>See the assigned bus and its latest location.</span></span></div>
          <div>${icon("book", 22)}<span><strong>Keep learning on track</strong><span>Download notes and mark lessons complete.</span></span></div>
          <div>${icon("library", 22)}<span><strong>Get ready for class</strong><span>Browse books and order for school collection.</span></span></div>
        </div>
      </div>
      <div class="login-card">
        <header><span class="login-form-icon">${icon("users", 24)}</span><h2>Welcome, parent</h2><p>Sign in with your child’s admission number.</p></header>
        <form data-form="parent-login">
          <label class="field" for="admission-number">Admission number</label>
          <input id="admission-number" class="login-input" name="admissionNumber" autocomplete="username" placeholder="e.g. SCN-1001" autocapitalize="characters" spellcheck="false" required maxlength="32" aria-describedby="login-error">
          <label class="field login-password-label" for="parent-password">Password</label>
          <div class="login-password">
            <input id="parent-password" class="login-input" type="password" name="password" autocomplete="current-password" placeholder="Enter your password" required aria-describedby="login-error">
            <button type="button" data-action="toggle-password" aria-label="Show password" aria-pressed="false">Show</button>
          </div>
          <p id="login-error" class="form-error" role="alert" hidden></p>
          <button type="submit" class="button primary login-submit">Sign in</button>
        </form>
        <section class="login-demo" aria-label="Demo login details">
          <div class="login-demo-heading"><strong>Try a student account</strong><span>Demo password <b>${demoPassword}</b></span></div>
          <div class="login-demo-students">${demoStudents.map((student) => `<button type="button" data-action="fill-login" data-value="${e(student.admissionNumber)}" aria-label="Use ${e(student.name)} demo login"><span>${e(student.name)}</span><strong>${e(student.admissionNumber)}</strong></button>`).join("")}</div>
        </section>
        <p class="login-prototype-note">Prototype demonstration · Sample student accounts</p>
      </div>
    </section>
  </main>`;
}

