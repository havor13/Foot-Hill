# Foothill Commons

A community app for BYU students: groups, course circles, alumni connections, events and chat.
Independent student project. Not affiliated with BYU or The Church of Jesus Christ of Latter-day Saints.

**Stack:** Next.js 15 (App Router, server actions), TypeScript, Tailwind CSS 4, Prisma + PostgreSQL, Auth.js v5 (credentials).

> **Status.** The first version compiled and type-checked on Vercel and runs locally. Photo and
> document uploads were added afterwards and have not been built yet, so run `npm run build` after
> adding them and fix any type errors before showing anyone.

## What is in it

| Area | What it does |
| --- | --- |
| Sign up | Students need an `@byu.edu`, `@student.byu.edu` or `@byupathway.edu` email and confirm it with a 6-digit code. Alumni sign up with any email. |
| Home | Feed of posts from your groups and circles, with likes and comments. |
| Groups | Browse, join, start your own, plan events, open the group chat. |
| Course circles | One circle per class: questions and replies, study sessions, group chat. |
| Alumni | Directory with industry filter and search. Students send an introduction request. If the alumnus accepts, a chat opens with the request as the first message. |
| Events | Upcoming events with RSVP counts. Times are entered and shown in Provo time. |
| People | Student directory with a Message button (students only). |
| Chat | Direct messages, group chats, unread badges, read ticks in direct messages. |
| Uploads | Attach up to 4 photos or documents (10 MB each) to a post or a chat message. Files live in Vercel Blob. |
| Admin | `/admin/alumni` lists alumni profiles waiting for review. |

### How access works

- Unverified accounts only see the verification page.
- Alumni are locked to their settings page until an admin approves their profile.
- Alumni cannot browse the student directory or start group chats. They talk to students only after accepting an introduction.
- Group and circle posts are visible to every verified member but only members can post, like or comment.

## Run it locally

You need Node 20+ and a PostgreSQL database (local, Neon, Supabase or Prisma Postgres).

```bash
cp .env.example .env        # then fill in DATABASE_URL and AUTH_SECRET
npm install
npm run db:push             # creates the tables
npm run db:seed             # starter groups and course circles
npm run dev                 # http://localhost:3000
```

- `AUTH_SECRET`: generate with `openssl rand -base64 32`.
- Verification emails go through Resend (`RESEND_API_KEY`, needs a verified domain) or, if that is empty, through
  Gmail (`GMAIL_USER` and `GMAIL_APP_PASSWORD`, run `npm install nodemailer @types/nodemailer -D` once).
  With neither set, codes are printed in the terminal running `npm run dev`.
- For demo people, posts and events (development only): `SEED_DEMO=1 npm run db:seed`.
  Sign in as `maya.torres@demo.foothill.test` with password `demo-password-1`.
- Make yourself an admin after signing up: `npm run make-admin -- you@byu.edu`.
- Uploads need `npm install @vercel/blob` and a `BLOB_READ_WRITE_TOKEN` in `.env`. Create a Blob store in the
  Vercel dashboard (Storage tab), connect it to the project, and copy the token. Without the token the
  attach button reports that uploads are not set up.

## Deploy to Vercel

1. Push the folder to GitHub and import it in Vercel.
2. Add a Postgres database (Vercel Marketplace: Neon or Prisma Postgres) and copy its connection string into `DATABASE_URL`.
3. Set `AUTH_SECRET`, `RESEND_API_KEY` and `EMAIL_FROM`. Verify your sending domain in Resend first, or codes will not reach students.
   Connect a Blob store to the project so `BLOB_READ_WRITE_TOKEN` is set.
4. From your machine, with the production `DATABASE_URL` in `.env`: `npm run db:push && npm run db:seed` (do not set `SEED_DEMO`).
5. Sign up, then run `npm run make-admin -- you@byu.edu` against production.

## Known limits

- **Chat uses polling**, not WebSockets. The open chat asks for new messages every 3 seconds, which is fine for hundreds of students. For thousands of simultaneous users, move to Pusher, Ably or a WebSocket server.
- **No typing indicators**, message editing or message deletion.
- **Uploads are public links.** Anyone who has a file's address can open it. The addresses are long and
  hard to guess, but they are not private. There is no virus scanning, only a check of file type and size.
  Deleting a post deletes its files, but chat files stay until the Blob store is cleaned up by hand.
- **No rate limiting** on sign in, verification codes or messages. Add one (for example Upstash Ratelimit) before launch.
- **No moderation tools** beyond alumni review: no reporting, blocking or admin deletion of posts.
- **Alumni review is manual.** Approving means checking the person yourself.
- Schema changes use `prisma db push`. Switch to `prisma migrate` once real data exists.
- Courses are seeded from a short list in `prisma/seed.ts`, not from BYU's catalog.

## Project map

```
prisma/schema.prisma        data model
prisma/seed.ts              starter groups, courses, optional demo data
scripts/make-admin.ts       promote an account to admin
src/auth.ts                 Auth.js credentials setup
src/lib/session.ts          requireUser(): sign-in, verification and alumni-approval gate
src/app/(auth)/             sign up, sign in, email code
src/app/(app)/              signed-in pages and server actions (actions.ts)
src/app/(app)/chat/         chat pages and the send-message action
src/app/api/chat/[id]/messages/route.ts   polling endpoint for new messages
src/components/ChatThread.tsx             live chat window
src/app/api/upload/route.ts               signed upload tokens for Vercel Blob
src/lib/uploads.ts, uploads.server.ts     upload rules and server-side validation
```
