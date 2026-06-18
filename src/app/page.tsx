import Link from "next/link";
import { GraduationCap, Key, BarChart2, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div
        className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 60%, #EC4899 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-lg mx-auto">
          {/* Logo icon */}
          <div className="w-20 h-20 rounded-3xl bg-white/20 flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Sparkles className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow">
            GamesToLearn
          </h1>
          <p className="text-white/80 text-xl max-w-md mx-auto mb-10">
            La plateforme qui rend l&apos;apprentissage{" "}
            <strong className="text-white">ludique</strong> et{" "}
            <strong className="text-white">engageant</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mx-auto">
            <Link
              href="/login"
              className="flex-1 bg-white text-[#2563EB] font-bold py-4 px-6 rounded-[14px] text-center hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200 text-sm"
            >
              👩‍🏫 Enseignant
            </Link>
            <Link
              href="/student"
              className="flex-1 bg-[#FBBF24] text-amber-900 font-bold py-4 px-6 rounded-[14px] text-center hover:bg-amber-300 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200 text-sm"
            >
              🎒 Élève
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-16 bg-white">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            {
              icon: GraduationCap,
              title: "Gestion des classes",
              desc: "Créez vos classes et gérez vos élèves facilement.",
              color: "text-[#2563EB]",
              bg: "bg-[#2563EB]/10",
            },
            {
              icon: Key,
              title: "Connexion par code",
              desc: "Les élèves se connectent sans email, juste un code.",
              color: "text-[#FBBF24]",
              bg: "bg-[#FBBF24]/10",
            },
            {
              icon: BarChart2,
              title: "Suivi des progrès",
              desc: "Visualisez les scores et la progression en temps réel.",
              color: "text-[#14B8A6]",
              bg: "bg-[#14B8A6]/10",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-[20px] p-6 text-center"
              style={{
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              <div
                className={`w-14 h-14 rounded-2xl ${f.bg} flex items-center justify-center mx-auto mb-4`}
              >
                <f.icon className={`w-7 h-7 ${f.color}`} />
              </div>
              <h3 className="font-bold text-[#0F172A] mb-1">{f.title}</h3>
              <p className="text-sm text-[#475569]">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
