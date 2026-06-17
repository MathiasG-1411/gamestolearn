"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function generateCode(length = 6): string {
  // Lettres et chiffres sans ambiguïté (pas de 0/O, 1/I/L)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function createClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = (formData.get("name") as string)?.trim();
  if (!name) redirect("/classes?error=Nom+requis");

  // Jusqu'à 5 tentatives pour obtenir un code unique
  for (let i = 0; i < 5; i++) {
    const { error } = await supabase
      .from("classes")
      .insert({ teacher_id: user.id, name, code: generateCode() });

    if (!error) {
      revalidatePath("/classes");
      redirect("/classes");
    }

    if (!error.message.includes("unique")) {
      redirect("/classes?error=Erreur+lors+de+la+création");
    }
  }

  redirect("/classes?error=Réessayez");
}

export async function deleteClass(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const classId = formData.get("classId") as string;
  await supabase
    .from("classes")
    .delete()
    .eq("id", classId)
    .eq("teacher_id", user.id);

  revalidatePath("/classes");
  redirect("/classes");
}
