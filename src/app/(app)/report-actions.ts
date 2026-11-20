"use server";

import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { isReportReason } from "@/lib/moderation";
import { removeBlobs } from "@/lib/uploads.server";
import { deleteUserCompletely } from "@/lib/account";

const refresh = () => revalidatePath("/", "layout");

type Target = { postId: string } | { commentId: string } | { messageId: string };
export type ReportResult = { ok: true } | { ok: false; error: string };

const clean = (v: FormDataEntryValue | null | undefined) => (typeof v === "string" ? v.trim().slice(0, 500) : "");

/** Saves a report. A student can report the same item only once, and never their own. */
async function createReport(userId: string, target: Target, reason: unknown, details: string): Promise<ReportResult> {
  if (!isReportReason(reason)) return { ok: false, error: "Choose a reason." };

  const recent = await prisma.report.count({ where: { reporterId: userId, createdAt: { gt: new Date(Date.now() - 3_600_000) } } });
  if (recent >= 20) return { ok: false, error: "You have sent many reports in the last hour. Try again later." };

  let ownerId: string | undefined;
  if ("postId" in target) ownerId = (await prisma.post.findUnique({ where: { id: target.postId }, select: { authorId: true } }))?.authorId;
  else if ("commentId" in target) ownerId = (await prisma.comment.findUnique({ where: { id: target.commentId }, select: { authorId: true } }))?.authorId;
  else {
    // Messages are private: only people in that chat can see them, so only they can report them.
    const m = await prisma.message.findFirst({
      where: { id: target.messageId, conversation: { members: { some: { userId } } } },
      select: { senderId: true },
    });
    ownerId = m?.senderId;
  }
  if (!ownerId) return { ok: false, error: "That item no longer exists." };
  if (ownerId === userId) return { ok: false, error: "You cannot report your own content." };

  try {
    await prisma.report.create({ data: { reporterId: userId, reason, details: details || null, ...target } });
  } catch {
    // The unique rule means this student already reported it. That is fine.
  }
  return { ok: true };
}

/** Form actions used by the Report panels on posts and comments. */
export async function reportPost(postId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  await createReport(user.id, { postId }, formData.get("reason"), clean(formData.get("details")));
  refresh();
}

export async function reportComment(commentId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  await createReport(user.id, { commentId }, formData.get("reason"), clean(formData.get("details")));
  refresh();
}

/** Called from the chat window, which shows its own thank-you message. */
export async function reportMessage(messageId: string, reason: string): Promise<ReportResult> {
  const user = await requireUser();
  return createReport(user.id, { messageId }, reason, "");
}

/* ---------- admin ---------- */

async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) notFound();
  return user;
}

/** The reports about the same item as this one, so one decision closes them all. */
async function sameTarget(reportId: string) {
  const r = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      postId: true,
      commentId: true,
      messageId: true,
      post: { select: { authorId: true, attachments: { select: { url: true } } } },
      comment: { select: { authorId: true } },
      message: { select: { senderId: true, attachments: { select: { url: true } } } },
    },
  });
  if (!r) return null;
  const where = r.postId ? { postId: r.postId } : r.commentId ? { commentId: r.commentId } : { messageId: r.messageId };
  return {
    where,
    authorId: r.post?.authorId ?? r.comment?.authorId ?? r.message?.senderId ?? null,
    files: [...(r.post?.attachments ?? []), ...(r.message?.attachments ?? [])].map((a) => a.url),
    r,
  };
}

/** The report was a mistake or breaks no rule. */
export async function dismissReports(reportId: string): Promise<void> {
  await requireAdmin();
  const t = await sameTarget(reportId);
  if (!t) return;
  await prisma.report.updateMany({ where: { ...t.where, status: "OPEN" }, data: { status: "DISMISSED" } });
  refresh();
}

/** Deletes the reported post, comment or message, with its uploaded files. Its reports go with it. */
export async function removeReported(reportId: string): Promise<void> {
  await requireAdmin();
  const t = await sameTarget(reportId);
  if (!t) return;
  if (t.r.postId) await prisma.post.deleteMany({ where: { id: t.r.postId } });
  else if (t.r.commentId) await prisma.comment.deleteMany({ where: { id: t.r.commentId } });
  else if (t.r.messageId) await prisma.message.deleteMany({ where: { id: t.r.messageId } });
  await removeBlobs(t.files);
  refresh();
}

/** Locks the author out of the app. Their content stays until it is removed. Admins cannot be suspended. */
export async function suspendAuthor(reportId: string): Promise<void> {
  const admin = await requireAdmin();
  const t = await sameTarget(reportId);
  if (!t?.authorId || t.authorId === admin.id) return;
  await prisma.user.updateMany({ where: { id: t.authorId, isAdmin: false, suspendedAt: null }, data: { suspendedAt: new Date() } });
  await prisma.report.updateMany({ where: { ...t.where, status: "OPEN" }, data: { status: "DISMISSED" } });
  refresh();
}

export async function restoreUser(userId: string): Promise<void> {
  await requireAdmin();
  await prisma.user.updateMany({ where: { id: userId }, data: { suspendedAt: null } });
  refresh();
}

/* ---------- guest (test) accounts ---------- */

/** Removes one guest account completely. Only admins can do this, and only to guests. */
export async function removeGuest(userId: string): Promise<void> {
  const admin = await requireUser();
  if (!admin.isAdmin) return;
  const target = await prisma.user.findUnique({ where: { id: userId }, select: { isGuest: true, isAdmin: true } });
  if (!target || !target.isGuest || target.isAdmin) return;
  await deleteUserCompletely(userId);
  refresh();
}

/** Removes every guest account at once, for the end of a test. */
export async function removeAllGuests(): Promise<void> {
  const admin = await requireUser();
  if (!admin.isAdmin) return;
  const guests = await prisma.user.findMany({ where: { isGuest: true, isAdmin: false }, select: { id: true } });
  for (const g of guests) await deleteUserCompletely(g.id);
  refresh();
}
