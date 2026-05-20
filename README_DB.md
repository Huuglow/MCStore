# 🗄️ MidnightCaps.Mx — Guía de Base de Datos

Aquí tienes dos opciones para conectar tu inventario en tiempo real. Recomiendo **Supabase** por ser gratis, rápido y tener panel visual para actualizar stock fácilmente sin código.

---

## Opción 1: Supabase (Recomendada ⭐)

### Por qué Supabase
- Gratis hasta 500MB y 50,000 filas
- Panel web para actualizar stock sin código
- Actualización en tiempo real (realtime)
- Base de datos PostgreSQL profesional

### Pasos

**1. Crea tu cuenta**
Entra a https://supabase.com → "Start for free" → crea tu proyecto.

**2. Crea la tabla de productos**
En el panel de Supabase, ve a SQL Editor y ejecuta:

```sql
CREATE TABLE productos (
  id SERIAL PRIMARY KEY,
  brand TEXT NOT NULL,
  name TEXT NOT NULL,
  price INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  type TEXT CHECK (type IN ('snapback', 'fitted', 'dad')),
  badge TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Datos de ejemplo
INSERT INTO productos (brand, name, price, stock, type, badge) VALUES
  ('New Era', '9FIFTY Snapback Negro', 850, 12, 'snapback', 'new'),
  ('New Era', '59FIFTY Fitted Gris', 950, 3, 'fitted', null),
  ('Carhartt', 'Dad Hat Canvas Beige', 650, 8, 'dad', 'new');
```

**3. Obtén tus credenciales**
En Supabase: Settings → API → copia:
- `Project URL` (ej: https://xxxx.supabase.co)
- `anon public key`

**4. Reemplaza el mock data en index.html**

Busca este bloque en `index.html`:
```javascript
// ── PRODUCTOS (mock data — reemplaza con fetch a tu API/DB) ──
const PRODUCTS = [ ... ];
```

Y reemplázalo con:
```javascript
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU-ANON-KEY';

let PRODUCTS = [];

async function loadProducts() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/productos?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  PRODUCTS = await res.json();
  renderProducts(activeFilter);
}

loadProducts(); // llama al cargar la página
```

**5. Actualizar stock desde el panel**
En Supabase → Table Editor → tabla `productos` → edita directamente el valor de `stock`. ¡Sin código!

---

## Opción 2: Firebase Firestore

### Pasos

**1.** Crea proyecto en https://console.firebase.google.com

**2.** Activa Firestore Database (modo test para empezar)

**3.** Agrega documentos en colección `productos` con campos:
- `brand`, `name`, `price`, `stock`, `type`, `badge`

**4.** Agrega el SDK en `<head>` de index.html:
```html
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore-compat.js"></script>
```

**5.** Reemplaza el mock data:
```javascript
const firebaseConfig = {
  apiKey: "TU-API-KEY",
  projectId: "TU-PROYECTO"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let PRODUCTS = [];
db.collection('productos').onSnapshot(snapshot => {
  PRODUCTS = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderProducts(activeFilter);
});
```

---

## 🔄 Flujo de trabajo recomendado

```
Tu tienda física
     ↓  (vendes una gorra)
Supabase Panel Web  ← actualiza stock manualmente
     ↓  (fetch automático)
MidnightCaps.Mx  ← muestra stock actualizado en tiempo real
```

---

## 📦 Próximos pasos sugeridos

1. **Dominio**: Conecta midnightcaps.mx → despliega en Vercel (gratis)
2. **Pagos**: Integra MercadoPago (muy fácil en México)
3. **WhatsApp Business API**: Notificaciones de pedidos automáticas
4. **Imágenes**: Sube fotos reales de tus gorras a Supabase Storage

---

¿Tienes preguntas? El código en index.html está documentado para facilitar la integración.
