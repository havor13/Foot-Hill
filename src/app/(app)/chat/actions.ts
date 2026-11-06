"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { attachmentRows, attachmentSelect, parseAttachments } from "@/lib/uploads.server";
import type { AttachmentView } from "@/lib/uploads";

export type ChatMsg = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string; // ISO string, safe to pass to the browser
  attachments: AttachmentView[];
};

export type SendResult = { ok: true; message: ChatMsg } | { ok: false; error: string };

const bodySchema = z.string().trim().max(2000, "Messages can be up to 2,000 characters.");

/** `rawAttachments` are files the browser already uploaded. They are re-checked here. */
export async function sendMessage(
  conversationId: string,
  rawBody: string,
  rawAttachments: unknown[] = [],
): Promise<SendResult> {
  const user = await requireUser();
  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Could not send." };

  const attachments = parseAttachments(rawAttachments, user.id);
  if (!parsed.data && attachments.length === 0) return { ok: false, error: "Write a message first." };

  const member = await prisma.conversationMember.findUnique({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    select: { userId: true },
  });
  if (!member) return { ok: false, error: "You are not in this chat." };

  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId: user.id,
      body: parsed.data,
      attachments: { create: attachmentRows(attachments, user.id) },
    },
    include: { attachments: { select: attachmentSelect, orderBy: { createdAt: "asc" } } },
  });
  // Sending counts as reading everything up to now, so your own message never shows as unread.
  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId, userId: user.id } },
    data: { lastReadAt: message.createdAt },
  });

  return {
    ok: true,
    message: {
      id: message.id,
      senderId: user.id,
      senderName: user.name,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      attachments: message.attachments,
    },
  };
}

export async function createGroupChat(formData: FormData): Promise<void> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const ids = Array.from(new Set(formData.getAll("member").map(String))).filter((id) => id && id !== user.id);
  if (name.length < 2 || name.length > 40 || ids.length < 1 || ids.length > 30) return;

  // Group chats are for students. Alumni join conversations only through introductions.
  if (user.role !== "STUDENT") return;
  const valid = await prisma.user.findMany({
    where: { id: { in: ids }, emailVerified: { not: null }, role: "STUDENT" },
    select: { id: true },
  });
  if (!valid.length) return;

  const convo = await prisma.conversation.create({
    data: {
      isGroup: true,
      name,
      members: { create: [{ userId: user.id }, ...valid.map((v) => ({ userId: v.id }))] },
    },
  });
  revalidatePath("/chat");
  redirect(`/chat/${convo.id}`);
}
