import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { approveAlumni } from "../../actions";

export const metadata = { title: "Review alumni" };

export default async function AdminAlumniPage() {
  const user = await requireUser();
  if (!user.isAdmin) notFound();

  const pending = await prisma.alumniProfile.findMany({
    where: { approved: false, user: { emailVerified: { not: null } } },
    orderBy: { user: { createdAt: "asc" } },
    include: { user: { select: { id: true, name: true, email: true, major: true, gradYear: true } } },
  });

  return (
    <div className="grid gap-4">
      <div>
        <h1 className="page-title">Review alumni</h1>
        <p className="text-muted">
          Check each profile against BYU records or a LinkedIn page before approving. Approved profiles appear in the alumni directory.
        </p>
      </div>

      {pending.length ? (
        pending.map((p) => (
          <div key={p.id} className="card grid gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Avatar name={p.user.name} />
              <div className="min-w-0">
                <b className="block leading-tight">{p.user.name}</b>
                <span className="block truncate text-xs text-muted">
                  {p.user.email} · Class of {p.user.gradYear ?? "unknown"}
                  {p.user.major ? ` · ${p.user.major}` : ""}
                </span>
              </div>
            </div>
            <p className="text-sm">
              <b>{p.jobTitle}</b> · {p.location} · {p.industry}
            </p>
            <p className="text-sm text-muted">{p.bio}</p>
            <div className="flex gap-2">
              <form action={approveAlumni.bind(null, p.userId, true)}>
                <SubmitButton pendingText="Approving…">Approve</SubmitButton>
              </form>
              <form action={approveAlumni.bind(null, p.userId, false)}>
                <SubmitButton className="btn" pendingText="…">
                  Reject
                </SubmitButton>
              </form>
            </div>
          </div>
        ))
      ) : (
        <div className="card text-center text-muted">Nothing waiting for review.</div>
      )}
    </div>
  );
}
