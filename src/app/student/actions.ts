"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function studentLogin(formData: FormData) {
  const classCode = (formData.get("classCode") as string)?.trim().toLowerCase();
  const studentCode = (formData.get("studentCode") as string)?.trim().toLowerCase();

  if (!classCode || !studentCode) {
    redirect("/student?error=Codes+manquants");
  }

  const supabase = await createClient();

  const { data: cls } = await supabase
    .from("classes")
    .select("id")
    .eq("code", classCode)
    .single();

  if (!cls) {
    redirect("/student?error=Code+de+classe+invalide");
  }

  const { data: student } = await supabase
    .from("students")
    .select("id, first_name")
    .eq("class_id", cls.id)
    .eq("code", studentCode)
    .single();

  if (!student) {
    redirect("/student?error=Code+personnel+invalide");
  }

  const cookieStore = await cookies();
  cookieStore.set("student_id", student.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  redirect("/student/home");
}

export async function studentLogout() {
  const cookieStore = await cookies();
  cookieStore.delete("student_id");
  redirect("/student");
}
