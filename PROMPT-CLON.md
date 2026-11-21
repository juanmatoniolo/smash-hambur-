# Prompt base: carta online con pedidos por WhatsApp + panel del dueño

> Copiá todo lo que está debajo de la línea en el nuevo proyecto. Completá primero el bloque "DATOS DEL CLIENTE". Lo que está entre `{{ }}` es variable.

---

Quiero que construyas una **carta/catálogo online para un comercio local**, mobile-first, donde el cliente arma su pedido y lo envía por **WhatsApp** al dueño, más un **panel privado** donde el dueño edita productos, precios, fotos, horarios y datos del local. No hay pagos online ni backend de pedidos: el pedido sale como mensaje de WhatsApp prearmado.

Es un producto que se vende a distintos comercios. Cada clon cambia **marca, colores, imágenes, rubro, categorías y opciones de personalización**, pero mantiene **todas las funcionalidades** descritas abajo. Toda la información variable del negocio debe vivir en un solo archivo de configuración (`src/lib/site.js`) y en la base de datos; nunca hardcodeada en componentes.

## DATOS DEL CLIENTE (completar)

- Nombre del comercio: `{{NOMBRE}}`
- Slug del local (a-z, 0-9, guiones): `{{slug-del-local}}`
- Rubro y qué vende: `{{ej: hamburguesería / pizzería / heladería / ropa / panadería}}`
- Ciudad y provincia: `{{CIUDAD}}, {{PROVINCIA}}` (país: `{{PAÍS}}`, zona horaria: `{{America/Argentina/Buenos_Aires}}`)
- URL final del sitio: `{{https://...}}`
- Descripción corta para SEO (máx. 155 caracteres): `{{...}}`
- Paleta: color primario oscuro `{{#......}}`, color de acento `{{#......}}`, fondo `{{#......}}`
- Tipografía (Google Fonts): `{{Poppins}}`
- Logo: `public/logo.png` (+ íconos PWA 192, 512 y maskable en `public/icons/`)
- Tono de voz: `{{ej: español rioplatense, voseo, informal y cálido ("Pedí", "Agregá")}}`
- Categorías (id + etiqueta, en orden): `{{ej: pizzas/Pizzas, empanadas/Empanadas, bebidas/Bebidas, otros/Otros}}`
- Opciones de personalización por categoría (si aplica): `{{ej: hamburguesas: cantidad de medallones 1 a 5 (cada extra suma $ configurable); hamburguesas y sandwiches: tipo de pan (uno base sin costo, otros con recargo configurable)}}`
- Métodos de entrega: `{{envío a domicilio / retiro en el local}}`
- Métodos de pago: `{{efectivo / transferencia (muestra alias)}}`

## Stack (mantener igual)

- **Next.js 14 App Router en JavaScript** (sin TypeScript), React 18.
- **CSS Modules** + `globals.css` con tokens de diseño en `:root` (colores, radios, sombras, alturas de header). Íconos con `lucide-react`.
- **Firebase Realtime Database** (datos) + **Firebase Auth** email/contraseña (panel).
- **Cloudinary** para fotos (subida unsigned desde el navegador con upload preset; borrado desde el servidor con API secret).
- **next-pwa** (instalable, deshabilitado en dev). Deploy en **Vercel**.
- ISR: páginas públicas con `revalidate = 60` y revalidación inmediata al guardar desde el panel.

### Variables de entorno

```
NEXT_PUBLIC_LOCAL_NAME=            # slug del local que publica este deploy
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=  # unsigned, sin asset_folder propio
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Estructura de carpetas

```
database.rules.json            # reglas de seguridad de Realtime Database (ver abajo)
firebase.json / .firebaserc
next.config.mjs                # next-pwa
PRODUCT.md                     # usuarios, propósito, marca, principios (para el diseño)
public/logo.png, public/icons/*

src/app/
  layout.jsx                   # fuente, metadata global (title template, OG, twitter, appleWebApp), viewport/themeColor
  globals.css                  # tokens de marca en :root + reset
  page.jsx                     # carta pública (server, revalidate 60) + JSON-LD Restaurant/LocalBusiness
  producto/[id]/page.jsx       # misma carta con un producto destacado (Spotlight), metadata y JSON-LD Product, generateStaticParams
  producto/[id]/opengraph-image.jsx  # imagen OG dinámica por producto (foto, nombre, precio)
  opengraph-image.jsx          # imagen OG del sitio
  comprar/page.jsx             # checkout (relee precios del server, nunca confía en localStorage)
  login/page.jsx               # ingreso al panel
  dashboard/page.jsx           # selector de locales / redirección / solicitud de acceso
  dashboard/layout.jsx         # noindex
  dashboard/[local]/layout.jsx # DashboardShell (navegación del panel, guard de acceso)
  dashboard/[local]/page.jsx   # lista de productos + estadísticas de visitas
  dashboard/[local]/agregar/page.jsx
  dashboard/[local]/editar/[id]/page.jsx
  dashboard/[local]/datos/page.jsx      # nombre, WhatsApp, dirección, alias, costo de envío, extras, redes
  dashboard/[local]/horarios/page.jsx   # franjas por día
  dashboard/admin/page.jsx     # superadmin: locales, usuarios, solicitudes
  api/revalidar/route.js       # POST autenticado -> revalidatePath("/", "layout")
  api/cloudinary/cleanup/route.js  # POST autenticado -> borra foto reemplazada si nadie más la usa
  api/locales/visitas/route.js # POST público -> suma 1 visita (total y por día)
  manifest.js, robots.js, sitemap.js

src/components/
  menu/      MenuApp, Hero, CategoryNav, ProductRow, ProductImage, ProductSheet, Spotlight,
             CartBar, InfoSheet, InstallApp, SiteFooter, VisitTracker, menu.module.css
  checkout/  CheckoutApp, CartLine, BuyerForm, message.js, checkout.module.css
  dashboard/ DashboardShell, ComidaForm, ImageUploader, PhotoEditor, PublishPreview, VisitStats, *.module.css
  admin/     AdminApp
  auth/      LoginForm
  ui/        Sheet (bottom sheet / dialog), Stepper (+/-), ShareButton
  Loading.jsx, BrandIcons.jsx

src/lib/
  site.js              # ÚNICO lugar de configuración del negocio (ver abajo)
  firebase.js          # initializeApp + getDatabase
  menu.js              # getLocal(): lee comidas, datos y horarios por separado (cache de React)
  menu-shared.js       # normalizeProduct() (runtime-agnóstico, sirve en edge para OG)
  cart.js              # carrito en localStorage con TTL 3 h, useSyncExternalStore, sync entre pestañas
  session.js           # login/logout/reset, useSession(), perfil, mensajes de error de Auth en español
  auth-server.js       # verifica el ID token leyendo usuarios/{uid}.json?auth=token (sin service account)
  admin-data.js        # CRUD del panel con sanitización + llamadas a /api/revalidar y /api/cloudinary/cleanup
  cloudinary-client.js # subida unsigned con progreso, carpeta <ROOT>/<local>, validación tipo/peso (10 MB)
  cloudinary-server.js # destroy si la foto ya no la usa ningún producto del local
  cloudinary-url.js    # cldUrl(url, "f_auto,q_auto,w_480"), publicIdFromUrl, cloudNameFromUrl
  jsonld.js, og.jsx
src/utils/horarios.js  # normalizar horarios, estado abierto/cerrado en zona horaria local
```

## `src/lib/site.js` (punto de personalización)

Debe exportar: `SITE_URL`, `SITE_NAME`, `SITE_CITY`, `SITE_DESCRIPTION`, `LOCAL` (desde `NEXT_PUBLIC_LOCAL_NAME`), `CATEGORIES` (array `{id,label}` en orden), `CATEGORY_ALIASES` + `categoryOf(raw)` (normaliza lo que escribe el dueño; desconocido cae en "otros"), las opciones de personalización del rubro (ej. `BREADS`, `MAX_MEATS`, `isCustomizable(product)`), `linePrice()` (precio unitario con extras), `formatPrice()` (Intl es-AR, sin decimales), `waNumber()` (normaliza teléfonos locales a formato internacional para wa.me; en Argentina 54 + 9 + área + número, quita 0 y 15), `whatsappOrderUrl()`, `whatsappShareUrl()`, `productUrl()`, `envioLabel()` (null = "A confirmar", 0 = "Gratis"), `instagramUrl()`, `facebookUrl()`, `fullAddress()` (agrega ciudad si falta), `mapsUrl()`.

## Modelo de datos (Firebase Realtime Database)

```
usuarios/{uid}: { nombre, email, superadmin: bool, locales: { "<slug>": true } }
solicitudes/{uid}: { email, nombre, fecha }          # usuario sin locales pide acceso
locales/{slug}/
  comidas/{pushId}: { nombre, descripcion, categoria, valor, oferta: bool, valorOferta, imagen (https) }
  datos: { nombre, whatsapp, direccion, alias, costoEnvio (null|número), extras: {...}, redes: { instagram, facebook } }
  horarios/{lunes..domingo}: { cerrado: bool, franjas: [{ desde: "HH:MM", hasta: "HH:MM" }] }  # máx 4 franjas, cruza medianoche si hasta <= desde
  visitas: { total, dias: { "YYYY-MM-DD": n } }
```

Reglas (`database.rules.json`), obligatorias:
- `comidas`, `datos`, `horarios`: lectura pública; escritura solo si `usuarios/{auth.uid}/locales/{slug} === true` o superadmin. Validar tipos, largos máximos, `$otro: false`, imagen vacía o `https://`, horas con regex `HH:MM`.
- `visitas`: escritura pública **solo de a +1** (`newData.val() === data.val() + 1`); lectura solo dueño/superadmin.
- `usuarios`, `solicitudes`, lista de `locales`: solo superadmin (cada usuario puede leer su propio perfil y escribir su propia solicitud con su email).
- El servidor usa la conexión anónima: solo lee lo público y suma visitas.

## Funcionalidades: carta pública

1. **Hero/header**: logo, nombre, estado **Abierto ahora / Cerrado** con detalle ("Cierra a las 23:30", "Abre mañana a las 20:00") calculado en la zona horaria del comercio, solo en cliente para evitar desajustes de hidratación. Tocar el estado abre **InfoSheet** con horarios de la semana, dirección (link a Google Maps) y redes.
2. **CategoryNav**: chips horizontales sticky con scrollspy (la sección que cruza el tercio superior queda activa y el chip se mantiene visible). Solo se muestran categorías con productos.
3. **ProductRow**: foto, nombre, descripción, precio; si hay oferta válida (`oferta && 0 < valorOferta < valor`) muestra precio tachado.
4. **ProductImage**: `<img>` lazy con fallback de marca; si es Cloudinary, pide versión redimensionada `f_auto,q_auto,w_...`.
5. **ProductSheet** (bottom sheet en móvil, diálogo centrado desde 768 px, basado en `<dialog>`): foto grande, opciones de personalización del rubro, aclaraciones (texto libre), cantidad con Stepper, precio recalculado en vivo, botón Agregar, botón **Compartir por WhatsApp** (mensaje que termina en la URL del producto para que se vea la vista previa).
6. **Página por producto** `/producto/[id]`: misma carta con el producto destacado arriba como H1 (Spotlight), metadata propia, OG image dinámica, JSON-LD Product. Sirve para compartir productos sueltos.
7. **CartBar**: barra fija abajo con cantidad y total, lleva a `/comprar`.
8. **Footer**: datos del local, redes, oferta discreta de **instalar la app** (PWA, sin popup).
9. **VisitTracker**: una visita por sesión de navegador vía `POST /api/locales/visitas`; ignora navegadores automatizados (`navigator.webdriver`).

## Funcionalidades: checkout `/comprar`

- Lista editable de líneas (cantidad, opciones, aclaraciones, eliminar). Los precios se **recalculan con los datos del servidor**; el localStorage solo guarda la selección.
- Formulario del comprador: nombre, entrega (envío con dirección + referencia, o retiro), pago (efectivo o transferencia mostrando alias con botón copiar).
- Subtotal, envío (`costoEnvio`: null = "A confirmar", 0 = "Gratis") y total.
- Botón final abre `wa.me/<número>?text=` con un mensaje en texto plano con negritas de WhatsApp (`*...*`): encabezado con nombre del local, cliente, entrega, dirección, pago, detalle por línea con opciones y aclaraciones, subtotal, envío y total ("Total sin envío" si el envío está a confirmar). El encoding se hace una sola vez.
- Si el local está cerrado, avisarlo sin bloquear el envío.

## Funcionalidades: panel `/dashboard`

- **Login** email/contraseña con persistencia local, recuperación de contraseña, errores de Firebase traducidos (credenciales, demasiados intentos, sin red, dominio no autorizado, método no habilitado).
- **Ruteo post-login**: un solo local -> directo a su panel; varios -> selector; superadmin -> todos + Administración; sin locales -> crea una solicitud de acceso y avisa.
- **Productos**: listado por categoría, crear, editar, borrar, marcar oferta. Al guardar: sanitiza (`cleanComida`), revalida el sitio (`/api/revalidar`) y, si cambió o se borró la foto, pide al server borrarla de Cloudinary si nadie más la usa. Ninguna de esas dos llamadas bloquea el guardado.
- **ImageUploader + PhotoEditor**: elegir o arrastrar foto, recortar/encuadrar a **4:3** (sirve para miniatura cuadrada, detalle 16:10 y tarjeta de compartir), subir a Cloudinary con barra de progreso, o pegar un link (acepta links de Google Drive y los convierte a URL directa; verifica que la imagen cargue).
- **PublishPreview**: vista previa del producto tal como se verá en la carta mientras se edita.
- **Datos del local**: nombre, WhatsApp, dirección, alias, costo de envío (vacío = a confirmar), precios de extras, redes.
- **Horarios**: por día, cerrado o hasta 4 franjas, soporta cruzar medianoche.
- **VisitStats**: visitas totales y por día.
- **Admin (superadmin)**: crear locales (slug validado, reservados: admin, login, api, nuevo), crear usuarios (con una segunda instancia de Firebase Auth en memoria para no cerrar la sesión del admin, y mail de reseteo opcional), asignar locales, dar superadmin, ver y resolver solicitudes.
- Todo el panel con `robots: noindex`.

## SEO y compartir

- `metadata` con `metadataBase`, title template `%s | {{NOMBRE}}`, canonical, Open Graph `es_AR`, Twitter `summary_large_image`.
- OG images generadas (`next/og`) con la fuente de marca embebida (`src/assets/og/*.woff`).
- JSON-LD: Restaurant/LocalBusiness en home (dirección, teléfono, horarios, menú) y Product por producto.
- `sitemap.js` con home + todos los productos; `robots.js` bloquea `/dashboard`, `/login`, `/api`.
- `manifest.js` con colores de marca, `display: standalone`, íconos 192/512/maskable.

## Principios de diseño y calidad

1. **Phone first**: cada decisión se juzga a 360-430 px de ancho y con un pulgar. Áreas táctiles de 44 px mínimo.
2. **El pedido tiene que llegar a WhatsApp completo y correcto.**
3. **Los datos del dueño son la fuente de verdad**: dirección, WhatsApp, alias, redes, precios y horarios salen siempre de la base. No inventar reseñas, tiempos de entrega ni precios.
4. **Compartible y encontrable**: cada link compartido y cada resultado de Google muestra la marca real.
5. Colores solo vía tokens CSS en `:root` (cambiar la marca = cambiar tokens + logo + `site.js`).
6. Contraste AA, foco visible, `<dialog>` para sheets, imágenes con `alt`.
7. Textos en el tono de voz del cliente.

## Checklist para dar de alta un clon nuevo

1. Clonar este proyecto base, crear proyecto Firebase (Realtime DB + Auth email) o reutilizar el multi-local existente con un slug nuevo.
2. Publicar `database.rules.json`. Agregar el dominio del deploy en Auth > Authorized domains.
3. Cloudinary: upload preset unsigned sin asset_folder; carpeta `<ROOT>/<slug>`.
4. Completar `site.js` (nombre, URL, ciudad, descripción, categorías, opciones del rubro), tokens de color en `globals.css`, `themeColor` en `layout.jsx` y `manifest.js`, logo e íconos, fuente.
5. Variables de entorno en Vercel con `NEXT_PUBLIC_LOCAL_NAME={{slug}}`.
6. Desde `/dashboard/admin`: crear el local y el usuario del dueño, asignárselo.
7. El dueño carga datos, horarios y productos. Verificar: estado abierto/cerrado, pedido de prueba por WhatsApp, vista previa al compartir un producto, instalación PWA, Lighthouse móvil.

Empezá leyendo este documento entero, proponé el `site.js` y los tokens de color para este cliente, y después implementá en este orden: config y datos -> carta pública -> checkout -> panel -> admin -> SEO/OG/PWA.
