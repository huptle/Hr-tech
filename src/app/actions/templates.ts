"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function createTemplate(formData: FormData) {
  const user = await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "Email").trim() || "Email";
  const category = String(formData.get("category") ?? "Other").trim() || "Other";
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return;

  await prisma.template.create({
    data: { title, type, category, body, authorId: user.id },
  });

  await logActivity({
    tag: "template",
    what: `Created template: ${title}.`,
    actorId: user.id,
  });

  revalidatePath("/templates");
}

export async function updateTemplate(templateId: string, formData: FormData) {
  await requireUser();
  const title = String(formData.get("title") ?? "").trim();
  const type = String(formData.get("type") ?? "Email").trim() || "Email";
  const category = String(formData.get("category") ?? "Other").trim() || "Other";
  const body = String(formData.get("body") ?? "").trim();
  if (!title) return;

  await prisma.template.update({
    where: { id: templateId },
    data: { title, type, category, body },
  });

  revalidatePath("/templates");
}

export async function deleteTemplate(templateId: string) {
  await requireUser();
  await prisma.template.delete({ where: { id: templateId } });
  revalidatePath("/templates");
}
