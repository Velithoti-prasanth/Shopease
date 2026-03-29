/* ── ShopEase — core state & utilities ────────── */
const SE = (() =>{
const user = JSON.parse(localStorage.getItem('shopease_user')) || {};



let state = {
  cart: [],
  wishlist: [],
  orders: [],
  theme: localStorage.getItem('se_theme') || 'light',
};

if (user && user.email) {
  state.cart = JSON.parse(localStorage.getItem(`se_cart_${user.email}`) || '[]');
  state.wishlist = JSON.parse(localStorage.getItem(`se_wishlist_${user.email}`) || '[]');
  state.orders = JSON.parse(localStorage.getItem(`se_orders_${user.email}`) || '[]');
}
const save = () => {
  if (!user || !user.email) {
    console.error("User not logged in");
    return;
  }

  localStorage.setItem(`se_cart_${user.email}`, JSON.stringify(state.cart));
  localStorage.setItem(`se_wishlist_${user.email}`, JSON.stringify(state.wishlist));
  localStorage.setItem(`se_orders_${user.email}`, JSON.stringify(state.orders));
};

  /* ── Theme ─────────────────────────────────────── */
  const applyTheme = (t) => {
    document.documentElement.setAttribute('data-theme', t);
    state.theme = t;
    localStorage.setItem('se_theme', t);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.innerHTML = t === 'dark' ? '☀️' : '🌙';
  };

  const toggleTheme = () => applyTheme(state.theme === 'dark' ? 'light' : 'dark');

  /* ── Toast ─────────────────────────────────────── */
  const toast = (msg, type = 'default', icon = '🛒') => {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      document.body.appendChild(container);
    }
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icons = { success: '✅', error: '❌', info: 'ℹ️', default: icon };
    el.innerHTML = `<span class="toast-icon">${icons[type] || icon}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 260);
    }, 3000);
  };

  /* ── Cart ──────────────────────────────────────── */
  const cartAdd = (product) => {
    const existing = state.cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty++;
      toast(`Quantity updated (${existing.qty})`, 'info', '🛒');
    } else {
      state.cart.push({ ...product, qty: 1 });
      toast(`${product.title.slice(0, 30)}… added to cart`, 'success');
    }
    save();
    updateCartBadge();
  };

  const cartRemove = (id) => {
    state.cart = state.cart.filter(i => i.id !== id);
    save();
    updateCartBadge();
  };

  const cartQty = (id, delta) => {
    const item = state.cart.find(i => i.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) cartRemove(id);
    else { save(); updateCartBadge(); }
  };

  const cartTotal = () => state.cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
  const cartCount = () => state.cart.reduce((s, i) => s + i.qty, 0);

  const updateCartBadge = () => {
    const badges = document.querySelectorAll('.cart-badge');
    const count = cartCount();
    badges.forEach(b => {
      b.textContent = count;
      b.classList.toggle('show', count > 0);
    });
  };

  /* ── Wishlist ──────────────────────────────────── */
  const wishToggle = (product) => {
    const idx = state.wishlist.findIndex(i => i.id === product.id);
    if (idx > -1) {
      state.wishlist.splice(idx, 1);
      toast('Removed from wishlist', 'info', '💔');
    } else {
      state.wishlist.push(product);
      toast('Added to wishlist', 'success', '❤️');
    }
    save();
    updateWishBadge();
    return idx === -1;
  };

  const isWished = (id) => state.wishlist.some(i => i.id === id);

  const updateWishBadge = () => {
    const badges = document.querySelectorAll('.wish-badge');
    const count = state.wishlist.length;
    badges.forEach(b => {
      b.textContent = count;
      b.classList.toggle('show', count > 0);
    });
  };

  /* ── Orders ────────────────────────────────────── */
  const placeOrder = () => {
    if (!state.cart.length) return false;
    const order = {
      id: 'ORD-' + Date.now().toString(36).toUpperCase(),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      items: [...state.cart],
      total: cartTotal(),
      status: 'Confirmed'
    };
    state.orders.unshift(order);
    state.cart = [];
    save();
    updateCartBadge();
    return order;
  };

  /* ── Stars renderer ────────────────────────────── */
  const stars = (rating) => {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    let s = '';
    for (let i = 0; i < full; i++) s += '★';
    if (half) s += '½';
    for (let i = full + (half ? 1 : 0); i < 5; i++) s += '☆';
    return s;
  };

  /* ── Fetch products ────────────────────────────── */
  const fetchProducts = async () => {
    const res = await fetch('https://fakestoreapi.com/products');
    return res.json();
  };

  const fetchCategories = async () => {
    const res = await fetch('https://fakestoreapi.com/products/categories');
    return res.json();
  };

  /* ── Init ──────────────────────────────────────── */
  const init = () => {
    applyTheme(state.theme);
    updateCartBadge();
    updateWishBadge();

    const toggle = document.getElementById('theme-toggle');
    if (toggle) toggle.addEventListener('click', toggleTheme);
  };

  return {
    state, toast, cartAdd, cartRemove, cartQty, cartTotal, cartCount,
    updateCartBadge, wishToggle, isWished, updateWishBadge,
    placeOrder, stars, fetchProducts, fetchCategories, applyTheme, init
  };
})();

document.addEventListener('DOMContentLoaded', SE.init);