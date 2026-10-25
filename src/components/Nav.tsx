"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ICONS: Record<string, string> = {
  home: "M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  groups: "M9 11a3.2 3.2 0 1 0 0-6.4A3.2 3.2 0 0 0 9 11zM3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M15 14.4c.6-.3 1.3-.4 2-.4 2.2 0 4 1.8 4 4",
  courses: "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z",
  alumni: "M2.5 9L12 4.5 21.5 9 12 13.5zM6.5 11.2V16c0 1.4 2.5 2.8 5.5 2.8s5.5-1.4 5.5-2.8v-4.8M21.5 9v5.5",
  events: "M3.5 7.5a2.5 2.5 0 0 1 2.5-2.5h12a2.5 2.5 0 0 1 2.5 2.5v10A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5zM3.5 10h17M8 3v4M16 3v4",
  people: "M12 11.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM5 20c0-3.9 3.1-7 7-7s7 3.1 7 7",
  chat: "M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1h-8l-5 4v-4H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  admin: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6zM9 12l2 2 4-4",
  me: "M12 11.6a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2zM5 20c0-3.9 3.1-7 7-7s7 3.1 7 7",
};

type Item = { href: string; label: string; icon: string; badge?: number; mobileOnly?: boolean };

export default function Nav({ unread, isAdmin }: { unread: number; isAdmin: boolean }) {
  const pathname = usePathname();

  const items: Item[] = [
    { href: "/feed", label: "Home", icon: "home" },
    { href: "/groups", label: "Groups", icon: "groups" },
    { href: "/courses", label: "Courses", icon: "courses" },
    { href: "/alumni", label: "Alumni", icon: "alumni" },
    { href: "/events", label: "Events", icon: "events" },
    { href: "/people", label: "People", icon: "people" },
    { href: "/chat", label: "Chat", icon: "chat", badge: unread },
    ...(isAdmin ? [{ href: "/admin/alumni", label: "Review", icon: "admin" }] : []),
    { href: "/settings", label: "Me", icon: "me", mobileOnly: true },
  ];

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  const icon = (name: string) => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" strokeLinecap="round" strokeLinejoin="round">
      <path d={ICONS[name]} />
    </svg>
  );

  const badge = (n?: number) =>
    n ? (
      <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-sun px-1.5 text-xs font-bold text-[#2a1c03]" aria-label={`${n} unread`}>
        {n > 99 ? "99+" : n}
      </span>
    ) : null;

  return (
    <>
      <nav aria-label="Main" className="hidden gap-1 md:grid">
        {items
          .filter((i) => !i.mobileOnly)
          .map((i) => (
            <Link
              key={i.href}
              href={i.href}
              aria-current={active(i.href) ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 font-semibold transition ${active(i.href) ? "bg-accent-soft text-accent" : "text-muted hover:bg-surface2 hover:text-ink"}`}
            >
              {icon(i.icon)}
              {i.label}
              {badge(i.badge)}
            </Link>
          ))}
      </nav>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {items.map((i) => (
          <Link
            key={i.href}
            href={i.href}
            aria-current={active(i.href) ? "page" : undefined}
            className={`relative flex min-w-[4.5rem] flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-semibold ${active(i.href) ? "text-accent" : "text-muted"}`}
          >
            {icon(i.icon)}
            {i.label}
            {i.badge ? <span className="absolute right-3 top-1 h-2.5 w-2.5 rounded-full bg-sun" aria-label={`${i.badge} unread`} /> : null}
          </Link>
        ))}
      </nav>
    </>
  );
}
