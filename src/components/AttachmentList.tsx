"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { formatBytes, type AttachmentView } from "@/lib/uploads";

const isPdf = (a: AttachmentView) => a.contentType === "application/pdf";
const canView = (a: AttachmentView) => a.kind === "IMAGE" || isPdf(a);

/** Vercel Blob adds a Content-Disposition: attachment header when asked, which forces a download. */
const forcedDownloadUrl = (url: string) => url + (url.includes("?") ? "&" : "?") + "download=1";

/** Saves the file under its original name. If the browser blocks the fetch, falls back to a forced download link. */
async function saveFile(a: AttachmentView): Promise<void> {
  try {
    const res = await fetch(a.url);
    if (!res.ok) throw new Error("fetch failed");
    const href = URL.createObjectURL(await res.blob());
    const link = document.createElement("a");
    link.href = href;
    link.download = a.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 10_000);
  } catch {
    window.location.assign(forcedDownloadUrl(a.url));
  }
}

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 4v11M7 11l5 5 5-5M5 20h14" />
  </svg>
);

function Viewer({ items, start, onClose }: { items: AttachmentView[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [saving, setSaving] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const many = items.length > 1;
  const current = items[index];

  const go = useCallback((step: number) => setIndex((i) => (i + step + items.length) % items.length), [items.length]);

  // Lock page scroll while open and give focus back to the thumbnail that opened the viewer.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    box.current?.querySelector<HTMLElement>("button")?.focus();
    return () => {
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowLeft" && many) go(-1);
      else if (e.key === "ArrowRight" && many) go(1);
      else if (e.key === "Tab" && box.current) {
        const focusable = Array.from(box.current.querySelectorAll<HTMLElement>("button, a[href]"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, many, onClose]);

  const barButton = "inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm font-semibold text-white hover:bg-white/20";

  return (
    <div
      ref={box}
      role="dialog"
      aria-modal="true"
      aria-label={current.name}
      className="fixed inset-0 z-50 flex flex-col bg-black/90"
    >
      <div className="flex items-center gap-2 px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <b className="block truncate text-sm">{current.name}</b>
          <span className="text-xs text-white/70">
            {formatBytes(current.size)}
            {many ? ` · ${index + 1} of ${items.length}` : ""}
          </span>
        </div>
        <button
          type="button"
          className={barButton}
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await saveFile(current);
            setSaving(false);
          }}
        >
          <DownloadIcon />
          {saving ? "Saving…" : "Download"}
        </button>
        <a href={current.url} target="_blank" rel="noopener noreferrer" className={`${barButton} hidden sm:inline-flex`}>
          Open in new tab
        </a>
        <button type="button" className={barButton} onClick={onClose} aria-label="Close viewer">
          Close
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-14"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {many && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous" className={`${barButton} absolute left-2 top-1/2 z-10 -translate-y-1/2 !px-2.5 text-lg`}>
              ‹
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next" className={`${barButton} absolute right-2 top-1/2 z-10 -translate-y-1/2 !px-2.5 text-lg`}>
              ›
            </button>
          </>
        )}
        {current.kind === "IMAGE" ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={current.name} className="max-h-full max-w-full rounded-lg object-contain" />
        ) : (
          <iframe key={current.id} src={current.url} title={current.name} className="h-full w-full max-w-4xl rounded-lg bg-white" />
        )}
      </div>
    </div>
  );
}

/**
 * Shows a post's or message's attachments. Photos open in a viewer on the same page, PDFs can be previewed
 * there too, and every file has a Download button that saves it instead of opening a new tab.
 */
export default function AttachmentList({ items, compact = false }: { items: AttachmentView[]; compact?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const close = useCallback(() => setOpen(null), []);

  if (!items.length) return null;
  const images = items.filter((i) => i.kind === "IMAGE");
  const files = items.filter((i) => i.kind !== "IMAGE");
  const viewable = items.filter(canView); // the order the viewer steps through

  return (
    <div className="grid gap-2">
      {images.length > 0 && (
        <div className={`grid gap-2 ${images.length > 1 ? "grid-cols-2" : ""}`}>
          {images.map((i) => (
            <button
              key={i.id}
              type="button"
              onClick={() => setOpen(viewable.findIndex((v) => v.id === i.id))}
              aria-label={`View ${i.name}`}
              className="block cursor-zoom-in overflow-hidden rounded-xl text-left"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={i.url}
                alt={i.name}
                loading="lazy"
                className={`w-full rounded-xl border border-line bg-surface2 object-cover ${compact ? "max-h-56" : "max-h-96"}`}
              />
            </button>
          ))}
        </div>
      )}

      {files.map((f) => (
        <div key={f.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-line bg-bg px-3 py-2 text-sm">
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-none stroke-current stroke-[1.8] text-accent" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
          </svg>
          <span className="min-w-0 flex-1 basis-32">
            <span className="block truncate font-semibold">{f.name}</span>
            <span className="block text-xs text-muted">{formatBytes(f.size)}</span>
          </span>
          <span className="flex gap-2">
            {isPdf(f) && (
              <button type="button" className="btn !px-3 !py-1 text-xs" onClick={() => setOpen(viewable.findIndex((v) => v.id === f.id))}>
                Preview
              </button>
            )}
            <button
              type="button"
              className="btn !px-3 !py-1 text-xs"
              disabled={saving === f.id}
              onClick={async () => {
                setSaving(f.id);
                await saveFile(f);
                setSaving(null);
              }}
            >
              {saving === f.id ? "Saving…" : "Download"}
            </button>
          </span>
        </div>
      ))}

      {open !== null && open >= 0 && createPortal(<Viewer items={viewable} start={open} onClose={close} />, document.body)}
    </div>
  );
}
