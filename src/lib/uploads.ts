/** Upload rules shared by the browser and the server. No server-only imports here. */

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB per file
export const MAX_ATTACHMENTS = 4; // per post or message

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const DOC_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "application/zip",
] as const;

export const ALLOWED_TYPES: readonly string[] = [...IMAGE_TYPES, ...DOC_TYPES];

/** Value for the file input's accept attribute. */
export const ACCEPT =
  ALLOWED_TYPES.join(",") + ",.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.jpg,.jpeg,.png,.webp,.gif";

/** What a client sends to the server after a file finished uploading. */
export type AttachmentInput = { url: string; name: string; contentType: string; size: number };

/** What the pages and chat window receive from the database. */
export type AttachmentView = AttachmentInput & { id: string; kind: "IMAGE" | "FILE" };

export const isImageType = (t: string) => (IMAGE_TYPES as readonly string[]).includes(t);

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** Keeps the stored path simple. The original name is saved separately for display. */
export function safeFileName(name: string): string {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return (cleaned || "file").slice(-80);
}

export const UPLOAD_NOTE =
  "Photos and documents up to 10 MB. Anyone with a file's link can open it, so do not share private documents.";
