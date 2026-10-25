import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { hue, initials } from "@/lib/format";
import ChatList from "@/components/ChatList";
import ChatThread from "@/components/ChatThread";

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();

  const convo = await prisma.conversation.findFirst({
    where: { id, members: { some: { userId: user.id } } },
    include: {
      members: { include: { user: { select: { id: true, name: true, major: true } } } },
      group: { select: { id: true, name: true, kind: true } },
    },
  });
  if (!convo) notFound();

  const newest = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { sender: { select: { name: true } } },
  });
  newest.reverse();

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: id, userId: user.id } },
    data: { lastReadAt: new Date() },
  });

  const others = convo.members.filter((m) => m.userId !== user.id);
  const title = convo.isGroup ? (convo.name ?? "Group chat") : (others[0]?.user.name ?? "Unknown student");
  const subtitle = convo.isGroup
    ? `${convo.members.length} members`
    : (others[0]?.user.major ?? "BYU student");
  const othersReadAt = others.length ? new Date(Math.max(...others.map((o) => o.lastReadAt.getTime()))).toISOString() : null;

  return (
    <div className="grid gap-4 md:grid-cols-[340px_minmax(0,1fr)]">
      <div className="hidden md:block">
        <ChatList userId={user.id} canStartGroup={user.role === "STUDENT"} activeId={id} />
      </div>

      <section aria-label={`Conversation with ${title}`} className="card flex h-[calc(100dvh-9rem)] min-h-[24rem] flex-col overflow-hidden !p-0 shadow-sm md:h-[calc(100dvh-6rem)]">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2.5">
          <Link href="/chat" className="btn !h-9 !w-9 shrink-0 !p-0 md:hidden" aria-label="Back to chats">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-none stroke-current stroke-2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </Link>
          <span
            aria-hidden="true"
            className={`grid h-10 w-10 shrink-0 place-items-center font-semibold text-white ${convo.isGroup ? "rounded-xl" : "rounded-full"}`}
            style={{ background: `hsl(${hue(title)} 42% 36%)` }}
          >
            {initials(title)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-lg font-bold leading-tight">{title}</h1>
            <p className="truncate text-xs text-muted">{subtitle}</p>
          </div>
          {convo.group && (
            <Link href={`/groups/${convo.group.id}`} className="btn shrink-0">
              {convo.group.kind === "COURSE" ? "Open circle" : "Open group"}
            </Link>
          )}
        </header>

        <ChatThread
          key={id}
          conversationId={id}
          meId={user.id}
          isGroup={convo.isGroup}
          initial={newest.map((m) => ({
            id: m.id,
            senderId: m.senderId,
            senderName: m.sender.name,
            body: m.body,
            createdAt: m.createdAt.toISOString(),
          }))}
          initialOthersReadAt={othersReadAt}
        />
      </section>
    </div>
  );
}
