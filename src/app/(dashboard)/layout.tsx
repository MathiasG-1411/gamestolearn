import Link from "next/link";
import { logout } from "@/app/(auth)/login/actions";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <header className="border-b border-border bg-background px-6 py-3 sticky top-0 z-10 shadow-sm">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-bold text-lg">
              Games<span className="text-primary">To</span>Learn
            </Link>
            <div className="flex items-center gap-1">
              <Link
                href="/classes"
                className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
              >
                🏫 Classes
              </Link>
              <Link
                href="/games"
                className="text-sm text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-lg transition-colors"
              >
                🎮 Jeux
              </Link>
            </div>
          </div>
          <form action={logout}>
            <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground">
              Se déconnecter
            </Button>
          </form>
        </nav>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {children}
      </main>
    </div>
  );
}
