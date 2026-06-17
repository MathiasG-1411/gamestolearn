import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 p-8">
      <h1 className="text-4xl font-bold text-primary">GamesToLearn</h1>
      <p className="text-muted-foreground text-lg text-center max-w-md">
        La plateforme éducative qui rend l&apos;apprentissage ludique.
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">Espace enseignant</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/student">Espace élève</Link>
        </Button>
      </div>
    </main>
  );
}
