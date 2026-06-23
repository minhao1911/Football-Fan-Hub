import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, fanGroupsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/users/me", async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  let groupName: string | null = null;
  if (user.groupId) {
    const [group] = await db.select().from(fanGroupsTable).where(eq(fanGroupsTable.id, user.groupId));
    groupName = group?.name ?? null;
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId ?? "",
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    favoriteTeam: user.favoriteTeam,
    xp: user.xp,
    isAdmin: user.isAdmin,
    groupId: user.groupId,
    groupName,
    createdAt: user.createdAt.toISOString(),
  });
});

router.patch("/users/me", async (req, res) => {
  const { username, bio, favoriteTeam, avatarUrl } = req.body as {
    username?: string;
    bio?: string;
    favoriteTeam?: string;
    avatarUrl?: string;
  };

  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (username !== undefined) updates.username = username;
  if (bio !== undefined) updates.bio = bio;
  if (favoriteTeam !== undefined) updates.favoriteTeam = favoriteTeam;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.userId)).returning();

  let groupName: string | null = null;
  if (user.groupId) {
    const [group] = await db.select().from(fanGroupsTable).where(eq(fanGroupsTable.id, user.groupId));
    groupName = group?.name ?? null;
  }

  res.json({
    id: user.id,
    clerkId: user.clerkId ?? "",
    username: user.username,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    favoriteTeam: user.favoriteTeam,
    xp: user.xp,
    isAdmin: user.isAdmin,
    groupId: user.groupId,
    groupName,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
