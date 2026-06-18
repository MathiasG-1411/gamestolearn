import Link from "next/link";
import { Users, Play, BarChart2, LogOut, Sparkles } from "lucide-react";
import { logout } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <header
        className="bg-white sticky top-0 z-10 px-6 py-0"
        style={{ borderBottom: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 1px 8px rgba(0,0,0,0.04)" }}
      >
        <nav className="flex items-center justify-between max-w-7xl mx-auto h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-[#0F172A]">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span>
              Games<span className="text-[#2563EB]">To</span>Learn
            </span>
          </Link>

          {/* Center nav */}
          <div className="hidden sm:flex items-center gap-1 bg-gray-50 rounded-2xl p-1">
            <Link
              href="/classes"
              className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#0F172A] hover:bg-white px-4 py-2 rounded-xl transition-all font-medium"
            >
              <Users className="w-4 h-4" />
              Classes
            </Link>
            <Link
              href="/games"
              className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#0F172A] hover:bg-white px-4 py-2 rounded-xl transition-all font-medium"
            >
              <Play className="w-4 h-4" />
              Jeux
            </Link>
            <Link
              href="/progress"
              className="flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#0F172A] hover:bg-white px-4 py-2 rounded-xl transition-all font-medium"
            >
              <BarChart2 className="w-4 h-4" />
              Progression
            </Link>
          </div>

          {/* Right side */}
          <form action={logout}>
            <Button
              variant="ghost"
              size="sm"
              type="submit"
              className="flex items-center gap-1.5 text-[#475569] hover:text-[#0F172A] text-sm h-9"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Se déconnecter</span>
            </Button>
          </form>
        </nav>

        {/* Mobile nav */}
        <div className="sm:hidden flex items-center gap-1 pb-2 overflow-x-auto">
          <Link
            href="/classes"
            className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#0F172A] hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            Classes
          </Link>
          <Link
            href="/games"
            className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#0F172A] hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap"
          >
            <Play className="w-3.5 h-3.5" />
            Jeux
          </Link>
          <Link
            href="/progress"
            className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#0F172A] hover:bg-gray-100 px-3 py-1.5 rounded-xl transition-all font-medium whitespace-nowrap"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Progression
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
