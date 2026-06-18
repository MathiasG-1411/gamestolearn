"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function generateStudentCode(length = 6): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function addStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classId = formData.get("classId") as string;
  const firstName = (formData.get("firstName") as string)?.trim();
  if (!firstName) redirect(`/classes/${classId}?error=Prénom+requis`);

  // Vérifie que la classe appartient bien à cet enseignant
  const { data: cls } = await supabase
    .from("classes")
    .select("id")
    .eq("id", classId)
    .eq("teacher_id", user.id)
    .single();

  if (!cls) redirect("/classes");

  for (let i = 0; i < 5; i++) {
    const { error } = await supabase
      .from("students")
      .insert({ class_id: classId, first_name: firstName, code: generateStudentCode() });

    if (!error) {
      revalidatePath(`/classes/${classId}`);
      redirect(`/classes/${classId}`);
    }

    if (!error.message.includes("unique")) {
      redirect(`/classes/${classId}?error=Erreur+lors+de+l'ajout`);
    }
  }

  redirect(`/classes/${classId}?error=Réessayez`);
}

export async function removeStudent(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const studentId = formData.get("studentId") as string;
  const classId = formData.get("classId") as string;

  // RLS garantit que seul l'enseignant propriétaire peut supprimer
  await supabase.from("students").delete().eq("id", studentId);

  revalidatePath(`/classes/${classId}`);
  redirect(`/classes/${classId}`);
}
