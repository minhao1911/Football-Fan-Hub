import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const matchStatusEnum = pgEnum("match_status", ["upcoming", "live", "settled"]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  clerkId: text("clerk_id"),
  username: text("username").notNull(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  favoriteTeam: text("favorite_team"),
  xp: integer("xp").notNull().default(0),
  isAdmin: boolean("is_admin").notNull().default(false),
  groupId: integer("group_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const fanGroupsTable = pgTable("fan_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  badgeColor: text("badge_color"),
  badgeEmoji: text("badge_emoji"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const matchesTable = pgTable("matches", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  liveUrl: text("live_url").notNull(),
  homeTeam: text("home_team").notNull(),
  awayTeam: text("away_team").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  status: matchStatusEnum("status").notNull().default("upcoming"),
  homeScore: integer("home_score"),
  awayScore: integer("away_score"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumPostsTable = pgTable("forum_posts", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const forumRepliesTable = pgTable("forum_replies", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pokesTable = pgTable("pokes", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  fromUserId: integer("from_user_id").notNull(),
  toUserId: integer("to_user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const predictionsTable = pgTable("predictions", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  userId: integer("user_id").notNull(),
  homeScore: integer("home_score").notNull(),
  awayScore: integer("away_score").notNull(),
  isCorrect: boolean("is_correct"),
  xpAwarded: integer("xp_awarded"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedPostsTable = pgTable("feed_posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedLikesTable = pgTable("feed_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const notificationTypeEnum = pgEnum("notification_type", ["poke", "forum_reply", "match_live"]);

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  matchId: integer("match_id"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export const insertGroupSchema = createInsertSchema(fanGroupsTable).omit({ id: true, createdAt: true });
export const insertMatchSchema = createInsertSchema(matchesTable).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessagesTable).omit({ id: true, createdAt: true });
export const insertForumPostSchema = createInsertSchema(forumPostsTable).omit({ id: true, createdAt: true });
export const insertForumReplySchema = createInsertSchema(forumRepliesTable).omit({ id: true, createdAt: true });
export const insertPokeSchema = createInsertSchema(pokesTable).omit({ id: true, createdAt: true });
export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true, createdAt: true });

export type User = typeof usersTable.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type FanGroup = typeof fanGroupsTable.$inferSelect;
export type Match = typeof matchesTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
export type ForumPost = typeof forumPostsTable.$inferSelect;
export type ForumReply = typeof forumRepliesTable.$inferSelect;
export type Poke = typeof pokesTable.$inferSelect;
export type Prediction = typeof predictionsTable.$inferSelect;
