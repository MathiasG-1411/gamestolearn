import Link from "next/link";
import { Button } from "@/components/ui/button";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <Link href="/" className="text-2xl font-bold">
          Games<span className="text-primary">To</span>Learn
        </Link>
        <p className="text-muted-foreground text-sm mt-2">
          Espace enseignant
        </p>
      </div>

      <div className="bg-background rounded-2xl shadow-sm border border-border p-8">
        <h1 className="text-xl font-semibold mb-1">Connexion</h1>
        <p className="text-muted-foreground text-sm mb-6">
          Accédez à votre espace de gestion des classes.
        </p>

        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg mb-5 text-center">
            Email ou mot de passe incorrect.
          </div>
        )}

        <form action={login} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="vous@exemple.com"
              className="border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-medium">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="border border-input rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <Button type="submit" className="w-full h-11 text-base mt-1">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
