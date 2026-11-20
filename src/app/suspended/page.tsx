import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { logout } from "../(auth)/actions";

export const metadata = { title: "Account paused" };

export default async function SuspendedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { suspendedAt: true } });
  if (!user?.suspendedAt) redirect("/feed"); // only paused accounts belong here

  return (
    <main className="mx-auto grid min-h-dvh max-w-md content-center gap-4 px-4 text-center">
      <h1 className="font-display text-2xl font-bold">Your account is paused</h1>
      <p className="text-muted">
        An admin paused this account after a report about posts or messages. If you think this is a mistake, contact the
        person who runs Foothill Commons and ask them to review it.
      </p>
      <form action={logout}>
        <button type="submit" className="btn">
          Sign out
        </button>
      </form>
    </main>
  );
}
