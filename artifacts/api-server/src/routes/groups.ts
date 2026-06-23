import { Router } from "express";
import { db } from "@workspace/db";
import { fanGroupsTable, usersTable } from "@workspace/db";
import { eq, ilike, count, sum, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

async function formatGroup(group: typeof fanGroupsTable.$inferSelect, currentUserId: number) {
  const [{ memberCount }] = await db
    .select({ memberCount: count() })
    .from(usersTable)
    .where(eq(usersTable.groupId, group.id));

  const [{ totalXp }] = await db
    .select({ totalXp: sql<number>`coalesce(sum(${usersTable.xp}), 0)` })
    .from(usersTable)
    .where(eq(usersTable.groupId, group.id));

  const [me] = await db.select({ groupId: usersTable.groupId }).from(usersTable).where(eq(usersTable.id, currentUserId));

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    badgeColor: group.badgeColor,
    badgeEmoji: group.badgeEmoji,
    memberCount: Number(memberCount),
    totalXp: Number(totalXp),
    isMember: me?.groupId === group.id,
    createdAt: group.createdAt.toISOString(),
  };
}

router.get("/groups", async (req, res) => {
  const search = req.query.search as string | undefined;

  let groups: (typeof fanGroupsTable.$inferSelect)[];
  if (search) {
    groups = await db.select().from(fanGroupsTable).where(ilike(fanGroupsTable.name, `%${search}%`));
  } else {
    groups = await db.select().from(fanGroupsTable);
  }

  const result = await Promise.all(groups.map((g) => formatGroup(g, req.userId)));
  res.json(result);
});

router.post("/groups", async (req, res) => {
  const { name, description, badgeColor, badgeEmoji } = req.body as {
    name: string;
    description: string;
    badgeColor?: string;
    badgeEmoji?: string;
  };

  const [group] = await db.insert(fanGroupsTable).values({ name, description, badgeColor, badgeEmoji }).returning();
  const formatted = await formatGroup(group, req.userId);
  res.status(201).json(formatted);
});

router.get("/groups/:groupId", async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const [group] = await db.select().from(fanGroupsTable).where(eq(fanGroupsTable.id, groupId));
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  res.json(await formatGroup(group, req.userId));
});

router.post("/groups/:groupId/join", async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const [group] = await db.select().from(fanGroupsTable).where(eq(fanGroupsTable.id, groupId));
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  await db.update(usersTable).set({ groupId }).where(eq(usersTable.id, req.userId));
  res.json(await formatGroup(group, req.userId));
});

router.post("/groups/:groupId/leave", async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const [group] = await db.select().from(fanGroupsTable).where(eq(fanGroupsTable.id, groupId));
  if (!group) {
    res.status(404).json({ error: "Group not found" });
    return;
  }
  await db.update(usersTable).set({ groupId: null }).where(eq(usersTable.id, req.userId));
  res.json(await formatGroup(group, req.userId));
});

router.get("/groups/:groupId/members", async (req, res) => {
  const groupId = parseInt(req.params.groupId);
  const members = await db.select().from(usersTable).where(eq(usersTable.groupId, groupId));

  res.json(
    members.map((m) => ({
      id: m.id,
      username: m.username,
      avatarUrl: m.avatarUrl,
      favoriteTeam: m.favoriteTeam,
      xp: m.xp,
      joinedAt: m.createdAt.toISOString(),
    })),
  );
});

export default router;
