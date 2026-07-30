# 1000 Prompts de IA — Landing Page

Landing page profesional y de alta conversión para vender el ebook digital
**“1000 Prompts de IA para Todos los Nichos”**. Escrita en español neutro para toda
América Latina, con HTML5, CSS3 y JavaScript puro (sin frameworks).

---

## 🗂 Estructura del proyecto

```
/
│ index.html
│ README.md
│
├── css/
│     style.css          → estilos principales
│     responsive.css     → media queries (tablet y celular)
│
├── js/
│     script.js          → acordeón, animaciones, año automático, botón de compra
│
├── images/
│     ebook-cover.svg     → portada del ebook (hero)
│     og-image.png        → imagen para redes sociales (1200×630)
│     favicon.svg         → ícono del sitio
│
└── assets/               → carpeta para archivos adicionales
```

Todo el CSS está en la carpeta `css/` y todo el JavaScript en `js/script.js`.
No hay CSS ni JS dentro del HTML. Todas las rutas son relativas.

---

## 🚀 Cómo publicar

### Opción 1 — GitHub + Vercel (recomendado)

1. Crea un repositorio nuevo en GitHub y sube todos los archivos.
2. Entra en [vercel.com](https://vercel.com) e inicia sesión con tu cuenta de GitHub.
3. Haz clic en **New Project** e importa el repositorio.
4. No necesitas configurar nada: Vercel detecta un sitio estático.
5. Haz clic en **Deploy**. En segundos tu página estará en línea.

### Opción 2 — Prueba local

Abre `index.html` directamente en tu navegador, o usa un servidor local:

```bash
# con Python
python3 -m http.server 8000
# luego abre http://localhost:8000
```

---

## ✏️ Personalización rápida

| Qué cambiar | Dónde |
|---|---|
| Enlace de pago (Hotmart, Kiwify, Paddle, Stripe…) | `js/script.js` → variable `CHECKOUT_URL` |
| Precio | `index.html` → sección `#comprar` y el bloque Schema.org |
| Nombre del ebook | busca y reemplaza el título en `index.html` |
| Dominio (SEO y Open Graph) | reemplaza `https://tu-dominio.com/` en `index.html` |
| Colores de marca | `css/style.css` → sección `:root` (variables) |
| Testimonios | `index.html` → sección `.testimonios` |

### Conectar el botón de compra

En `js/script.js`, pega el enlace de tu pasarela de pago:

```js
var CHECKOUT_URL = "https://pay.hotmart.com/TU-PRODUCTO";
```

---

## ✅ Incluye

- **SEO**: meta title, meta description, keywords, Open Graph, Twitter Card y Schema.org (Product).
- **Rendimiento**: código limpio, `lazy loading` en imágenes, fuentes con `preconnect`, imágenes SVG ligeras.
- **Accesibilidad**: etiquetas ARIA, `alt` en imágenes, jerarquía correcta de encabezados y foco visible por teclado.
- **Responsivo**: se adapta a computadora, tablet y celular.
- **Copywriting**: estructura AIDA + PAS + storytelling para maximizar conversión.

---

## ⚠️ Nota importante sobre los testimonios

Los testimonios incluidos son **ejemplos de demostración**. Antes de publicar,
reemplázalos por testimonios **reales** de tus clientes. Publicar testimonios
falsos puede ser considerado publicidad engañosa en muchos países.

Lo mismo aplica a la calificación (`aggregateRating`) del Schema.org: ajústala
a tus datos reales o elimínala si aún no tienes reseñas.

---

## 📄 Licencia

Puedes usar y modificar esta página libremente para tu propio producto.
