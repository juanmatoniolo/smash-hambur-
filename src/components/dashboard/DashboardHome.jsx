"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Shield } from "lucide-react";
import Loading from "@/components/Loading";
import { listLocales } from "@/lib/admin-data";
import { logout, profileLocales, requestAccess, useSession } from "@/lib/session";
import { Unconfigured } from "./DashboardShell";
import s from "./dashboard.module.css";

/** Ruteo post-login: un local -> directo; varios -> selector; superadmin -> todos; ninguno -> solicitud. */
export default function DashboardHome() {
  const router = useRouter();
  const session = useSession();
  const [allLocales, setAllLocales] = useState(null);
  const [requested, setRequested] = useState(false);

  const signedIn = session.status === "in";
  const isSuper = signedIn && session.profile?.superadmin === true;
  const mine = signedIn ? profileLocales(session.profile) : [];
  const mineKey = mine.join(",");
  const locales = isSuper ? allLocales : mine.length > 1 ? mine.map((slug) => ({ slug, nombre: slug })) : null;

  useEffect(() => {
    if (session.status === "out") {
      router.replace("/login");
      return;
    }
    if (!signedIn) return;
    const list = mineKey ? mineKey.split(",") : [];
    if (isSuper) {
      listLocales()
        .then(setAllLocales)
        .catch(() => setAllLocales([]));
    } else if (list.length === 1) {
      router.replace(`/dashboard/${list[0]}`);
    } else if (list.length === 0) {
      requestAccess(session.user)
        .catch(() => {})
        .finally(() => setRequested(true));
    }
  }, [session.status, session.user, signedIn, isSuper, mineKey, router]);

  if (session.status === "unconfigured") return <Unconfigured />;

  const out = async () => {
    await logout();
    router.replace("/login");
  };

  if (requested) {
    return (
      <div className={s.center}>
        <div className={s.card}>
          <h1 className={s.h1}>Pedido de acceso enviado</h1>
          <p>Tu cuenta ({session.user?.email}) todavía no tiene un local asignado. Ya avisamos al administrador.</p>
          <button type="button" className="btn btn-ghost" onClick={out}>
            <LogOut size={18} aria-hidden /> Salir
          </button>
        </div>
      </div>
    );
  }

  if (!locales) return <Loading />;

  return (
    <div className={s.center}>
      <div className={`${s.card} ${s.selector}`}>
        <h1 className={s.h1}>Elegí un local</h1>
        <ul className={s.localList}>
          {locales.map((l) => (
            <li key={l.slug}>
              <Link href={`/dashboard/${l.slug}`} className={s.localItem}>
                <span>
                  <strong>{l.nombre}</strong>
                  <small>{l.slug}</small>
                </span>
                <ChevronRight size={20} aria-hidden />
              </Link>
            </li>
          ))}
          {locales.length === 0 ? <li className="hint">Todavía no hay locales.</li> : null}
        </ul>
        {session.profile?.superadmin ? (
          <Link href="/dashboard/admin" className="btn btn-primary">
            <Shield size={18} aria-hidden /> Administración
          </Link>
        ) : null}
        <button type="button" className="btn btn-ghost" onClick={out}>
          <LogOut size={18} aria-hidden /> Salir
        </button>
      </div>
    </div>
  );
}
