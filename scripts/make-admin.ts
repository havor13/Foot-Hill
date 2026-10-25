/** Usage: npm run make-admin -- you@byu.edu   (the account must already exist and be verified) */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) throw new Error("Pass the account email, for example: npm run make-admin -- you@byu.edu");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No account with email ${email}. Sign up first, then run this again.`);
  await prisma.user.update({ where: { id: user.id }, data: { isAdmin: true } });
  console.log(`${user.name} (${email}) is now an admin. They can review alumni at /admin/alumni.`);
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
