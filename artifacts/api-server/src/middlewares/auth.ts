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
  const authHeader = req.headers.authorization;
  let userId = 1;

  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    const parsed = parseInt(token, 10);
    if (!isNaN(parsed) && parsed > 0) {
      userId = parsed;
    }
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    const [created] = await db.insert(usersTable).values({
      username: `fan_${userId}`,
      xp: 0,
      isAdmin: false,
    }).returning();
    req.userId = created.id;
    req.isAdmin = created.isAdmin;
  } else {
    req.userId = user.id;
    req.isAdmin = user.isAdmin;
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
