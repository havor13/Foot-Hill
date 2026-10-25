export default function Logo({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <path className="fill-accent" d="M2 27L12 9l6 10 4-6 8 14z" />
      <circle className="fill-sun" cx="24" cy="8" r="4" />
    </svg>
  );
}
