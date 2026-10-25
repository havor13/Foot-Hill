"use client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="card grid gap-3 text-center">
      <h1 className="text-xl font-bold">Something went wrong</h1>
      <p className="text-muted">The page did not load. Check your connection and try again.</p>
      <div>
        <button type="button" onClick={reset} className="btn btn-primary">
          Try again
        </button>
      </div>
    </div>
  );
}
