import { Router } from "express";
import { db } from "@workspace/db";
import { fanGroupsTable, usersTable } from "@workspace/db";
import { eq, sql, desc } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/leaderboard/groups", async (req, res) => {
  const groups = await db.select().from(fanGroupsTable);

  const withStats = await Promise.all(
    groups.map(async (group) => {
      const [{ memberCount }] = await db
        .select({ memberCount: sql<number>`count(*)` })
        .from(usersTable)
        .where(eq(usersTable.groupId, group.id));

      const [{ totalXp }] = await db
        .select({ totalXp: sql<number>`coalesce(sum(${usersTable.xp}), 0)` })
        .from(usersTable)
        .where(eq(usersTable.groupId, group.id));

      return {
        groupId: group.id,
        groupName: group.name,
        badgeColor: group.badgeColor,
        badgeEmoji: group.badgeEmoji,
        memberCount: Number(memberCount),
        totalXp: Number(totalXp),
      };
    }),
  );

  const sorted = withStats.sort((a, b) => b.totalXp - a.totalXp);
  res.json(sorted.map((g, i) => ({ rank: i + 1, ...g })));
});

router.get("/leaderboard/users", async (req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      avatarUrl: usersTable.avatarUrl,
      favoriteTeam: usersTable.favoriteTeam,
      xp: usersTable.xp,
      groupId: usersTable.groupId,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.xp))
    .limit(50);

  const result = await Promise.all(
    users.map(async (user, i) => {
      let groupName: string | null = null;
      if (user.groupId) {
        const [group] = await db.select().from(fanGroupsTable).where(eq(fanGroupsTable.id, user.groupId));
        groupName = group?.name ?? null;
      }
      return {
        rank: i + 1,
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        favoriteTeam: user.favoriteTeam,
        xp: user.xp,
        groupName,
      };
    }),
  );

  res.json(result);
});

export default router;
