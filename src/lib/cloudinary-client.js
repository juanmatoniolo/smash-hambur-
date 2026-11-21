"use client";
import { CLOUDINARY_ROOT } from "./site";

const CLOUD = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "";
export const MAX_BYTES = 10 * 1024 * 1024;

export function cloudinaryConfigured() {
  return Boolean(CLOUD && PRESET);
}

export function validateImageFile(file) {
  if (!file) return "Elegí una imagen.";
  if (!/^image\/(jpeg|png|webp|heic|heif|avif)$/i.test(file.type)) return "El archivo tiene que ser una foto (JPG, PNG o WebP).";
  if (file.size > MAX_BYTES) return "La foto pesa más de 10 MB.";
  return "";
}

/** Subida unsigned con progreso a <ROOT>/<local>. Devuelve la secure_url. */
export function uploadImage(blob, local, onProgress) {
  return new Promise((resolve, reject) => {
    if (!cloudinaryConfigured()) {
      reject(new Error("Cloudinary no está configurado."));
      return;
    }
    if (blob.size > MAX_BYTES) {
      reject(new Error("La foto pesa más de 10 MB."));
      return;
    }
    const form = new FormData();
    form.append("file", blob);
    form.append("upload_preset", PRESET);
    form.append("folder", `${CLOUDINARY_ROOT}/${local}`);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      try {
        const res = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) resolve(res.secure_url);
        else reject(new Error(res?.error?.message || "No se pudo subir la foto."));
      } catch {
        reject(new Error("No se pudo subir la foto."));
      }
    };
    xhr.onerror = () => reject(new Error("Sin conexión. Probá de nuevo."));
    xhr.send(form);
  });
}

/** Convierte links de Google Drive a URL directa de imagen. Otros links pasan igual. */
export function directImageUrl(raw) {
  const s = String(raw || "").trim();
  if (!/drive\.google\.com|docs\.google\.com/.test(s)) return s;
  const id = s.match(/\/d\/([\w-]{10,})/)?.[1] || s.match(/[?&]id=([\w-]{10,})/)?.[1];
  return id ? `https://lh3.googleusercontent.com/d/${id}=w1600` : s;
}

/** Verifica que la URL cargue como imagen. */
export function verifyImage(url, timeout = 10000) {
  return new Promise((resolve) => {
    const img = new Image();
    const t = setTimeout(() => resolve(false), timeout);
    img.onload = () => {
      clearTimeout(t);
      resolve(img.naturalWidth > 0);
    };
    img.onerror = () => {
      clearTimeout(t);
      resolve(false);
    };
    img.src = url;
  });
}
