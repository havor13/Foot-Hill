"use client";

import { useEffect, useRef } from "react";
import { UPLOAD_NOTE } from "@/lib/uploads";
import { useAttachmentUploader } from "@/components/useAttachmentUploader";
import { AttachButton, AttachChips } from "@/components/AttachControls";

/**
 * Lives inside the post form. Finished uploads travel with the form as hidden `attachment` fields.
 * The form blocks submitting while a file is still uploading and clears itself after a post.
 */
export default function PostAttachments({ userId }: { userId: string }) {
  const uploader = useAttachmentUploader(userId);
  const root = useRef<HTMLDivElement>(null);
  const { uploading, clear } = uploader;

  useEffect(() => {
    const form = root.current?.closest("form");
    if (!form) return;
    const onSubmit = (e: Event) => {
      if (uploading) e.preventDefault();
    };
    const onReset = () => clear(); // React resets the form after a successful post
    form.addEventListener("submit", onSubmit);
    form.addEventListener("reset", onReset);
    return () => {
      form.removeEventListener("submit", onSubmit);
      form.removeEventListener("reset", onReset);
    };
  }, [uploading, clear]);

  return (
    <div ref={root} className="grid gap-2">
      <AttachChips uploader={uploader} />
      {uploader.ready.map((a) => (
        <input key={a.url} type="hidden" name="attachment" value={JSON.stringify(a)} />
      ))}
      <div className="flex items-center gap-3">
        <AttachButton uploader={uploader} />
        <p className="text-xs text-muted">{uploading ? "Uploading. Wait for it to finish before posting." : UPLOAD_NOTE}</p>
      </div>
    </div>
  );
}
