import { v4 as uuidv4 } from 'uuid'
import type { Worksheet } from '../types/worksheet'

export const TEMPLATES: Omit<Worksheet, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    meta: {
      title: 'Fiche d\'exercices — Fractions',
      subject: 'Mathématiques',
      level: '5ème',
      date: new Date().toLocaleDateString('fr-FR'),
      duration: '1h',
      showScore: true,
      showName: true,
      showDate: true,
    },
    blocks: [
      {
        id: uuidv4(),
        type: 'exercise-header',
        number: 1,
        title: 'Calculer les fractions suivantes',
        points: 4,
        difficulty: 1,
      },
      {
        id: uuidv4(),
        type: 'math',
        latex: '\\frac{3}{4} + \\frac{1}{2} = ',
        display: 'block',
        label: 'a)',
      },
      {
        id: uuidv4(),
        type: 'math',
        latex: '\\frac{5}{6} - \\frac{1}{3} = ',
        display: 'block',
        label: 'b)',
      },
      {
        id: uuidv4(),
        type: 'blank-lines',
        count: 3,
        lined: true,
      },
      {
        id: uuidv4(),
        type: 'exercise-header',
        number: 2,
        title: 'Problème',
        points: 6,
        difficulty: 2,
      },
      {
        id: uuidv4(),
        type: 'text',
        content: 'Marie a une pizza. Elle en mange les 3/4. Quelle fraction reste-t-il ?',
      },
      {
        id: uuidv4(),
        type: 'blank-lines',
        count: 5,
        lined: true,
      },
    ],
  },
  {
    meta: {
      title: 'Fiche de synthèse — La Révolution Française',
      subject: 'Histoire-Géographie',
      level: '4ème',
      date: new Date().toLocaleDateString('fr-FR'),
      showScore: false,
      showName: true,
      showDate: true,
    },
    blocks: [
      {
        id: uuidv4(),
        type: 'heading',
        content: 'La Révolution Française (1789-1799)',
        level: 1,
        align: 'center',
      },
      {
        id: uuidv4(),
        type: 'heading',
        content: 'I. Les causes de la Révolution',
        level: 2,
      },
      {
        id: uuidv4(),
        type: 'bullet-list',
        items: [
          'Crise économique et financière de la monarchie',
          'Inégalités sociales entre les trois ordres',
          'Influence des idées des Lumières',
          'Mauvaises récoltes et famine',
        ],
      },
      {
        id: uuidv4(),
        type: 'heading',
        content: 'II. Les grandes dates',
        level: 2,
      },
      {
        id: uuidv4(),
        type: 'table',
        hasHeader: true,
        rows: [
          [
            { content: 'Date', bold: true, bg: '#e0e7ff' },
            { content: 'Événement', bold: true, bg: '#e0e7ff' },
            { content: 'Importance', bold: true, bg: '#e0e7ff' },
          ],
          [
            { content: '14 juillet 1789', bold: true },
            { content: 'Prise de la Bastille' },
            { content: 'Symbole de la Révolution' },
          ],
          [
            { content: '26 août 1789', bold: true },
            { content: 'Déclaration des Droits de l\'Homme' },
            { content: 'Liberté, égalité, fraternité' },
          ],
          [
            { content: '21 janvier 1793', bold: true },
            { content: 'Exécution de Louis XVI' },
            { content: 'Fin de la monarchie' },
          ],
        ],
      },
    ],
  },
  {
    meta: {
      title: 'Évaluation — Grammaire',
      subject: 'Français',
      level: 'CM2',
      date: new Date().toLocaleDateString('fr-FR'),
      duration: '45min',
      showScore: true,
      showName: true,
      showDate: true,
    },
    blocks: [
      {
        id: uuidv4(),
        type: 'exercise-header',
        number: 1,
        title: 'Nature des mots',
        points: 5,
        competency: 'Identifier la nature des mots',
      },
      {
        id: uuidv4(),
        type: 'text',
        content: 'Souligne les verbes et encadre les noms dans les phrases suivantes :',
      },
      {
        id: uuidv4(),
        type: 'numbered-list',
        items: [
          'Le chat dort sur le canapé.',
          'Les enfants jouent dans le jardin.',
          'Marie mange une pomme rouge.',
        ],
      },
      {
        id: uuidv4(),
        type: 'divider',
        style: 'dashed',
      },
      {
        id: uuidv4(),
        type: 'exercise-header',
        number: 2,
        title: 'Conjugaison',
        points: 5,
        competency: 'Conjuguer au présent de l\'indicatif',
      },
      {
        id: uuidv4(),
        type: 'text',
        content: 'Conjugue les verbes entre parenthèses au présent :',
      },
      {
        id: uuidv4(),
        type: 'table',
        hasHeader: false,
        rows: [
          [{ content: 'Nous (aller) .......... au marché.' }, { content: 'Elle (finir) .......... ses devoirs.' }],
          [{ content: 'Ils (prendre) .......... le bus.' }, { content: 'Tu (être) .......... gentil.' }],
        ],
      },
    ],
  },
  {
    meta: {
      title: 'Fiche vierge',
      subject: 'Autre',
      level: 'Autre',
      date: new Date().toLocaleDateString('fr-FR'),
      showScore: false,
      showName: true,
      showDate: true,
    },
    blocks: [
      {
        id: uuidv4(),
        type: 'heading',
        content: 'Titre de la fiche',
        level: 1,
        align: 'center',
      },
    ],
  },
]
