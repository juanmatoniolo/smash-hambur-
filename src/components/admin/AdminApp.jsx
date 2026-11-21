"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Loading from "@/components/Loading";
import { Unconfigured } from "@/components/dashboard/DashboardShell";
import {
  RESERVED_SLUGS,
  SLUG_RE,
  createLocal,
  createUsuario,
  listLocales,
  listSolicitudes,
  listUsuarios,
  resolveSolicitud,
  saveUsuario,
} from "@/lib/admin-data";
import { authError, useSession } from "@/lib/session";
import s from "@/components/dashboard/dashboard.module.css";

function LocalesChecks({ locales, value, onChange, name }) {
  if (locales.length === 0) return <p className="hint">Primero creá un local.</p>;
  return (
    <fieldset className={s.checks}>
      <legend className="label">Locales</legend>
      {locales.map((l) => (
        <label key={l.slug} className={s.check}>
          <input
            type="checkbox"
            name={name}
            checked={value.includes(l.slug)}
            onChange={(e) => onChange(e.target.checked ? [...value, l.slug] : value.filter((x) => x !== l.slug))}
          />
          <span>{l.slug}</span>
        </label>
      ))}
    </fieldset>
  );
}

function NewLocal({ onDone }) {
  const [slug, setSlug] = useState("");
  const [nombre, setNombre] = useState("");
  const [msg, setMsg] = useState({ error: "", ok: "" });
  const valid = SLUG_RE.test(slug) && !RESERVED_SLUGS.includes(slug);

  async function submit(e) {
    e.preventDefault();
    try {
      const created = await createLocal(slug, nombre);
      setMsg({ error: "", ok: `Local "${created}" creado.` });
      setSlug("");
      setNombre("");
      onDone();
    } catch (err) {
      setMsg({ error: err.code ? authError(err) : err.message, ok: "" });
    }
  }

  return (
    <form className={s.card} onSubmit={submit} noValidate>
      <h3 className={s.h3}>Nuevo local</h3>
      <label className="field">
        <span>Slug (a-z, 0-9, guiones)</span>
        <input
          className="input"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40))}
          placeholder="smash-burger"
          autoCapitalize="none"
        />
        {slug && !valid ? <span className="error-text">Slug inválido o reservado ({RESERVED_SLUGS.join(", ")}).</span> : null}
      </label>
      <label className="field">
        <span>Nombre</span>
        <input className="input" value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} />
      </label>
      {msg.error ? <p className="error-text">{msg.error}</p> : null}
      {msg.ok ? <p className={s.ok}>{msg.ok}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={!valid}>
        Crear local
      </button>
    </form>
  );
}

function NewUser({ locales, onDone }) {
  const [f, setF] = useState({ email: "", password: "", nombre: "", locales: [], superadmin: false, sendReset: true });
  const [msg, setMsg] = useState({ error: "", ok: "", busy: false });

  async function submit(e) {
    e.preventDefault();
    if (!f.email.trim() || f.password.length < 6) {
      setMsg({ error: "Email y contraseña de al menos 6 caracteres.", ok: "", busy: false });
      return;
    }
    setMsg({ error: "", ok: "", busy: true });
    try {
      await createUsuario(f);
      setMsg({ error: "", ok: `Usuario ${f.email} creado.`, busy: false });
      setF({ email: "", password: "", nombre: "", locales: [], superadmin: false, sendReset: true });
      onDone();
    } catch (err) {
      setMsg({ error: authError(err), ok: "", busy: false });
    }
  }

  return (
    <form className={s.card} onSubmit={submit} noValidate>
      <h3 className={s.h3}>Nuevo usuario</h3>
      <label className="field">
        <span>Nombre</span>
        <input className="input" value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} maxLength={80} />
      </label>
      <label className="field">
        <span>Email</span>
        <input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoCapitalize="none" />
      </label>
      <label className="field">
        <span>Contraseña inicial</span>
        <input className="input" type="text" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="new-password" />
      </label>
      <LocalesChecks locales={locales} value={f.locales} onChange={(v) => setF({ ...f, locales: v })} name="nuevo-locales" />
      <label className={s.check}>
        <input type="checkbox" checked={f.superadmin} onChange={(e) => setF({ ...f, superadmin: e.target.checked })} />
        <span>Superadmin</span>
      </label>
      <label className={s.check}>
        <input type="checkbox" checked={f.sendReset} onChange={(e) => setF({ ...f, sendReset: e.target.checked })} />
        <span>Mandarle un mail para que elija su contraseña</span>
      </label>
      {msg.error ? <p className="error-text">{msg.error}</p> : null}
      {msg.ok ? <p className={s.ok}>{msg.ok}</p> : null}
      <button type="submit" className="btn btn-primary" disabled={msg.busy}>
        {msg.busy ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}

function UserRow({ user, locales, onSaved, isSelf }) {
  const [u, setU] = useState(user);
  const [state, setState] = useState("");
  const dirty = JSON.stringify(u) !== JSON.stringify(user);

  async function save() {
    setState("saving");
    try {
      await saveUsuario(u.uid, u);
      setState("ok");
      onSaved();
    } catch (err) {
      setState(authError(err));
    }
  }

  return (
    <li className={s.card}>
      <p>
        <strong>{u.nombre || u.email || u.uid}</strong>
        <br />
        <small className="hint">{u.email}</small>
      </p>
      <LocalesChecks locales={locales} value={u.locales} onChange={(v) => setU({ ...u, locales: v })} name={`loc-${u.uid}`} />
      <label className={s.check}>
        <input type="checkbox" checked={u.superadmin} disabled={isSelf} onChange={(e) => setU({ ...u, superadmin: e.target.checked })} />
        <span>Superadmin{isSelf ? " (vos)" : ""}</span>
      </label>
      {state && state !== "saving" && state !== "ok" ? <p className="error-text">{state}</p> : null}
      <button type="button" className="btn btn-ghost" onClick={save} disabled={!dirty || state === "saving"}>
        {state === "saving" ? "Guardando..." : state === "ok" && !dirty ? "Guardado" : "Guardar"}
      </button>
    </li>
  );
}

function SolicitudRow({ sol, locales, onDone }) {
  const [sel, setSel] = useState([]);
  const [error, setError] = useState("");
  async function resolve(assign) {
    try {
      await resolveSolicitud(sol, assign ? sel : []);
      onDone();
    } catch (err) {
      setError(authError(err));
    }
  }
  return (
    <li className={s.card}>
      <p>
        <strong>{sol.email}</strong>
        <br />
        <small className="hint">{sol.fecha ? new Date(sol.fecha).toLocaleString("es-AR") : ""}</small>
      </p>
      <LocalesChecks locales={locales} value={sel} onChange={setSel} name={`sol-${sol.uid}`} />
      {error ? <p className="error-text">{error}</p> : null}
      <div className={s.dayActions}>
        <button type="button" className="btn btn-primary" disabled={sel.length === 0} onClick={() => resolve(true)}>
          Dar acceso
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => resolve(false)}>
          Descartar
        </button>
      </div>
    </li>
  );
}

async function fetchAll() {
  const [locales, usuarios, solicitudes] = await Promise.all([listLocales(), listUsuarios(), listSolicitudes()]);
  return { locales, usuarios, solicitudes };
}

export default function AdminApp() {
  const router = useRouter();
  const session = useSession();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    fetchAll()
      .then(setData)
      .catch((err) => setError(authError(err)));
  }, []);

  const isSuper = session.status === "in" && session.profile?.superadmin === true;

  useEffect(() => {
    if (session.status === "out") router.replace("/login");
  }, [session.status, router]);

  useEffect(() => {
    if (!isSuper) return;
    fetchAll()
      .then(setData)
      .catch((err) => setError(authError(err)));
  }, [isSuper]);

  if (session.status === "unconfigured") return <Unconfigured />;
  if (session.status !== "in") return <Loading />;
  if (!session.profile?.superadmin) {
    return (
      <div className={s.center}>
        <div className={s.card}>
          <h1 className={s.h1}>Solo superadmin</h1>
          <Link href="/dashboard" className="btn btn-primary">
            Volver
          </Link>
        </div>
      </div>
    );
  }
  if (error) return <p className="error-text">{error}</p>;
  if (!data) return <Loading />;

  return (
    <div className={s.adminWrap}>
      <Link href="/dashboard" className={s.backLink}>
        <ArrowLeft size={18} aria-hidden /> Locales
      </Link>
      <h1 className={s.h1}>Administración</h1>

      <section className={s.stack} aria-labelledby="h-sol">
        <h2 id="h-sol" className={s.h2}>
          Solicitudes de acceso <small>({data.solicitudes.length})</small>
        </h2>
        {data.solicitudes.length === 0 ? <p className="hint">No hay solicitudes pendientes.</p> : null}
        <ul className={s.cardList}>
          {data.solicitudes.map((sol) => (
            <SolicitudRow key={sol.uid} sol={sol} locales={data.locales} onDone={load} />
          ))}
        </ul>
      </section>

      <section className={s.stack} aria-labelledby="h-loc">
        <h2 id="h-loc" className={s.h2}>
          Locales <small>({data.locales.length})</small>
        </h2>
        <ul className={s.localList}>
          {data.locales.map((l) => (
            <li key={l.slug}>
              <Link href={`/dashboard/${l.slug}`} className={s.localItem}>
                <span>
                  <strong>{l.nombre}</strong>
                  <small>
                    {l.slug} · {l.productos} productos
                  </small>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <NewLocal onDone={load} />
      </section>

      <section className={s.stack} aria-labelledby="h-usr">
        <h2 id="h-usr" className={s.h2}>
          Usuarios <small>({data.usuarios.length})</small>
        </h2>
        <ul className={s.cardList}>
          {data.usuarios.map((u) => (
            <UserRow
              key={`${u.uid}-${u.locales.join()}-${u.superadmin}`}
              user={u}
              locales={data.locales}
              onSaved={load}
              isSelf={u.uid === session.user.uid}
            />
          ))}
        </ul>
        <NewUser locales={data.locales} onDone={load} />
      </section>
    </div>
  );
}
