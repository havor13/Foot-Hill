import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { INDUSTRIES } from "@/lib/constants";
import { timeAgo } from "@/lib/format";
import { requestIntro, respondIntro, startDm } from "../actions";

export const metadata = { title: "Alumni" };

export default async function AlumniPage({ searchParams }: { searchParams: Promise<{ q?: string; ind?: string }> }) {
  const user = await requireUser();
  const { q = "", ind = "" } = await searchParams;
  const query = q.trim();
  const industry = (INDUSTRIES as readonly string[]).includes(ind) ? ind : undefined;
  const isAlumnus = user.role === "ALUMNI";

  const contains = { contains: query, mode: "insensitive" as const };
  const profiles = await prisma.alumniProfile.findMany({
    where: {
      approved: true,
      user: { emailVerified: { not: null } },
      ...(industry ? { industry } : {}),
      ...(query
        ? { OR: [{ jobTitle: contains }, { location: contains }, { user: { name: contains } }, { user: { major: contains } }] }
        : {}),
    },
    orderBy: { user: { name: "asc" } },
    take: 60,
    include: { user: { select: { id: true, name: true, major: true, gradYear: true } } },
  });

  // Students see the state of requests they sent. Alumni see requests waiting for an answer.
  const sent = isAlumnus
    ? []
    : await prisma.introRequest.findMany({
        where: { fromId: user.id, toId: { in: profiles.map((p) => p.userId) } },
        select: { toId: true, status: true },
      });
  const inbox = isAlumnus
    ? await prisma.introRequest.findMany({
        where: { toId: user.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        include: { from: { select: { name: true, major: true } } },
      })
    : [];
  const statusByAlumnus = new Map(sent.map((s) => [s.toId, s.status]));

  const href = (next: { q?: string; ind?: string }) => {
    const p = new URLSearchParams();
    const nq = next.q ?? query;
    const ni = next.ind ?? industry ?? "";
    if (nq) p.set("q", nq);
    if (ni) p.set("ind", ni);
    const s = p.toString();
    return s ? `/alumni?${s}` : "/alumni";
  };

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="page-title">Alumni</h1>
        <p className="text-muted">Graduates who offered to help a current student. Ask for advice, a resume review or an introduction.</p>
      </div>

      {isAlumnus && inbox.length > 0 && (
        <section className="grid gap-3" aria-label="Introduction requests">
          <h2 className="text-lg font-bold">Introduction requests</h2>
          {inbox.map((r) => (
            <div key={r.id} className="card grid gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar name={r.from.name} />
                <div className="min-w-0">
                  <b className="block leading-tight">{r.from.name}</b>
                  <span className="text-xs text-muted">
                    {r.from.major ? `${r.from.major} · ` : ""}
                    {timeAgo(r.createdAt)}
                  </span>
                </div>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm">{r.note}</p>
              <div className="flex gap-2">
                <form action={respondIntro.bind(null, r.id, true)}>
                  <SubmitButton pendingText="Accepting…">Accept and chat</SubmitButton>
                </form>
                <form action={respondIntro.bind(null, r.id, false)}>
                  <SubmitButton className="btn" pendingText="…">
                    Not now
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      <form role="search" className="grid gap-3">
        <label className="sr-only" htmlFor="q">
          Search alumni
        </label>
        <input id="q" name="q" defaultValue={query} placeholder="Search by name, job, city or major" className="input rounded-full px-4" autoComplete="off" />
        {industry && <input type="hidden" name="ind" value={industry} />}
      </form>

      <div className="flex gap-2 overflow-x-auto pb-1" role="navigation" aria-label="Filter by industry">
        <Link href={href({ ind: "" })} className="chip" aria-current={!industry}>
          All
        </Link>
        {INDUSTRIES.map((i) => (
          <Link key={i} href={href({ ind: i })} className="chip" aria-current={industry === i}>
            {i}
          </Link>
        ))}
      </div>

      {profiles.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {profiles.map((p) => {
            const first = p.user.name.split(" ")[0];
            const status = statusByAlumnus.get(p.userId);
            return (
              <div key={p.id} className="card grid content-start gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <Avatar name={p.user.name} size="lg" />
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold">{p.user.name}</h2>
                    <span className="block text-sm text-muted">
                      {p.user.gradYear ? `Class of ${p.user.gradYear}` : "Alumni"}
                      {p.user.major ? ` · ${p.user.major}` : ""}
                    </span>
                  </div>
                </div>
                <p className="text-sm">
                  <b>{p.jobTitle}</b>
                  <br />
                  <span className="text-muted">{p.location}</span>
                </p>
                <p className="text-sm text-muted">{p.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.openTo.map((t) => (
                    <span key={t} className="tag bg-sun-soft text-ink">
                      {t}
                    </span>
                  ))}
                </div>

                {isAlumnus ? null : status === "PENDING" ? (
                  <button type="button" disabled className="btn btn-on">
                    Request sent
                  </button>
                ) : status === "ACCEPTED" ? (
                  <form action={startDm.bind(null, p.userId)}>
                    <button type="submit" className="btn btn-primary">
                      Open chat
                    </button>
                  </form>
                ) : status === "DECLINED" ? (
                  <span className="text-sm text-muted">{first} is not available right now.</span>
                ) : (
                  <details>
                    <summary className="btn btn-primary w-fit cursor-pointer list-none">Request intro</summary>
                    <form action={requestIntro.bind(null, p.userId)} className="mt-3 grid gap-2">
                      <label className="sr-only" htmlFor={`note-${p.userId}`}>
                        Note to {first}
                      </label>
                      <textarea
                        id={`note-${p.userId}`}
                        name="note"
                        rows={4}
                        required
                        minLength={10}
                        maxLength={600}
                        defaultValue={`Hi ${first}, I am ${user.name.split(" ")[0]}${user.major ? `, a ${user.major} student` : ""}. Could we talk for 15 minutes about your path after graduation?`}
                        className="input"
                      />
                      <div>
                        <SubmitButton pendingText="Sending…">Send request</SubmitButton>
                      </div>
                    </form>
                  </details>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center text-muted">
          {query || industry ? "Nobody matches that search. Try another industry or a city." : "No alumni have joined yet. Graduates can sign up from the Join page."}
        </div>
      )}
    </div>
  );
}
