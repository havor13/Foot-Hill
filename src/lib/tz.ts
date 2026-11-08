import { cookies } from "next/headers";

export const TZ_COOKIE = "tz";

/** True when the browser accepts this as a time zone name such as "Africa/Accra". */
export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return value.length > 0 && value.length < 60;
  } catch {
    return false;
  }
}

/** The signed-in browser's time zone, saved in a cookie by TimeZoneSync. Falls back to UTC. */
export async function getUserTz(): Promise<string> {
  const value = (await cookies()).get(TZ_COOKIE)?.value;
  return value && isTimeZone(decodeURIComponent(value)) ? decodeURIComponent(value) : "UTC";
}
