import { del } from "@vercel/blob";
import { z } from "zod";
import { ALLOWED_TYPES, MAX_ATTACHMENTS, MAX_UPLOAD_BYTES, isImageType, type AttachmentInput } from "@/lib/uploads";

/** Fields to select whenever attachments are loaded for display. */
export const attachmentSelect = {
  id: true,
  url: true,
  name: true,
  contentType: true,
  size: true,
  kind: true,
} as const;

const itemSchema = z.object({
  url: z.string().url().max(600),
  name: z.string().trim().min(1).max(150),
  contentType: z.string().refine((t) => ALLOWED_TYPES.includes(t), "File type not allowed."),
  size: z.number().int().min(1).max(MAX_UPLOAD_BYTES),
});

/**
 * Turns what the browser sent into attachments that are safe to save. The browser uploads straight
 * to Vercel Blob, so the server cannot trust the URL it receives. A file is accepted only if it sits
 * in this user's own upload folder of a Vercel Blob store, which our signed upload route enforces.
 * Anything else is dropped.
 */
export function parseAttachments(raw: unknown[], userId: string): AttachmentInput[] {
  const out: AttachmentInput[] = [];
  const seen = new Set<string>();
  for (const entry of raw.slice(0, MAX_ATTACHMENTS)) {
    let value: unknown = entry;
    if (typeof entry === "string") {
      try {
        value = JSON.parse(entry);
      } catch {
        continue;
      }
    }
    const parsed = itemSchema.safeParse(value);
    if (!parsed.success) continue;

    let url: URL;
    try {
      url = new URL(parsed.data.url);
    } catch {
      continue;
    }
    let path: string;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      continue;
    }
    const ours =
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      path.startsWith(`/uploads/${userId}/`);
    if (!ours || seen.has(parsed.data.url)) continue;
    seen.add(parsed.data.url);
    out.push(parsed.data);
  }
  return out;
}

/** Prisma nested-create data for a list of validated attachments. */
export function attachmentRows(list: AttachmentInput[], userId: string) {
  return list.map((a) => ({
    url: a.url,
    name: a.name,
    contentType: a.contentType,
    size: a.size,
    kind: isImageType(a.contentType) ? ("IMAGE" as const) : ("FILE" as const),
    uploaderId: userId,
  }));
}

/** True only for a profile photo that this user uploaded to our own Vercel Blob store. */
export function isOwnAvatarUrl(value: string, userId: string): boolean {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname.endsWith(".public.blob.vercel-storage.com") &&
      decodeURIComponent(url.pathname).startsWith(`/avatars/${userId}/`)
    );
  } catch {
    return false;
  }
}

/** Best effort: a failure to delete a file must never block deleting the post. */
export async function removeBlobs(urls: string[]): Promise<void> {
  if (!urls.length || !process.env.BLOB_READ_WRITE_TOKEN) return;
  try {
    await del(urls);
  } catch (e) {
    console.error("Could not delete uploaded files:", e);
  }
}
