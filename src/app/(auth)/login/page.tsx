import { Button } from "@/components/ui/button";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="w-full max-w-sm p-8 bg-background rounded-xl shadow-sm border border-border">
      <h1 className="text-2xl font-semibold mb-2">Connexion enseignant</h1>
      <p className="text-muted-foreground text-sm mb-6">
        Accédez à votre espace de gestion des classes.
      </p>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md mb-4">
          Email ou mot de passe incorrect.
        </p>
      )}

      <form action={login} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="vous@exemple.com"
            className="border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="border border-input rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <Button type="submit" className="w-full mt-2">
          Se connecter
        </Button>
      </form>
    </div>
  );
}
