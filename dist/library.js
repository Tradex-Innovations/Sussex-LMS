import { can, visibleOrders } from "./access.js";
import { icon } from "./icons.js";
import { badge, button, emptyState, escapeHtml as e, iconTile, money, pageHeading } from "./ui.js";

export function branchBooks(state, context) {
  return state.books.filter((book) => context.branch === "all" || book.branch === context.branch);
}

export function cartFor(state, context) {
  return state.carts[context.account.id]?.[context.branch] || {};
}

export function cartItems(state, context) {
  const cart = cartFor(state, context);
  return branchBooks(state, context).filter((book) => book.available && cart[book.id] > 0).map((book) => ({ ...book, quantity: cart[book.id] }));
}

function bookCard(book) {
  return `<article class="surface book-card">
    <div class="cover-stage cover-${book.art}"><div class="book-cover" aria-hidden="true"><div class="cover-art"></div><span>SUSSEX COLLEGE</span><strong>${e(book.title)}</strong><small>${e(book.subtitle)}</small></div></div>
    <div class="book-info"><span class="book-category">Grade ${book.grade} · ${e(book.category)}</span><h2>${e(book.title)}</h2><p>${e(book.subtitle)}</p>
      <div class="book-price"><strong>${money(book.price)}</strong>${book.available ? button("Add", "add-book", { value: book.id, iconName: "plus", variant: "secondary compact", focus: `book-${book.id}`, extra: `aria-label="Add ${e(book.title)} to order"` }) : badge("Unavailable", "amber")}</div>
    </div>
  </article>`;
}

export function catalogResults(state, context, grade, query) {
  const text = query.trim().toLowerCase();
  const visible = branchBooks(state, context).filter((book) => (grade === "all" || book.grade === Number(grade)) && `${book.title} ${book.subtitle} ${book.category}`.toLowerCase().includes(text));
  return visible.length ? `<div class="book-grid">${visible.map(bookCard).join("")}</div>` : `<section class="surface">${emptyState("search", "No books found", "Try another title, subject, or grade.")}</section>`;
}

export function libraryPage(options) {
  const { state, context, grade, query } = options;
  if (context.role !== "parent") {
    const books = branchBooks(state, context);
    return `${pageHeading("Library management", "Manage book availability and orders within your school scope.")}
      <section class="surface"><header class="panel-heading"><div><h2>Book catalogue</h2><p>${books.length} titles across the selected scope</p></div></header>
      <div class="table-scroll"><table class="course-table"><thead><tr><th>Book</th><th>Branch</th><th>Price</th><th>Availability</th><th>Actions</th></tr></thead><tbody>
        ${books.map((book) => `<tr><td><strong>${e(book.title)}</strong><div class="secondary-text">Grade ${book.grade}</div></td><td>${e(state.branches.find((branch) => branch.id === book.branch)?.name)}</td><td>${money(book.price)}</td><td>${badge(book.available ? "Available" : "Unavailable", book.available ? "green" : "amber")}</td><td>${can(context, "library.manage") ? button("Edit book", "edit-book", { value: book.id, variant: "secondary compact", iconName: "edit" }) : ""}</td></tr>`).join("")}
      </tbody></table></div></section>
      <section class="surface section-gap"><header class="panel-heading"><div><h2>Book orders</h2><p>Orders from parents in your scope</p></div>${iconTile("package", "green", "small-tile")}</header>${orderHistory(state, context)}</section>`;
  }
  const count = cartItems(state, context).reduce((sum, item) => sum + item.quantity, 0);
  return `${pageHeading("School library", "Browse books and order them for collection at school.", `${button("My orders", "orders", { variant: "secondary", iconName: "package" })}${button(`Book bag (${count})`, "cart", { iconName: "bag", focus: "cart" })}`)}
    <div class="catalog-toolbar"><label class="search-field">${icon("search", 17)}<span class="sr-only">Search books</span><input type="search" data-change="book-search" value="${e(query)}" placeholder="Search title or subject"></label>
      <label class="select-wrap"><span class="sr-only">Filter by grade</span><select data-change="grade"><option value="all">All grades</option>${[6, 8].map((value) => `<option value="${value}" ${String(value) === grade ? "selected" : ""}>Grade ${value}</option>`).join("")}</select>${icon("chevronDown", 15)}</label>
    </div><div id="catalog-results" aria-live="polite">${catalogResults(state, context, grade, query)}</div>`;
}

export function cartForm(state, context) {
  const items = cartItems(state, context);
  if (!items.length) return `<div class="form-body">${emptyState("bag", "Your book bag is empty", "Add a book from the library to place an order.")}</div>`;
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const branch = state.branches.find((item) => item.id === context.branch);
  return `<div class="form-body"><div class="cart-items">${items.map((item) => `<div class="cart-row">${iconTile("book", "green", "small-tile")}<div><strong>${e(item.title)}</strong><small>${money(item.price)} each</small></div>
    <div class="quantity-controls"><button type="button" data-action="decrease-book" data-value="${item.id}" aria-label="Remove one copy of ${e(item.title)}">${icon("minus", 15)}</button><span>${item.quantity}</span><button type="button" data-action="increase-book" data-value="${item.id}" aria-label="Add one copy of ${e(item.title)}" ${item.quantity >= 10 ? "disabled" : ""}>${icon("plus", 15)}</button></div></div>`).join("")}</div>
    <div class="cart-total"><span>Total</span><strong>${money(total)}</strong></div><div class="pickup-note">${icon("school", 18)}<span><strong>Collect at ${e(branch.school)}</strong><small>Pay at collection · Demo order</small></span></div>
    </div><footer class="dialog-actions">${button("Continue browsing", "close-dialog", { variant: "secondary" })}${button("Place order", "place-order", { iconName: "check" })}</footer>`;
}

export function orderHistory(state, context) {
  const orders = visibleOrders(state, context);
  if (!orders.length) return emptyState("package", "No book orders yet", "Orders placed through the parent portal will appear here.");
  return `<div class="orders-list">${[...orders].reverse().map((order) => `<article class="order-row">${iconTile("package", "green", "small-tile")}
    <div><strong>${e(order.number)}</strong><small>${e(order.date)} · ${e(state.branches.find((branch) => branch.id === order.branch)?.name)} · ${order.items.map((item) => `${e(item.title)} × ${item.quantity}`).join(", ")}</small></div>
    <div class="order-totals"><strong>${money(order.total)}</strong>${badge(order.status === "collected" ? "Collected" : "Awaiting collection", order.status === "collected" ? "neutral" : "green")}
    ${can(context, "library.manage") && order.status !== "collected" ? button("Mark collected", "collect-order", { value: order.number, variant: "secondary compact" }) : ""}</div></article>`).join("")}</div>`;
}

export function bookForm(book) {
  return `<form data-form="book"><input type="hidden" name="id" value="${book.id}"><div class="form-body">
    <label class="field">Book title<input name="title" required maxlength="80" value="${e(book.title)}"></label>
    <label class="field">Price in LKR<input name="price" type="number" min="1" max="100000" step="1" required value="${book.price}"></label>
    <label class="roster-check"><input name="available" type="checkbox" ${book.available ? "checked" : ""}>Available to order</label>
    <p class="form-error" role="alert" hidden></p></div><footer class="dialog-actions">${button("Cancel", "close-dialog", { variant: "secondary" })}<button class="button primary" type="submit">Save book</button></footer></form>`;
}
