import Link from "next/link";
import { requireUser } from "@/lib/session";
import { unreadByConversation } from "@/lib/chat";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";
import TimeZoneSync from "@/components/TimeZoneSync";
import CallProvider from "@/components/CallProvider";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser({ allowPendingAlumni: true });
  const unread = Object.values(await unreadByConversation(user.id)).reduce((a, b) => a + b, 0);

  return (
    <CallProvider>
    <div className="mx-auto grid max-w-6xl gap-6 px-4 pb-24 pt-5 md:grid-cols-[220px_minmax(0,1fr)] md:pb-10">
      <aside className="grid content-start gap-5 md:sticky md:top-5 md:self-start">
        <Link href="/feed" className="flex items-center gap-2.5 font-display text-xl font-bold">
          <Logo />
          Foothill Commons
        </Link>
        <Nav unread={unread} isAdmin={user.isAdmin} />
        <Link
          href="/settings"
          className="hidden items-center gap-3 rounded-xl border border-line bg-surface p-2.5 hover:bg-surface2 md:flex"
        >
          <Avatar name={user.name} image={user.image} />
          <span className="min-w-0">
            <b className="block truncate text-sm leading-tight">{user.name}</b>
            <span className="block truncate text-xs text-muted">{user.major ?? (user.role === "ALUMNI" ? "Alumni" : "Student")}</span>
          </span>
        </Link>
      </aside>
      <main className="min-w-0">{children}</main>
      <footer className="border-t border-line pt-4 text-xs text-muted md:col-span-2">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>© {new Date().getFullYear()} Foothill Commons</span>
          <Link href="/privacy" className="underline hover:text-ink">
            Privacy
          </Link>
          <Link href="/terms" className="underline hover:text-ink">
            Terms
          </Link>
          <Link href="/settings" className="underline hover:text-ink">
            Settings
          </Link>
        </p>
        <p className="mt-1">An independent student project. Not affiliated with BYU, BYU-Pathway or The Church of Jesus Christ of Latter-day Saints.</p>
      </footer>
      <TimeZoneSync />
    </div>
    </CallProvider>
  );
}
