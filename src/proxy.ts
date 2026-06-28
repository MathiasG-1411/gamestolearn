import { NextResponse, type NextRequest } from "next/server";

// Vérification HMAC compatible Edge Runtime (Web Crypto) du cookie élève signé.
// Doit produire le même résultat que src/lib/student-session.ts (HMAC-SHA256,
// base64url non paddé). On vérifie ici pour éviter une boucle de redirection
// avec un cookie présent mais invalide, et pour bloquer en amont.
function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hasValidStudentSession(raw: string | undefined): Promise<boolean> {
  if (!raw) return false;
  const idx = raw.lastIndexOf(".");
  if (idx <= 0 || idx === raw.length - 1) return false;
  const studentId = raw.slice(0, idx);
  const provided = raw.slice(idx + 1);
  const secret = process.env.STUDENT_SESSION_SECRET;
  if (!secret || secret.length < 16) return false;
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(studentId));
    return base64url(mac) === provided;
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isTeacherProtected =
    path.startsWith("/dashboard") ||
    path.startsWith("/classes") ||
    path.startsWith("/games");
  const isTeacherAuthPage = path.startsWith("/login");
  const isStudentProtected = path.startsWith("/student/home");
  const isStudentAuthPage = path === "/student";

  const hasTeacherSession = request.cookies
    .getAll()
    .some((c) => c.name.startsWith("sb-") && c.name.includes("-auth-token"));
  const hasStudentSession = await hasValidStudentSession(
    request.cookies.get("student_id")?.value
  );

  if (!hasTeacherSession && isTeacherProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (hasTeacherSession && isTeacherAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  if (!hasStudentSession && isStudentProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/student";
    return NextResponse.redirect(url);
  }

  if (hasStudentSession && isStudentAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/student/home";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
