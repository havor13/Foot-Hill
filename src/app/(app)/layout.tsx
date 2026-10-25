import Link from "next/link";
import { requireUser } from "@/lib/session";
import { unreadByConversation } from "@/lib/chat";
import Nav from "@/components/Nav";
import Avatar from "@/components/Avatar";
import Logo from "@/components/Logo";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser({ allowPendingAlumni: true });
  const unread = Object.values(await unreadByConversation(user.id)).reduce((a, b) => a + b, 0);

  return (
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
          <Avatar name={user.name} />
          <span className="min-w-0">
            <b className="block truncate text-sm leading-tight">{user.name}</b>
            <span className="block truncate text-xs text-muted">{user.major ?? (user.role === "ALUMNI" ? "Alumni" : "Student")}</span>
          </span>
        </Link>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
