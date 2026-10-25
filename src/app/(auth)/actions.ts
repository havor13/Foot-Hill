"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth, signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { sendVerificationCode } from "@/lib/mail";

export type FormState = { error?: string; message?: string };

const BYU_EMAIL = /^[^\s@]+@(student\.)?byu\.edu$/i;

function hashCode(code: string): string {
  return crypto
    .createHash("sha256")
    .update(code + (process.env.AUTH_SECRET ?? ""))
    .digest("hex");
}

async function issueCode(userId: string, email: string): Promise<void> {
  await prisma.verificationCode.deleteMany({ where: { userId } });
  const code = String(crypto.randomInt(100000, 1000000));
  await prisma.verificationCode.create({
    data: { userId, codeHash: hashCode(code), expiresAt: new Date(Date.now() + 15 * 60 * 1000) },
  });
  await sendVerificationCode(email, code);
}

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters.").max(100),
  role: z.enum(["STUDENT", "ALUMNI"]),
  major: z.string().trim().max(80).optional(),
  gradYear: z.coerce.number().int().min(1950).max(2100).optional(),
});

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
    major: formData.get("major") || undefined,
    gradYear: formData.get("gradYear") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const { name, email, password, role, major, gradYear } = parsed.data;

  if (role === "STUDENT" && !BYU_EMAIL.test(email)) {
    return { error: "Students sign up with a BYU email that ends in @byu.edu." };
  }
  if (role === "ALUMNI" && !gradYear) {
    return { error: "Enter the year you graduated." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists. Try signing in." };

  const user = await prisma.user.create({
    data: { name, email, role, major, gradYear, passwordHash: await bcrypt.hash(password, 12) },
  });

  try {
    await issueCode(user.id, email);
  } catch {
    await prisma.user.delete({ where: { id: user.id } });
    return { error: "We could not send the verification email. Please try again in a minute." };
  }

  try {
    await signIn("credentials", { email, password, redirectTo: "/verify" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "Your account was created. Sign in to continue." };
    throw e; // signIn redirects by throwing; let Next.js handle it
  }
  return {};
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };
  try {
    await signIn("credentials", { email, password, redirectTo: "/feed" });
  } catch (e) {
    if (e instanceof AuthError) return { error: "That email and password do not match." };
    throw e;
  }
  return {};
}

export async function verifyCode(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { error: "Enter the 6-digit code from your email." };

  const record = await prisma.verificationCode.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (!record || record.expiresAt < new Date()) {
    return { error: "That code has expired. Ask for a new one below." };
  }
  if (record.attempts >= 5) return { error: "Too many wrong tries. Ask for a new code below." };

  const given = Buffer.from(hashCode(code));
  const real = Buffer.from(record.codeHash);
  const ok = given.length === real.length && crypto.timingSafeEqual(given, real);
  if (!ok) {
    await prisma.verificationCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } });
    return { error: "That code is not right. Check it and try again." };
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { emailVerified: new Date() } }),
    prisma.verificationCode.deleteMany({ where: { userId } }),
  ]);
  redirect("/groups");
}

export async function resendCode(): Promise<FormState> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  const latest = await prisma.verificationCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < 60_000) {
    return { error: "Wait a minute before asking for another code." };
  }
  try {
    await issueCode(user.id, user.email);
  } catch {
    return { error: "We could not send the email. Please try again shortly." };
  }
  return { message: "A new code is on its way." };
}

export async function logout(): Promise<void> {
  await signOut({ redirectTo: "/" });
}
