import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import Avatar from "@/components/Avatar";
import { startDm } from "../actions";

export const metadata = { title: "People" };

export default async function PeoplePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  // The student directory is for students. Alumni reach students through introductions.
  if (user.role !== "STUDENT") redirect("/alumni");
  const { q = "" } = await searchParams;
  const query = q.trim();

  const contains = (field: string) => ({ [field]: { contains: query, mode: "insensitive" as const } });
  const people = await prisma.user.findMany({
    where: {
      role: "STUDENT",
      emailVerified: { not: null },
      id: { not: user.id },
      ...(query ? { OR: [contains("name"), contains("major"), contains("hometown"), contains("mission")] } : {}),
    },
    orderBy: { name: "asc" },
    take: 60,
    select: { id: true, name: true, major: true, hometown: true, mission: true, bio: true },
  });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="page-title">People</h1>
        <p className="text-muted">Search by name, major, hometown or mission.</p>
      </div>
      <form role="search">
        <label className="sr-only" htmlFor="q">
          Search people
        </label>
        <input id="q" name="q" defaultValue={query} placeholder="Try Nursing, Arizona or Peru" className="input rounded-full px-4" autoComplete="off" />
      </form>

      {people.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {people.map((p) => (
            <div key={p.id} className="card grid content-start gap-3 shadow-sm">
              <div className="flex items-center gap-3">
                <Avatar name={p.name} size="lg" />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold">{p.name}</h2>
                  <span className="block text-sm text-muted">{[p.major, p.hometown].filter(Boolean).join(" · ")}</span>
                </div>
              </div>
              {p.mission && <span className="tag w-fit bg-sun-soft text-ink">{p.mission}</span>}
              {p.bio && <p className="text-sm text-muted">{p.bio}</p>}
              <form action={startDm.bind(null, p.id)}>
                <button type="submit" className="btn">
                  Message
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center text-muted">Nobody matches that search. Try a major or a city.</div>
      )}
    </div>
  );
}
