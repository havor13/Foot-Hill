/**
 * Sets a new password for an existing account.
 *
 *   npx tsx scripts/reset-password.ts you@byu.edu "new password here"
 *   npx tsx scripts/reset-password.ts you@byu.edu "new password here" --verify
 *
 * --verify also marks the email as confirmed, so you can skip the 6-digit code.
 * Run this only against a database you own. It changes the account directly.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const [rawEmail, password, flag] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase();
  if (!email || !password) {
    throw new Error('Usage: npx tsx scripts/reset-password.ts you@byu.edu "new password" [--verify]');
  }
  if (password.length < 8) throw new Error("Use a password with at least 8 characters.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No account with email ${email}. Check the spelling in Prisma Studio.`);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await bcrypt.hash(password, 12),
      ...(flag === "--verify" && !user.emailVerified ? { emailVerified: new Date() } : {}),
    },
  });

  console.log(`Password updated for ${user.name} (${email}).`);
  if (flag === "--verify") console.log("Email marked as verified.");
  else if (!user.emailVerified) console.log("This account is not verified yet. Sign in, then use the 6-digit code, or rerun with --verify.");
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());