import { books } from "./data.js";
import { icon } from "./icons.js";
import { badge, button, emptyState, escapeHtml as e, iconTile, money, pageHeading } from "./ui.js";

export function cartItems(state) {
  return books.filter((book) => state.cart[book.id] > 0).map((book) => ({
    ...book,
    quantity: state.cart[book.id],
  }));
}

function bookCard(book) {
  return `<article class="surface book-card">
    <div class="cover-stage cover-${book.art}">
      <div class="book-cover" aria-hidden="true">
        <div class="cover-art"></div><span>GREENFIELD PRESS</span><strong>${book.title}</strong><small>${book.subtitle}</small>
      </div>
    </div>
    <div class="book-info">
      <span class="book-category">Grade ${book.grade} · ${book.category}</span>
      <h2>${book.title}</h2>
      <p>${book.subtitle}</p>
      <div class="book-price"><strong>${money(book.price)}</strong>
      ${button("Add", "add-book", { value: book.id, iconName: "plus", variant: "secondary compact", focus: `book-${book.id}`, extra: `aria-label="Add ${e(book.title)} to order"` })}</div>
    </div>
  </article>`;
}

export function catalogResults(grade, query) {
  const text = query.trim().toLowerCase();
  const visible = books.filter((book) => (grade === "all" || book.grade === Number(grade)) && `${book.title} ${book.subtitle} ${book.category}`.toLowerCase().includes(text));
  return visible.length ? `<div class="book-grid">${visible.map(bookCard).join("")}</div>`
    : `<section class="surface">${emptyState("search", "No books found", "Try another title, subject, or grade.")}</section>`;
}

export function libraryPage(role, { state, grade, query }) {
  if (role === "admin") return `
    ${pageHeading("Library orders", "Review orders placed through the parent portal.")}
    <section class="surface"><header class="panel-heading"><div><h2>Book orders</h2><p>${state.orders.length} demo ${state.orders.length === 1 ? "order" : "orders"}</p></div>${iconTile("package", "green", "small-tile")}</header>
      ${orderHistory(state)}
    </section>`;
  const count = cartItems(state).reduce((sum, item) => sum + item.quantity, 0);
  return `
    ${pageHeading("School library", "Browse books and order them for collection at school.",
      `${button("My orders", "orders", { variant: "secondary", iconName: "package", focus: "orders" })}
        ${button(`Book bag (${count})`, "cart", { iconName: "bag", focus: "cart" })}`)}
    <div class="catalog-toolbar">
      <label class="search-field">${icon("search", 17)}<span class="sr-only">Search books</span><input type="search" data-change="book-search" data-focus="book-search" value="${e(query)}" placeholder="Search title or subject"></label>
      <label class="select-wrap"><span class="sr-only">Filter by grade</span><select data-change="grade" data-focus="grade">
        <option value="all" ${grade === "all" ? "selected" : ""}>All grades</option>
        <option value="6" ${grade === "6" ? "selected" : ""}>Grade 6</option>
        <option value="8" ${grade === "8" ? "selected" : ""}>Grade 8</option>
      </select>${icon("chevronDown", 15)}</label>
    </div>
    <div id="catalog-results" aria-live="polite">${catalogResults(grade, query)}</div>`;
}

export function cartForm(state) {
  const items = cartItems(state);
  if (!items.length) return `<div class="form-body">${emptyState("bag", "Your book bag is empty", "Add a book from the library to place an order.")}</div>
    <footer class="dialog-actions">${button("Browse books", "close-dialog", { variant: "secondary" })}</footer>`;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return `<div class="form-body">
      <div class="cart-items">
        ${items.map((item) => `<div class="cart-row">
          ${iconTile("book", "green", "small-tile")}
          <div><strong>${item.title}</strong><small>${money(item.price)} each</small></div>
          <div class="quantity-controls">
            <button type="button" data-action="decrease-book" data-value="${item.id}" data-focus="decrease-${item.id}" aria-label="Remove one copy of ${item.title}">${icon("minus", 15)}</button>
            <span>${item.quantity}</span>
            <button type="button" data-action="increase-book" data-value="${item.id}" data-focus="increase-${item.id}" aria-label="Add one copy of ${item.title}" ${item.quantity >= 10 ? "disabled" : ""}>${icon("plus", 15)}</button>
          </div>
        </div>`).join("")}
      </div>
      <div class="cart-total"><span>Total</span><strong>${money(total)}</strong></div>
      <div class="pickup-note">${icon("school", 18)} <span><strong>Collect at Greenfield Academy</strong><small>Pay at collection · Demo order</small></span></div>
    </div>
    <footer class="dialog-actions">${button("Continue browsing", "close-dialog", { variant: "secondary" })}${button("Place order", "place-order", { iconName: "check" })}</footer>`;
}

export function orderHistory(state) {
  if (!state.orders.length) return emptyState("package", "No book orders yet", "Orders placed in the parent portal will appear here.");
  return `<div class="orders-list">${[...state.orders].reverse().map((order) => `<article class="order-row">
    ${iconTile("package", "green", "small-tile")}
    <div><strong>${e(order.number)}</strong><small>${e(order.date)} · ${order.items.map((item) => `${e(item.title)} × ${item.quantity}`).join(", ")}</small></div>
    <div class="order-totals"><strong>${money(order.total)}</strong>${badge("Awaiting collection", "green")}</div>
  </article>`).join("")}</div>`;
}

