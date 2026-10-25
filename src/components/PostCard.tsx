import Link from "next/link";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { addComment, deletePost, toggleLike } from "@/app/(app)/actions";
import { timeAgo } from "@/lib/format";

export type PostView = {
  id: string;
  body: string;
  createdAt: Date;
  author: { id: string; name: string; major: string | null };
  group: { id: string; name: string; kind: "GROUP" | "COURSE" };
  _count: { likes: number; comments: number };
  likes: { userId: string }[]; // already filtered to the signed-in user
  comments: { id: string; body: string; createdAt: Date; author: { name: string } }[];
};

export default function PostCard({
  post,
  meId,
  showGroup = true,
  canInteract = true,
}: {
  post: PostView;
  meId: string;
  showGroup?: boolean;
  canInteract?: boolean;
}) {
  const liked = post.likes.length > 0;
  const isQuestion = post.group.kind === "COURSE";
  const noun = isQuestion ? "repl" : "comment";
  const count = post._count.comments;
  const countLabel = isQuestion ? `${count} ${count === 1 ? "reply" : "replies"}` : `${count} ${count === 1 ? "comment" : "comments"}`;

  return (
    <article className="card grid gap-3 shadow-sm">
      <header className="flex items-center gap-3">
        <Avatar name={post.author.name} />
        <div className="min-w-0">
          <b className="block leading-tight">{post.author.name}</b>
          <span className="text-xs text-muted">
            {post.author.major ? `${post.author.major} · ` : ""}
            {timeAgo(post.createdAt)}
          </span>
        </div>
        {post.author.id === meId && (
          <form action={deletePost.bind(null, post.id)} className="ml-auto">
            <button type="submit" className="text-xs text-muted underline hover:text-danger">
              Delete
            </button>
          </form>
        )}
      </header>

      {showGroup && (
        <Link href={`/groups/${post.group.id}`} className="tag w-fit hover:text-ink">
          {isQuestion ? "Question in " : ""}
          {post.group.name}
        </Link>
      )}

      <p className="whitespace-pre-wrap break-words">{post.body}</p>

      <div className="flex items-center gap-1 border-t border-line pt-2">
        <form action={toggleLike.bind(null, post.id)}>
          <button
            type="submit"
            disabled={!canInteract}
            aria-pressed={liked}
            aria-label={isQuestion ? "Mark helpful" : "Like"}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold transition hover:bg-surface2 ${liked ? "text-danger" : "text-muted"}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className={`h-[18px] w-[18px] stroke-current stroke-[1.8] ${liked ? "fill-current" : "fill-none"}`} strokeLinejoin="round">
              <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />
            </svg>
            {post._count.likes}
          </button>
        </form>
      </div>

      <details>
        <summary className="cursor-pointer text-sm font-semibold text-accent">
          {countLabel}
          {canInteract ? `, add ${noun === "repl" ? "a reply" : "a comment"}` : ""}
        </summary>
        <div className="mt-3 grid gap-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar name={c.author.name} size="sm" />
              <div className="min-w-0 rounded-xl bg-surface2 px-3 py-1.5 text-sm">
                <b className="block text-xs">{c.author.name}</b>
                <span className="break-words">{c.body}</span>
              </div>
            </div>
          ))}
          {canInteract && (
            <form action={addComment.bind(null, post.id)} className="flex gap-2">
              <label className="sr-only" htmlFor={`c-${post.id}`}>
                {isQuestion ? "Write a reply" : "Write a comment"}
              </label>
              <input
                id={`c-${post.id}`}
                name="body"
                required
                maxLength={1000}
                autoComplete="off"
                placeholder={isQuestion ? "Help out with an answer" : "Write a comment"}
                className="input min-w-0 flex-1 rounded-full"
              />
              <SubmitButton pendingText="…">Reply</SubmitButton>
            </form>
          )}
        </div>
      </details>
    </article>
  );
}

export const postInclude = (userId: string) =>
  ({
    author: { select: { id: true, name: true, major: true } },
    group: { select: { id: true, name: true, kind: true } },
    _count: { select: { likes: true, comments: true } },
    likes: { where: { userId }, select: { userId: true } },
    comments: {
      orderBy: { createdAt: "asc" },
      take: 30,
      select: { id: true, body: true, createdAt: true, author: { select: { name: true } } },
    },
  }) as const;
