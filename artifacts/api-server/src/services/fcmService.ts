import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";
import { logger } from "../lib/logger.js";

let firebaseApp: App | null = null;

function getFirebaseApp(): App | null {
  if (firebaseApp) return firebaseApp;
  if (getApps().length > 0) {
    firebaseApp = getApps()[0];
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    logger.warn(
      "Firebase credentials not configured — push notifications disabled. " +
        "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
    );
    return null;
  }

  try {
    firebaseApp = initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
    logger.info({ projectId }, "Firebase Admin SDK initialized");
    return firebaseApp;
  } catch (err) {
    logger.error({ err }, "Failed to initialize Firebase Admin SDK");
    return null;
  }
}

export type PushPayload = {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
};

export type SendResult = {
  successCount: number;
  failureCount: number;
  failedTokens: string[];
};

export async function sendPushToTokens(
  tokens: string[],
  payload: PushPayload,
): Promise<SendResult> {
  const empty: SendResult = { successCount: 0, failureCount: 0, failedTokens: [] };
  if (tokens.length === 0) return empty;

  const app = getFirebaseApp();
  if (!app) return empty;

  const messaging = getMessaging(app);
  const failedTokens: string[] = [];
  let successCount = 0;
  let failureCount = 0;

  const BATCH_SIZE = 500;
  for (let i = 0; i < tokens.length; i += BATCH_SIZE) {
    const batch = tokens.slice(i, i + BATCH_SIZE);
    const message: MulticastMessage = {
      tokens: batch,
      notification: {
        title: payload.title,
        body: payload.body,
        ...(payload.imageUrl ? { imageUrl: payload.imageUrl } : {}),
      },
      data: payload.data ?? {},
      android: {
        priority: "high",
        notification: {
          channelId: "fanzone_notifications",
          color: "#16a34a",
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
          },
        },
        headers: {
          "apns-priority": "10",
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      successCount += response.successCount;
      failureCount += response.failureCount;

      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code ?? "";
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            failedTokens.push(batch[idx]);
          }
        }
      });
    } catch (err) {
      logger.error({ err, batchSize: batch.length }, "FCM multicast send failed");
      failureCount += batch.length;
    }
  }

  logger.info(
    { successCount, failureCount, failedTokens: failedTokens.length },
    "FCM batch send complete",
  );

  return { successCount, failureCount, failedTokens };
}

export async function sendMatchLiveAlert(
  tokens: string[],
  matchId: number,
  homeTeam: string,
  awayTeam: string,
  aiBody?: string,
): Promise<SendResult> {
  return sendPushToTokens(tokens, {
    title: "⚽ Match is LIVE!",
    body: aiBody ?? `${homeTeam} vs ${awayTeam} has kicked off — join the chat!`,
    data: {
      type: "match_live",
      matchId: String(matchId),
      route: `/matches/${matchId}`,
    },
  });
}

export async function sendPredictionWonAlert(
  tokens: string[],
  matchId: number,
  homeTeam: string,
  awayTeam: string,
  xpAwarded: number,
): Promise<SendResult> {
  return sendPushToTokens(tokens, {
    title: "🎯 Prediction Correct!",
    body: `You nailed the ${homeTeam} vs ${awayTeam} result — +${xpAwarded} XP!`,
    data: {
      type: "prediction_won",
      matchId: String(matchId),
      route: `/matches/${matchId}`,
    },
  });
}
