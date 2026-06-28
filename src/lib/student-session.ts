import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signature HMAC pour la session élève.
 *
 * Le cookie `student_id` ne contient qu'un UUID. Sans signature, n'importe qui
 * pouvant écrire un cookie (devtools, requête forgée, proxy) pourrait se faire
 * passer pour un autre élève et enregistrer des scores en son nom.
 *
 * On signe donc la valeur avec un secret connu du serveur uniquement
 * (`STUDENT_SESSION_SECRET`) et on vérifie cette signature à chaque lecture.
 * Format du cookie : `<student_id>.<signature base64url>`.
 *
 * ⚠️ `STUDENT_SESSION_SECRET` doit rester côté serveur (jamais NEXT_PUBLIC_)
 * et être défini dans `.env.local` (local) et dans les variables Vercel (prod).
 */

const SEP = ".";

function getSecret(): string {
  const secret = process.env.STUDENT_SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "STUDENT_SESSION_SECRET manquant ou trop court (≥ 16 caractères requis). " +
        "Définis-le dans .env.local et dans les variables d'environnement Vercel."
    );
  }
  return secret;
}

function computeSignature(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

/** Renvoie la valeur signée à stocker dans le cookie : `<id>.<signature>`. */
export function signStudentId(studentId: string): string {
  return `${studentId}${SEP}${computeSignature(studentId)}`;
}

/**
 * Vérifie un cookie signé. Renvoie le `student_id` si la signature est valide,
 * sinon `null` (cookie absent, malformé, falsifié, ou secret non configuré).
 */
export function verifyStudentId(raw: string | undefined | null): string | null {
  if (!raw) return null;

  const idx = raw.lastIndexOf(SEP);
  if (idx <= 0 || idx === raw.length - 1) return null;

  const studentId = raw.slice(0, idx);
  const provided = raw.slice(idx + 1);

  let expected: string;
  try {
    expected = computeSignature(studentId);
  } catch {
    // Secret non configuré → on échoue de manière fermée (aucune session valide).
    return null;
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  return studentId;
}
