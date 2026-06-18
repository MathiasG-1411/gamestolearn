"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, Gamepad2, BarChart2,
  Sparkles, LogOut, GraduationCap, ExternalLink,
} from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";

const NAV = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Tableau de bord" },
  { href: "/classes", icon: Users, label: "Classes" },
  { href: "/games", icon: Gamepad2, label: "Jeux" },
  { href: "/progress", icon: BarChart2, label: "Progression" },
];

interface SidebarProps {
  userEmail: string;
  userName: string;
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname();

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className="w-[232px] shrink-0 h-screen sticky top-0 flex flex-col bg-white"
      style={{ borderRight: "1px solid #F1F5F9" }}
    >
      {/* Logo */}
      <div className="px-4 h-14 flex items-center" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-bold text-[#0F172A] text-[13px] tracking-tight">
            Games<span className="text-[#2563EB]">To</span>Learn
          </span>
        </Link>
      </div>

      {/* User section */}
      <div className="px-3 py-2.5" style={{ borderBottom: "1px solid #F1F5F9" }}>
        <div className="flex items-center gap-2.5 px-2 py-2 rounded-xl">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-[#0F172A] truncate leading-tight">{userName}</p>
            <p className="text-[11px] text-[#94A3B8] truncate">{userEmail}</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 pt-4 pb-2 overflow-y-auto">
        <p className="text-[10px] font-semibold text-[#CBD5E1] uppercase tracking-widest px-2.5 mb-1.5">
          Enseignant
        </p>
        <div className="space-y-0.5">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href ||
              (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`group flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? "bg-[#EFF6FF] text-[#2563EB] font-semibold"
                    : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    active
                      ? "text-[#2563EB]"
                      : "text-[#94A3B8] group-hover:text-[#475569]"
                  }`}
                />
                <span className="flex-1">{label}</span>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="mt-4 pt-3" style={{ borderTop: "1px solid #F1F5F9" }}>
          <p className="text-[10px] font-semibold text-[#CBD5E1] uppercase tracking-widest px-2.5 mb-1.5">
            Élèves
          </p>
          <Link
            href="/student"
            target="_blank"
            className="group flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-all duration-150"
          >
            <GraduationCap className="w-4 h-4 text-[#94A3B8] group-hover:text-[#475569] shrink-0" />
            <span className="flex-1">Espace élève</span>
            <ExternalLink className="w-3 h-3 text-[#CBD5E1] group-hover:text-[#94A3B8]" />
          </Link>
        </div>
      </nav>

      {/* Logout */}
      <div className="px-3 py-3" style={{ borderTop: "1px solid #F1F5F9" }}>
        <form action={logout}>
          <button
            type="submit"
            className="w-full flex items-center gap-2.5 px-2.5 py-[7px] rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
          >
            <LogOut className="w-4 h-4 text-[#94A3B8] group-hover:text-red-500 shrink-0 transition-colors" />
            <span>Se déconnecter</span>
          </button>
        </form>
      </div>
    </aside>
  );
}
