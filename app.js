/* =============================================
   MidnightCaps.Mx — Lógica Principal
   app.js
   ============================================= */

/* ── SUPABASE CONFIG ── */
const SUPABASE_URL = 'https://wvfdlggqfxsvqowtrkfm.supabase.co';
const SUPABASE_KEY = 'sb_publishable_kSIUmiuSeoccmKKfGozxiA_BvmE9F6A';

/* ── ESTADO ── */
let PRODUCTS = [];
let cart     = [];

/* ── HELPERS ── */
function stockLabel(n) {
  if (n === 0) return { text: 'Agotado',       cls: 'stock-out' };
  if (n <= 3)  return { text: `Ultimas ${n}`,  cls: 'stock-low' };
  return              { text: `${n} disponibles`, cls: 'stock-ok' };
}

function capSVG() {
  return `<svg viewBox="0 0 80 60" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 40 Q40 10 70 40 L70 55 Q40 50 10 55 Z" fill="currentColor"/>
    <rect x="5" y="52" width="70" height="6" rx="3" fill="currentColor"/>
    <path d="M40 14 L40 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

/* ── CARGAR PRODUCTOS DESDE SUPABASE ── */
async function loadProducts() {
  const grid = document.getElementById('productsGrid');

  // Estado de carga
  grid.innerHTML = `
    <div style="grid-column:1/-1; text-align:center; padding:60px 0; color:#666;
                font-family:'Barlow Condensed',sans-serif; letter-spacing:3px;
                font-size:13px; text-transform:uppercase;">
      Cargando colección...
    </div>`;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/productos?select=*&order=id.asc`,
      {
        headers: {
          'apikey':        SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type':  'application/json',
        }
      }
    );

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    PRODUCTS = await res.json();

    if (PRODUCTS.length === 0) {
      grid.innerHTML = `
        <div style="grid-column:1/-1; text-align:center; padding:60px 0; color:#666;
                    font-family:'Barlow Condensed',sans-serif; letter-spacing:3px;
                    font-size:13px; text-transform:uppercase;">
          No hay productos disponibles por el momento.
        </div>`;
      return;
    }

    renderProducts();

  } catch (err) {
    console.error('Error cargando productos:', err);
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 0; color:#666;
                  font-family:'Barlow Condensed',sans-serif; letter-spacing:3px;
                  font-size:13px; text-transform:uppercase;">
        Error cargando productos. Intenta recargar la pagina.
      </div>`;
  }
}

/* ── RENDERIZAR PRODUCTOS ── */
function renderProducts() {
  const grid = document.getElementById('productsGrid');

  grid.innerHTML = PRODUCTS.map(p => {
    const s = stockLabel(p.stock);

    // Badge: prioriza el campo de DB, si es null y stock=0 muestra Agotado
    const badgeHTML = (p.badge && p.badge.toLowerCase() === 'new')
      ? '<span class="product-badge badge-new">Nuevo</span>'
      : p.stock === 0
        ? '<span class="product-badge badge-soldout">Agotado</span>'
        : '';

    // Imagen: usa image_url de Supabase si existe, si no muestra el SVG placeholder
    const imgContent = p.image_url
      ? `<img src="${p.image_url}" alt="${p.name}"
              style="width:100%;height:100%;object-fit:cover;" />`
      : capSVG();

    return `
      <div class="product-card">
        <div class="product-img-wrap">
          <div class="product-img-bg">${imgContent}</div>
          ${badgeHTML}
          <div class="product-overlay">
            <button
              class="btn-add"
              ${p.stock === 0 ? 'disabled' : ''}
              onclick="addToCart(${p.id}, event)"
            >
              ${p.stock === 0 ? 'Sin Stock' : '+ Agregar'}
            </button>
          </div>
        </div>
        <div class="product-info">
          <div class="product-brand">${p.brand}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-footer">
            <div>
              <span class="product-price">$${p.price}</span>
              <span class="price-og">MXN</span>
            </div>
            <span class="product-stock ${s.cls}">${s.text}</span>
          </div>
        </div>
      </div>`;
  }).join('');
}

/* ── CARRITO: AGREGAR ── */
function addToCart(id, e) {
  e.stopPropagation();
  const product = PRODUCTS.find(p => p.id === id);
  if (!product || product.stock === 0) return;

  const existing = cart.find(i => i.id === id);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartUI();
  openCart();
}

/* ── CARRITO: ELIMINAR ── */
function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

/* ── CARRITO: CAMBIAR CANTIDAD ── */
function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

/* ── CARRITO: ACTUALIZAR UI ── */
function updateCartUI() {
  const count    = cart.reduce((s, i) => s + i.qty, 0);
  const total    = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const itemsEl  = document.getElementById('cartItems');
  const footerEl = document.getElementById('cartFooter');

  document.getElementById('cartCount').textContent = count;
  document.getElementById('cartTotal').textContent = '$' + total.toLocaleString('es-MX');

  if (cart.length === 0) {
    itemsEl.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">&#x1F9E2;</div>
        <span>Tu carrito esta vacio</span>
      </div>`;
    footerEl.style.display = 'none';
    return;
  }

  footerEl.style.display = 'block';
  itemsEl.innerHTML = cart.map(i => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${i.image_url
          ? `<img src="${i.image_url}" alt="${i.name}" style="width:100%;height:100%;object-fit:cover;"/>`
          : '&#x1F9E2;'}
      </div>
      <div class="cart-item-info">
        <div class="cart-item-name">${i.name}</div>
        <div class="cart-item-price">$${(i.price * i.qty).toLocaleString('es-MX')} MXN</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${i.id}, -1)">&#x2212;</button>
          <span class="qty-num">${i.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i.id},  1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${i.id})">&#x2715;</button>
    </div>`).join('');
}

/* ── CARRITO: ABRIR / CERRAR ── */
function openCart() {
  document.getElementById('cartDrawer').classList.add('open');
  document.getElementById('cartOverlay').classList.add('open');
}

function toggleCart() {
  document.getElementById('cartDrawer').classList.toggle('open');
  document.getElementById('cartOverlay').classList.toggle('open');
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
});