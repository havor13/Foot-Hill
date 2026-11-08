import { toggleReaction } from "@/app/(app)/actions";
import { REACTION_EMOJIS, summarizeReactions } from "@/lib/reactions";

/** Emoji chips under a post, plus a small picker. Each tap is a plain form, so it works without JavaScript. */
export default function ReactionBar({
  postId,
  rows,
  meId,
  canInteract,
}: {
  postId: string;
  rows: { emoji: string; userId: string }[];
  meId: string;
  canInteract: boolean;
}) {
  const summary = summarizeReactions(rows, meId);

  return (
    <>
      {summary.map((r) => {
        const cls = `inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm font-semibold ${
          r.mine ? "border-accent bg-accent-soft text-accent" : "border-line text-muted"
        }`;
        return canInteract ? (
          <form key={r.emoji} action={toggleReaction.bind(null, postId, r.emoji)}>
            <button type="submit" aria-pressed={r.mine} aria-label={`${r.emoji} ${r.count}${r.mine ? ", you reacted" : ""}`} className={`${cls} hover:bg-surface2`}>
              <span aria-hidden="true">{r.emoji}</span>
              {r.count}
            </button>
          </form>
        ) : (
          <span key={r.emoji} className={cls}>
            <span aria-hidden="true">{r.emoji}</span>
            {r.count}
          </span>
        );
      })}

      {canInteract && (
        <details className="relative">
          <summary
            aria-label="Add a reaction"
            className="inline-flex cursor-pointer list-none items-center rounded-full px-2.5 py-1 text-sm font-semibold text-muted hover:bg-surface2 [&::-webkit-details-marker]:hidden"
          >
            + 😊
          </summary>
          <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-1 rounded-xl border border-line bg-surface p-1 shadow-md">
            {REACTION_EMOJIS.map((e) => (
              <form key={e} action={toggleReaction.bind(null, postId, e)}>
                <button type="submit" aria-label={`React with ${e}`} className="rounded-lg px-2 py-1 text-xl hover:bg-surface2">
                  {e}
                </button>
              </form>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
