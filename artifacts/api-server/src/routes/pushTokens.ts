import { Router } from "express";
import { db } from "@workspace/db";
import { pushTokensTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth.js";
import { logger } from "../lib/logger.js";

const router = Router();
router.use(authMiddleware);

router.post("/push-tokens", async (req, res) => {
  const userId = (req as any).userId as number;
  const { token, platform } = req.body as {
    token?: string;
    platform?: "android" | "ios" | "web";
  };

  if (!token || !platform) {
    res.status(400).json({ error: "token and platform are required" });
    return;
  }

  if (!["android", "ios", "web"].includes(platform)) {
    res.status(400).json({ error: "platform must be android, ios, or web" });
    return;
  }

  try {
    await db
      .insert(pushTokensTable)
      .values({ userId, token, platform })
      .onConflictDoUpdate({
        target: pushTokensTable.token,
        set: { userId, updatedAt: new Date() },
      });

    logger.info({ userId, platform }, "Push token registered");
    res.status(201).json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to register push token");
    res.status(500).json({ error: "Failed to register token" });
  }
});

router.delete("/push-tokens", async (req, res) => {
  const userId = (req as any).userId as number;
  const { token } = req.body as { token?: string };

  if (!token) {
    res.status(400).json({ error: "token is required" });
    return;
  }

  try {
    await db
      .delete(pushTokensTable)
      .where(and(eq(pushTokensTable.token, token), eq(pushTokensTable.userId, userId)));

    logger.info({ userId }, "Push token removed");
    res.json({ ok: true });
  } catch (err) {
    logger.error({ err }, "Failed to remove push token");
    res.status(500).json({ error: "Failed to remove token" });
  }
});

export default router;
