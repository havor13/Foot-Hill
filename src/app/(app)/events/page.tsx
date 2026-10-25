import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import EventCard from "@/components/EventCard";

export const metadata = { title: "Events" };

export default async function EventsPage() {
  const user = await requireUser();
  const events = await prisma.event.findMany({
    where: { startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 50,
    include: {
      group: { select: { name: true } },
      _count: { select: { rsvps: true } },
      rsvps: { where: { userId: user.id }, select: { userId: true } },
    },
  });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="page-title">Events</h1>
        <p className="text-muted">Show up once and you will know three new people. Plan your own from any group page.</p>
      </div>
      {events.length ? (
        events.map((e) => <EventCard key={e.id} event={e} going={e.rsvps.length > 0} />)
      ) : (
        <div className="card text-center text-muted">No upcoming events. Open a group and plan the first one.</div>
      )}
    </div>
  );
}
