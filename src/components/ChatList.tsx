import Link from "next/link";
import { prisma } from "@/lib/db";
import { unreadByConversation } from "@/lib/chat";
import { hue, initials, timeAgo } from "@/lib/format";
import SubmitButton from "@/components/SubmitButton";
import { createGroupChat } from "@/app/(app)/chat/actions";

export default async function ChatList({
  userId,
  canStartGroup = true,
  activeId,
}: {
  userId: string;
  canStartGroup?: boolean;
  activeId?: string;
}) {
  const [convos, unread, people] = await Promise.all([
    prisma.conversation.findMany({
      where: { members: { some: { userId } } },
      include: {
        // Only a few other members are needed: the other person in a DM, or a preview for a group.
        members: { where: { userId: { not: userId } }, take: 3, include: { user: { select: { name: true } } } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, include: { sender: { select: { name: true } } } },
      },
    }),
    unreadByConversation(userId),
    // Only students can start group chats, and only with other students.
    canStartGroup
      ? prisma.user.findMany({
          where: { emailVerified: { not: null }, id: { not: userId }, role: "STUDENT" },
          orderBy: { name: "asc" },
          take: 100,
          select: { id: true, name: true, major: true },
        })
      : Promise.resolve([] as { id: string; name: string; major: string | null }[]),
  ]);

  const rows = convos
    .map((c) => {
      const last = c.messages[0] ?? null;
      const title = c.isGroup ? (c.name ?? "Group chat") : (c.members[0]?.user.name ?? "Unknown student");
      return { id: c.id, title, isGroup: c.isGroup, last, sortAt: (last?.createdAt ?? c.createdAt).getTime() };
    })
    .sort((a, b) => b.sortAt - a.sortAt);

  return (
    <section aria-label="Chats" className="card grid content-start gap-3 !p-0 shadow-sm">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-2xl font-bold">Chat</h1>
      </div>

      {canStartGroup && (
      <details className="mx-4 rounded-xl border border-line">
        <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-accent">New group chat</summary>
        <form action={createGroupChat} className="grid gap-3 border-t border-line p-3">
          <label className="label" htmlFor="gc-name">
            Group name
            <input id="gc-name" name="name" required minLength={2} maxLength={40} className="input" placeholder="For example, Chem 105 Study Crew" />
          </label>
          <fieldset className="grid max-h-48 gap-1 overflow-y-auto">
            <legend className="label mb-1">Add people</legend>
            {people.map((p) => (
              <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-surface2">
                <input type="checkbox" name="member" value={p.id} className="h-4 w-4 accent-[var(--accent)]" />
                <span className="truncate">{p.name}</span>
                {p.major && <span className="truncate text-xs text-muted">{p.major}</span>}
              </label>
            ))}
            {!people.length && <span className="text-sm text-muted">No one else has joined yet.</span>}
          </fieldset>
          <div>
            <SubmitButton pendingText="Creating…">Create chat</SubmitButton>
          </div>
        </form>
      </details>
      )}

      <ul className="max-h-[60dvh] overflow-y-auto border-t border-line md:max-h-[calc(100dvh-13rem)]">
        {rows.map((r) => {
          const n = unread[r.id] ?? 0;
          const preview = r.last
            ? `${r.last.senderId === userId ? "You: " : r.isGroup ? `${r.last.sender.name.split(" ")[0]}: ` : ""}${r.last.body}`
            : "No messages yet";
          return (
            <li key={r.id} className="border-b border-line last:border-0">
              <Link
                href={`/chat/${r.id}`}
                aria-current={activeId === r.id ? "page" : undefined}
                className={`flex items-center gap-3 px-4 py-3 hover:bg-bg ${activeId === r.id ? "bg-accent-soft" : ""}`}
              >
                <span
                  aria-hidden="true"
                  className={`grid h-11 w-11 shrink-0 place-items-center font-semibold text-white ${r.isGroup ? "rounded-xl" : "rounded-full"}`}
                  style={{ background: `hsl(${hue(r.title)} 42% 36%)` }}
                >
                  {initials(r.title)}
                </span>
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex items-baseline justify-between gap-2">
                    <b className={`truncate ${n ? "font-extrabold" : ""}`}>{r.title}</b>
                    <span className="shrink-0 text-xs text-muted">{r.last ? timeAgo(r.last.createdAt) : ""}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-muted">{preview}</span>
                    {n > 0 && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-sun px-1.5 text-xs font-bold text-[#2a1c03]" aria-label={`${n} unread`}>
                        {n}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
        {!rows.length && (
          <li className="p-6 text-center text-sm text-muted">
            No chats yet. Open the People page and tap Message, or start a group chat above.
          </li>
        )}
      </ul>
    </section>
  );
}
