import { generateText, SYSTEM_BASE } from "./aiProvider.js";

export async function generateXpCommentary(
  username: string,
  xpEarned: number,
  reason: string,
): Promise<string> {
  const prompt = `Generate a short, exciting XP achievement message for a football fan app.
User: ${username}
XP Earned: ${xpEarned}
Reason: ${reason}
Note: Do NOT mention calculating or adjusting XP — just celebrate the achievement.

Write 1-2 punchy sentences. Be enthusiastic.`;

  return generateText(SYSTEM_BASE, prompt, 80);
}

export async function generateBadgeAnnouncement(
  username: string,
  badgeName: string,
): Promise<string> {
  const prompt = `Generate a short achievement announcement for a football fan app.
Player: ${username}
Achievement unlocked: "${badgeName}"

Write 1-2 exciting sentences celebrating this milestone. Make it feel special.`;

  return generateText(SYSTEM_BASE, prompt, 80);
}

export async function generateMatchLiveNotification(
  homeTeam: string,
  awayTeam: string,
): Promise<string> {
  const prompt = `Write a short push notification (max 15 words) to alert football fans that a match is starting now.
Match: ${homeTeam} vs ${awayTeam}
Make it urgent and exciting.`;

  return generateText(SYSTEM_BASE, prompt, 40);
}

export async function generateStreamLiveNotification(
  username: string,
  streamTitle: string,
): Promise<string> {
  const prompt = `Write a short push notification (max 15 words) to alert fans that a community member just went live.
Streamer: ${username}
Stream title: ${streamTitle}
Make it inviting and exciting.`;

  return generateText(SYSTEM_BASE, prompt, 40);
}
