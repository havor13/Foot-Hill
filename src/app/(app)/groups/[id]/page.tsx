import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { hue } from "@/lib/format";
import PostCard, { postInclude } from "@/components/PostCard";
import Composer from "@/components/Composer";
import JoinButton from "@/components/JoinButton";
import EventCard from "@/components/EventCard";
import EventForm from "@/components/EventForm";

export default async function GroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      _count: { select: { memberships: true } },
      memberships: { where: { userId: user.id }, select: { userId: true } },
      conversation: { select: { id: true } },
    },
  });
  if (!group) notFound();

  const joined = group.memberships.length > 0;
  const isCourse = group.kind === "COURSE";

  const [posts, events] = await Promise.all([
    prisma.post.findMany({
      where: { groupId: id },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: postInclude(user.id),
    }),
    prisma.event.findMany({
      where: { groupId: id, startsAt: { gte: new Date() } },
      orderBy: { startsAt: "asc" },
      take: 5,
      include: {
        group: { select: { name: true } },
        _count: { select: { rsvps: true } },
        rsvps: { where: { userId: user.id }, select: { userId: true } },
      },
    }),
  ]);

  const h = hue(group.slug);

  return (
    <div className="grid gap-4">
      <Link href={isCourse ? "/courses" : "/groups"} className="w-fit text-sm text-muted underline">
        Back to {isCourse ? "course circles" : "groups"}
      </Link>

      <header className="card grid gap-3 shadow-sm">
        <div className="h-14 rounded-xl" style={{ background: `linear-gradient(160deg, hsl(${h} 55% 42%), hsl(${h + 40} 60% 55%))` }} />
        {isCourse && (
          <span className="w-fit rounded-lg bg-accent-soft px-2.5 py-0.5 font-display text-sm font-bold text-accent">
            {group.courseCode} · {group.term}
          </span>
        )}
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <p className="text-muted">{group.description}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-muted">{group._count.memberships} {isCourse ? "students" : "members"}</span>
          <JoinButton groupId={group.id} joined={joined} joinLabel={isCourse ? "Join circle" : "Join"} />
          {joined && group.conversation && (
            <Link href={`/chat/${group.conversation.id}`} className="btn">
              Open group chat
            </Link>
          )}
        </div>
      </header>

      {joined ? (
        <>
          {events.length > 0 && (
            <section className="grid gap-3" aria-label="Upcoming events">
              <h2 className="text-lg font-bold">{isCourse ? "Study sessions" : "Upcoming events"}</h2>
              {events.map((e) => (
                <EventCard key={e.id} event={e} going={e.rsvps.length > 0} showGroup={false} />
              ))}
            </section>
          )}
          <EventForm groupId={group.id} label={isCourse ? "Plan a study session" : "Plan an event"} />
          <Composer
            fixedGroupId={group.id}
            userName={user.name}
            placeholder={isCourse ? `Ask your circle a question about ${group.courseCode}` : "Share something with the group"}
          />
        </>
      ) : (
        <div className="card text-center text-muted">Join to post, plan events and chat with this {isCourse ? "circle" : "group"}.</div>
      )}

      {posts.length ? (
        posts.map((p) => <PostCard key={p.id} post={p} meId={user.id} showGroup={false} canInteract={joined} />)
      ) : (
        <div className="card text-center text-muted">
          {isCourse ? "No questions yet. Ask the first one and your circle will see it." : "No posts yet."}
        </div>
      )}
    </div>
  );
}
