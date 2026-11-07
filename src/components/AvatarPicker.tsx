"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import Avatar from "@/components/Avatar";
import { setAvatar } from "@/app/(app)/actions";
import { AVATAR_TYPES } from "@/lib/uploads";

const SIZE = 384; // saved photos are square and this many pixels wide, which keeps them small and sharp

/** Centre-crops the picture to a square and re-encodes it as a small JPEG. */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.min(SIZE, side);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas");
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", 0.85),
  );
}

export default function AvatarPicker({ userId, name, image }: { userId: string; name: string; image: string | null }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  async function onPick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (!AVATAR_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP picture.");
      return;
    }
    setBusy(true);
    try {
      const small = await shrink(file);
      const blob = await upload(`avatars/${userId}/photo.jpg`, small, {
        access: "public",
        handleUploadUrl: "/api/upload",
        contentType: "image/jpeg",
      });
      const result = await setAvatar(blob.url);
      if (!result.ok) setError(result.error);
      else startTransition(() => router.refresh());
    } catch (e) {
      setError(
        e instanceof Error && /not set up/i.test(e.message)
          ? "Photo uploads are not set up yet."
          : "Could not upload the picture. Try a different one.",
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function onRemove() {
    setError("");
    setBusy(true);
    const result = await setAvatar(null).catch(() => null);
    setBusy(false);
    if (!result || !result.ok) setError(result && !result.ok ? result.error : "Could not remove the photo.");
    else startTransition(() => router.refresh());
  }

  const working = busy || pending;

  return (
    <div className="flex items-center gap-4">
      <Avatar name={name} image={image} size="xl" />
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" disabled={working} onClick={() => input.current?.click()}>
            {working ? "Saving…" : image ? "Change photo" : "Add a photo"}
          </button>
          {image && (
            <button type="button" className="btn" disabled={working} onClick={onRemove}>
              Remove
            </button>
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={AVATAR_TYPES.join(",")}
          className="sr-only"
          aria-label="Profile photo"
          onChange={(e) => void onPick(e.target.files?.[0])}
        />
        <p className="text-xs text-muted">JPG, PNG or WebP. It is cropped to a square. Other students can see it.</p>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
