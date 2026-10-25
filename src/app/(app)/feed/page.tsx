import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import PostCard, { postInclude } from "@/components/PostCard";
import Composer from "@/components/Composer";

export const metadata = { title: "Home" };

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ g?: string }> }) {
  const user = await requireUser();
  const { g } = await searchParams;

  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { group: { select: { id: true, name: true, kind: true } } },
    orderBy: { group: { name: "asc" } },
  });
  const groups = memberships.map((m) => m.group);
  const filterId = groups.some((x) => x.id === g) ? g : undefined;

  const posts = await prisma.post.findMany({
    where: filterId ? { groupId: filterId } : { group: { memberships: { some: { userId: user.id } } } },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: postInclude(user.id),
  });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="page-title">Good to see you, {user.name.split(" ")[0]}</h1>
        <p className="text-muted">Here is what your groups are talking about.</p>
      </div>

      {groups.length ? (
        <>
          <Composer groups={groups} defaultGroupId={filterId} />
          <div className="flex gap-2 overflow-x-auto pb-1" role="navigation" aria-label="Filter by group">
            <Link href="/feed" className="chip" aria-current={!filterId}>
              All my groups
            </Link>
            {groups.map((x) => (
              <Link key={x.id} href={`/feed?g=${x.id}`} className="chip" aria-current={filterId === x.id}>
                {x.name}
              </Link>
            ))}
          </div>
        </>
      ) : (
        <div className="card text-center text-muted">
          Join a group or a course circle to start seeing posts.{" "}
          <Link href="/groups" className="font-semibold text-accent underline">
            Browse groups
          </Link>
        </div>
      )}

      {posts.length ? (
        posts.map((p) => <PostCard key={p.id} post={p} meId={user.id} />)
      ) : groups.length ? (
        <div className="card text-center text-muted">No posts yet. Be the first to say something.</div>
      ) : null}
    </div>
  );
}
