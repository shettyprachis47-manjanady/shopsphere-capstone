const STORAGE_KEYS = { products: "shopsphere_products_v1", cart: "shopsphere_cart_v1", users: "shopsphere_users_v1", session: "shopsphere_session_v1" };

const starterProducts = [
  {id:"p101",name:"Everyday Ceramic Mug",category:"Home",price:18.00,image:"https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=700&q=85",description:"A lovely little mug for slow mornings.",rating:"4.9",badge:"BESTSELLER"},
  {id:"p102",name:"Cloud Knit Throw",category:"Home",price:54.00,image:"https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=700&q=85",description:"Soft texture for a softer landing.",rating:"4.8",badge:"COZY PICK"},
  {id:"p103",name:"Studio Wireless Headphones",category:"Tech",price:89.00,image:"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=700&q=85",description:"Your soundtrack, wherever you go.",rating:"4.7",badge:"TOP RATED"},
  {id:"p104",name:"Daily Carry Tote",category:"Style",price:32.00,image:"https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=700&q=85",description:"Room for all the everyday essentials.",rating:"4.8",badge:"EVERYDAY"},
  {id:"p105",name:"Botanical Face Oil",category:"Wellness",price:26.00,image:"https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=700&q=85",description:"A calming step in your daily ritual.",rating:"4.6",badge:"SELF CARE"},
  {id:"p106",name:"Minimal Desk Lamp",category:"Home",price:47.00,image:"https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=700&q=85",description:"A warm glow for late-night ideas.",rating:"4.9",badge:"DESIGN PICK"},
  {id:"p107",name:"Pocket Bluetooth Speaker",category:"Tech",price:39.00,image:"https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=700&q=85",description:"Big energy in a small package.",rating:"4.7",badge:"ON THE GO"},
  {id:"p108",name:"Sculpted Everyday Bottle",category:"Wellness",price:24.00,image:"https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=85",description:"A hydration companion that goes anywhere.",rating:"4.8",badge:"GOOD HABIT"}
];

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const money = (value) => new Intl.NumberFormat("en-US", {style:"currency",currency:"USD"}).format(Number(value) || 0);
const safeParse = (value, fallback) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const readStore = (key, fallback) => safeParse(localStorage.getItem(key), fallback);
const writeStore = (key, value) => localStorage.setItem(key, JSON.stringify(value));
const makeId = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));

let products = readStore(STORAGE_KEYS.products, null);
if (!Array.isArray(products)) { products = starterProducts; writeStore(STORAGE_KEYS.products, products); }
let cart = readStore(STORAGE_KEYS.cart, []);
if (!Array.isArray(cart)) cart = [];
let users = readStore(STORAGE_KEYS.users, []);
if (!Array.isArray(users)) users = [];
let session = readStore(STORAGE_KEYS.session, null);
let activeCategory = "All";
let searchTerm = "";
let authMode = "login";
let toastTimer;

const productGrid = $("#productGrid");
const overlay = $("#overlay");
const cartDrawer = $("#cartDrawer");
const authDialog = $("#authDialog");

function toast(message) {
  const node = $("#toast");
  node.textContent = message;
  node.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => node.classList.remove("show"), 2500);
}

function productImage(product) {
  return escapeHTML(product.image || "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=700&q=80");
}

function getVisibleProducts() {
  let visible = products.filter(product => {
    const matchesCategory = activeCategory === "All" || product.category === activeCategory;
    const searchable = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return matchesCategory && searchable.includes(searchTerm.toLowerCase());
  });
  const sort = $("#sortSelect").value;
  if (sort === "price-low") visible.sort((a,b) => Number(a.price)-Number(b.price));
  if (sort === "price-high") visible.sort((a,b) => Number(b.price)-Number(a.price));
  if (sort === "name") visible.sort((a,b) => a.name.localeCompare(b.name));
  return visible;
}

function renderProducts() {
  const visible = getVisibleProducts();
  $("#resultsSummary").textContent = `${visible.length} ${visible.length === 1 ? "find" : "finds"} to explore`;
  $("#emptyState").classList.toggle("hidden", visible.length > 0);
  productGrid.classList.toggle("hidden", visible.length === 0);
  productGrid.innerHTML = visible.map(product => `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${productImage(product)}" alt="${escapeHTML(product.name)}" loading="lazy" onerror="this.onerror=null;this.src='https://placehold.co/600x700/f0ede8/625f5b?text=ShopSphere'">
        <span class="product-badge">${escapeHTML(product.badge || product.category.toUpperCase())}</span>
        <button class="quick-add" type="button" data-add="${escapeHTML(product.id)}" aria-label="Add ${escapeHTML(product.name)} to cart">+</button>
      </div>
      <div class="product-info">
        <div class="product-meta"><span>${escapeHTML(product.category)}</span><span class="rating">★ ${escapeHTML(product.rating || "4.8")}</span></div>
        <h3>${escapeHTML(product.name)}</h3><p class="product-description">${escapeHTML(product.description)}</p>
        <div class="product-bottom"><span class="product-price">${money(product.price)}</span><span class="product-colors" aria-label="Neutral color options"><span></span><span style="background:#d7c8a9"></span><span style="background:#8f9b87"></span></span></div>
      </div>
    </article>`).join("");
}

function persistProducts() {
  writeStore(STORAGE_KEYS.products, products);
  renderProducts();
  renderAdminRows();
}

function addToCart(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  const line = cart.find(item => item.id === id);
  if (line) line.quantity += 1;
  else cart.push({id, quantity:1});
  writeStore(STORAGE_KEYS.cart, cart);
  renderCart();
  toast(`${product.name} added to your bag`);
}

function cartQuantity() {
  return cart.reduce((total, item) => total + item.quantity, 0);
}

function renderCart() {
  cart = cart.filter(line => products.some(product => product.id === line.id) && line.quantity > 0);
  writeStore(STORAGE_KEYS.cart, cart);
  const count = cartQuantity();
  $("#cartCount").textContent = count;
  $("#drawerCartCount").textContent = `(${count})`;
  const lines = cart.map(line => ({...line, product: products.find(product => product.id === line.id)}));
  $("#cartItems").innerHTML = lines.map(line => `
    <article class="cart-line">
      <img src="${productImage(line.product)}" alt="${escapeHTML(line.product.name)}" onerror="this.onerror=null;this.src='https://placehold.co/100x120/f0ede8/625f5b?text=Item'">
      <div><span class="cart-category">${escapeHTML(line.product.category)}</span><h3>${escapeHTML(line.product.name)}</h3><span class="cart-price">${money(line.product.price)}</span>
        <div class="quantity-control"><button type="button" data-quantity="${line.id}" data-change="-1" aria-label="Decrease quantity of ${escapeHTML(line.product.name)}">−</button><span>${line.quantity}</span><button type="button" data-quantity="${line.id}" data-change="1" aria-label="Increase quantity of ${escapeHTML(line.product.name)}">+</button></div>
        <button class="remove-item" type="button" data-remove="${line.id}">Remove</button>
      </div><strong class="cart-price">${money(line.product.price * line.quantity)}</strong>
    </article>`).join("");
  $("#cartEmpty").classList.toggle("hidden", cart.length > 0);
  $("#cartItems").classList.toggle("hidden", cart.length === 0);
  $("#cartSubtotal").textContent = money(lines.reduce((sum,line) => sum + line.product.price * line.quantity,0));
  $("#checkoutButton").disabled = cart.length === 0;
  $("#checkoutButton").style.opacity = cart.length === 0 ? ".5" : "1";
}

function openCart() {
  overlay.classList.remove("hidden");
  cartDrawer.classList.add("open");
  cartDrawer.setAttribute("aria-hidden","false");
  document.body.classList.add("drawer-open");
  $("#closeCartButton").focus();
}
function closeCart() {
  cartDrawer.classList.remove("open");
  cartDrawer.setAttribute("aria-hidden","true");
  overlay.classList.add("hidden");
  document.body.classList.remove("drawer-open");
  $("#cartButton").focus();
}

function renderAdminRows() {
  $("#adminProductRows").innerHTML = products.map(product => `
    <tr><td><div class="table-product"><img src="${productImage(product)}" alt=""><span>${escapeHTML(product.name)}</span></div></td>
    <td>${escapeHTML(product.category)}</td><td>${money(product.price)}</td>
    <td><div class="table-actions"><button type="button" data-edit="${escapeHTML(product.id)}">Edit</button><button type="button" class="delete-button" data-delete="${escapeHTML(product.id)}">Delete</button></div></td></tr>`).join("");
}

function resetProductForm() {
  $("#productForm").reset();
  $("#productId").value = "";
  $("#saveProductButton").textContent = "Add product";
  $("#cancelEditButton").classList.add("hidden");
  $("#formMessage").textContent = "";
}

function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;
  $("#productId").value = product.id;
  $("#productName").value = product.name;
  $("#productCategory").value = product.category;
  $("#productPrice").value = product.price;
  $("#productImage").value = product.image || "";
  $("#productDescription").value = product.description;
  $("#saveProductButton").textContent = "Save changes";
  $("#cancelEditButton").classList.remove("hidden");
  $("#adminSection").scrollIntoView({behavior:"smooth"});
  $("#productName").focus({preventScroll:true});
}

function handleProductSubmit(event) {
  event.preventDefault();
  const id = $("#productId").value;
  const name = $("#productName").value.trim();
  const category = $("#productCategory").value;
  const price = Number($("#productPrice").value);
  const image = $("#productImage").value.trim();
  const description = $("#productDescription").value.trim();
  if (!name || !description || !Number.isFinite(price) || price <= 0) {
    $("#formMessage").textContent = "Please enter valid product details.";
    return;
  }
  if (image && !/^https?:\/\//i.test(image)) {
    $("#formMessage").textContent = "Image URL must start with http:// or https://.";
    return;
  }
  if (id) {
    products = products.map(product => product.id === id ? {...product,name,category,price,image: image || product.image,description} : product);
    $("#formMessage").textContent = "Product updated successfully.";
    toast("Product updated");
  } else {
    products.unshift({id:makeId(),name,category,price,image:image || "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=700&q=80",description,rating:"New",badge:"NEW FIND"});
    $("#formMessage").textContent = "Product added successfully.";
    toast("Product added to the collection");
  }
  writeStore(STORAGE_KEYS.products,products);
  resetProductForm();
  renderProducts();
  renderAdminRows();
  renderCart();
}

function setAuthMode(mode) {
  authMode = mode;
  $$(".auth-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.authMode === mode));
  $("#authTitle").innerHTML = mode === "login" ? "Good to see <em>you.</em>" : "Make yourself <em>at home.</em>";
  $("#authNameField").classList.toggle("hidden", mode === "login");
  $("#authName").required = mode === "register";
  $("#authPassword").autocomplete = mode === "login" ? "current-password" : "new-password";
  $("#authSubmitButton").textContent = mode === "login" ? "Sign in ↗" : "Create account ↗";
  $("#authMessage").textContent = "";
}

function updateAccountUI() {
  $("#accountLabel").textContent = session ? (session.name || "My account") : "Sign in";
}

function handleAuthSubmit(event) {
  event.preventDefault();
  const email = $("#authEmail").value.trim().toLowerCase();
  const password = $("#authPassword").value;
  const name = $("#authName").value.trim();
  $("#authMessage").textContent = "";
  if (authMode === "register") {
    if (!name) { $("#authMessage").textContent = "Please enter your name."; return; }
    if (users.some(user => user.email === email)) { $("#authMessage").textContent = "An account with this email already exists. Please sign in."; return; }
    users.push({id:makeId(),name,email,password});
    writeStore(STORAGE_KEYS.users,users);
    session = {name,email};
    writeStore(STORAGE_KEYS.session,session);
    authDialog.close();
    updateAccountUI();
    toast(`Welcome to ShopSphere, ${name}!`);
  } else {
    const user = users.find(item => item.email === email && item.password === password);
    if (!user) { $("#authMessage").textContent = "Account not found. Create a demo account or check your details."; return; }
    session = {name:user.name,email:user.email};
    writeStore(STORAGE_KEYS.session,session);
    authDialog.close();
    updateAccountUI();
    toast(`Welcome back, ${user.name}!`);
  }
}

function openAuth() {
  if (session) {
    const shouldLogout = window.confirm(`Signed in as ${session.name} (${session.email}). Sign out?`);
    if (shouldLogout) {
      session = null;
      localStorage.removeItem(STORAGE_KEYS.session);
      updateAccountUI();
      toast("You have signed out.");
    }
    return;
  }
  setAuthMode("login");
  $("#authForm").reset();
  authDialog.showModal();
  $("#authEmail").focus();
}

$("#searchForm").addEventListener("submit", event => {
  event.preventDefault();
  searchTerm = $("#searchInput").value.trim();
  renderProducts();
  $("#catalog").scrollIntoView({behavior:"smooth"});
});
$("#searchInput").addEventListener("input", event => { searchTerm = event.target.value.trim(); renderProducts(); });
$("#categoryFilters").addEventListener("click", event => {
  const button = event.target.closest("[data-category]");
  if (!button) return;
  activeCategory = button.dataset.category;
  $$(".filter-chip").forEach(chip => chip.classList.toggle("active", chip === button));
  renderProducts();
});
$("#sortSelect").addEventListener("change", renderProducts);
$("#productGrid").addEventListener("click", event => {
  const button = event.target.closest("[data-add]");
  if (button) addToCart(button.dataset.add);
});
$("#resetFiltersButton").addEventListener("click", () => {
  activeCategory = "All"; searchTerm = ""; $("#searchInput").value = ""; $("#sortSelect").value = "featured";
  $$(".filter-chip").forEach(chip => chip.classList.toggle("active", chip.dataset.category === "All"));
  renderProducts();
});
$("#shopNowButton").addEventListener("click", () => $("#catalog").scrollIntoView({behavior:"smooth"}));
$("#cartButton").addEventListener("click", openCart);
$("#closeCartButton").addEventListener("click", closeCart);
$("#continueShoppingButton").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
$("#cartItems").addEventListener("click", event => {
  const quantityButton = event.target.closest("[data-quantity]");
  const removeButton = event.target.closest("[data-remove]");
  if (quantityButton) {
    const line = cart.find(item => item.id === quantityButton.dataset.quantity);
    if (!line) return;
    line.quantity += Number(quantityButton.dataset.change);
    if (line.quantity <= 0) cart = cart.filter(item => item.id !== line.id);
    writeStore(STORAGE_KEYS.cart,cart); renderCart();
  }
  if (removeButton) {
    cart = cart.filter(item => item.id !== removeButton.dataset.remove);
    writeStore(STORAGE_KEYS.cart,cart); renderCart(); toast("Item removed from your bag");
  }
});
$("#checkoutButton").addEventListener("click", () => {
  if (!cart.length) return;
  if (!session) { closeCart(); openAuth(); toast("Sign in to continue with the demo checkout."); return; }
  const total = cart.reduce((sum,line) => { const product = products.find(item => item.id === line.id); return sum + (product ? product.price * line.quantity : 0); },0);
  window.alert(`Demo checkout complete!\n\nOrder total: ${money(total)}\n\nNo payment was collected. This is a portfolio demonstration.`);
  cart = []; writeStore(STORAGE_KEYS.cart,cart); renderCart(); closeCart(); toast("Demo order placed successfully!");
});
$("#accountButton").addEventListener("click",openAuth);
$("#authForm").addEventListener("submit",handleAuthSubmit);
$("#closeAuthButton").addEventListener("click",() => authDialog.close());
$$(".auth-tab").forEach(tab => tab.addEventListener("click",() => setAuthMode(tab.dataset.authMode)));
$("#productForm").addEventListener("submit",handleProductSubmit);
$("#cancelEditButton").addEventListener("click",resetProductForm);
$("#adminProductRows").addEventListener("click",event => {
  const edit = event.target.closest("[data-edit]");
  const del = event.target.closest("[data-delete]");
  if (edit) editProduct(edit.dataset.edit);
  if (del) {
    const product = products.find(item => item.id === del.dataset.delete);
    if (!product) return;
    if (window.confirm(`Delete "${product.name}" from the collection?`)) {
      products = products.filter(item => item.id !== product.id);
      cart = cart.filter(item => item.id !== product.id);
      persistProducts(); renderCart(); toast("Product deleted");
    }
  }
});
$("#newsletterForm").addEventListener("submit",event => {
  event.preventDefault();
  const email = $("#newsletterEmail").value.trim();
  $("#newsletterMessage").textContent = `Thanks! ${email} has been added to this demo list.`;
  event.target.reset();
});
document.addEventListener("keydown",event => { if (event.key === "Escape" && cartDrawer.classList.contains("open")) closeCart(); });
$("#currentYear").textContent = new Date().getFullYear();

renderProducts();
renderAdminRows();
renderCart();
updateAccountUI();
setAuthMode("login");
