import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import Logo from "@/components/Logo";

export default async function LandingPage() {
  const session = await auth();
  if (session?.user?.id) redirect("/feed");

  const features = [
    ["Groups", "Hikes, housing, open mics and the clubs that fit you."],
    ["Course circles", "Every class gets a circle for questions and study sessions."],
    ["Alumni", "Graduates who offered to give advice, reviews and introductions."],
    ["Chat", "Direct messages and group chats with read status."],
  ];

  return (
    <main className="mx-auto grid min-h-dvh max-w-5xl content-center gap-10 px-4 py-12">
      <header className="flex items-center justify-between">
        <span className="flex items-center gap-2.5 font-display text-xl font-bold">
          <Logo className="h-8 w-8" />
          Foothill Commons
        </span>
        <nav className="flex gap-2">
          <Link href="/login" className="btn">
            Sign in
          </Link>
          <Link href="/signup" className="btn btn-primary">
            Join
          </Link>
        </nav>
      </header>

      <section className="grid gap-5">
        <h1 className="max-w-3xl font-display text-5xl font-bold sm:text-6xl">
          Find your people at <span className="text-accent">BYU</span>
        </h1>
        <p className="max-w-xl text-lg text-muted">
          One place for study groups, course circles, alumni advice, events and chat. Students join with a BYU email.
        </p>
        <div>
          <Link href="/signup" className="btn btn-primary px-6 py-2.5 text-base">
            Create your account
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(([title, text]) => (
          <div key={title} className="card">
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="mt-1 text-sm text-muted">{text}</p>
          </div>
        ))}
      </section>

      <p className="text-xs text-muted">
        An independent student project. Not affiliated with BYU or The Church of Jesus Christ of Latter-day Saints.
      </p>
    </main>
  );
}
