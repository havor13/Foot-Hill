import SubmitButton from "@/components/SubmitButton";
import { deleteCourse } from "@/app/(app)/actions";

/** A two-step delete: open the panel, read the warning, then confirm. Works without JavaScript. */
export default function DeleteCourse({ groupId, label }: { groupId: string; label: string }) {
  return (
    <details className="rounded-xl border border-line">
      <summary className="cursor-pointer px-3 py-2 text-sm font-semibold text-danger">Delete this course circle</summary>
      <form action={deleteCourse.bind(null, groupId)} className="grid gap-3 border-t border-line p-3">
        <p className="text-sm">
          This permanently deletes <b>{label}</b> for everyone: its posts, comments, study sessions, group chat and
          uploaded files. This cannot be undone.
        </p>
        <div>
          <SubmitButton pendingText="Deleting…" className="btn border-danger text-danger">
            Yes, delete it
          </SubmitButton>
        </div>
      </form>
    </details>
  );
}
