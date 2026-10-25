"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { getOrCreateDm } from "@/lib/chat";
import { provoLocalToDate } from "@/lib/format";
import { INDUSTRIES, OPEN_TO } from "@/lib/constants";

const refresh = () => revalidatePath("/", "layout");
const text = (v: FormDataEntryValue | null) => String(v ?? "").trim();

async function isMember(userId: string, groupId: string) {
  const m = await prisma.membership.findUnique({ where: { userId_groupId: { userId, groupId } } });
  return Boolean(m);
}

/* ---------- posts ---------- */

export async function createPost(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = z
    .object({ groupId: z.string().min(1), body: z.string().trim().min(1).max(2000) })
    .safeParse({ groupId: formData.get("groupId"), body: formData.get("body") });
  if (!parsed.success) return;
  if (!(await isMember(user.id, parsed.data.groupId))) return;
  await prisma.post.create({
    data: { body: parsed.data.body, authorId: user.id, groupId: parsed.data.groupId },
  });
  refresh();
}

export async function deletePost(postId: string): Promise<void> {
  const user = await requireUser();
  await prisma.post.deleteMany({ where: { id: postId, authorId: user.id } });
  refresh();
}

export async function toggleLike(postId: string): Promise<void> {
  const user = await requireUser();
  const post = await prisma.post.findFirst({
    where: { id: postId, group: { memberships: { some: { userId: user.id } } } },
    select: { id: true },
  });
  if (!post) return;
  const key = { userId_postId: { userId: user.id, postId } };
  const existing = await prisma.like.findUnique({ where: key });
  if (existing) await prisma.like.delete({ where: key });
  else await prisma.like.create({ data: { userId: user.id, postId } });
  refresh();
}

export async function addComment(postId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const body = text(formData.get("body"));
  if (!body || body.length > 1000) return;
  const post = await prisma.post.findFirst({
    where: { id: postId, group: { memberships: { some: { userId: user.id } } } },
    select: { id: true },
  });
  if (!post) return;
  await prisma.comment.create({ data: { body, postId, authorId: user.id } });
  refresh();
}

/* ---------- groups and course circles ---------- */

export async function joinGroup(groupId: string): Promise<void> {
  const user = await requireUser();
  const group = await prisma.group.findUnique({ where: { id: groupId }, include: { conversation: true } });
  if (!group) return;
  await prisma.membership.upsert({
    where: { userId_groupId: { userId: user.id, groupId } },
    update: {},
    create: { userId: user.id, groupId },
  });
  if (group.conversation) {
    await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId: group.conversation.id, userId: user.id } },
      update: {},
      create: { conversationId: group.conversation.id, userId: user.id },
    });
  }
  refresh();
}

export async function leaveGroup(groupId: string): Promise<void> {
  const user = await requireUser();
  await prisma.membership.deleteMany({ where: { userId: user.id, groupId } });
  await prisma.conversationMember.deleteMany({
    where: { userId: user.id, conversation: { groupId } },
  });
  refresh();
}

export async function createGroup(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = z
    .object({
      name: z.string().trim().min(3).max(60),
      description: z.string().trim().min(5).max(300),
    })
    .safeParse({ name: formData.get("name"), description: formData.get("description") });
  if (!parsed.success) return;

  const { name, description } = parsed.data;
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) +
    "-" +
    Math.random().toString(36).slice(2, 7);

  const group = await prisma.group.create({
    data: {
      name,
      description,
      slug,
      kind: "GROUP",
      memberships: { create: { userId: user.id, isAdmin: true } },
      conversation: { create: { isGroup: true, name, members: { create: { userId: user.id } } } },
    },
  });
  refresh();
  redirect(`/groups/${group.id}`);
}

/* ---------- events ---------- */

export async function toggleRsvp(eventId: string): Promise<void> {
  const user = await requireUser();
  const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
  if (!event) return;
  const key = { userId_eventId: { userId: user.id, eventId } };
  const existing = await prisma.rsvp.findUnique({ where: key });
  if (existing) await prisma.rsvp.delete({ where: key });
  else await prisma.rsvp.create({ data: { userId: user.id, eventId } });
  refresh();
}

export async function createEvent(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = z
    .object({
      groupId: z.string().min(1),
      title: z.string().trim().min(2).max(100),
      location: z.string().trim().min(2).max(120),
      description: z.string().trim().max(500).optional(),
    })
    .safeParse({
      groupId: formData.get("groupId"),
      title: formData.get("title"),
      location: formData.get("location"),
      description: text(formData.get("description")) || undefined,
    });
  const startsAt = provoLocalToDate(text(formData.get("startsAt")));
  if (!parsed.success || !startsAt) return;
  if (!(await isMember(user.id, parsed.data.groupId))) return;

  const event = await prisma.event.create({
    data: { ...parsed.data, startsAt, createdById: user.id },
  });
  await prisma.rsvp.create({ data: { userId: user.id, eventId: event.id } });
  refresh();
}

/* ---------- alumni ---------- */

export async function requestIntro(toId: string, formData: FormData): Promise<void> {
  const user = await requireUser();
  const note = text(formData.get("note"));
  if (user.role !== "STUDENT" || note.length < 10 || note.length > 600 || toId === user.id) return;
  const target = await prisma.alumniProfile.findFirst({ where: { userId: toId, approved: true } });
  if (!target) return;
  await prisma.introRequest.upsert({
    where: { fromId_toId: { fromId: user.id, toId } },
    update: {},
    create: { fromId: user.id, toId, note },
  });
  refresh();
}

export async function respondIntro(requestId: string, accept: boolean): Promise<void> {
  const user = await requireUser();
  const req = await prisma.introRequest.findFirst({
    where: { id: requestId, toId: user.id, status: "PENDING" },
  });
  if (!req) return;
  await prisma.introRequest.update({
    where: { id: requestId },
    data: { status: accept ? "ACCEPTED" : "DECLINED" },
  });
  if (accept) {
    const convo = await getOrCreateDm(req.fromId, req.toId);
    await prisma.message.create({
      data: { conversationId: convo.id, senderId: req.fromId, body: req.note },
    });
  }
  refresh();
}

export async function approveAlumni(userId: string, approve: boolean): Promise<void> {
  const admin = await requireUser();
  if (!admin.isAdmin) return;
  if (approve) await prisma.alumniProfile.updateMany({ where: { userId }, data: { approved: true } });
  else await prisma.alumniProfile.deleteMany({ where: { userId } });
  refresh();
}

/* ---------- chat and profile ---------- */

export async function startDm(otherId: string): Promise<void> {
  const user = await requireUser();
  if (otherId === user.id) return;
  const other = await prisma.user.findFirst({
    where: {
      id: otherId,
      emailVerified: { not: null },
      OR: [{ role: "STUDENT" }, { alumni: { approved: true } }],
    },
    select: { id: true, role: true },
  });
  if (!other) return;

  // A student and an alumnus can only chat after the alumnus accepted an introduction.
  if (user.role !== other.role) {
    const [studentId, alumnusId] = user.role === "STUDENT" ? [user.id, other.id] : [other.id, user.id];
    const accepted = await prisma.introRequest.findFirst({
      where: { fromId: studentId, toId: alumnusId, status: "ACCEPTED" },
      select: { id: true },
    });
    if (!accepted) return;
  }
  if (user.role === "ALUMNI" && other.role === "ALUMNI") return;

  const convo = await getOrCreateDm(user.id, other.id);
  redirect(`/chat/${convo.id}`);
}

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  major: z.string().trim().max(80).optional(),
  hometown: z.string().trim().max(80).optional(),
  mission: z.string().trim().max(80).optional(),
  bio: z.string().trim().max(500).optional(),
});

const alumniSchema = z.object({
  jobTitle: z.string().trim().min(2).max(100),
  location: z.string().trim().min(2).max(100),
  industry: z.enum(INDUSTRIES),
  openTo: z.array(z.enum(OPEN_TO)).min(1),
  bio: z.string().trim().min(10).max(400),
});

export async function updateProfile(formData: FormData): Promise<void> {
  const user = await requireUser({ allowPendingAlumni: true });
  const base = profileSchema.safeParse({
    name: formData.get("name"),
    major: text(formData.get("major")) || undefined,
    hometown: text(formData.get("hometown")) || undefined,
    mission: text(formData.get("mission")) || undefined,
    bio: text(formData.get("bio")) || undefined,
  });
  if (!base.success) return;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: base.data.name,
      major: base.data.major ?? null,
      hometown: base.data.hometown ?? null,
      mission: base.data.mission ?? null,
      bio: base.data.bio ?? null,
    },
  });

  if (user.role === "ALUMNI") {
    const alumni = alumniSchema.safeParse({
      jobTitle: formData.get("jobTitle"),
      location: formData.get("location"),
      industry: formData.get("industry"),
      openTo: formData.getAll("openTo"),
      bio: formData.get("alumniBio"),
    });
    if (alumni.success) {
      await prisma.alumniProfile.upsert({
        where: { userId: user.id },
        update: alumni.data,
        create: { ...alumni.data, userId: user.id },
      });
    }
  }
  refresh();
  redirect("/settings?saved=1");
}
