import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { hue } from "@/lib/format";
import JoinButton from "@/components/JoinButton";
import SubmitButton from "@/components/SubmitButton";
import { createGroup } from "../actions";

export const metadata = { title: "Groups" };

export default async function GroupsPage() {
  const user = await requireUser();
  const groups = await prisma.group.findMany({
    where: { kind: "GROUP" },
    orderBy: { name: "asc" },
    include: { _count: { select: { memberships: true } }, memberships: { where: { userId: user.id }, select: { userId: true } } },
  });

  return (
    <div className="grid gap-5">
      <div>
        <h1 className="page-title">Groups</h1>
        <p className="text-muted">Smaller circles make a big campus feel closer. Join a few.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {groups.map((g) => (
          <div key={g.id} className="card grid content-start gap-2.5 shadow-sm">
            <div
              className="h-16 rounded-xl"
              style={{ background: `linear-gradient(160deg, hsl(${hue(g.slug)} 55% 42%), hsl(${hue(g.slug) + 40} 60% 55%))` }}
            />
            <h2 className="text-lg font-bold">
              <Link href={`/groups/${g.id}`} className="hover:underline">
                {g.name}
              </Link>
            </h2>
            <p className="text-sm text-muted">{g.description}</p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-sm text-muted">{g._count.memberships} members</span>
              <JoinButton groupId={g.id} joined={g.memberships.length > 0} />
            </div>
          </div>
        ))}
      </div>

      <details className="card">
        <summary className="cursor-pointer font-semibold text-accent">Start a new group</summary>
        <form action={createGroup} className="mt-3 grid gap-3">
          <label className="label" htmlFor="gname">
            Group name
            <input id="gname" name="name" required minLength={3} maxLength={60} className="input" />
          </label>
          <label className="label" htmlFor="gdesc">
            What is it for?
            <textarea id="gdesc" name="description" required minLength={5} maxLength={300} rows={3} className="input" />
          </label>
          <div>
            <SubmitButton pendingText="Creating…">Create group</SubmitButton>
          </div>
        </form>
      </details>
    </div>
  );
}
