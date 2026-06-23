import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, fanGroupsTable, matchesTable, predictionsTable } from "@workspace/db";
import { eq, count, sum, sql } from "drizzle-orm";
import { authMiddleware } from "../middlewares/auth";

const router = Router();

router.use(authMiddleware);

router.get("/admin/stats", async (req, res) => {
  const [{ totalUsers }] = await db.select({ totalUsers: count() }).from(usersTable);
  const [{ totalGroups }] = await db.select({ totalGroups: count() }).from(fanGroupsTable);
  const [{ totalMatches }] = await db.select({ totalMatches: count() }).from(matchesTable);
  const [{ liveMatches }] = await db
    .select({ liveMatches: count() })
    .from(matchesTable)
    .where(eq(matchesTable.status, "live"));
  const [{ totalPredictions }] = await db.select({ totalPredictions: count() }).from(predictionsTable);
  const [{ totalXpAwarded }] = await db
    .select({ totalXpAwarded: sql<number>`coalesce(sum(${predictionsTable.xpAwarded}), 0)` })
    .from(predictionsTable);

  res.json({
    totalUsers: Number(totalUsers),
    totalGroups: Number(totalGroups),
    totalMatches: Number(totalMatches),
    liveMatches: Number(liveMatches),
    totalPredictions: Number(totalPredictions),
    totalXpAwarded: Number(totalXpAwarded),
  });
});

export default router;
