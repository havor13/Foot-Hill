import Link from "next/link";
import { toggleRsvp } from "@/app/(app)/actions";
import { eventParts } from "@/lib/format";

export type EventView = {
  id: string;
  title: string;
  location: string;
  description: string | null;
  startsAt: Date;
  groupId: string | null;
  group: { name: string } | null;
  _count: { rsvps: number };
};

export default function EventCard({
  event,
  going,
  showGroup = true,
}: {
  event: EventView;
  going: boolean;
  showGroup?: boolean;
}) {
  const p = eventParts(event.startsAt);
  return (
    <div className="card flex flex-wrap items-center gap-4 shadow-sm">
      <div className="w-14 shrink-0 rounded-xl bg-sun-soft py-1.5 text-center leading-none">
        <small className="block text-[11px] font-bold uppercase tracking-wider text-muted">{p.month}</small>
        <b className="font-display text-2xl">{p.day}</b>
      </div>
      <div className="grid min-w-[10rem] flex-1 gap-0.5">
        <h3 className="text-lg font-bold">{event.title}</h3>
        <span className="text-sm text-muted">
          {p.weekday} · {p.time} · {event.location}
        </span>
        {event.description && <span className="text-sm">{event.description}</span>}
        {showGroup && event.group && event.groupId && (
          <Link href={`/groups/${event.groupId}`} className="tag mt-1 w-fit hover:text-ink">
            {event.group.name}
          </Link>
        )}
      </div>
      <form action={toggleRsvp.bind(null, event.id)} className="grid justify-items-end gap-1">
        <button type="submit" aria-pressed={going} className={`btn ${going ? "btn-on" : "btn-primary"}`}>
          {going ? "You are going" : "RSVP"}
        </button>
        <span className="text-xs text-muted">{event._count.rsvps} going</span>
      </form>
    </div>
  );
}
