import Link from "next/link";

/** Switches between the admin pages and shows how many reports are waiting. */
export default function AdminTabs({ current, openReports }: { current: "alumni" | "reports" | "guests"; openReports: number }) {
  const tab = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-semibold ${active ? "bg-accent text-white" : "border border-line text-muted hover:bg-surface2"}`;
  return (
    <nav aria-label="Admin sections" className="flex gap-2">
      <Link href="/admin/alumni" aria-current={current === "alumni" ? "page" : undefined} className={tab(current === "alumni")}>
        Alumni
      </Link>
      <Link href="/admin/reports" aria-current={current === "reports" ? "page" : undefined} className={tab(current === "reports")}>
        Reports{openReports > 0 ? ` (${openReports})` : ""}
      </Link>
      <Link href="/admin/guests" aria-current={current === "guests" ? "page" : undefined} className={tab(current === "guests")}>
        Guests
      </Link>
    </nav>
  );
}
