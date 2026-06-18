"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { generateGameWithAI } from "./ai-generator-action";
import { createGame } from "./actions";

const GAME_TYPES = [
  { value: "image-click", label: "🖼️ Image", desc: "Clique sur la bonne image" },
  { value: "quiz", label: "❓ Quiz", desc: "Questions à choix multiples" },
  { value: "memory", label: "🧠 Memory", desc: "Associer les paires" },
  { value: "escape", label: "🔐 Escape", desc: "Escape room éducatif" },
  { value: "anagram", label: "🔤 Anagramme", desc: "Remettre les lettres en ordre" },
  { value: "aventure", label: "📖 Aventure", desc: "Livre dont vous êtes le héros — narration + choix" },
  { value: "mission", label: "🎯 Mission", desc: "Mission multi-phases avec boss final" },
];

export default function GameForm() {
  const [gameType, setGameType] = useState("quiz");
  const [title, setTitle] = useState("");

  // AI generator state
  const [aiSubject, setAiSubject] = useState("");
  const [aiGrade, setAiGrade] = useState("CE2");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState([
    { question: "", choices: ["", "", "", ""], correctIndex: 0 },
  ]);

  // Memory state
  const [pairs, setPairs] = useState([{ word: "", emoji: "" }]);

  // Escape state
  const [escapeScenario, setEscapeScenario] = useState("");
  const [escapeSetting, setEscapeSetting] = useState("🏰");
  const [escapeQuestions, setEscapeQuestions] = useState([
    { question: "", choices: ["", "", "", ""], correctIndex: 0, codeDigit: "", wrongHint: "" },
  ]);

  // Anagram state
  const [anagramWords, setAnagramWords] = useState([{ word: "", hint: "", emoji: "" }]);

  // Aventure state
  const [aventureConfig, setAventureConfig] = useState<unknown>(null);

  // Mission state
  const [missionConfig, setMissionConfig] = useState<unknown>(null);

  async function handleAIGenerate() {
    setAiLoading(true);
    setAiError(null);
    const result = await generateGameWithAI(gameType, aiSubject, aiGrade);
    if (result.success && result.config) {
      try {
        const parsed = JSON.parse(result.config);
        if (result.title) setTitle(result.title);
        if (gameType === "escape") {
          setEscapeScenario(parsed.scenario ?? "");
          setEscapeSetting(parsed.setting ?? "🏰");
          setEscapeQuestions(parsed.questions ?? []);
        } else if (gameType === "quiz") {
          setQuizQuestions(parsed.questions ?? []);
        } else if (gameType === "memory") {
          setPairs(parsed.pairs ?? []);
        } else if (gameType === "anagram") {
          setAnagramWords(parsed.words ?? []);
        } else if (gameType === "aventure") {
          setAventureConfig(parsed);
        } else if (gameType === "mission") {
          setMissionConfig(parsed);
        }
      } catch {
        setAiError("Erreur lors du remplissage du formulaire");
      }
    } else {
      setAiError(result.error ?? "Erreur inconnue");
    }
    setAiLoading(false);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await createGame(formData);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* AI Generator */}
      <div className="bg-gradient-to-br from-[#2563EB]/5 to-[#7C3AED]/5 border border-[#2563EB]/20 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#2563EB]" />
          <p className="text-[13px] font-semibold text-[#0F172A]">Générer avec l&apos;IA</p>
        </div>
        <p className="text-[12px] text-[#64748B] mb-4">Décrivez le sujet et l&apos;IA crée le jeu automatiquement.</p>
        <div className="flex gap-2">
          <input
            value={aiSubject}
            onChange={e => setAiSubject(e.target.value)}
            placeholder="Ex : Les fractions CE2, La Révolution française..."
            className="flex-1 h-10 border border-[#E2E8F0] rounded-xl px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white placeholder:text-[#CBD5E1]"
          />
          <select
            value={aiGrade}
            onChange={e => setAiGrade(e.target.value)}
            className="h-10 border border-[#E2E8F0] rounded-xl px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 bg-white text-[#0F172A]"
          >
            {["CP","CE1","CE2","CM1","CM2","6ème","5ème","4ème","3ème"].map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={!aiSubject.trim() || aiLoading}
            onClick={handleAIGenerate}
            className="h-10 px-4 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5 shrink-0 disabled:opacity-50 transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
          >
            {aiLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Génération...
              </span>
            ) : (
              <><Sparkles className="w-3.5 h-3.5" /> Générer</>
            )}
          </button>
        </div>
        {aiError && <p className="text-[12px] text-red-600 mt-2">{aiError}</p>}
      </div>

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-1.5">Titre du jeu</label>
        <input
          name="title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          placeholder="Ex : Les tables de multiplication"
          className="w-full h-10 border border-[#E2E8F0] rounded-xl px-3.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] bg-white"
        />
      </div>

      {/* Game type selector */}
      <div>
        <label className="block text-sm font-medium text-[#0F172A] mb-2">Type de jeu</label>
        <input type="hidden" name="type" value={gameType} />
        <div className="grid grid-cols-2 gap-2">
          {GAME_TYPES.map(gt => (
            <button
              key={gt.value}
              type="button"
              onClick={() => setGameType(gt.value)}
              className={`text-left p-3 rounded-xl border transition-all ${
                gameType === gt.value
                  ? "border-[#2563EB] bg-[#EFF6FF]"
                  : "border-[#E2E8F0] hover:border-[#2563EB]/40"
              }`}
            >
              <div className="text-sm font-semibold">{gt.label}</div>
              <div className="text-[11px] text-[#64748B] mt-0.5">{gt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Quiz editor */}
      {gameType === "quiz" && (
        <div className="space-y-4">
          {quizQuestions.map((q, qi) => (
            <div key={qi} className="bg-[#F8FAFC] rounded-xl p-4 border border-[#F1F5F9]">
              <p className="text-[12px] font-medium text-[#64748B] mb-2">Question {qi + 1}</p>
              <input
                value={q.question}
                onChange={e => {
                  const updated = [...quizQuestions];
                  updated[qi] = { ...updated[qi], question: e.target.value };
                  setQuizQuestions(updated);
                }}
                placeholder="Question..."
                className="w-full h-9 border border-[#E2E8F0] rounded-lg px-3 text-[13px] focus:outline-none focus:border-[#2563EB] bg-white mb-2"
              />
              {q.choices.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2 mb-1.5">
                  <input
                    type="radio"
                    checked={q.correctIndex === ci}
                    onChange={() => {
                      const updated = [...quizQuestions];
                      updated[qi] = { ...updated[qi], correctIndex: ci };
                      setQuizQuestions(updated);
                    }}
                    className="accent-[#2563EB]"
                  />
                  <input
                    value={c}
                    onChange={e => {
                      const updated = [...quizQuestions];
                      const choices = [...updated[qi].choices];
                      choices[ci] = e.target.value;
                      updated[qi] = { ...updated[qi], choices };
                      setQuizQuestions(updated);
                    }}
                    placeholder={`Choix ${ci + 1}`}
                    className="flex-1 h-8 border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB] bg-white"
                  />
                </div>
              ))}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setQuizQuestions([...quizQuestions, { question: "", choices: ["", "", "", ""], correctIndex: 0 }])}
            className="text-[13px] text-[#2563EB] hover:underline"
          >
            + Ajouter une question
          </button>
          <input type="hidden" name="quizConfig" value={JSON.stringify({ questions: quizQuestions, timePerQuestion: 20 })} />
        </div>
      )}

      {/* Memory editor */}
      {gameType === "memory" && (
        <div className="space-y-3">
          {pairs.map((pair, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={pair.word}
                onChange={e => {
                  const updated = [...pairs];
                  updated[i] = { ...updated[i], word: e.target.value };
                  setPairs(updated);
                }}
                placeholder="Mot"
                className="flex-1 h-9 border border-[#E2E8F0] rounded-lg px-3 text-[13px] focus:outline-none focus:border-[#2563EB] bg-white"
              />
              <input
                value={pair.emoji}
                onChange={e => {
                  const updated = [...pairs];
                  updated[i] = { ...updated[i], emoji: e.target.value };
                  setPairs(updated);
                }}
                placeholder="Emoji"
                className="w-16 h-9 border border-[#E2E8F0] rounded-lg px-3 text-[13px] text-center focus:outline-none focus:border-[#2563EB] bg-white"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setPairs([...pairs, { word: "", emoji: "" }])}
            className="text-[13px] text-[#2563EB] hover:underline"
          >
            + Ajouter une paire
          </button>
          <input type="hidden" name="memoryConfig" value={JSON.stringify({ pairs })} />
        </div>
      )}

      {/* Escape editor */}
      {gameType === "escape" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              value={escapeSetting}
              onChange={e => setEscapeSetting(e.target.value)}
              placeholder="🏰"
              className="w-16 h-9 border border-[#E2E8F0] rounded-lg px-3 text-center text-[13px] focus:outline-none focus:border-[#2563EB] bg-white"
            />
            <input
              value={escapeScenario}
              onChange={e => setEscapeScenario(e.target.value)}
              placeholder="Scénario..."
              className="flex-1 h-9 border border-[#E2E8F0] rounded-lg px-3 text-[13px] focus:outline-none focus:border-[#2563EB] bg-white"
            />
          </div>
          {escapeQuestions.map((q, qi) => (
            <div key={qi} className="bg-[#F8FAFC] rounded-xl p-4 border border-[#F1F5F9]">
              <p className="text-[12px] font-medium text-[#64748B] mb-2">Question {qi + 1} — Chiffre du code</p>
              <input
                value={q.question}
                onChange={e => {
                  const updated = [...escapeQuestions];
                  updated[qi] = { ...updated[qi], question: e.target.value };
                  setEscapeQuestions(updated);
                }}
                placeholder="Question..."
                className="w-full h-9 border border-[#E2E8F0] rounded-lg px-3 text-[13px] focus:outline-none focus:border-[#2563EB] bg-white mb-2"
              />
              <div className="flex gap-2 mb-2">
                <input
                  value={q.codeDigit}
                  onChange={e => {
                    const updated = [...escapeQuestions];
                    updated[qi] = { ...updated[qi], codeDigit: e.target.value };
                    setEscapeQuestions(updated);
                  }}
                  placeholder="Chiffre (0-9)"
                  className="w-24 h-8 border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB] bg-white"
                />
                <input
                  value={q.wrongHint}
                  onChange={e => {
                    const updated = [...escapeQuestions];
                    updated[qi] = { ...updated[qi], wrongHint: e.target.value };
                    setEscapeQuestions(updated);
                  }}
                  placeholder="Indice si erreur..."
                  className="flex-1 h-8 border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB] bg-white"
                />
              </div>
              {q.choices.map((c, ci) => (
                <div key={ci} className="flex items-center gap-2 mb-1.5">
                  <input
                    type="radio"
                    checked={q.correctIndex === ci}
                    onChange={() => {
                      const updated = [...escapeQuestions];
                      updated[qi] = { ...updated[qi], correctIndex: ci };
                      setEscapeQuestions(updated);
                    }}
                    className="accent-[#2563EB]"
                  />
                  <input
                    value={c}
                    onChange={e => {
                      const updated = [...escapeQuestions];
                      const choices = [...updated[qi].choices];
                      choices[ci] = e.target.value;
                      updated[qi] = { ...updated[qi], choices };
                      setEscapeQuestions(updated);
                    }}
                    placeholder={`Choix ${ci + 1}`}
                    className="flex-1 h-8 border border-[#E2E8F0] rounded-lg px-3 text-[12px] focus:outline-none focus:border-[#2563EB] bg-white"
                  />
                </div>
              ))}
            </div>
          ))}
          <input type="hidden" name="escapeConfig" value={JSON.stringify({ scenario: escapeScenario, setting: escapeSetting, questions: escapeQuestions })} />
        </div>
      )}

      {/* Anagram editor */}
      {gameType === "anagram" && (
        <div className="space-y-3">
          {anagramWords.map((w, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={w.word}
                onChange={e => {
                  const updated = [...anagramWords];
                  updated[i] = { ...updated[i], word: e.target.value };
                  setAnagramWords(updated);
                }}
                placeholder="MOT"
                className="w-24 h-9 border border-[#E2E8F0] rounded-lg px-3 text-[13px] focus:outline-none focus:border-[#2563EB] bg-white"
              />
              <input
                value={w.hint}
                onChange={e => {
                  const updated = [...anagramWords];
                  updated[i] = { ...updated[i], hint: e.target.value };
                  setAnagramWords(updated);
                }}
                placeholder="Définition..."
                className="flex-1 h-9 border border-[#E2E8F0] rounded-lg px-3 text-[13px] focus:outline-none focus:border-[#2563EB] bg-white"
              />
              <input
                value={w.emoji}
                onChange={e => {
                  const updated = [...anagramWords];
                  updated[i] = { ...updated[i], emoji: e.target.value };
                  setAnagramWords(updated);
                }}
                placeholder="Emoji"
                className="w-14 h-9 border border-[#E2E8F0] rounded-lg px-3 text-[13px] text-center focus:outline-none focus:border-[#2563EB] bg-white"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={() => setAnagramWords([...anagramWords, { word: "", hint: "", emoji: "" }])}
            className="text-[13px] text-[#2563EB] hover:underline"
          >
            + Ajouter un mot
          </button>
          <input type="hidden" name="anagramConfig" value={JSON.stringify({ words: anagramWords })} />
        </div>
      )}

      {/* Aventure editor */}
      {gameType === "aventure" && (
        <div className="space-y-4">
          <p className="text-[13px] text-[#64748B]">
            Utilisez le générateur IA ci-dessus pour créer une aventure, ou collez une configuration JSON.
          </p>
          {aventureConfig ? (
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#F1F5F9]">
              <p className="text-[12px] text-[#64748B] mb-2 font-medium">
                ✓ Aventure générée : <span className="text-[#0F172A] font-semibold">{(aventureConfig as Record<string, string>).title}</span>
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                {((aventureConfig as Record<string, unknown[]>).chapters ?? []).length} chapitres • Thème: {(aventureConfig as Record<string, string>).theme}
              </p>
              <button type="button" onClick={() => setAventureConfig(null)} className="text-[11px] text-red-500 mt-2 hover:underline">
                Réinitialiser
              </button>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-[#E2E8F0] rounded-xl">
              <p className="text-[13px] text-[#94A3B8]">Cliquez sur &quot;Générer&quot; ci-dessus pour créer votre aventure</p>
            </div>
          )}
          <input type="hidden" name="aventureConfig" value={aventureConfig ? JSON.stringify(aventureConfig) : ""} />
        </div>
      )}

      {/* Mission editor */}
      {gameType === "mission" && (
        <div className="space-y-4">
          <p className="text-[13px] text-[#64748B]">
            Utilisez le générateur IA ci-dessus pour créer une mission.
          </p>
          {missionConfig ? (
            <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#F1F5F9]">
              <p className="text-[12px] text-[#64748B] mb-2 font-medium">
                ✓ Mission générée : <span className="text-[#0F172A] font-semibold">{(missionConfig as Record<string, string>).title}</span>
              </p>
              <p className="text-[11px] text-[#94A3B8]">
                {((missionConfig as Record<string, unknown[]>).phases ?? []).length} phases
              </p>
              <button type="button" onClick={() => setMissionConfig(null)} className="text-[11px] text-red-500 mt-2 hover:underline">
                Réinitialiser
              </button>
            </div>
          ) : (
            <div className="text-center py-8 border-2 border-dashed border-[#E2E8F0] rounded-xl">
              <p className="text-[13px] text-[#94A3B8]">Cliquez sur &quot;Générer&quot; ci-dessus pour créer votre mission</p>
            </div>
          )}
          <input type="hidden" name="missionConfig" value={missionConfig ? JSON.stringify(missionConfig) : ""} />
        </div>
      )}

      <button
        type="submit"
        className="w-full h-11 rounded-xl font-semibold text-white text-[14px]"
        style={{ background: "linear-gradient(135deg, #2563EB 0%, #7C3AED 100%)" }}
      >
        Créer le jeu
      </button>
    </form>
  );
}
