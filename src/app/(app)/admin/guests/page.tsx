import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import AdminTabs from "@/components/AdminTabs";
import SubmitButton from "@/components/SubmitButton";
import { timeAgo } from "@/lib/format";
import { removeAllGuests, removeGuest } from "../../report-actions";

export const metadata = { title: "Guests" };

export default async function AdminGuestsPage() {
  const admin = await requireUser();
  if (!admin.isAdmin) notFound();

  const [guests, openReports] = await Promise.all([
    prisma.user.findMany({
      where: { isGuest: true },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true, emailVerified: true },
    }),
    prisma.report.count({ where: { status: "OPEN" } }),
  ]);
  const inviteOn = Boolean(process.env.GUEST_INVITE_CODE?.trim());

  return (
    <div className="grid gap-5">
      <h1 className="page-title">Guests</h1>
      <AdminTabs current="guests" openReports={openReports} />
      <p className="text-sm text-muted">
        Guests are testers and school leaders who joined with the invite code instead of a student email.{" "}
        {inviteOn
          ? "Guest sign-up is open. Remove the GUEST_INVITE_CODE setting in Vercel to close it."
          : "Guest sign-up is closed. Set GUEST_INVITE_CODE in Vercel to open it."}
      </p>

      {guests.length === 0 ? (
        <p className="card text-sm text-muted">No guest accounts right now.</p>
      ) : (
        <>
          <ul className="grid gap-2">
            {guests.map((g) => (
              <li key={g.id} className="card flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <b className="block truncate">{g.name}</b>
                  <span className="block truncate text-sm text-muted">
                    {g.email} · joined {timeAgo(g.createdAt)}
                    {g.emailVerified ? "" : " · email not confirmed"}
                  </span>
                </div>
                <form action={removeGuest.bind(null, g.id)}>
                  <SubmitButton pendingText="Removing…" className="btn border-danger text-danger">
                    Remove
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
          <details className="rounded-xl border border-line">
            <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-danger">Remove all guests</summary>
            <form action={removeAllGuests} className="grid gap-3 border-t border-line p-3">
              <p className="text-sm">
                This permanently deletes all {guests.length} guest accounts with their posts, messages and uploaded files.
                It cannot be undone.
              </p>
              <div>
                <SubmitButton pendingText="Removing…" className="btn border-danger text-danger">
                  Yes, remove all guests
                </SubmitButton>
              </div>
            </form>
          </details>
        </>
      )}
    </div>
  );
}
