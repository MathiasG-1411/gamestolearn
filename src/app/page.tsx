import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center bg-gradient-to-b from-accent to-background">
        <div className="text-6xl mb-6">🎮</div>
        <h1 className="text-5xl font-bold text-foreground mb-4 tracking-tight">
          Games<span className="text-primary">To</span>Learn
        </h1>
        <p className="text-muted-foreground text-xl max-w-md mb-10">
          La plateforme qui rend l&apos;apprentissage ludique et engageant.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
          <Button asChild size="lg" className="flex-1 text-base h-14">
            <Link href="/login">
              <span className="mr-2">👩‍🏫</span> Espace enseignant
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1 text-base h-14 border-primary/30 text-primary hover:bg-accent">
            <Link href="/student">
              <span className="mr-2">🎒</span> Espace élève
            </Link>
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="bg-muted/50 border-t border-border px-6 py-12">
        <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">🏫</span>
            <h3 className="font-semibold">Gestion des classes</h3>
            <p className="text-sm text-muted-foreground">Créez vos classes et ajoutez vos élèves en quelques clics.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">🔑</span>
            <h3 className="font-semibold">Connexion simplifiée</h3>
            <p className="text-sm text-muted-foreground">Les élèves se connectent avec un simple code, sans email.</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="text-3xl">📊</span>
            <h3 className="font-semibold">Suivi des progrès</h3>
            <p className="text-sm text-muted-foreground">Visualisez les scores et la progression de vos élèves.</p>
          </div>
        </div>
      </div>
    </main>
  );
}
