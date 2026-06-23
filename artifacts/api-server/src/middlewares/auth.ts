import { getAuth } from "@clerk/express";
import type { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  namespace Express {
    interface Request {
      userId: number;
      isAdmin: boolean;
    }
  }
}

export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const auth = getAuth(req);
  const clerkUserId = auth?.userId;

  if (!clerkUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [existingUser] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkUserId))
    .limit(1);

  if (existingUser) {
    req.userId = existingUser.id;
    req.isAdmin = existingUser.isAdmin;
  } else {
    const [created] = await db
      .insert(usersTable)
      .values({
        clerkId: clerkUserId,
        username: `fan_${clerkUserId.slice(-8)}`,
        xp: 0,
        isAdmin: false,
      })
      .returning();
    req.userId = created.id;
    req.isAdmin = created.isAdmin;
  }

  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAdmin) {
    res.status(403).json({ error: "Admin only" });
    return;
  }
  next();
}
