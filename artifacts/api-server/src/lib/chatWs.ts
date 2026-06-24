import { WebSocketServer, WebSocket } from "ws";
import type { IncomingMessage } from "http";
import type { Server } from "http";
import { db } from "@workspace/db";
import { usersTable, chatMessagesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { createClerkClient } from "@clerk/express";
import { logger } from "./logger.js";

interface AuthedSocket extends WebSocket {
  userId?: number;
  username?: string;
  matchId?: number;
  isAlive?: boolean;
}

interface ChatMessage {
  type: "chat";
  id: number;
  matchId: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  content: string;
  createdAt: string;
}

interface ServerMessage {
  type: "connected" | "error" | "ping";
  message?: string;
}

const rooms = new Map<number, Set<AuthedSocket>>();

function getRoomBroadcast(matchId: number): (msg: ChatMessage) => void {
  return (msg) => {
    const room = rooms.get(matchId);
    if (!room) return;
    const payload = JSON.stringify(msg);
    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  };
}

export function broadcastToMatch(matchId: number, msg: ChatMessage) {
  getRoomBroadcast(matchId)(msg);
}

export function createChatWss(server: Server) {
  const clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  });

  const wss = new WebSocketServer({ server, path: "/api/ws/chat" });

  const heartbeat = setInterval(() => {
    wss.clients.forEach((ws) => {
      const s = ws as AuthedSocket;
      if (s.isAlive === false) { s.terminate(); return; }
      s.isAlive = false;
      s.ping();
    });
  }, 30_000);

  wss.on("close", () => clearInterval(heartbeat));

  wss.on("connection", (ws: AuthedSocket, req: IncomingMessage) => {
    ws.isAlive = true;
    ws.on("pong", () => { ws.isAlive = true; });

    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const matchId = parseInt(url.searchParams.get("matchId") ?? "");

    if (!matchId || isNaN(matchId)) {
      ws.send(JSON.stringify({ type: "error", message: "Missing matchId" } satisfies ServerMessage));
      ws.close();
      return;
    }

    ws.matchId = matchId;

    ws.on("message", async (raw) => {
      let msg: { type: string; token?: string; content?: string };
      try { msg = JSON.parse(raw.toString()); } catch { return; }

      if (msg.type === "auth") {
        if (!msg.token) {
          ws.send(JSON.stringify({ type: "error", message: "No token" } satisfies ServerMessage));
          return;
        }
        try {
          const payload = await clerk.verifyToken(msg.token);
          const clerkId = payload.sub;

          const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
          if (!existing) {
            ws.send(JSON.stringify({ type: "error", message: "User not found" } satisfies ServerMessage));
            return;
          }

          ws.userId = existing.id;
          ws.username = existing.username;

          if (!rooms.has(matchId)) rooms.set(matchId, new Set());
          rooms.get(matchId)!.add(ws);

          ws.send(JSON.stringify({ type: "connected", message: "Authenticated" } satisfies ServerMessage));
          logger.info({ userId: existing.id, matchId }, "WS chat connected");
        } catch (err) {
          ws.send(JSON.stringify({ type: "error", message: "Auth failed" } satisfies ServerMessage));
          logger.warn({ err }, "WS auth failed");
        }
        return;
      }

      if (msg.type === "message") {
        if (!ws.userId || !ws.matchId) {
          ws.send(JSON.stringify({ type: "error", message: "Not authenticated" } satisfies ServerMessage));
          return;
        }
        const content = (msg.content ?? "").trim().slice(0, 500);
        if (!content) return;

        const [inserted] = await db
          .insert(chatMessagesTable)
          .values({ matchId: ws.matchId, userId: ws.userId, content })
          .returning();

        const chatMsg: ChatMessage = {
          type: "chat",
          id: inserted.id,
          matchId: inserted.matchId,
          userId: inserted.userId,
          username: ws.username!,
          avatarUrl: null,
          content: inserted.content,
          createdAt: inserted.createdAt.toISOString(),
        };

        broadcastToMatch(ws.matchId, chatMsg);
      }
    });

    ws.on("close", () => {
      if (ws.matchId) rooms.get(ws.matchId)?.delete(ws);
    });

    ws.on("error", (err) => logger.warn({ err }, "WS client error"));
  });

  logger.info("Chat WebSocket server attached at /api/ws/chat");
  return wss;
}
