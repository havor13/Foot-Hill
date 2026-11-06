import { formatBytes, type AttachmentView } from "@/lib/uploads";

/** Shows a post's or message's attachments: photos as thumbnails, documents as download rows. */
export default function AttachmentList({ items, compact = false }: { items: AttachmentView[]; compact?: boolean }) {
  if (!items.length) return null;
  const images = items.filter((i) => i.kind === "IMAGE");
  const files = items.filter((i) => i.kind !== "IMAGE");

  return (
    <div className="grid gap-2">
      {images.length > 0 && (
        <div className={`grid gap-2 ${images.length > 1 ? "grid-cols-2" : ""}`}>
          {images.map((i) => (
            <a key={i.id} href={i.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={i.url}
                alt={i.name}
                loading="lazy"
                className={`w-full rounded-xl border border-line bg-surface2 object-cover ${compact ? "max-h-56" : "max-h-96"}`}
              />
            </a>
          ))}
        </div>
      )}
      {files.map((f) => (
        <a
          key={f.id}
          href={f.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2 text-sm hover:bg-surface2"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 fill-none stroke-current stroke-[1.8] text-accent" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5" />
          </svg>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{f.name}</span>
            <span className="block text-xs text-muted">{formatBytes(f.size)} · opens in a new tab</span>
          </span>
        </a>
      ))}
    </div>
  );
}
