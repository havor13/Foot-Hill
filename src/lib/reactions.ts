/** Reaction rules shared by the browser and the server. No server-only imports here. */

/** The emoji people can react with. Likes (the heart) stay a separate button on posts. */
export const REACTION_EMOJIS = ["👍", "🎉", "😂", "😮", "🙏", "🔥"] as const;

export const isReactionEmoji = (value: string): boolean => (REACTION_EMOJIS as readonly string[]).includes(value);

/** One row per emoji that has at least one reaction. `mine` is true when the signed-in student used it. */
export type ReactionSummary = { emoji: string; count: number; mine: boolean }[];

export function summarizeReactions(rows: { emoji: string; userId: string }[], meId: string): ReactionSummary {
  const byEmoji = new Map<string, { count: number; mine: boolean }>();
  for (const r of rows) {
    const entry = byEmoji.get(r.emoji) ?? { count: 0, mine: false };
    entry.count += 1;
    if (r.userId === meId) entry.mine = true;
    byEmoji.set(r.emoji, entry);
  }
  // Keep the order of the palette so chips do not jump around between reloads.
  return REACTION_EMOJIS.filter((e) => byEmoji.has(e)).map((e) => ({ emoji: e, ...byEmoji.get(e)! }));
}

export const sameReactions = (a: ReactionSummary, b: ReactionSummary): boolean =>
  a.length === b.length && a.every((x, i) => x.emoji === b[i].emoji && x.count === b[i].count && x.mine === b[i].mine);
