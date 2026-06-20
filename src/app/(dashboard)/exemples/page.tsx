"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";

const EXAMPLES = [
  {
    type: "aventure",
    label: "Aventure",
    icon: "📖",
    description: "Livre dont tu es le héros — narration + choix",
    color: "#7C3AED",
    json: {
      title: "L'Expédition en Égypte Ancienne",
      theme: "chateau",
      intro:
        "Tu es un jeune archéologue en mission secrète. Le sable chaud crisse sous tes bottes alors que tu approches des grandes pyramides de Gizeh…",
      character: "Archéologue",
      characterEmoji: "🗺️",
      startChapterId: "ch1",
      chapters: [
        {
          id: "ch1",
          narrative:
            "Devant toi se dresse le grand Sphinx. Un gardien surgit : « Pour entrer, tu dois répondre à mon énigme ! »",
          challenge: {
            question: "Quel pharaon a fait construire la Grande Pyramide de Gizeh ?",
            choices: ["Ramsès II", "Khéops", "Toutânkhamon"],
            correctIndex: 1,
            correctFeedback: "« Bien parlé, jeune explorateur ! » Le gardien s'écarte.",
            wrongFeedback: "Le gardien fronce les sourcils… Réfléchis encore !",
          },
          correctNext: "ch2",
          wrongNext: "ch1",
        },
        {
          id: "ch2",
          narrative:
            "Tu entres dans un couloir sombre. Des hiéroglyphes brillent à la lueur de ta torche. Une question est gravée dans la pierre…",
          challenge: {
            question: "Le Nil coule dans quel sens ?",
            choices: ["Du nord au sud", "Du sud au nord", "D'est en ouest"],
            correctIndex: 1,
            correctFeedback: "Une porte secrète s'ouvre ! Tu avances dans le couloir.",
            wrongFeedback: "Une décharge te pique les doigts. Essaie encore !",
          },
          correctNext: "ch3",
          wrongNext: "ch2",
        },
        {
          id: "ch3",
          narrative:
            "Tu arrives dans la chambre du pharaon. Une voix mystérieuse résonne : « Prouve que tu mérites ce trésor… »",
          challenge: {
            question: "Combien font 47 + 36 ?",
            choices: ["73", "83", "93"],
            correctIndex: 1,
            correctFeedback: "Le coffre s'ouvre ! Tu t'échappes avec le trésor !",
            wrongFeedback: "Le calcul est incorrect… Compte encore une fois.",
          },
          correctNext: "end_good",
          wrongNext: "ch3",
        },
      ],
      endingGood: {
        text: "Félicitations ! Tu as résolu toutes les énigmes et ramené le trésor. Tu es un vrai archéologue !",
        emoji: "🏆",
        xp: 100,
      },
      endingBad: {
        text: "L'aventure s'arrête ici. Entraîne-toi et reviens relever le défi !",
        emoji: "😔",
        xp: 20,
      },
    },
  },
  {
    type: "mission",
    label: "Mission",
    icon: "🎯",
    description: "Mission multi-phases avec boss final",
    color: "#DC2626",
    json: {
      title: "Mission Système Solaire",
      narrative:
        "Agent spécial, nous avons besoin de toi. Une sonde mystérieuse traverse notre système solaire et nous devons l'identifier. Prépare-toi !",
      phases: [
        {
          title: "Phase 1 — Identification des planètes",
          briefing:
            "Pour localiser la sonde, tu dois d'abord connaître les planètes par cœur.",
          questions: [
            {
              question: "Quelle est la planète la plus proche du Soleil ?",
              choices: ["Vénus", "Mercure", "Mars"],
              correctIndex: 1,
              feedback: "Exact ! Mercure orbite en seulement 88 jours autour du Soleil.",
            },
            {
              question: "Quelle planète est surnommée la 'planète rouge' ?",
              choices: ["Saturne", "Jupiter", "Mars"],
              correctIndex: 2,
              feedback:
                "Bravo ! Mars doit sa couleur rougeâtre à l'oxyde de fer sur sa surface.",
            },
            {
              question: "Quelle est la plus grande planète du système solaire ?",
              choices: ["Jupiter", "Saturne", "Uranus"],
              correctIndex: 0,
              feedback: "Jupiter est si grande qu'on pourrait y mettre 1 300 Terres !",
            },
          ],
        },
        {
          title: "Phase 2 — Analyse de la trajectoire",
          briefing: "Bonne phase 1 ! Maintenant, analyse les données de trajectoire.",
          questions: [
            {
              question: "La Terre met combien de temps à faire le tour du Soleil ?",
              choices: ["24 heures", "365 jours", "28 jours"],
              correctIndex: 1,
              feedback: "Parfait ! C'est ce qu'on appelle une révolution ou une 'année'.",
            },
            {
              question: "Quelle planète possède les anneaux les plus visibles ?",
              choices: ["Jupiter", "Uranus", "Saturne"],
              correctIndex: 2,
              feedback: "Les anneaux de Saturne sont composés de glace et de roches !",
            },
          ],
        },
      ],
      bossChallenge: {
        question:
          "La sonde a été localisée ! Combien de planètes compte officiellement notre système solaire depuis 2006 ?",
        choices: ["8", "9", "10"],
        correctIndex: 0,
        rewardText:
          "Mission accomplie ! Pluton a été reclassée en 'planète naine' en 2006. Tu es un vrai expert de l'espace !",
      },
    },
  },
  {
    type: "defi",
    label: "Défi chronométré",
    icon: "⚡",
    description: "Course contre la montre — réponds vite !",
    color: "#F97316",
    json: {
      title: "Tables de Multiplication Express",
      emoji: "⚡",
      narrative:
        "Le chronomètre tourne ! Réponds le plus vite possible aux calculs. Chaque bonne réponse rapide rapporte des points bonus !",
      totalTimeSeconds: 120,
      challenges: [
        {
          question: "Combien font 6 × 7 ?",
          choices: ["36", "42", "48", "54"],
          correctIndex: 1,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 8 × 9 ?",
          choices: ["63", "64", "72", "81"],
          correctIndex: 2,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 7 × 7 ?",
          choices: ["42", "48", "49", "56"],
          correctIndex: 2,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 9 × 6 ?",
          choices: ["48", "54", "56", "63"],
          correctIndex: 1,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 8 × 6 ?",
          choices: ["42", "46", "48", "52"],
          correctIndex: 2,
          points: 10,
          timeBonusSeconds: 5,
        },
        {
          question: "Combien font 9 × 8 ?",
          choices: ["64", "72", "76", "81"],
          correctIndex: 1,
          points: 15,
          timeBonusSeconds: 8,
        },
        {
          question: "Combien font 7 × 9 ?",
          choices: ["56", "61", "63", "72"],
          correctIndex: 2,
          points: 15,
          timeBonusSeconds: 8,
        },
        {
          question: "Combien font 9 × 9 ?",
          choices: ["72", "81", "84", "90"],
          correctIndex: 1,
          points: 20,
          timeBonusSeconds: 10,
        },
      ],
    },
  },
  {
    type: "plateau",
    label: "Jeu de plateau",
    icon: "🎲",
    description: "Avance sur le plateau en répondant correctement",
    color: "#059669",
    json: {
      title: "Tour de France",
      theme: "france",
      narrative:
        "Bienvenue dans le Tour de France géographique ! Parcours l'Hexagone en répondant aux questions sur les villes, fleuves et régions de France.",
      characterEmoji: "🚴",
      spaces: [
        {
          position: 1,
          type: "question",
          question: "Quelle est la capitale de la France ?",
          choices: ["Lyon", "Paris", "Marseille"],
          correctIndex: 1,
          correctFeedback: "Bravo ! Paris est la capitale et la plus grande ville de France.",
          wrongFeedback: "C'est Paris ! Ne confonds pas avec les autres grandes villes.",
        },
        {
          position: 2,
          type: "bonus",
          bonusSpaces: 2,
          narrative: "Coup de vent favorable ! Tu avances de 2 cases supplémentaires !",
        },
        {
          position: 3,
          type: "question",
          question: "Quel est le plus long fleuve de France ?",
          choices: ["La Seine", "Le Rhône", "La Loire"],
          correctIndex: 2,
          correctFeedback:
            "La Loire fait 1 006 km ! C'est le dernier grand fleuve sauvage d'Europe.",
          wrongFeedback:
            "C'est la Loire, pas la Seine ! La Loire traverse notamment Nantes et Tours.",
        },
        {
          position: 4,
          type: "repos",
          narrative:
            "Pause pique-nique dans un champ de lavande en Provence. Tu reprends des forces !",
        },
        {
          position: 5,
          type: "question",
          question: "Quelle montagne est la plus haute de France ?",
          choices: ["Le Mont Blanc", "Le Puy de Dôme", "Le Mont Ventoux"],
          correctIndex: 0,
          correctFeedback:
            "Le Mont Blanc culmine à 4 808 m ! C'est aussi le toit de l'Europe occidentale.",
          wrongFeedback: "C'est le Mont Blanc, dans les Alpes, avec 4 808 m d'altitude !",
        },
        {
          position: 6,
          type: "bonus",
          bonusSpaces: 3,
          narrative: "Descente à toute vitesse dans les Pyrénées ! Tu gagnes 3 cases !",
        },
        {
          position: 7,
          type: "question",
          question: "Quelle mer borde la côte sud-est de la France ?",
          choices: ["L'Atlantique", "La Méditerranée", "La Manche"],
          correctIndex: 1,
          correctFeedback: "La Méditerranée borde la Côte d'Azur, de Marseille à Nice !",
          wrongFeedback:
            "C'est la mer Méditerranée ! L'Atlantique est à l'ouest et la Manche au nord.",
        },
      ],
      endNarrative:
        "Félicitations ! Tu as traversé toute la France. Champion du Tour de France géographique !",
    },
  },
  {
    type: "cartes",
    label: "Jeu de cartes",
    icon: "🃏",
    description: "Duel RPG — active tes cartes en répondant",
    color: "#2563EB",
    json: {
      title: "Duel des Fractions",
      narrative:
        "Le sorcier Calculix a jeté un sort sur la bibliothèque ! Pour le vaincre, utilise tes cartes de mathématiques.",
      setting: "bibliotheque",
      playerName: "Élève Courageux",
      playerEmoji: "🧙",
      enemyName: "Calculix",
      enemyEmoji: "👹",
      playerMaxHP: 100,
      enemyMaxHP: 100,
      cards: [
        {
          id: "c1",
          name: "Flèche de la moitié",
          emoji: "🏹",
          type: "attack",
          question: "Quelle est la moitié de 48 ?",
          choices: ["22", "24", "26"],
          correctIndex: 1,
          power: 20,
          description: "Une flèche précise qui inflige 20 points de dégâts.",
          wrongPenalty: 10,
        },
        {
          id: "c2",
          name: "Bouclier du quart",
          emoji: "🛡️",
          type: "defense",
          question: "1/4 de 100, c'est combien ?",
          choices: ["20", "25", "40"],
          correctIndex: 1,
          power: 25,
          description: "Un bouclier solide qui absorbe 25 points de dégâts.",
          wrongPenalty: 0,
        },
        {
          id: "c3",
          name: "Boule de feu des tiers",
          emoji: "🔥",
          type: "attack",
          question: "Quel est le tiers (1/3) de 60 ?",
          choices: ["15", "20", "30"],
          correctIndex: 1,
          power: 30,
          description: "Une boule de feu puissante qui inflige 30 dégâts !",
          wrongPenalty: 15,
        },
        {
          id: "c4",
          name: "Potion de guérison",
          emoji: "🧪",
          type: "heal",
          question: "3/4 de 80, c'est combien ?",
          choices: ["40", "60", "64"],
          correctIndex: 1,
          power: 25,
          description: "Récupère 25 points de vie si tu réponds correctement.",
          wrongPenalty: 5,
        },
        {
          id: "c5",
          name: "Éclair du double",
          emoji: "⚡",
          type: "attack",
          question: "1/2 de 36, plus 1/3 de 12, ça fait combien ?",
          choices: ["18", "22", "24"],
          correctIndex: 1,
          power: 40,
          description: "L'attaque ultime ! 40 dégâts si tu maîtrises les fractions.",
          wrongPenalty: 20,
        },
      ],
    },
  },
  {
    type: "construction",
    label: "Construction",
    icon: "🔧",
    description: "Débloque des pièces pour construire quelque chose",
    color: "#0891B2",
    json: {
      title: "Construis le Système Solaire",
      narrative:
        "La salle des sciences a besoin de toi ! Réponds aux questions pour débloquer chaque pièce de notre maquette du système solaire.",
      buildTarget: "Maquette du Système Solaire",
      buildEmoji: "🌌",
      pieces: [
        {
          id: "p1",
          name: "Le Soleil",
          emoji: "☀️",
          question: "Le Soleil est une étoile. De quoi est-il principalement composé ?",
          choices: ["Fer fondu", "Hydrogène et hélium", "Lave volcanique"],
          correctIndex: 1,
          hint: "C'est le même gaz que dans les ballons de fête, en beaucoup plus lourd !",
          unlockText:
            "Le Soleil est placé au centre ! Il représente 99,8 % de la masse du système solaire.",
        },
        {
          id: "p2",
          name: "Mercure",
          emoji: "⚫",
          question:
            "Mercure est la planète la plus proche du Soleil. Quel est son temps de révolution ?",
          choices: ["24 heures", "88 jours", "365 jours"],
          correctIndex: 1,
          hint: "Elle tourne beaucoup plus vite que la Terre autour du Soleil.",
          unlockText:
            "Mercure est ajoutée ! C'est aussi la plus petite planète du système solaire.",
        },
        {
          id: "p3",
          name: "La Terre",
          emoji: "🌍",
          question: "Quelle est la seule planète connue à abriter de la vie ?",
          choices: ["Mars", "La Terre", "Vénus"],
          correctIndex: 1,
          hint: "C'est notre planète ! Elle possède de l'eau liquide et une atmosphère idéale.",
          unlockText:
            "La Terre est installée à la 3e position ! Elle est à 150 millions de km du Soleil.",
        },
        {
          id: "p4",
          name: "Jupiter",
          emoji: "🟠",
          question:
            "Jupiter possède une célèbre tempête géante. Comment s'appelle-t-elle ?",
          choices: ["La Tache Noire", "La Grande Tache Rouge", "L'Ouragan Solaire"],
          correctIndex: 1,
          hint: "C'est une tempête qui dure depuis plus de 400 ans !",
          unlockText:
            "Jupiter rejoint la maquette ! Cette planète géante aurait pu devenir une étoile.",
        },
        {
          id: "p5",
          name: "Saturne",
          emoji: "🪐",
          question: "Saturne est célèbre pour ses anneaux. De quoi sont-ils composés ?",
          choices: ["Or et argent", "Glace et roches", "Gaz chauds"],
          correctIndex: 1,
          hint: "Ils brillent parce qu'ils reflètent la lumière du Soleil.",
          unlockText:
            "Saturne et ses magnifiques anneaux sont ajoutés ! Ils s'étendent sur 282 000 km.",
        },
        {
          id: "p6",
          name: "Neptune",
          emoji: "💙",
          question:
            "Neptune est la planète la plus éloignée du Soleil. Combien de temps lui faut-il pour en faire le tour ?",
          choices: ["12 ans", "84 ans", "165 ans"],
          correctIndex: 2,
          hint: "Depuis sa découverte en 1846, elle n'a fait qu'une seule révolution complète !",
          unlockText:
            "Neptune complète la maquette ! Le système solaire est terminé. Félicitations !",
        },
      ],
      completionText:
        "Extraordinaire ! Tu as construit tout le système solaire. La maquette est prête pour la salle des sciences !",
    },
  },
];

export default function ExemplesPage() {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (type: string, json: object) => {
    await navigator.clipboard.writeText(JSON.stringify(json, null, 2));
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Exemples de jeux</h1>
      <p className="text-[#475569] text-sm mb-8">
        Copie un exemple, puis colle-le dans{" "}
        <Link href="/games/new" className="text-[#2563EB] font-medium hover:underline">
          Créer un jeu
        </Link>{" "}
        après avoir sélectionné le bon type. Tu peux le modifier à ta guise !
      </p>

      <div className="flex flex-col gap-6">
        {EXAMPLES.map((ex) => {
          const isCopied = copied === ex.type;
          return (
            <div
              key={ex.type}
              className="bg-white rounded-[20px] overflow-hidden"
              style={{
                boxShadow: "0 8px 24px rgba(0,0,0,0.05)",
                border: "1px solid rgba(0,0,0,0.05)",
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-4 flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, ${ex.color}15 0%, ${ex.color}08 100%)`,
                  borderBottom: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{ex.icon}</span>
                  <div>
                    <p className="font-bold text-[#0F172A] text-[15px]">{ex.label}</p>
                    <p className="text-xs text-[#64748B]">{ex.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/games/new"
                    className="text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                    style={{ color: ex.color, background: `${ex.color}15` }}
                  >
                    Créer ce jeu →
                  </Link>
                  <button
                    onClick={() => handleCopy(ex.type, ex.json)}
                    className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl text-white transition-all"
                    style={{ background: isCopied ? "#10B981" : ex.color }}
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        Copié !
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copier le JSON
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* JSON preview */}
              <pre
                className="text-[11px] text-[#475569] px-6 py-4 overflow-x-auto leading-relaxed max-h-64"
                style={{ fontFamily: "monospace" }}
              >
                {JSON.stringify(ex.json, null, 2)}
              </pre>
            </div>
          );
        })}
      </div>
    </div>
  );
}
