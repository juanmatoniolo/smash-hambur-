// Único punto de configuración del negocio.
// Cambiar de cliente = editar este archivo + tokens de color en globals.css + logo/íconos.
// Los datos que el dueño edita (WhatsApp, dirección, alias, redes, precios, horarios)
// viven en Firebase y NUNCA se escriben acá.

// URL pública: NEXT_PUBLIC_SITE_URL si está cargada (dominio propio); si no, el dominio de
// producción que Vercel expone en el build; en local, localhost. Las imágenes al compartir
// necesitan una URL absoluta real: con localhost WhatsApp no muestra la vista previa.
function resolveSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || "";
  const vercel = process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  // Si en Vercel quedó cargada la URL de desarrollo (localhost), se ignora: rompería las vistas previas.
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/i.test(explicit);
  if (explicit && !(isLocal && vercel)) return explicit;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
export const SITE_URL = resolveSiteUrl().replace(/\/+$/, "");
export const SITE_NAME = "Smash Burger El Toro";
export const SITE_SHORT_NAME = "El Toro";
export const SITE_CITY = "Chajarí";
export const SITE_PROVINCE = "Entre Ríos";
export const SITE_COUNTRY = "AR";
export const SITE_AREA_CODE = "3456"; // característica local, para normalizar teléfonos sin código de área
export const TIMEZONE = "America/Argentina/Buenos_Aires";
export const SITE_DESCRIPTION =
  "Smash burgers en Chajarí. Mirá la carta, armá tu pedido y mandalo por WhatsApp. Envío a domicilio o retiro en el local.";

// Colores de marca para manifest, themeColor y OG (la UI usa los tokens de globals.css).
export const BRAND = {
  black: "#000000",
  red: "#FB0102",
  cream: "#FDF6F0",
};

// Slug del local que publica este deploy.
export const LOCAL = process.env.NEXT_PUBLIC_LOCAL_NAME || "smash-burger";

// Carpeta raíz en Cloudinary: <ROOT>/<slug>
export const CLOUDINARY_ROOT = "CardCloude";

/* ---------------- Categorías ---------------- */

export const CATEGORIES = [
  { id: "hamburguesas", label: "Smash burgers" },
  { id: "papas", label: "Papas" },
  { id: "bebidas", label: "Bebidas" },
  { id: "otros", label: "Otros" },
];

export const CATEGORY_ALIASES = {
  hamburguesa: "hamburguesas",
  burger: "hamburguesas",
  burgers: "hamburguesas",
  smash: "hamburguesas",
  "smash burger": "hamburguesas",
  "smash burgers": "hamburguesas",
  papa: "papas",
  fritas: "papas",
  "papas fritas": "papas",
  acompanamientos: "papas",
  bebida: "bebidas",
  gaseosa: "bebidas",
  gaseosas: "bebidas",
  cerveza: "bebidas",
  cervezas: "bebidas",
  tragos: "bebidas",
};

export function slugText(raw) {
  return String(raw ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Normaliza lo que escribe el dueño. Desconocido cae en "otros". */
export function categoryOf(raw) {
  const s = slugText(raw);
  if (CATEGORIES.some((c) => c.id === s)) return s;
  return CATEGORY_ALIASES[s] || "otros";
}

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || "Otros";
}

/* ---------------- Personalización del rubro ---------------- */

// Carnes (medallones): cualquier producto con `medallones` cargado (1 a 4) deja elegir la cantidad.
// Las hamburguesas siempre dejan elegir (sin dato, base 1). El precio cargado es el de la base y
// cada opción suma la diferencia de MEAT_SURCHARGE. La base máxima es 3 para que haya algo que elegir.
export const MIN_MEATS = 1;
export const MAX_MEATS = 4;
export const MAX_BASE_MEATS = MAX_MEATS - 1;
export const MEAT_LABELS = { 1: "Simple", 2: "Doble", 3: "Triple", 4: "Cuádruple" };
// Recargo sobre el precio de 1 carne, para productos sin precio propio en `precios`.
export const MEAT_SURCHARGE = { 1: 0, 2: 3000, 3: 5000, 4: 7000 };
// Claves de `precios` en la base. Con texto y no números para que Firebase no lo convierta en array.
export const MEAT_PRICE_KEYS = { 2: "doble", 3: "triple", 4: "cuadruple" };

export function includesFries(product) {
  return product?.categoria === "hamburguesas";
}

/* ---------------- Medios de pago ---------------- */

export const PAYMENT_METHODS = [
  { id: "efectivo", label: "Efectivo" },
  { id: "transferencia", label: "Transferencia" },
  { id: "tarjeta", label: "Tarjeta" },
];

export function paymentLabel(id) {
  return PAYMENT_METHODS.find((m) => m.id === id)?.label || "Efectivo";
}

function validMeats(n) {
  return Number.isInteger(n) && n >= MIN_MEATS && n <= MAX_MEATS;
}

export function isCustomizable(product) {
  if (!product || product.categoria === "bebidas") return false;
  return product.categoria === "hamburguesas" || validMeats(Number(product.medallones));
}

export function baseMeats(product) {
  const n = Number(product?.medallones);
  return validMeats(n) ? n : MIN_MEATS;
}

export function meatLabel(n) {
  return MEAT_LABELS[n] || `${n} medallones`;
}

/* ---------------- Precios ---------------- */

export function hasOffer(p) {
  const v = Number(p?.valor);
  const o = Number(p?.valorOferta);
  return Boolean(p?.oferta) && o > 0 && o < v;
}

export function unitPrice(p) {
  return hasOffer(p) ? Number(p.valorOferta) : Number(p?.valor) || 0;
}

/** Precio unitario de una línea con sus opciones. */
export function linePrice(product, options = {}) {
  let price = unitPrice(product);
  if (isCustomizable(product)) {
    const base = baseMeats(product);
    const meats = clampMeats(options.meats ?? base, base);
    if (meats === base) return price;
    const own = Number(product.precios?.[MEAT_PRICE_KEYS[meats]]);
    // Con oferta, el precio propio mantiene el mismo descuento en pesos que el precio base.
    if (own > 0) return Math.max(0, own - (Number(product.valor) - price));
    price += MEAT_SURCHARGE[meats] - MEAT_SURCHARGE[base];
  }
  return price;
}

export function clampMeats(n, base = MIN_MEATS) {
  const v = Math.round(Number(n));
  if (!Number.isFinite(v)) return base;
  return Math.min(MAX_MEATS, Math.max(base, v));
}

const ARS = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function formatPrice(n) {
  return ARS.format(Math.round(Number(n) || 0));
}

/** null/"" = "A confirmar", 0 = "Gratis". */
export function envioLabel(costo) {
  if (costo === null || costo === undefined || costo === "") return "A confirmar";
  const n = Number(costo);
  if (!Number.isFinite(n)) return "A confirmar";
  return n === 0 ? "Gratis" : formatPrice(n);
}

/* ---------------- WhatsApp y links ---------------- */

/**
 * Normaliza un teléfono argentino al formato de wa.me: 54 9 <área> <número>.
 * Acepta "03456 15-123456", "+54 9 3456 123456", "3456123456", "15123456", etc.
 */
export function waNumber(raw) {
  let d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("00")) d = d.slice(2);
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);
  // número local sin característica
  if (d.length === 8 && d.startsWith("15")) d = d.slice(2);
  if (d.length <= 7) d = SITE_AREA_CODE + d;
  // área + 15 + número (12 dígitos): sacar el 15
  if (d.length === 12) {
    for (const i of [4, 3, 2]) {
      if (d.slice(i, i + 2) === "15") {
        d = d.slice(0, i) + d.slice(i + 2);
        break;
      }
    }
  }
  return `549${d}`;
}

export function whatsappOrderUrl(phone, text) {
  return `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;
}

export function whatsappShareUrl(text) {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export function productPath(id) {
  return `/producto/${encodeURIComponent(id)}`;
}

export function productUrl(id) {
  return `${SITE_URL}${productPath(id)}`;
}

function handleFrom(raw, hosts) {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      if (hosts.some((h) => u.hostname.endsWith(h))) return u.pathname.split("/").filter(Boolean)[0] || "";
      return "";
    } catch {
      return "";
    }
  }
  s = s.replace(/^@/, "").split(/[/?#\s]/)[0];
  return s;
}

export function instagramUrl(raw) {
  const h = handleFrom(raw, ["instagram.com"]);
  return h ? `https://www.instagram.com/${encodeURIComponent(h)}/` : "";
}

export function facebookUrl(raw) {
  const h = handleFrom(raw, ["facebook.com", "fb.com"]);
  return h ? `https://www.facebook.com/${encodeURIComponent(h)}` : "";
}

/** Agrega ciudad y provincia si faltan. */
export function fullAddress(dir) {
  const s = String(dir ?? "").trim();
  if (!s) return "";
  return slugText(s).includes(slugText(SITE_CITY)) ? s : `${s}, ${SITE_CITY}, ${SITE_PROVINCE}`;
}

export function mapsUrl(dir) {
  const a = fullAddress(dir);
  return a ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}` : "";
}
