"use client";

import { useId, useRef } from "react";
import { ACCEPT, formatBytes } from "@/lib/uploads";
import type { Uploader } from "@/components/useAttachmentUploader";

/** Paperclip button with a hidden file picker. */
export function AttachButton({ uploader, label = "Attach a photo or document" }: { uploader: Uploader; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  return (
    <>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input
        id={id}
        ref={input}
        type="file"
        multiple
        accept={ACCEPT}
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          if (e.target.files?.length) uploader.add(e.target.files);
          e.target.value = ""; // lets the same file be chosen again after removing it
        }}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={uploader.full}
        aria-label={label}
        title={label}
        className="btn h-10 w-10 shrink-0 !p-0"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 11.5l-7.8 7.8a4.5 4.5 0 0 1-6.4-6.4l8.1-8.1a3 3 0 0 1 4.2 4.2l-8 8a1.5 1.5 0 0 1-2.1-2.1l7.4-7.4" />
        </svg>
      </button>
    </>
  );
}

/** One row per selected file with progress, errors and a remove button. */
export function AttachChips({ uploader }: { uploader: Uploader }) {
  if (!uploader.items.length) return null;
  return (
    <ul className="grid gap-1.5" aria-label="Attachments">
      {uploader.items.map((i) => (
        <li key={i.key} className="flex items-center gap-2 rounded-xl border border-line bg-bg px-3 py-1.5 text-sm">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{i.name}</span>
            {i.error ? (
              <span role="alert" className="block text-xs text-danger">
                {i.error}
              </span>
            ) : i.done ? (
              <span className="block text-xs text-muted">{formatBytes(i.size)} · ready</span>
            ) : (
              <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface2" role="progressbar" aria-valuenow={i.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Uploading ${i.name}`}>
                <span className="block h-full bg-accent transition-all" style={{ width: `${Math.max(4, i.progress)}%` }} />
              </span>
            )}
          </span>
          <button type="button" onClick={() => uploader.remove(i.key)} className="text-xs font-semibold text-muted underline hover:text-danger" aria-label={`Remove ${i.name}`}>
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
