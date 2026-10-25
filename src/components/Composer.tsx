import Avatar from "@/components/Avatar";
import SubmitButton from "@/components/SubmitButton";
import { createPost } from "@/app/(app)/actions";

export default function Composer({
  groups,
  defaultGroupId,
  fixedGroupId,
  placeholder = "Ask a question, share a plan or say hello",
  userName,
}: {
  groups?: { id: string; name: string }[];
  defaultGroupId?: string;
  fixedGroupId?: string;
  placeholder?: string;
  userName?: string;
}) {
  return (
    <form action={createPost} className="card grid gap-3">
      <div className="flex gap-3">
        {userName && <Avatar name={userName} />}
        <label className="sr-only" htmlFor="post-body">
          Write a post
        </label>
        <textarea
          id="post-body"
          name="body"
          required
          maxLength={2000}
          rows={3}
          placeholder={placeholder}
          className="input min-w-0 flex-1 resize-y"
        />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {fixedGroupId ? (
          <input type="hidden" name="groupId" value={fixedGroupId} />
        ) : (
          <>
            <label className="sr-only" htmlFor="post-group">
              Post to
            </label>
            <select
              id="post-group"
              name="groupId"
              defaultValue={defaultGroupId}
              className="max-w-full rounded-full border border-line bg-bg px-3 py-1.5 text-sm"
            >
              {groups?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </>
        )}
        <SubmitButton pendingText="Posting…">Post</SubmitButton>
      </div>
    </form>
  );
}
