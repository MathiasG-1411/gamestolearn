import GameForm from "./game-form";

export default function NewGamePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0F172A]">Nouveau jeu</h1>
        <p className="text-[#64748B] text-sm mt-1">Créez un jeu éducatif pour vos élèves.</p>
      </div>
      <GameForm />
    </div>
  );
}
