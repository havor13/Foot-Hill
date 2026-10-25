export const TZ = "America/Denver";

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function hue(seed: string): number {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}

export function timeAgo(date: Date): string {
  const s = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (s < 60) return "Just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d === 1) return "Yesterday";
  if (d < 7) return `${d} days ago`;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: TZ }).format(date);
}

export function eventParts(date: Date) {
  const f = (opts: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...opts }).format(date);
  return {
    month: f({ month: "short" }).toUpperCase(),
    day: f({ day: "numeric" }),
    weekday: f({ weekday: "short" }),
    time: f({ hour: "numeric", minute: "2-digit" }),
  };
}

function tzOffsetMinutes(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: TZ, timeZoneName: "longOffset" }).formatToParts(date);
  const value = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(value);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (Number(m[2]) * 60 + Number(m[3]));
}

/** Turns a "2026-10-31T06:15" value from a datetime-local input (Provo time) into a UTC Date. */
export function provoLocalToDate(local: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const date = new Date(guess - tzOffsetMinutes(new Date(guess)) * 60000);
  return Number.isNaN(date.getTime()) ? null : date;
}
