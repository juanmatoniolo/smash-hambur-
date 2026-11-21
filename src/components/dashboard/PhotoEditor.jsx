"use client";
import { useEffect, useRef, useState } from "react";
import { ZoomIn } from "lucide-react";
import Sheet from "@/components/ui/Sheet";
import s from "./dashboard.module.css";

const OUT_W = 1600;
const OUT_H = 1200; // 4:3: sirve para miniatura cuadrada, detalle 16:10 y tarjeta de compartir

/** Recorte/encuadre 4:3: arrastrar para mover, deslizar para acercar. */
export default function PhotoEditor({ file, onCancel, onDone }) {
  const stageRef = useRef(null);
  const drag = useRef(null);
  const [img, setImg] = useState(null);
  const [W, setW] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) return undefined;
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      setImg(im);
      setZoom(1);
      setPos({ x: 0, y: 0 });
    };
    im.onerror = () => setError("No pudimos abrir esa foto. Probá con otra (JPG o PNG).");
    im.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  const H = (W * 3) / 4;
  const base = img && W ? Math.max(W / img.naturalWidth, H / img.naturalHeight) : 1;
  const scale = base * zoom;
  const dispW = img ? img.naturalWidth * scale : 0;
  const dispH = img ? img.naturalHeight * scale : 0;

  function clamp(p, z = zoom) {
    if (!img || !W) return p;
    const sc = base * z;
    const mx = Math.max(0, (img.naturalWidth * sc - W) / 2);
    const my = Math.max(0, (img.naturalHeight * sc - H) / 2);
    return { x: Math.min(mx, Math.max(-mx, p.x)), y: Math.min(my, Math.max(-my, p.y)) };
  }

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, start: pos };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    const d = drag.current;
    setPos(clamp({ x: d.start.x + e.clientX - d.x, y: d.start.y + e.clientY - d.y }));
  }
  function onPointerUp() {
    drag.current = null;
  }
  function onKeyDown(e) {
    const step = e.shiftKey ? 30 : 10;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    setPos((p) => clamp({ x: p.x + m[0], y: p.y + m[1] }));
  }

  async function confirm() {
    if (!img || !W) return;
    setBusy(true);
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext("2d");
    const f = OUT_W / W;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, OUT_W, OUT_H);
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, (W / 2 - dispW / 2 + pos.x) * f, (H / 2 - dispH / 2 + pos.y) * f, dispW * f, dispH * f);
    canvas.toBlob(
      (blob) => {
        setBusy(false);
        if (blob) onDone(blob);
        else setError("No se pudo procesar la foto.");
      },
      "image/jpeg",
      0.88
    );
  }

  return (
    <Sheet
      open={Boolean(file)}
      onClose={onCancel}
      title="Encuadrar foto"
      wide
      footer={
        <div className={s.editorActions}>
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className="btn btn-primary" onClick={confirm} disabled={!img || busy}>
            {busy ? "Procesando..." : "Usar esta foto"}
          </button>
        </div>
      }
    >
      {error ? <p className="error-text">{error}</p> : null}
      <p className="hint" style={{ marginBottom: 10 }}>
        Arrastrá para mover y usá el control para acercar. Así se va a ver en la carta.
      </p>
      <div
        ref={stageRef}
        className={s.stage}
        style={{ height: H || undefined }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        tabIndex={0}
        role="application"
        aria-label="Área de encuadre. Usá las flechas para mover la foto."
      >
        {img && W ? (
           
          <img
            src={img.src}
            alt=""
            draggable={false}
            className={s.stageImg}
            style={{ width: dispW, height: dispH, left: W / 2 - dispW / 2 + pos.x, top: H / 2 - dispH / 2 + pos.y }}
          />
        ) : null}
        <div className={s.stageGuide} aria-hidden />
      </div>
      <label className={s.zoom}>
        <ZoomIn size={18} aria-hidden />
        <span className="visually-hidden">Zoom</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => {
            const z = Number(e.target.value);
            setZoom(z);
            setPos((p) => clamp(p, z));
          }}
        />
      </label>
    </Sheet>
  );
}
