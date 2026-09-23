"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BrainCircuit, LayoutDashboard, FolderKanban, FilePlus2, Handshake, CalendarClock,
  BarChart3, ScrollText, Settings2, UserRound, LogOut, Languages, FlaskConical,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { LANGUAGES, t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { Role } from "@/lib/types";

interface NavItem {
  href: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  roles?: Role[];
}

const NAV: NavItem[] = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/cases", labelKey: "nav.cases", icon: FolderKanban },
  { href: "/cases/new", labelKey: "nav.newCase", icon: FilePlus2, roles: ["COUNSELLOR", "ADMIN"] },
  { href: "/referrals", labelKey: "nav.referrals", icon: Handshake },
  { href: "/follow-ups", labelKey: "nav.followUps", icon: CalendarClock },
  { href: "/analytics", labelKey: "nav.analytics", icon: BarChart3 },
  { href: "/audit-logs", labelKey: "nav.auditLogs", icon: ScrollText, roles: ["ADMIN"] },
  { href: "/settings", labelKey: "nav.settings", icon: Settings2 },
  { href: "/profile", labelKey: "nav.profile", icon: UserRound },
];

export default function StaffShell({ children }: { children: React.ReactNode }) {
  const { db, user, logout, setUiLanguage } = useStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (db && !user) router.replace("/login");
  }, [db, user, router]);

  if (!db || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <FlaskConical className="h-4 w-4 animate-pulse" /> Loading demo environment…
        </div>
      </div>
    );
  }

  const lang = db.settings.uiLanguage;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-slate-800 bg-slate-950 md:flex">
        <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500">
            <BrainCircuit className="h-5 w-5 text-white" />
          </span>
          <div>
            <p className="text-sm font-bold leading-none text-white">FLOWMINDS&rsquo;26</p>
            <p className="mt-1 text-[10px] text-slate-500">SIH26093 Prototype</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {NAV.filter((n) => !n.roles || n.roles.includes(user.role)).map((n) => {
            const active = n.href === "/cases" ? pathname === "/cases" : pathname === n.href || pathname.startsWith(n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active ? "bg-indigo-500/15 font-medium text-indigo-300" : "text-slate-400 hover:bg-slate-900 hover:text-slate-200"
                )}
              >
                <n.icon className="h-4 w-4" />
                {t(lang, n.labelKey)}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-500/20 text-sm font-bold text-indigo-300">
              {user.name.split(" ").map((p) => p[0]).join("")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-[10px] text-slate-500">{user.role}</p>
            </div>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              title={t(lang, "nav.logout")}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="md:pl-60">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 md:px-8">
            <div className="flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 py-1">
              <FlaskConical className="h-3.5 w-3.5 text-amber-600" />
              <span className="text-[11px] font-semibold text-amber-700">
                Prototype AI Assessment — Demonstration Mode
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1">
                <Languages className="h-3.5 w-3.5 text-slate-400" />
                <select
                  aria-label="UI language"
                  value={lang}
                  onChange={(e) => setUiLanguage(e.target.value as typeof lang)}
                  className="bg-transparent text-xs font-medium text-slate-700 outline-none"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.native} — {l.label}</option>
                  ))}
                </select>
              </div>
              <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 sm:block">
                {user.title}
              </span>
            </div>
          </div>
          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-2 py-1.5 md:hidden">
            {NAV.filter((n) => !n.roles || n.roles.includes(user.role)).map((n) => (
              <Link key={n.href} href={n.href}
                className={cn("flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs",
                  pathname === n.href ? "bg-indigo-50 font-medium text-indigo-700" : "text-slate-500")}>
                <n.icon className="h-3.5 w-3.5" /> {t(lang, n.labelKey)}
              </Link>
            ))}
          </nav>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">{children}</main>

        <footer className="px-4 pb-8 text-center md:px-8">
          <p className="text-[11px] text-slate-400">
            FLOWMINDS&rsquo;26 prototype · AI recommends, humans verify and act · Demo data stored locally in your browser
          </p>
        </footer>
      </div>
    </div>
  );
}
