import Link from "next/link";
import Logo from "@/components/Logo";

/** Shared frame for the privacy policy and the terms of use. Readable without signing in. */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto grid max-w-2xl gap-6 px-4 py-10">
      <Link href="/" className="flex items-center gap-2.5 font-display text-xl font-bold">
        <Logo />
        Foothill Commons
      </Link>
      <article className="card grid gap-4 shadow-sm [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">
        <header>
          <h1 className="page-title">{title}</h1>
          <p className="text-sm text-muted">Last updated {updated}</p>
        </header>
        {children}
      </article>
      <nav aria-label="Legal pages" className="flex gap-4 text-sm text-muted">
        <Link href="/privacy" className="underline hover:text-ink">
          Privacy policy
        </Link>
        <Link href="/terms" className="underline hover:text-ink">
          Terms of use
        </Link>
        <Link href="/login" className="underline hover:text-ink">
          Sign in
        </Link>
      </nav>
    </main>
  );
}

/** Where people send questions and deletion requests. Set CONTACT_EMAIL to show a real address. */
export function ContactLine() {
  const email = process.env.CONTACT_EMAIL;
  return email ? (
    <a href={`mailto:${email}`} className="font-semibold text-accent underline">
      {email}
    </a>
  ) : (
    <span>the person who runs this site (ask in the app or through the group that shared the link)</span>
  );
}
