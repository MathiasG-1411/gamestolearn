import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div
        className="bg-white p-10 rounded-[20px]"
        style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.05)" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-[#2563EB]" />
          </div>
          <Link href="/" className="text-2xl font-bold text-[#0F172A]">
            Games<span className="text-[#2563EB]">To</span>Learn
          </Link>
          <p className="text-[#475569] text-sm mt-1">Espace enseignant</p>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0F172A] mb-1">
            Bienvenue 👋
          </h1>
          <p className="text-[#475569] text-sm">
            Connectez-vous à votre espace enseignant
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl mb-5 text-center">
            Email ou mot de passe incorrect.
          </div>
        )}

        <form action={login} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-[#0F172A]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="vous@exemple.com"
              className="h-12 border border-gray-200 rounded-[12px] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-[#0F172A]">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="h-12 border border-gray-200 rounded-[12px] px-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent bg-white"
            />
          </div>

          <Button type="submit" className="w-full mt-1">
            Se connecter
          </Button>
        </form>
      </div>
    </div>
  );
}
