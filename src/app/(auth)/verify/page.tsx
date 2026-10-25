import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import VerifyForm from "@/components/VerifyForm";

export const metadata = { title: "Confirm your email" };

export default async function VerifyPage() {
  const user = await requireUser({ allowUnverified: true });
  if (user.emailVerified) redirect("/feed");
  return <VerifyForm email={user.email} />;
}
