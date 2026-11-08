"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { attachmentRows, attachmentSelect, parseAttachments } from "@/lib/uploads.server";
import type { AttachmentView } from "@/lib/uploads";
import { notifyNewMessage } from "@/lib/push";
import { isReactionEmoji, summarizeReactions, type ReactionSummary } from "@/lib/reactions";

export type ChatMsg = {
  id: string;
  senderId: string;
  senderName: string;
  body: string;
  createdAt: string; // ISO string, safe to pass to the browser
  attachments: AttachmentView[];
  reactions: ReactionSummary;
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

  // Runs after the reply is sent, so a slow push service never delays the chat.
  after(() =>
    notifyNewMessage({
      conversationId,
      senderId: user.id,
      senderName: user.name,
      body: message.body,
      attachmentKind: message.attachments[0]?.kind,
    }).catch((e) => console.error("Could not send notifications:", e)),
  );

  return {
    ok: true,
    message: {
      id: message.id,
      senderId: user.id,
      senderName: user.name,
      body: message.body,
      createdAt: message.createdAt.toISOString(),
      attachments: message.attachments,
      reactions: [],
    },
  };
}

export type ReactResult = { ok: true; reactions: ReactionSummary } | { ok: false; error: string };

/** Adds or removes the signed-in student's emoji reaction on a message in a chat they belong to. */
export async function toggleMessageReaction(messageId: string, emoji: string): Promise<ReactResult> {
  const user = await requireUser();
  if (!isReactionEmoji(emoji)) return { ok: false, error: "That reaction is not available." };

  const message = await prisma.message.findFirst({
    where: { id: messageId, conversation: { members: { some: { userId: user.id } } } },
    select: { id: true },
  });
  if (!message) return { ok: false, error: "You are not in this chat." };

  const existing = await prisma.reaction.findFirst({ where: { userId: user.id, messageId, emoji }, select: { id: true } });
  if (existing) await prisma.reaction.deleteMany({ where: { id: existing.id } });
  else {
    try {
      await prisma.reaction.create({ data: { userId: user.id, messageId, emoji } });
    } catch {
      // Two quick taps can race. One row survives, which is the intended result.
    }
  }

  const rows = await prisma.reaction.findMany({ where: { messageId }, select: { emoji: true, userId: true } });
  return { ok: true, reactions: summarizeReactions(rows, user.id) };
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
