import { PushNotifications } from "@capacitor/push-notifications";
import { isNative } from "./capacitor";

export type PushToken = {
  value: string;
  platform: "android" | "ios";
};

type NotificationHandler = (notification: {
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}) => void;

type TokenHandler = (token: PushToken) => void;

let tokenHandlers: TokenHandler[] = [];
let notificationHandlers: NotificationHandler[] = [];

export function onPushToken(cb: TokenHandler) {
  tokenHandlers.push(cb);
  return () => {
    tokenHandlers = tokenHandlers.filter((h) => h !== cb);
  };
}

export function onPushNotification(cb: NotificationHandler) {
  notificationHandlers.push(cb);
  return () => {
    notificationHandlers = notificationHandlers.filter((h) => h !== cb);
  };
}

export async function initPushNotifications(): Promise<boolean> {
  if (!isNative) return false;

  let permission = await PushNotifications.checkPermissions();

  if (permission.receive === "prompt") {
    permission = await PushNotifications.requestPermissions();
  }

  if (permission.receive !== "granted") {
    return false;
  }

  await PushNotifications.register();

  PushNotifications.addListener("registration", (token) => {
    const platform = /android/i.test(navigator.userAgent) ? "android" : "ios";
    tokenHandlers.forEach((h) => h({ value: token.value, platform }));
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("Push registration error:", err);
  });

  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    notificationHandlers.forEach((h) =>
      h({
        title: notification.title,
        body: notification.body,
        data: notification.data as Record<string, unknown>,
      }),
    );
  });

  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action) => {
      const data = action.notification.data as Record<string, unknown>;
      if (data?.route && typeof data.route === "string") {
        window.location.hash = data.route;
      }
    },
  );

  return true;
}

export async function getPendingNotifications() {
  if (!isNative) return [];
  const result = await PushNotifications.getDeliveredNotifications();
  return result.notifications;
}

export async function clearAllNotifications() {
  if (!isNative) return;
  await PushNotifications.removeAllDeliveredNotifications();
}
