export default function Loading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-live="polite">
      <div className="h-9 w-56 animate-pulse rounded-xl bg-surface2" />
      <div className="h-24 animate-pulse rounded-2xl bg-surface2" />
      <div className="h-24 animate-pulse rounded-2xl bg-surface2" />
      <span className="sr-only">Loading</span>
    </div>
  );
}
