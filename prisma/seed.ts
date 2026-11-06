/**
 * Seeds the starter groups and course circles. Safe to run more than once.
 *
 *   npm run db:seed                 starter groups and courses only (fine for production)
 *   SEED_DEMO=1 npm run db:seed     also adds invented demo students, alumni, posts and events
 *                                   (development only; the demo accounts share a known password)
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const GROUPS = [
  { slug: "y-mountain-hikers", name: "Y Mountain Hikers", description: "Sunrise hikes, trail tips and carpools up Rock Canyon and beyond." },
  { slug: "stats-study-hall", name: "Stats Study Hall", description: "Weekly problem sessions and midterm review for statistics courses." },
  { slug: "housing-and-roommates", name: "Housing and Roommates", description: "Find a contract, a roommate or a sublease near campus." },
  { slug: "returned-missionaries", name: "Returned Missionaries", description: "Meet people who served in your mission, language or area. Reunions and job leads." },
  { slug: "music-and-open-mic", name: "Music and Open Mic", description: "Jam nights, band swaps and practice room buddies." },
  { slug: "builders-and-founders", name: "Builders and Founders", description: "Side projects, startup ideas and weekend hack sessions." },
  { slug: "intramural-sports", name: "Intramural Sports", description: "Pick-up games, team sign-ups and league updates." },
  { slug: "new-student-welcome", name: "New Student Welcome", description: "First-semester questions, answered by students who just did it." },
];

// Administrative Assistant (BUS), Software Development (CSE, ITM) and Web Development (WDD). Add more here.
const COURSES = [
  { code: "BUS 105", title: "Spreadsheet Essentials", note: "Also listed as BUSPC105." },
  { code: "BUS 129", title: "Office Procedures", note: "" },
  { code: "BUS 180", title: "The Cycle of Cash", note: "" },
  { code: "BUS 240", title: "Word Processing I", note: "" },
  { code: "CSE 212", title: "Programming with Data Structures", note: "" },
  { code: "CSE 270", title: "Software Testing", note: "" },
  { code: "CSE 300", title: "Professional Readiness", note: "" },
  { code: "CSE 310", title: "Applied Programming", note: "" },
  { code: "CSE 325", title: ".NET Software Development", note: "" },
  { code: "CSE 370", title: "Software Engineering Principles", note: "" },
  { code: "ITM 111", title: "Introduction to Databases", note: "" },
  { code: "CSE 340", title: "Web Backend Development", note: "" },
  { code: "CSE 341", title: "Web Services", note: "" },
  { code: "WDD 330", title: "Web Frontend Development II", note: "" },
  { code: "WDD 430", title: "Web Full-Stack Development", note: "" },
];

// Example circles from the first version. Removed on seed only if nobody has posted in them.
const RETIRED_COURSE_SLUGS = ["bus-129", "bus-105", "math-112", "chem-105", "econ-110", "psych-111", "wrtg-150"];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function upsertGroup(data: {
  slug: string;
  name: string;
  description: string;
  kind: "GROUP" | "COURSE";
  courseCode?: string;
}) {
  const group = await prisma.group.upsert({
    where: { slug: data.slug },
    update: { name: data.name, description: data.description },
    create: data,
  });
  // Every group and course circle has a chat room that members are added to when they join.
  await prisma.conversation.upsert({
    where: { groupId: group.id },
    update: { name: group.name },
    create: { groupId: group.id, isGroup: true, name: group.name },
  });
  return group;
}

async function join(userId: string, groupId: string) {
  await prisma.membership.upsert({
    where: { userId_groupId: { userId, groupId } },
    update: {},
    create: { userId, groupId },
  });
  const convo = await prisma.conversation.findUnique({ where: { groupId } });
  if (convo) {
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId: convo.id, userId } },
      update: {},
      create: { conversationId: convo.id, userId },
    });
  }
}

async function seedStarter() {
  const groups = new Map<string, string>();
  for (const g of GROUPS) {
    const row = await upsertGroup({ ...g, kind: "GROUP" });
    groups.set(g.slug, row.id);
  }
  for (const c of COURSES) {
    const row = await upsertGroup({
      slug: slugify(c.code),
      name: c.title,
      description: `Questions, notes and study sessions for ${c.code}. ${c.note}`.trim(),
      kind: "COURSE",
      courseCode: c.code,
    });
    groups.set(slugify(c.code), row.id);
  }
  const removed = await prisma.group.deleteMany({
    where: { slug: { in: RETIRED_COURSE_SLUGS }, kind: "COURSE", posts: { none: {} } },
  });
  if (removed.count) console.log(`Removed ${removed.count} example course circles from the first version.`);
  console.log(`Seeded ${GROUPS.length} groups and ${COURSES.length} course circles.`);
  return groups;
}

/* ---------- demo data (invented people, development only) ---------- */

const DEMO_PASSWORD = "demo-password-1";
const DEMO_DOMAIN = "demo.foothill.test";

const STUDENTS = [
  { name: "Maya Torres", major: "Nursing", hometown: "Mesa, AZ", mission: null },
  { name: "Caleb Brooks", major: "Mechanical Engineering", hometown: "Boise, ID", mission: null },
  { name: "Daniel Kim", major: "Computer Science", hometown: "Irvine, CA", mission: "Korea Busan Mission" },
  { name: "Lucia Moreno", major: "Music Education", hometown: "Houston, TX", mission: "Peru Lima Mission" },
  { name: "Hannah Reed", major: "Business Management", hometown: "Lehi, UT", mission: null },
  { name: "Jordan Hale", major: "Film and Media", hometown: "Portland, OR", mission: "Ghana Accra Mission" },
  { name: "Priya Nair", major: "Public Health", hometown: "Edison, NJ", mission: null },
  { name: "Eli Warner", major: "Economics", hometown: "Denver, CO", mission: "Texas Dallas Mission" },
];

const ALUMNI = [
  { name: "Rachel Dalton", gradYear: 2019, major: "Computer Science", jobTitle: "Software Engineer", location: "Lehi, UT", industry: "Tech", openTo: ["Mentoring", "Resume review"], bio: "Started in a campus lab, now building software for small businesses. Happy to talk about your first job search." },
  { name: "Marcus Webb", gradYear: 2016, major: "Nursing", jobTitle: "Nurse Practitioner", location: "Salt Lake City, UT", industry: "Health", openTo: ["Mentoring", "Interview prep"], bio: "Went from bedside nursing to advanced practice. Ask me about grad school timing." },
  { name: "Elise Tanaka", gradYear: 2021, major: "Business Management", jobTitle: "Product Manager", location: "Seattle, WA", industry: "Tech", openTo: ["Coffee chat", "Referrals"], bio: "Switched from marketing to product in two years. I can walk you through how." },
  { name: "Grace Okafor", gradYear: 2018, major: "Music Education", jobTitle: "High School Choir Director", location: "Mesa, AZ", industry: "Education", openTo: ["Career advice", "Coffee chat"], bio: "Teaching in a public school and running a community choir on weekends." },
];

const emailFor = (name: string) => `${slugify(name).replace(/-/g, ".")}@${DEMO_DOMAIN}`;

async function seedDemo(groups: Map<string, string>) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const ids = new Map<string, string>();

  for (const s of STUDENTS) {
    const u = await prisma.user.upsert({
      where: { email: emailFor(s.name) },
      update: {},
      create: { ...s, email: emailFor(s.name), passwordHash, role: "STUDENT", emailVerified: new Date() },
    });
    ids.set(s.name, u.id);
  }
  for (const a of ALUMNI) {
    const { jobTitle, location, industry, openTo, bio, ...user } = a;
    const u = await prisma.user.upsert({
      where: { email: emailFor(a.name) },
      update: {},
      create: { ...user, email: emailFor(a.name), passwordHash, role: "ALUMNI", emailVerified: new Date() },
    });
    await prisma.alumniProfile.upsert({
      where: { userId: u.id },
      update: {},
      create: { userId: u.id, jobTitle, location, industry, openTo, bio, approved: true },
    });
    ids.set(a.name, u.id);
  }

  const memberships: Record<string, string[]> = {
    "y-mountain-hikers": ["Caleb Brooks", "Eli Warner", "Maya Torres"],
    "stats-study-hall": ["Maya Torres", "Priya Nair"],
    "bus-105": ["Maya Torres", "Priya Nair", "Hannah Reed"],
    "bus-129": ["Daniel Kim", "Eli Warner"],
    "returned-missionaries": ["Daniel Kim", "Lucia Moreno", "Jordan Hale", "Eli Warner"],
    "music-and-open-mic": ["Lucia Moreno", "Jordan Hale"],
    "housing-and-roommates": ["Hannah Reed"],
  };
  for (const [slug, names] of Object.entries(memberships)) {
    const gid = groups.get(slug);
    if (!gid) continue;
    for (const n of names) await join(ids.get(n)!, gid);
  }

  const alreadySeeded = (await prisma.post.count({ where: { author: { email: { endsWith: DEMO_DOMAIN } } } })) > 0;
  if (alreadySeeded) {
    console.log("Demo posts and events already exist. Skipping them.");
    return;
  }

  const posts: [string, string, string][] = [
    ["Maya Torres", "bus-105", "Study session for the BUS 105 spreadsheet project on Tuesday at 7 PM. I will share my formulas sheet. Bring questions about VLOOKUP."],
    ["Priya Nair", "bus-105", "What is the difference between VLOOKUP and XLOOKUP, and which one does the assignment want?"],
    ["Caleb Brooks", "y-mountain-hikers", "Sunrise hike to the Y this Saturday. Meet at the trailhead at 6:15 AM. Bring a headlamp and water."],
    ["Daniel Kim", "returned-missionaries", "Anyone else who served in the Korea Busan mission? Trying to organize a reunion dinner this month."],
    ["Lucia Moreno", "music-and-open-mic", "Looking for a bassist and a drummer for Thursday open mic. All levels welcome."],
  ];
  for (const [who, slug, body] of posts) {
    await prisma.post.create({ data: { authorId: ids.get(who)!, groupId: groups.get(slug)!, body } });
  }

  const hour = 3_600_000;
  const day = 24 * hour;
  const events: [string, string, string, string, number][] = [
    ["Maya Torres", "bus-105", "BUS 105 spreadsheet study session", "Online, link in the circle chat", 3 * day + 4 * hour],
    ["Caleb Brooks", "y-mountain-hikers", "Sunrise hike to the Y", "Rock Canyon trailhead", 6 * day],
    ["Lucia Moreno", "music-and-open-mic", "Open mic night", "Wilkinson Center lounge", 5 * day],
  ];
  for (const [who, slug, title, location, offset] of events) {
    const e = await prisma.event.create({
      data: { title, location, startsAt: new Date(Date.now() + offset), groupId: groups.get(slug)!, createdById: ids.get(who)! },
    });
    await prisma.rsvp.create({ data: { userId: ids.get(who)!, eventId: e.id } });
  }
  console.log(`Demo data added. Sign in as ${emailFor("Maya Torres")} with password "${DEMO_PASSWORD}".`);
}

async function main() {
  const groups = await seedStarter();
  if (process.env.SEED_DEMO === "1") {
    if (process.env.NODE_ENV === "production") throw new Error("Refusing to add demo accounts in production.");
    await seedDemo(groups);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());