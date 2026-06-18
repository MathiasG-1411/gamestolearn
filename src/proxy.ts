import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
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
  const hasStudentSession = !!request.cookies.get("student_id");

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
