import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-10 left-10 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-white/10 rounded-full blur-3xl" />

        <div className="relative z-10">
          <div className="text-7xl mb-6 drop-shadow-lg">🎮</div>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow">
            GamesToLearn
          </h1>
          <p className="text-indigo-100 text-xl max-w-md mb-10">
            La plateforme qui rend l&apos;apprentissage <strong className="text-white">ludique</strong> et <strong className="text-white">engageant</strong>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs mx-auto">
            <Link
              href="/login"
              className="flex-1 bg-white text-indigo-700 font-bold py-3.5 px-6 rounded-2xl text-center hover:bg-indigo-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200"
            >
              👩‍🏫 Enseignant
            </Link>
            <Link
              href="/student"
              className="flex-1 bg-amber-400 text-amber-900 font-bold py-3.5 px-6 rounded-2xl text-center hover:bg-amber-300 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200"
            >
              🎒 Élève
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="px-6 py-14 bg-white">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { emoji: "🏫", title: "Gestion des classes", desc: "Créez vos classes et gérez vos élèves facilement.", color: "bg-indigo-50 border-indigo-200" },
            { emoji: "🔑", title: "Connexion par code", desc: "Les élèves se connectent sans email, juste un code.", color: "bg-amber-50 border-amber-200" },
            { emoji: "📊", title: "Suivi des progrès", desc: "Visualisez les scores et la progression en temps réel.", color: "bg-violet-50 border-violet-200" },
          ].map((f) => (
            <div key={f.title} className={`${f.color} border rounded-2xl p-6 text-center`}>
              <div className="text-4xl mb-3">{f.emoji}</div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
