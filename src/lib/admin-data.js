"use client";
// CRUD del panel. Todo pasa por las reglas de Realtime Database; acá además se sanitiza.
import { deleteApp, initializeApp } from "firebase/app";
import { createUserWithEmailAndPassword, getAuth, inMemoryPersistence, sendPasswordResetEmail, setPersistence, signOut } from "firebase/auth";
import { get, push, ref, remove, set, update } from "firebase/database";
import { firebaseConfig, getAuthClient, getDb } from "./firebase";
import { idToken } from "./session";
import { CATEGORIES, INGREDIENT_GROUPS, MAX_BASE_MEATS, MEAT_PRICE_KEYS, MIN_MEATS, categoryOf, cleanIngredients, hasIngredients, ingredientsText } from "./site";
import { MAX_FRANJAS, WEEK_ORDER, isHHMM } from "@/utils/horarios";

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/;
export const RESERVED_SLUGS = ["admin", "login", "api", "nuevo", "dashboard"];

const txt = (v, max) => String(v ?? "").trim().slice(0, max);
const money = (v) => {
  const n = Math.round(Number(String(v ?? "").replace(/[^\d.]/g, "")));
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 100000000) : 0;
};

/* ---------------- Productos ---------------- */

export function cleanComida(raw) {
  const valor = money(raw.valor);
  const valorOferta = money(raw.valorOferta);
  const oferta = Boolean(raw.oferta) && valorOferta > 0 && valorOferta < valor;
  const categoria = CATEGORIES.some((c) => c.id === raw.categoria) ? raw.categoria : categoryOf(raw.categoria);
  const imagen = txt(raw.imagen, 2000);
  const med = Number(raw.medallones);
  const out = {
    nombre: txt(raw.nombre, 80),
    descripcion: txt(raw.descripcion, 400),
    categoria,
    valor,
    oferta,
    valorOferta: oferta ? valorOferta : 0,
    imagen: /^https:\/\//i.test(imagen) ? imagen : "",
    oculto: Boolean(raw.oculto),
  };
  // Base de carnes: obligatoria en hamburguesas, opcional en el resto (sin dato = no se eligen).
  const medOk = Number.isInteger(med) && med >= MIN_MEATS && med <= MAX_BASE_MEATS;
  if (categoria === "hamburguesas") out.medallones = medOk ? med : MIN_MEATS;
  else if (categoria !== "bebidas" && medOk) out.medallones = med;
  // Precios propios por cantidad de carnes: solo las opciones por encima de la base.
  if (out.medallones) {
    const precios = {};
    for (const [n, k] of Object.entries(MEAT_PRICE_KEYS)) {
      const v = money(raw.precios?.[k]);
      if (Number(n) > out.medallones && v > 0) precios[k] = v;
    }
    if (Object.keys(precios).length) out.precios = precios;
  }
  // Con ingredientes elegidos, la descripción se arma siempre en el orden de la carta.
  if (hasIngredients(raw.ingredientes)) {
    const clean = cleanIngredients(raw.ingredientes);
    out.ingredientes = Object.fromEntries(INGREDIENT_GROUPS.filter(({ id }) => clean[id].length).map(({ id }) => [id, clean[id]]));
    out.descripcion = txt(ingredientsText(clean), 400);
  }
  return out;
}

export async function getComidas(local) {
  const snap = await get(ref(getDb(), `locales/${local}/comidas`));
  return snap.val() || {};
}

export async function getComida(local, id) {
  const snap = await get(ref(getDb(), `locales/${local}/comidas/${id}`));
  return snap.exists() ? snap.val() : null;
}

/** Guarda y devuelve el id. Revalidación y limpieza de fotos no bloquean el guardado. */
export async function saveComida(local, id, data, previousImage = "") {
  const clean = cleanComida(data);
  if (!clean.nombre) throw new Error("Falta el nombre.");
  const db = getDb();
  let key = id;
  if (key) {
    await set(ref(db, `locales/${local}/comidas/${key}`), clean);
  } else {
    key = push(ref(db, `locales/${local}/comidas`)).key;
    await set(ref(db, `locales/${local}/comidas/${key}`), clean);
  }
  afterSave(local, previousImage && previousImage !== clean.imagen ? previousImage : "");
  return key;
}

export async function setComidaFlag(local, id, patch) {
  const allowed = {};
  if ("oculto" in patch) allowed.oculto = Boolean(patch.oculto);
  await update(ref(getDb(), `locales/${local}/comidas/${id}`), allowed);
  afterSave(local);
}

export async function deleteComida(local, id, image = "") {
  await remove(ref(getDb(), `locales/${local}/comidas/${id}`));
  afterSave(local, image);
}

/* ---------------- Datos y horarios ---------------- */

export async function getDatos(local) {
  const snap = await get(ref(getDb(), `locales/${local}/datos`));
  return snap.val() || {};
}

export function cleanDatos(raw) {
  const costo = String(raw.costoEnvio ?? "").trim();
  const costoFuera = String(raw.costoEnvioFuera ?? "").trim();
  return {
    nombre: txt(raw.nombre, 80),
    whatsapp: txt(raw.whatsapp, 30),
    direccion: txt(raw.direccion, 160),
    alias: txt(raw.alias, 60),
    costoEnvio: costo === "" ? null : money(costo),
    costoEnvioFuera: costoFuera === "" ? null : money(costoFuera),
    redes: { instagram: txt(raw.redes?.instagram, 120), facebook: txt(raw.redes?.facebook, 160) },
  };
}

export async function saveDatos(local, raw) {
  // update: conserva las opciones de envío y pago que se editan en el panel central.
  await update(ref(getDb(), `locales/${local}/datos`), cleanDatos(raw));
  afterSave(local);
}

export async function getHorarios(local) {
  const snap = await get(ref(getDb(), `locales/${local}/horarios`));
  return snap.val() || {};
}

export function cleanHorarios(raw) {
  const out = {};
  for (const k of WEEK_ORDER) {
    const d = raw?.[k] || {};
    const franjas = (d.franjas || [])
      .filter((f) => isHHMM(f.desde) && isHHMM(f.hasta) && f.desde !== f.hasta)
      .slice(0, MAX_FRANJAS)
      .map((f) => ({ desde: f.desde, hasta: f.hasta }));
    out[k] = { cerrado: Boolean(d.cerrado) || franjas.length === 0, franjas };
  }
  return out;
}

export async function saveHorarios(local, raw) {
  await set(ref(getDb(), `locales/${local}/horarios`), cleanHorarios(raw));
  afterSave(local);
}

export async function getVisitas(local) {
  const snap = await get(ref(getDb(), `locales/${local}/visitas`));
  return snap.val() || { total: 0, dias: {} };
}

/* ---------------- Revalidación y limpieza ---------------- */

async function authedPost(path, body) {
  const token = await idToken();
  if (!token) return null;
  return fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
}

function afterSave(local, oldImage = "") {
  authedPost("/api/revalidar", { local }).catch(() => {});
  if (oldImage) authedPost("/api/cloudinary/cleanup", { local, url: oldImage }).catch(() => {});
}

/** Borra un original temporal. El servidor no lo toca si algún producto lo usa. */
export function discardImage(local, url) {
  authedPost("/api/cloudinary/cleanup", { local, url }).catch(() => {});
}

/* ---------------- Administración (superadmin) ---------------- */

export async function listLocales() {
  const snap = await get(ref(getDb(), "locales"));
  const val = snap.val() || {};
  return Object.entries(val)
    .map(([slug, l]) => ({ slug, nombre: l?.datos?.nombre || slug, productos: Object.keys(l?.comidas || {}).length }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

export async function createLocal(slug, nombre) {
  const s = String(slug || "").trim().toLowerCase();
  if (!SLUG_RE.test(s)) throw new Error("El slug solo puede tener a-z, 0-9 y guiones (2 a 40).");
  if (RESERVED_SLUGS.includes(s)) throw new Error("Ese slug está reservado.");
  const db = getDb();
  const exists = await get(ref(db, `locales/${s}/datos`));
  if (exists.exists()) throw new Error("Ya existe un local con ese slug.");
  await set(ref(db, `locales/${s}/datos`), cleanDatos({ nombre: nombre || s }));
  return s;
}

export async function listUsuarios() {
  const snap = await get(ref(getDb(), "usuarios"));
  const val = snap.val() || {};
  return Object.entries(val).map(([uid, u]) => ({
    uid,
    nombre: u?.nombre || "",
    email: u?.email || "",
    superadmin: u?.superadmin === true,
    locales: Object.keys(u?.locales || {}),
  }));
}

export async function saveUsuario(uid, { nombre, email, superadmin, locales }) {
  const loc = {};
  for (const l of locales || []) if (SLUG_RE.test(l)) loc[l] = true;
  await set(ref(getDb(), `usuarios/${uid}`), {
    nombre: txt(nombre, 80),
    email: txt(email, 120),
    superadmin: Boolean(superadmin),
    ...(Object.keys(loc).length ? { locales: loc } : {}),
  });
}

/**
 * Crea un usuario con una segunda instancia de Auth en memoria,
 * para no cerrar la sesión del admin.
 */
export async function createUsuario({ email, password, nombre, locales = [], superadmin = false, sendReset = false }) {
  const secondary = initializeApp(firebaseConfig, `alta-${Date.now()}`);
  try {
    const auth2 = getAuth(secondary);
    await setPersistence(auth2, inMemoryPersistence);
    const cred = await createUserWithEmailAndPassword(auth2, email.trim(), password);
    await saveUsuario(cred.user.uid, { nombre, email: email.trim(), superadmin, locales });
    await signOut(auth2);
    if (sendReset) await sendPasswordResetEmail(getAuthClient(), email.trim()).catch(() => {});
    return cred.user.uid;
  } finally {
    await deleteApp(secondary).catch(() => {});
  }
}

export async function listSolicitudes() {
  const snap = await get(ref(getDb(), "solicitudes"));
  const val = snap.val() || {};
  return Object.entries(val)
    .map(([uid, s]) => ({ uid, email: s?.email || "", nombre: s?.nombre || "", fecha: s?.fecha || 0 }))
    .sort((a, b) => b.fecha - a.fecha);
}

export async function resolveSolicitud(sol, locales) {
  if (locales.length) {
    const prev = await get(ref(getDb(), `usuarios/${sol.uid}`));
    const p = prev.val() || {};
    const merged = Array.from(new Set([...Object.keys(p.locales || {}), ...locales]));
    await saveUsuario(sol.uid, { nombre: p.nombre || sol.nombre, email: p.email || sol.email, superadmin: p.superadmin === true, locales: merged });
  }
  await remove(ref(getDb(), `solicitudes/${sol.uid}`));
}
