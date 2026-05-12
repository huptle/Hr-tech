"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  clearSessionCookie,
  createSessionToken,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export type AuthFormState = {
  error?: string;
};

export async function signUp(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const designation = String(formData.get("designation") ?? "HR Manager").trim() || "HR Manager";
  const company = String(formData.get("company") ?? "").trim();

  if (!name || name.length < 2) return { error: "Please enter your name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const existing = await prisma.hrUser.findUnique({ where: { email } });
  if (existing) return { error: "An account with this email already exists." };

  const passwordHash = await hashPassword(password);
  const totalUsers = await prisma.hrUser.count();

  const user = await prisma.hrUser.create({
    data: {
      name,
      email,
      passwordHash,
      role: designation,
      designation,
      company,
      isAdmin: totalUsers === 0,
    },
  });

  const token = await createSessionToken({ uid: user.id, email: user.email });
  await setSessionCookie(token);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return { error: "Email and password are required." };

  const user = await prisma.hrUser.findUnique({ where: { email } });
  if (!user) return { error: "Invalid email or password." };

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return { error: "Invalid email or password." };

  const token = await createSessionToken({ uid: user.id, email: user.email });
  await setSessionCookie(token);
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  await clearSessionCookie();
  revalidatePath("/", "layout");
  redirect("/signin");
}

export async function updateProfile(formData: FormData): Promise<void> {
  const { requireUser } = await import("@/lib/auth");
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const designation = String(formData.get("designation") ?? "").trim();
  const company = String(formData.get("company") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  if (!name) return;

  await prisma.hrUser.update({
    where: { id: user.id },
    data: {
      name,
      designation: designation || user.designation,
      role: designation || user.role,
      company,
      phone,
    },
  });

  revalidatePath("/profile");
  revalidatePath("/", "layout");
}
