"use client";

import { useCallback, useState } from "react";
import { upload } from "@vercel/blob/client";
import {
  ALLOWED_TYPES,
  MAX_ATTACHMENTS,
  MAX_UPLOAD_BYTES,
  formatBytes,
  safeFileName,
  type AttachmentInput,
} from "@/lib/uploads";

export type UploadItem = {
  key: string;
  name: string;
  size: number;
  contentType: string;
  progress: number; // 0 to 100
  error?: string;
  done?: AttachmentInput;
};

export type Uploader = ReturnType<typeof useAttachmentUploader>;

/**
 * Uploads files from the browser straight to Vercel Blob, using a signed token from /api/upload.
 * `ready` is the list to send to the server once every file has finished.
 */
export function useAttachmentUploader(userId: string) {
  const [items, setItems] = useState<UploadItem[]>([]);

  const patch = useCallback((key: string, change: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, ...change } : i)));
  }, []);

  const add = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      const room = MAX_ATTACHMENTS - items.length;
      const accepted = list.slice(0, Math.max(0, room));
      const tooMany = list.length > accepted.length;

      const created: { item: UploadItem; file: File }[] = accepted.map((file) => {
        let error: string | undefined;
        if (!ALLOWED_TYPES.includes(file.type)) error = "This file type is not allowed.";
        else if (file.size > MAX_UPLOAD_BYTES) error = `Too large (${formatBytes(file.size)}). The limit is 10 MB.`;
        else if (file.size === 0) error = "This file is empty.";
        const item: UploadItem = {
          key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          size: file.size,
          contentType: file.type,
          progress: 0,
          error,
        };
        return { item, file };
      });

      if (tooMany) {
        created.push({
          item: {
            key: `limit-${Date.now()}`,
            name: "Attachment limit",
            size: 0,
            contentType: "",
            progress: 0,
            error: `You can attach up to ${MAX_ATTACHMENTS} files at a time.`,
          },
          file: new File([], "limit"),
        });
      }

      setItems((prev) => [...prev, ...created.map((c) => c.item)]);

      for (const { item, file } of created) {
        if (item.error) continue;
        upload(`uploads/${userId}/${safeFileName(file.name)}`, file, {
          access: "public",
          handleUploadUrl: "/api/upload",
          contentType: file.type,
          onUploadProgress: ({ percentage }) => patch(item.key, { progress: Math.round(percentage) }),
        })
          .then((blob) =>
            patch(item.key, {
              progress: 100,
              done: { url: blob.url, name: file.name, contentType: file.type, size: file.size },
            }),
          )
          .catch((e: unknown) =>
            patch(item.key, {
              error:
                e instanceof Error && /not set up/i.test(e.message)
                  ? "File uploads are not set up yet."
                  : "Upload failed. Check your connection and try again.",
            }),
          );
      }
    },
    [items.length, patch, userId],
  );

  const remove = useCallback((key: string) => setItems((prev) => prev.filter((i) => i.key !== key)), []);
  const clear = useCallback(() => setItems([]), []);

  return {
    items,
    add,
    remove,
    clear,
    uploading: items.some((i) => !i.done && !i.error),
    ready: items.flatMap((i) => (i.done ? [i.done] : [])),
    full: items.length >= MAX_ATTACHMENTS,
  };
}
