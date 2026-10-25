import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { eventParts } from "@/lib/format";
import JoinButton from "@/components/JoinButton";

export const metadata = { title: "Course circles" };

export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ q?: string; all?: string }> }) {
  const user = await requireUser();
  const { q = "", all } = await searchParams;
  const query = q.trim();
  const showAll = all === "1" || Boolean(query);

  const courses = await prisma.group.findMany({
    where: {
      kind: "COURSE",
      ...(showAll ? {} : { memberships: { some: { userId: user.id } } }),
      ...(query
        ? {
            OR: [
              { courseCode: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { courseCode: "asc" },
    include: {
      _count: { select: { memberships: true } },
      memberships: { where: { userId: user.id }, select: { userId: true } },
      events: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 1 },
    },
  });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="page-title">Course circles</h1>
        <p className="text-muted">Every class gets its own circle. Ask questions, find study partners and skip the lonely cramming.</p>
      </div>

      <form className="grid gap-3" role="search">
        <label className="sr-only" htmlFor="q">
          Search courses
        </label>
        <input id="q" name="q" defaultValue={query} placeholder="Search by code or title, like CS 142" className="input rounded-full px-4" autoComplete="off" />
        {all === "1" && <input type="hidden" name="all" value="1" />}
      </form>
      <div className="flex gap-2">
        <Link href="/courses" className="chip" aria-current={!showAll}>
          My circles
        </Link>
        <Link href="/courses?all=1" className="chip" aria-current={showAll}>
          All courses
        </Link>
      </div>

      {courses.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((c) => {
            const next = c.events[0];
            const p = next ? eventParts(next.startsAt) : null;
            return (
              <div key={c.id} className="card grid content-start gap-2.5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-lg bg-accent-soft px-2.5 py-0.5 font-display text-sm font-bold text-accent">{c.courseCode}</span>
                  <span className="text-xs text-muted">{c.term}</span>
                </div>
                <h2 className="text-lg font-bold">
                  <Link href={`/groups/${c.id}`} className="hover:underline">
                    {c.name}
                  </Link>
                </h2>
                <p className="text-sm text-muted">
                  Next study session
                  <br />
                  <b className="text-ink">{next && p ? `${p.weekday} ${p.time} · ${next.location}` : "None planned yet"}</b>
                </p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted">{c._count.memberships} students</span>
                  <JoinButton groupId={c.id} joined={c.memberships.length > 0} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-muted">
          {showAll ? "No courses match that search." : "You have not joined a circle yet. Switch to All courses to find yours."}
        </div>
      )}
    </div>
  );
}
