import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import AdminTabs from "@/components/AdminTabs";
import SubmitButton from "@/components/SubmitButton";
import { reasonLabel } from "@/lib/moderation";
import { timeAgo } from "@/lib/format";
import { dismissReports, removeReported, restoreUser, suspendAuthor } from "../../report-actions";

export const metadata = { title: "Reports" };

const authorSelect = { name: true, email: true, suspendedAt: true, isAdmin: true } as const;

export default async function AdminReportsPage() {
  const admin = await requireUser();
  if (!admin.isAdmin) notFound();

  const [reports, suspended] = await Promise.all([
    prisma.report.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "asc" },
      take: 200,
      include: {
        reporter: { select: { name: true } },
        post: { select: { body: true, author: { select: authorSelect }, group: { select: { name: true } }, _count: { select: { attachments: true } } } },
        comment: { select: { body: true, author: { select: authorSelect }, post: { select: { group: { select: { name: true } } } } } },
        message: {
          select: {
            body: true,
            sender: { select: authorSelect },
            conversation: { select: { isGroup: true, name: true } },
            _count: { select: { attachments: true } },
          },
        },
      },
    }),
    prisma.user.findMany({ where: { suspendedAt: { not: null } }, orderBy: { suspendedAt: "desc" }, select: { id: true, name: true, email: true } }),
  ]);

  // One card per reported item, however many students reported it.
  const items = new Map<string, typeof reports>();
  for (const r of reports) {
    const key = r.postId ?? r.commentId ?? r.messageId ?? r.id;
    items.set(key, [...(items.get(key) ?? []), r]);
  }

  return (
    <div className="grid gap-4">
      <AdminTabs current="reports" openReports={items.size} />
      <div>
        <h1 className="page-title">Reports</h1>
        <p className="text-muted">Items students have flagged. Read each one, then remove it, pause the author, or dismiss the report.</p>
      </div>

      {[...items.values()].map((group) => {
        const r = group[0];
        const kind = r.post ? "Post" : r.comment ? "Comment" : "Chat message";
        const body = r.post?.body ?? r.comment?.body ?? r.message?.body ?? "";
        const author = r.post?.author ?? r.comment?.author ?? r.message?.sender;
        const where = r.post
          ? r.post.group.name
          : r.comment
            ? r.comment.post.group.name
            : r.message?.conversation.isGroup
              ? (r.message.conversation.name ?? "Group chat")
              : "Private chat";
        const files = (r.post?._count.attachments ?? 0) + (r.message?._count.attachments ?? 0);
        return (
          <article key={r.id} className="card grid gap-3 shadow-sm">
            <header className="flex flex-wrap items-center gap-2 text-sm">
              <span className="tag">{kind}</span>
              <span className="text-muted">in {where}</span>
              <span className="ml-auto text-muted">
                {group.length} {group.length === 1 ? "report" : "reports"}
              </span>
            </header>

            <div className="rounded-xl bg-surface2 p-3">
              <b className="block text-sm">
                {author?.name} <span className="font-normal text-muted">{author?.email}</span>
                {author?.suspendedAt && <span className="ml-2 text-danger">paused</span>}
              </b>
              <p className="mt-1 whitespace-pre-wrap break-words">{body || <i className="text-muted">No text</i>}</p>
              {files > 0 && (
                <p className="mt-1 text-xs text-muted">
                  {files} attached {files === 1 ? "file" : "files"}
                </p>
              )}
            </div>

            <ul className="grid gap-1 text-sm">
              {group.map((x) => (
                <li key={x.id}>
                  <b>{reasonLabel(x.reason)}</b> · {x.reporter.name} · <span className="text-muted">{timeAgo(x.createdAt)}</span>
                  {x.details && <span className="block text-muted">“{x.details}”</span>}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-2">
              <form action={removeReported.bind(null, r.id)}>
                <SubmitButton pendingText="Removing…" className="btn border-danger text-danger">Remove {kind.toLowerCase()}</SubmitButton>
              </form>
              {author && !author.isAdmin && !author.suspendedAt && (
                <form action={suspendAuthor.bind(null, r.id)}>
                  <button type="submit" className="btn border-danger text-danger">
                    Pause author
                  </button>
                </form>
              )}
              <form action={dismissReports.bind(null, r.id)}>
                <button type="submit" className="btn">
                  Dismiss
                </button>
              </form>
            </div>
          </article>
        );
      })}

      {!items.size && <p className="card text-center text-muted">No open reports. Nothing needs your attention.</p>}

      {suspended.length > 0 && (
        <section aria-label="Paused accounts" className="card grid gap-2 shadow-sm">
          <h2 className="font-display text-lg font-bold">Paused accounts</h2>
          {suspended.map((u) => (
            <form key={u.id} action={restoreUser.bind(null, u.id)} className="flex items-center gap-3 text-sm">
              <span className="min-w-0 flex-1 truncate">
                <b>{u.name}</b> <span className="text-muted">{u.email}</span>
              </span>
              <button type="submit" className="btn !py-1 text-xs">
                Restore
              </button>
            </form>
          ))}
        </section>
      )}
    </div>
  );
}
