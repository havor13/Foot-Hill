import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import SubmitButton from "@/components/SubmitButton";
import { INDUSTRIES, OPEN_TO } from "@/lib/constants";
import { logout } from "../../(auth)/actions";
import { updateProfile } from "../actions";

export const metadata = { title: "Your profile" };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const user = await requireUser({ allowPendingAlumni: true });
  const { saved } = await searchParams;
  const alumni = user.role === "ALUMNI" ? await prisma.alumniProfile.findUnique({ where: { userId: user.id } }) : null;

  return (
    <div className="grid max-w-2xl gap-4">
      <div>
        <h1 className="page-title">Your profile</h1>
        <p className="text-muted">{user.email}</p>
      </div>

      {saved && (
        <p role="status" className="card bg-accent-soft text-sm font-semibold text-accent">
          Profile saved.
        </p>
      )}

      <form action={updateProfile} className="card grid gap-4 shadow-sm">
        <label className="label" htmlFor="name">
          Full name
          <input id="name" name="name" required minLength={2} maxLength={80} defaultValue={user.name} className="input" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="label" htmlFor="major">
            Major
            <input id="major" name="major" maxLength={80} defaultValue={user.major ?? ""} className="input" />
          </label>
          <label className="label" htmlFor="hometown">
            Hometown
            <input id="hometown" name="hometown" maxLength={80} defaultValue={user.hometown ?? ""} className="input" />
          </label>
        </div>
        <label className="label" htmlFor="mission">
          Mission (optional)
          <input id="mission" name="mission" maxLength={80} defaultValue={user.mission ?? ""} placeholder="For example, Peru Lima Mission" className="input" />
        </label>
        <label className="label" htmlFor="bio">
          About you
          <textarea id="bio" name="bio" rows={3} maxLength={500} defaultValue={user.bio ?? ""} className="input" />
        </label>

        {user.role === "ALUMNI" && (
          <fieldset className="grid gap-4 border-t border-line pt-4">
            <legend className="font-display text-lg font-bold">Alumni directory</legend>
            <p className="text-sm text-muted">
              {alumni
                ? alumni.approved
                  ? "Your profile is approved and visible to students."
                  : "Your profile is waiting for review."
                : "Fill this in so students can find you. A reviewer approves each profile before it appears."}
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="label" htmlFor="jobTitle">
                Job title
                <input id="jobTitle" name="jobTitle" required minLength={2} maxLength={100} defaultValue={alumni?.jobTitle ?? ""} className="input" />
              </label>
              <label className="label" htmlFor="location">
                City
                <input id="location" name="location" required minLength={2} maxLength={100} defaultValue={alumni?.location ?? ""} className="input" />
              </label>
            </div>
            <label className="label" htmlFor="industry">
              Industry
              <select id="industry" name="industry" defaultValue={alumni?.industry ?? INDUSTRIES[0]} className="input">
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="grid gap-2">
              <legend className="label">I am open to</legend>
              <div className="flex flex-wrap gap-2">
                {OPEN_TO.map((o) => (
                  <label key={o} className="flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1 text-sm has-[:checked]:border-accent has-[:checked]:bg-accent-soft">
                    <input type="checkbox" name="openTo" value={o} defaultChecked={alumni?.openTo.includes(o)} className="h-4 w-4 accent-[var(--accent)]" />
                    {o}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="label" htmlFor="alumniBio">
              What can you help with?
              <textarea id="alumniBio" name="alumniBio" rows={3} required minLength={10} maxLength={400} defaultValue={alumni?.bio ?? ""} className="input" />
            </label>
          </fieldset>
        )}

        <div>
          <SubmitButton pendingText="Saving…">Save profile</SubmitButton>
        </div>
      </form>

      <form action={logout}>
        <button type="submit" className="btn">
          Sign out
        </button>
      </form>
    </div>
  );
}
