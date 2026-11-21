"use client";
import { useRef, useState } from "react";
import { ImagePlus, Link2, Trash2 } from "lucide-react";
import ProductImage from "@/components/menu/ProductImage";
import { cloudinaryConfigured, directImageUrl, uploadImage, validateImageFile, verifyImage } from "@/lib/cloudinary-client";
import PhotoEditor from "./PhotoEditor";
import s from "./dashboard.module.css";

export default function ImageUploader({ value, onChange, local }) {
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState("");
  const [link, setLink] = useState("");
  const [checking, setChecking] = useState(false);
  const [over, setOver] = useState(false);
  const canUpload = cloudinaryConfigured();

  function pick(f) {
    const err = validateImageFile(f);
    setError(err);
    if (!err) setFile(f);
  }

  async function upload(blob) {
    setFile(null);
    setError("");
    setProgress(0);
    try {
      const url = await uploadImage(blob, local, setProgress);
      onChange(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setProgress(null);
    }
  }

  async function useLink() {
    const url = directImageUrl(link);
    if (!/^https:\/\//i.test(url)) {
      setError("Pegá un link que empiece con https://");
      return;
    }
    setChecking(true);
    const ok = await verifyImage(url);
    setChecking(false);
    if (!ok) {
      setError("Ese link no carga como imagen. Si es de Google Drive, compartilo como \"Cualquiera con el enlace\".");
      return;
    }
    setError("");
    setLink("");
    onChange(url);
  }

  return (
    <div className={s.uploader}>
      <div
        className={`${s.drop} ${over ? s.dropOver : ""}`}
        onDragOver={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!canUpload) return;
          e.preventDefault();
          setOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        {value ? (
          <ProductImage src={value} alt="Foto actual" width={640} ratio="4 / 3" className={s.dropImg} />
        ) : (
          <div className={s.dropEmpty}>
            <ImagePlus size={32} aria-hidden />
            <span>{canUpload ? "Arrastrá una foto o elegila" : "Pegá el link de una foto"}</span>
          </div>
        )}
        {progress !== null ? (
          <div className={s.progress} role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Subiendo foto">
            <span style={{ width: `${progress}%` }} />
            <em>Subiendo {progress}%</em>
          </div>
        ) : null}
      </div>

      <div className={s.uploaderActions}>
        {canUpload ? (
          <>
            <input
              ref={input}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                pick(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button type="button" className="btn btn-ghost" onClick={() => input.current?.click()} disabled={progress !== null}>
              <ImagePlus size={18} aria-hidden /> {value ? "Cambiar foto" : "Elegir foto"}
            </button>
          </>
        ) : null}
        {value ? (
          <button type="button" className="btn btn-ghost" onClick={() => onChange("")}>
            <Trash2 size={18} aria-hidden /> Quitar
          </button>
        ) : null}
      </div>

      <div className={s.linkRow}>
        <label className="field" style={{ flex: 1 }}>
          <span>O pegá un link (sirve Google Drive)</span>
          <input className="input" type="url" inputMode="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </label>
        <button type="button" className="btn btn-ghost" onClick={useLink} disabled={!link.trim() || checking}>
          <Link2 size={18} aria-hidden /> {checking ? "Verificando" : "Usar"}
        </button>
      </div>

      {error ? (
        <p className="error-text" role="alert">
          {error}
        </p>
      ) : null}

      <PhotoEditor file={file} onCancel={() => setFile(null)} onDone={upload} />
    </div>
  );
}
