/**
 * Creates a ready-to-use test account for someone who has no school email, such as a school leader.
 * The account is a student account with the email already confirmed, so no 6-digit code is needed.
 *
 *   npx tsx scripts/create-account.ts leader@gmail.com "Sister Jones"
 *   npx tsx scripts/create-account.ts leader@gmail.com "Sister Jones" "a-password-here"
 *   npx tsx scripts/create-account.ts leader@gmail.com "Sister Jones" "a-password-here" --admin
 *
 * - With no password, a random one is made and printed once. Share it privately.
 * - --admin also gives access to the review page (/admin/alumni).
 * - --no-groups skips joining the starter groups.
 * - Run it against the database the live site uses (the DATABASE_URL in your .env). Run it again with the
 *   same email to reset that person's password instead.
 */
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith("--"));
  const [rawEmail, name, givenPassword] = args.filter((a) => !a.startsWith("--"));
  const email = rawEmail?.trim().toLowerCase();

  if (!email || !name) {
    throw new Error('Usage: npx tsx scripts/create-account.ts person@example.com "Full Name" ["password"] [--admin] [--no-groups]');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`"${email}" does not look like an email address.`);

  const generated = !givenPassword;
  const password = givenPassword ?? crypto.randomBytes(9).toString("base64url"); // 12 readable characters
  if (password.length < 8) throw new Error("Use a password with at least 8 characters.");

  const passwordHash = await bcrypt.hash(password, 12);
  const makeAdmin = flags.includes("--admin");

  const existing = await prisma.user.findUnique({ where: { email } });
  const user = existing
    ? await prisma.user.update({
        where: { id: existing.id },
        data: { passwordHash, emailVerified: existing.emailVerified ?? new Date(), ...(makeAdmin ? { isAdmin: true } : {}) },
      })
    : await prisma.user.create({
        data: {
          email,
          name: name.trim(),
          passwordHash,
          role: "STUDENT",
          isAdmin: makeAdmin,
          emailVerified: new Date(),
          major: "School leader (test account)",
        },
      });

  let joined = 0;
  if (!flags.includes("--no-groups")) {
    const groups = await prisma.group.findMany({ where: { kind: "GROUP" }, select: { id: true, conversation: { select: { id: true } } } });
    for (const g of groups) {
      await prisma.membership.upsert({
        where: { userId_groupId: { userId: user.id, groupId: g.id } },
        update: {},
        create: { userId: user.id, groupId: g.id },
      });
      if (g.conversation) {
        await prisma.conversationMember.upsert({
          where: { conversationId_userId: { conversationId: g.conversation.id, userId: user.id } },
          update: {},
          create: { conversationId: g.conversation.id, userId: user.id },
        });
      }
      joined += 1;
    }
  }

  console.log(existing ? `Updated the account for ${user.name} (${email}).` : `Created an account for ${user.name} (${email}).`);
  console.log(`Password: ${password}${generated ? "  (made up for you, shown only now)" : ""}`);
  console.log(`Email confirmed. ${makeAdmin ? "Admin access on. " : ""}${joined ? `Joined ${joined} starter groups.` : ""}`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());