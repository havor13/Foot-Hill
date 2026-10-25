import Link from "next/link";
import Logo from "@/components/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold">
        <Logo />
        Foothill Commons
      </Link>
      {children}
      <p className="text-xs text-muted">
        An independent student project. Not affiliated with BYU or The Church of Jesus Christ of Latter-day Saints.
      </p>
    </main>
  );
}
