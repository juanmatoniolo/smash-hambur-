"use client";
import { createContext, useContext, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { CalendarClock, ExternalLink, LogOut, Package, Plus, Shield, Store } from "lucide-react";
import Loading from "@/components/Loading";
import { canEdit, logout, profileLocales, useSession } from "@/lib/session";
import s from "./dashboard.module.css";

const Ctx = createContext(null);
export function useDashboard() {
  return useContext(Ctx);
}

export function Unconfigured() {
  return (
    <div className={s.center}>
      <div className={s.card}>
        <h1 className={s.h1}>Falta configurar Firebase</h1>
        <p className="hint">Cargá las variables NEXT_PUBLIC_FIREBASE_* en .env.local o en Vercel y reiniciá el servidor.</p>
      </div>
    </div>
  );
}

export default function DashboardShell({ children }) {
  const { local } = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession();
  const allowed = session.status === "in" && canEdit(session.profile, local);

  useEffect(() => {
    if (session.status === "out") router.replace("/login");
  }, [session.status, router]);

  if (session.status === "unconfigured") return <Unconfigured />;
  if (session.status !== "in") return <Loading />;
  if (!allowed) {
    return (
      <div className={s.center}>
        <div className={s.card}>
          <h1 className={s.h1}>Sin acceso a este local</h1>
          <p className="hint">Tu cuenta no tiene permiso para editar “{local}”.</p>
          <Link href="/dashboard" className="btn btn-primary">
            Ir a mis locales
          </Link>
        </div>
      </div>
    );
  }

  const base = `/dashboard/${local}`;
  const nav = [
    { href: base, label: "Productos", icon: Package, exact: true },
    { href: `${base}/agregar`, label: "Agregar", icon: Plus },
    { href: `${base}/datos`, label: "Datos", icon: Store },
    { href: `${base}/horarios`, label: "Horarios", icon: CalendarClock },
  ];
  const isActive = (i) => (i.exact ? pathname === i.href || pathname.startsWith(`${base}/editar`) : pathname.startsWith(i.href));
  const several = session.profile?.superadmin || profileLocales(session.profile).length > 1;

  return (
    <Ctx.Provider value={{ local, user: session.user, profile: session.profile }}>
      <div className={s.shell}>
        <header className={s.topbar}>
          <Link href={several ? "/dashboard" : base} className={s.brand}>
            <img src="/logo-sm.webp" alt="" width={36} height={36} />
            <span>
              Panel <small>{local}</small>
            </span>
          </Link>
          <div className={s.topActions}>
            <a href="/" target="_blank" rel="noopener noreferrer" className={s.topLink}>
              <ExternalLink size={18} aria-hidden /> <span>Ver carta</span>
            </a>
            {session.profile?.superadmin ? (
              <Link href="/dashboard/admin" className={s.topLink}>
                <Shield size={18} aria-hidden /> <span>Admin</span>
              </Link>
            ) : null}
            <button
              type="button"
              className={s.topLink}
              onClick={async () => {
                await logout();
                router.replace("/login");
              }}
            >
              <LogOut size={18} aria-hidden /> <span>Salir</span>
            </button>
          </div>
        </header>

        <nav className={s.tabs} aria-label="Secciones del panel">
          {nav.map((i) => (
            <Link key={i.href} href={i.href} className={`${s.tab} ${isActive(i) ? s.tabActive : ""}`} aria-current={isActive(i) ? "page" : undefined}>
              <i.icon size={20} aria-hidden />
              <span>{i.label}</span>
            </Link>
          ))}
        </nav>

        <main className={s.content}>{children}</main>
      </div>
    </Ctx.Provider>
  );
}
