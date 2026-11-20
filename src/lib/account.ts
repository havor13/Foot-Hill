import { prisma } from "@/lib/db";
import { isOwnAvatarUrl, removeBlobs } from "@/lib/uploads.server";

/**
 * Permanently deletes one account and everything it owns. The database cascades posts, comments,
 * reactions, messages and memberships. One-to-one chats are removed for both people, and the
 * person's uploaded files and photo are deleted from storage.
 */
export async function deleteUserCompletely(userId: string): Promise<void> {
  const row = await prisma.user.findUnique({ where: { id: userId }, select: { image: true } });
  if (!row) return;
  const dms = await prisma.conversation.findMany({
    where: { isGroup: false, groupId: null, members: { some: { userId } } },
    select: { id: true },
  });
  const dmIds = dms.map((d) => d.id);
  const files = await prisma.attachment.findMany({
    where: { OR: [{ uploaderId: userId }, { message: { conversationId: { in: dmIds } } }] },
    select: { url: true },
  });
  const urls = files.map((f) => f.url);
  if (row.image && isOwnAvatarUrl(row.image, userId)) urls.push(row.image);

  await prisma.$transaction([
    prisma.conversation.deleteMany({ where: { id: { in: dmIds } } }),
    prisma.user.delete({ where: { id: userId } }),
  ]);
  await removeBlobs(urls);
}
