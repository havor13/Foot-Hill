import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { ALLOWED_TYPES, AVATAR_TYPES, MAX_AVATAR_BYTES, MAX_UPLOAD_BYTES } from "@/lib/uploads";

/**
 * Hands the browser a short-lived, single-purpose upload token. The browser then uploads the file
 * straight to Vercel Blob, which avoids the 4.5 MB request limit of serverless functions. The token
 * only allows our file types and size, and only inside this user's own folder.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: "File uploads are not set up yet." }, { status: 503 });
  }

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Sign in to upload files." }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
  if (!user?.emailVerified) return Response.json({ error: "Confirm your email first." }, { status: 403 });

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return Response.json({ error: "Bad request." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (pathname.startsWith(`avatars/${userId}/`)) {
          return { allowedContentTypes: AVATAR_TYPES, maximumSizeInBytes: MAX_AVATAR_BYTES, addRandomSuffix: true };
        }
        if (!pathname.startsWith(`uploads/${userId}/`)) throw new Error("Upload path not allowed.");
        return {
          allowedContentTypes: [...ALLOWED_TYPES],
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
        };
      },
    });
    return Response.json(result);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Upload failed." }, { status: 400 });
  }
}
