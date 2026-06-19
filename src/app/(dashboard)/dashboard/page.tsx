import Link from "next/link";
import { Users, Gamepad2, BarChart2, GraduationCap, ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { count: classCount },
    { count: gameCount },
  ] = await Promise.all([
    supabase.from("classes").select("*", { count: "exact", head: true }).eq("teacher_id", user!.id),
    supabase.from("games").select("*", { count: "exact", head: true }),
  ]);

  const { data: classIds } = await supabase
    .from("classes")
    .select("id")
    .eq("teacher_id", user!.id);

  const { count: studentCount } = classIds && classIds.length > 0
    ? await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .in("class_id", classIds.map((c) => c.id))
    : { count: 0 };

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? null;

  const now = new Date();
  const dateStr = now.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const formattedDate = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const STATS = [
    {
      label: "Classes",
      value: classCount ?? 0,
      icon: GraduationCap,
      color: "#2563EB",
      bgColor: "#EFF6FF",
      href: "/classes",
      cta: "Gérer les classes",
    },
    {
      label: "Élèves",
      value: studentCount ?? 0,
      icon: Users,
      color: "#14B8A6",
      bgColor: "#F0FDFA",
      href: "/classes",
      cta: "Voir les élèves",
    },
    {
      label: "Jeux créés",
      value: gameCount ?? 0,
      icon: Gamepad2,
      color: "#F59E0B",
      bgColor: "#FFFBEB",
      href: "/games",
      cta: "Gérer les jeux",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-1">
            {firstName ? `Bonjour, ${firstName} 👋` : "Bonjour 👋"}
          </h1>
          <p className="text-[13px] text-[#94A3B8]">{formattedDate}</p>
        </div>
        <Link
          href="/games/new"
          className="inline-flex items-center gap-2 h-9 px-4 rounded-xl text-[13px] font-semibold text-white transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-sm"
          style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau jeu
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
        {STATS.map((stat, i) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group bg-white rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-up"
            style={{
              border: "1px solid #F1F5F9",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: stat.bgColor }}
              >
                <stat.icon style={{ color: stat.color, width: "18px", height: "18px" }} />
              </div>
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: stat.bgColor, color: stat.color }}
              >
                {stat.label}
              </span>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0F172A] leading-none mb-1">
                {stat.value}
              </div>
              <div className="flex items-center gap-1 text-[12px] font-medium text-[#94A3B8] group-hover:text-[#2563EB] transition-colors">
                {stat.cta}
                <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <p className="text-[11px] font-semibold text-[#94A3B8] uppercase tracking-widest mb-3">
          Actions rapides
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/games/new"
            className="group flex items-center gap-4 bg-white rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            style={{
              border: "1px solid #F1F5F9",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center shrink-0">
              <Gamepad2 className="w-5 h-5 text-[#2563EB]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0F172A] mb-0.5">Créer un jeu</p>
              <p className="text-[12px] text-[#94A3B8]">6 types disponibles</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#2563EB] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>

          <Link
            href="/progress"
            className="group flex items-center gap-4 bg-white rounded-2xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            style={{
              border: "1px solid #F1F5F9",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)",
            }}
          >
            <div className="w-10 h-10 rounded-xl bg-[#F0FDFA] flex items-center justify-center shrink-0">
              <BarChart2 className="w-5 h-5 text-[#14B8A6]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-[#0F172A] mb-0.5">Voir la progression</p>
              <p className="text-[12px] text-[#94A3B8]">Scores par élève</p>
            </div>
            <ArrowRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#14B8A6] group-hover:translate-x-0.5 transition-all shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  );
}
