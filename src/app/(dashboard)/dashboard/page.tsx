import Link from "next/link";
import {
  Users,
  Play,
  BarChart2,
  ChevronRight,
  FileText,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { count: classCount } = await supabase
    .from("classes")
    .select("*", { count: "exact", head: true })
    .eq("teacher_id", user!.id);

  const { count: studentCount } = await supabase
    .from("students")
    .select("students.id", { count: "exact", head: true })
    .eq("classes.teacher_id", user!.id);

  const { count: gameCount } = await supabase
    .from("games")
    .select("*", { count: "exact", head: true });

  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ?? null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-1">
          {firstName ? `Bonjour, ${firstName} 👋` : "Bonjour 👋"}
        </h1>
        <p className="text-[#475569]">Que souhaitez-vous faire aujourd&apos;hui ?</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          {
            label: "Classes",
            value: classCount ?? 0,
            icon: GraduationCap,
            color: "text-[#2563EB]",
            bg: "bg-[#2563EB]/10",
          },
          {
            label: "Élèves",
            value: studentCount ?? 0,
            icon: Users,
            color: "text-[#14B8A6]",
            bg: "bg-[#14B8A6]/10",
          },
          {
            label: "Jeux",
            value: gameCount ?? 0,
            icon: Play,
            color: "text-[#FBBF24]",
            bg: "bg-[#FBBF24]/10",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-[20px] p-5 flex flex-col gap-2"
            style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.05)" }}
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bg} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div className="text-2xl font-bold text-[#0F172A]">{stat.value}</div>
            <div className="text-sm text-[#475569]">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Action cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Active cards */}
        <Link
          href="/classes"
          className="group bg-white rounded-[20px] p-6 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-[#2563EB]" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#2563EB] transition-colors" />
          </div>
          <div>
            <h2 className="font-bold text-[#0F172A] text-lg mb-0.5">Consulter mes classes</h2>
            <p className="text-[#475569] text-sm">
              {classCount ?? 0} classe{(classCount ?? 0) !== 1 ? "s" : ""} créée{(classCount ?? 0) !== 1 ? "s" : ""}
            </p>
          </div>
        </Link>

        <Link
          href="/games"
          className="group bg-white rounded-[20px] p-6 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#FBBF24]/10 flex items-center justify-center">
              <Play className="w-6 h-6 text-[#FBBF24]" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#FBBF24] transition-colors" />
          </div>
          <div>
            <h2 className="font-bold text-[#0F172A] text-lg mb-0.5">Mes jeux</h2>
            <p className="text-[#475569] text-sm">Créez et gérez vos jeux pédagogiques</p>
          </div>
        </Link>

        <Link
          href="/progress"
          className="group bg-white rounded-[20px] p-6 flex flex-col gap-3 transition-all duration-200 hover:-translate-y-0.5"
          style={{
            boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
            border: "1px solid rgba(0,0,0,0.05)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 flex items-center justify-center">
              <BarChart2 className="w-6 h-6 text-[#14B8A6]" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#14B8A6] transition-colors" />
          </div>
          <div>
            <h2 className="font-bold text-[#0F172A] text-lg mb-0.5">Progression élèves</h2>
            <p className="text-[#475569] text-sm">Suivez les scores et la progression en temps réel</p>
          </div>
        </Link>

        {/* Coming soon cards */}
        {[
          { icon: BookOpen, label: "Créer une préparation de cours" },
          { icon: ClipboardCheck, label: "Générer une évaluation" },
          { icon: FileText, label: "Créer une fiche d'exercices" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-[20px] p-6 flex flex-col gap-3 opacity-60 cursor-not-allowed select-none"
            style={{
              boxShadow: "0 8px 24px rgba(0,0,0,0.03)",
              border: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-gray-400" />
              </div>
              <span className="text-xs font-semibold bg-[#FBBF24]/20 text-amber-700 px-2.5 py-1 rounded-full">
                Bientôt
              </span>
            </div>
            <div>
              <h2 className="font-bold text-[#475569] text-lg mb-0.5">{item.label}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
