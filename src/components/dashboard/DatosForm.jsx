"use client";
import { useEffect, useState } from "react";
import Loading from "@/components/Loading";
import { getDatos, saveDatos } from "@/lib/admin-data";
import { authError } from "@/lib/session";
import { envioLabel, fullAddress, instagramUrl, facebookUrl, waNumber } from "@/lib/site";
import { useDashboard } from "./DashboardShell";
import s from "./dashboard.module.css";

export default function DatosForm() {
  const { local } = useDashboard();
  const [form, setForm] = useState(null);
  const [status, setStatus] = useState({ saving: false, msg: "", error: "" });

  useEffect(() => {
    getDatos(local)
      .then((d) =>
        setForm({
          nombre: d.nombre || "",
          whatsapp: d.whatsapp || "",
          direccion: d.direccion || "",
          alias: d.alias || "",
          costoEnvio: d.costoEnvio === null || d.costoEnvio === undefined ? "" : String(d.costoEnvio),
          extras: { medallon: d.extras?.medallon ? String(d.extras.medallon) : "" },
          redes: { instagram: d.redes?.instagram || "", facebook: d.redes?.facebook || "" },
        })
      )
      .catch((e) => setStatus({ saving: false, msg: "", error: authError(e) }));
  }, [local]);

  if (!form) return status.error ? <p className="error-text">{status.error}</p> : <Loading />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNested = (g, k, digits = false) => (e) =>
    setForm((f) => ({ ...f, [g]: { ...f[g], [k]: digits ? e.target.value.replace(/\D/g, "").slice(0, 9) : e.target.value } }));
  const wa = waNumber(form.whatsapp);

  async function submit(e) {
    e.preventDefault();
    setStatus({ saving: true, msg: "", error: "" });
    try {
      await saveDatos(local, form);
      setStatus({ saving: false, msg: "Guardado. La carta se actualiza en segundos.", error: "" });
    } catch (err) {
      setStatus({ saving: false, msg: "", error: authError(err) });
    }
  }

  return (
    <form className={s.stack} onSubmit={submit} noValidate>
      <h1 className={s.h1}>Datos del local</h1>

      <fieldset className={s.card}>
        <legend className={s.legend}>General</legend>
        <label className="field">
          <span>Nombre del local</span>
          <input className="input" value={form.nombre} onChange={set("nombre")} maxLength={80} placeholder="Smash Burger El Toro" />
        </label>
        <label className="field">
          <span>WhatsApp para pedidos</span>
          <input className="input" type="tel" inputMode="tel" value={form.whatsapp} onChange={set("whatsapp")} maxLength={30} placeholder="03456 15 123456" />
          <span className="hint">{form.whatsapp ? `Los pedidos llegan a wa.me/${wa}` : "Sin WhatsApp no se pueden enviar pedidos."}</span>
        </label>
        <label className="field">
          <span>Dirección</span>
          <input className="input" value={form.direccion} onChange={set("direccion")} maxLength={160} placeholder="Calle y número" />
          {form.direccion ? <span className="hint">Se muestra como: {fullAddress(form.direccion)}</span> : null}
        </label>
      </fieldset>

      <fieldset className={s.card}>
        <legend className={s.legend}>Cobro y envío</legend>
        <label className="field">
          <span>Alias para transferencias</span>
          <input className="input" value={form.alias} onChange={set("alias")} maxLength={60} placeholder="eltoro.smash" autoCapitalize="none" />
        </label>
        <label className="field">
          <span>Costo de envío ($)</span>
          <input
            className="input"
            inputMode="numeric"
            value={form.costoEnvio}
            onChange={(e) => setForm((f) => ({ ...f, costoEnvio: e.target.value.replace(/\D/g, "").slice(0, 9) }))}
            placeholder="Vacío = a confirmar"
          />
          <span className="hint">En la carta: {envioLabel(form.costoEnvio)}. Vacío = a confirmar, 0 = gratis.</span>
        </label>
        <label className="field">
          <span>Precio de cada medallón extra ($)</span>
          <input className="input" inputMode="numeric" value={form.extras.medallon} onChange={setNested("extras", "medallon", true)} placeholder="0" />
        </label>
      </fieldset>

      <fieldset className={s.card}>
        <legend className={s.legend}>Redes</legend>
        <label className="field">
          <span>Instagram</span>
          <input className="input" value={form.redes.instagram} onChange={setNested("redes", "instagram")} placeholder="@eltoro.smash" autoCapitalize="none" />
          {form.redes.instagram ? <span className="hint">{instagramUrl(form.redes.instagram) || "No parece un usuario válido"}</span> : null}
        </label>
        <label className="field">
          <span>Facebook</span>
          <input className="input" value={form.redes.facebook} onChange={setNested("redes", "facebook")} placeholder="Página o link" autoCapitalize="none" />
          {form.redes.facebook ? <span className="hint">{facebookUrl(form.redes.facebook) || "No parece un link válido"}</span> : null}
        </label>
      </fieldset>

      <div className={s.saveBar}>
        {status.error ? (
          <p className="error-text" role="alert">
            {status.error}
          </p>
        ) : null}
        {status.msg ? (
          <p className={s.ok} role="status">
            {status.msg}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={status.saving}>
          {status.saving ? "Guardando..." : "Guardar datos"}
        </button>
      </div>
    </form>
  );
}
