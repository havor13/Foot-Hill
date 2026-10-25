import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const loadUser = cache(async (id: string) =>
  prisma.user.findUnique({ where: { id }, include: { alumni: { select: { approved: true } } } }),
);

/**
 * Returns the signed-in user, or redirects.
 *
 * - Unverified accounts are sent to /verify unless the caller passes allowUnverified.
 * - Alumni can sign up with any email, so until a reviewer approves their profile they can only
 *   reach their own settings page (allowPendingAlumni). Admins are exempt.
 */
export async function requireUser(opts?: { allowUnverified?: boolean; allowPendingAlumni?: boolean }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await loadUser(session.user.id);
  if (!user) redirect("/login");
  if (!user.emailVerified && !opts?.allowUnverified) redirect("/verify");

  const pendingAlumnus = user.role === "ALUMNI" && !user.alumni?.approved && !user.isAdmin;
  if (user.emailVerified && pendingAlumnus && !opts?.allowPendingAlumni) redirect("/settings");
  return user;
}
