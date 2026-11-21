"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Unconfigured } from "@/components/dashboard/DashboardShell";
import { authError, login, resetPassword, useSession } from "@/lib/session";
import s from "@/components/dashboard/dashboard.module.css";

export default function LoginForm() {
  const router = useRouter();
  const session = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (session.status === "in") router.replace("/dashboard");
  }, [session.status, router]);

  if (session.status === "unconfigured") return <Unconfigured />;

  async function submit(e) {
    e.preventDefault();
    setError("");
    setInfo("");
    if (!email.trim() || !password) {
      setError("Completá email y contraseña.");
      return;
    }
    setBusy(true);
    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(authError(err));
      setBusy(false);
    }
  }

  async function forgot() {
    setError("");
    setInfo("");
    if (!email.trim()) {
      setError("Escribí tu email y tocá de nuevo para recibir el link.");
      return;
    }
    try {
      await resetPassword(email);
      setInfo("Te mandamos un mail para cambiar la contraseña. Revisá también spam.");
    } catch (err) {
      setError(authError(err));
    }
  }

  return (
    <div className={s.center}>
      <form className={`${s.card} ${s.login}`} onSubmit={submit} noValidate>
        <img src="/logo-hero.webp" alt="" width={96} height={96} className={s.loginLogo} />
        <h1 className={s.h1}>Panel del local</h1>
        <label className="field">
          <span>Email</span>
          <input className="input" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoCapitalize="none" />
        </label>
        <label className="field">
          <span>Contraseña</span>
          <input className="input" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error ? (
          <p className="error-text" role="alert">
            {error}
          </p>
        ) : null}
        {info ? (
          <p className={s.ok} role="status">
            {info}
          </p>
        ) : null}
        <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={busy || session.status === "loading"}>
          {busy ? "Entrando..." : "Entrar"}
        </button>
        <button type="button" className={s.linkBtn} onClick={forgot}>
          Olvidé mi contraseña
        </button>
      </form>
    </div>
  );
}
