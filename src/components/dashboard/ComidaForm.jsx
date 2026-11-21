"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import Loading from "@/components/Loading";
import { deleteComida, getComida, saveComida } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import { CATEGORIES, MAX_BASE_MEATS, MAX_MEATS, MIN_MEATS, meatLabel } from "@/lib/site";
import { useDashboard } from "./DashboardShell";
import ImageUploader from "./ImageUploader";
import PublishPreview from "./PublishPreview";
import s from "./dashboard.module.css";

const EMPTY = {
  nombre: "",
  descripcion: "",
  categoria: "hamburguesas",
  valor: "",
  oferta: false,
  valorOferta: "",
  imagen: "",
  medallones: 1,
  oculto: false,
};

export default function ComidaForm({ id = null }) {
  const { local } = useDashboard();
  const router = useRouter();
  const [form, setForm] = useState(id ? null : EMPTY);
  const [original, setOriginal] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    getComida(local, id)
      .then((c) => {
        if (!alive) return;
        if (!c) {
          setNotFound(true);
          return;
        }
        setForm({ ...EMPTY, ...c, medallones: Number(c.medallones) || (c.categoria === "hamburguesas" ? 1 : 0), valor: String(c.valor ?? ""), valorOferta: c.valorOferta ? String(c.valorOferta) : "" });
        setOriginal(c.imagen || "");
      })
      .catch((e) => alive && setError(authError(e)));
    return () => {
      alive = false;
    };
  }, [id, local]);

  if (notFound) return <p className="hint">Ese producto ya no existe.</p>;
  if (!form) return <Loading />;

  // Base de carnes visible en el selector: en hamburguesas mínimo 1, y nunca más de MAX_BASE_MEATS
  // (con 5 incluidas el cliente no tendría nada para elegir).
  const rawMeats = Number(form.medallones) || 0;
  const meatsValue = Math.min(MAX_BASE_MEATS, form.categoria === "hamburguesas" ? Math.max(MIN_MEATS, rawMeats) : rawMeats);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const onInput = (k) => (e) => set(k)(e.target.type === "checkbox" ? e.target.checked : e.target.value);
  const numeric = (k) => (e) => set(k)(e.target.value.replace(/\D/g, "").slice(0, 9));

  const offerInvalid = form.oferta && !(Number(form.valorOferta) > 0 && Number(form.valorOferta) < Number(form.valor));

  async function submit(e) {
    e.preventDefault();
    if (!form.nombre.trim()) return setError("Poné un nombre.");
    if (!(Number(form.valor) > 0)) return setError("Poné un precio mayor a 0.");
    if (offerInvalid) return setError("El precio de oferta tiene que ser menor al precio normal.");
    setSaving(true);
    setError("");
    try {
      await saveComida(local, id, { ...form, medallones: meatsValue }, original);
      router.push(`/dashboard/${local}`);
    } catch (err) {
      setError(authError(err));
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm(`¿Borrar "${form.nombre}"? No se puede deshacer.`)) return;
    setSaving(true);
    try {
      await deleteComida(local, id, form.imagen);
      router.push(`/dashboard/${local}`);
    } catch (err) {
      setError(authError(err));
      setSaving(false);
    }
  }

  return (
    <form className={s.formGrid} onSubmit={submit} noValidate>
      <div className={s.formMain}>
        <h1 className={s.h1}>{id ? "Editar producto" : "Nuevo producto"}</h1>

        <label className="field">
          <span>Nombre</span>
          <input className="input" value={form.nombre} onChange={onInput("nombre")} maxLength={80} required />
        </label>

        <label className="field">
          <span>Descripción</span>
          <textarea className="input" value={form.descripcion} onChange={onInput("descripcion")} maxLength={400} rows={3} placeholder="Ingredientes, tamaño..." />
          <span className="hint">{form.descripcion.length}/400</span>
        </label>

        <div className={s.row2}>
          <label className="field">
            <span>Categoría</span>
            <select
              className="input"
              value={form.categoria}
              onChange={(e) => {
                const categoria = e.target.value;
                setForm((f) => ({ ...f, categoria, medallones: categoria === "hamburguesas" ? Math.max(1, Number(f.medallones) || 0) : 0 }));
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Precio ($)</span>
            <input className="input" inputMode="numeric" value={form.valor} onChange={numeric("valor")} placeholder="0" required />
          </label>
        </div>

        {form.categoria !== "bebidas" ? (
          <label className="field">
            <span>Carnes incluidas en el precio</span>
            <select className="input" value={meatsValue} onChange={(e) => set("medallones")(Number(e.target.value))}>
              {form.categoria !== "hamburguesas" ? <option value={0}>No lleva carne para elegir</option> : null}
              {Array.from({ length: MAX_BASE_MEATS - MIN_MEATS + 1 }, (_, i) => i + MIN_MEATS).map((n) => (
                <option key={n} value={n}>
                  {n} ({meatLabel(n)})
                </option>
              ))}
            </select>
            <span className="hint">
              {meatsValue > 0
                ? `El cliente elige de ${meatsValue} a ${MAX_MEATS} carnes. Cada carne extra suma el precio del medallón que cargás en Datos.`
                : "El cliente no elige cantidad de carnes en este producto."}
            </span>
          </label>
        ) : null}

        <div className={s.toggleBox}>
          <label className={s.check}>
            <input type="checkbox" checked={form.oferta} onChange={onInput("oferta")} />
            <span>En oferta</span>
          </label>
          {form.oferta ? (
            <label className="field">
              <span>Precio de oferta ($)</span>
              <input
                className="input"
                inputMode="numeric"
                value={form.valorOferta}
                onChange={numeric("valorOferta")}
                aria-invalid={offerInvalid ? "true" : undefined}
              />
              {offerInvalid ? <span className="error-text">Tiene que ser menor al precio normal.</span> : null}
            </label>
          ) : null}
        </div>

        <label className={s.check}>
          <input type="checkbox" checked={form.oculto} onChange={onInput("oculto")} />
          <span>Ocultar de la carta (sin stock)</span>
        </label>

        <div className="field">
          <span className="label">Foto</span>
          <ImageUploader value={form.imagen} onChange={set("imagen")} local={local} />
        </div>
      </div>

      <aside className={s.formSide}>
        <PublishPreview data={form} />
      </aside>

      <div className={s.saveBar}>
        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}
        <div className={s.saveActions}>
          {id ? (
            <button type="button" className={s.dangerBtn} onClick={onDelete} disabled={saving}>
              <Trash2 size={18} aria-hidden /> Borrar
            </button>
          ) : null}
          <button type="submit" className="btn btn-primary btn-lg" disabled={saving} style={{ flex: 1 }}>
            {saving ? "Guardando..." : id ? "Guardar cambios" : "Publicar producto"}
          </button>
        </div>
      </div>
    </form>
  );
}
