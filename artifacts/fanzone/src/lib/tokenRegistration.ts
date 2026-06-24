import { isNative, platform } from "./capacitor";
import { onPushToken } from "./pushNotifications";

const API_BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    const p: "android" | "ios" | "web" = isNative
      ? (platform as "android" | "ios")
      : "web";

    const res = await fetch(`${API_BASE}/api/push-tokens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token, platform: p }),
    });

    if (!res.ok) {
      console.warn("[FanZone] Push token registration failed:", res.status);
    }
  } catch (err) {
    console.warn("[FanZone] Push token registration error:", err);
  }
}

export async function unregisterToken(token: string): Promise<void> {
  try {
    await fetch(`${API_BASE}/api/push-tokens`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token }),
    });
  } catch {
  }
}

export function setupTokenRegistration(): () => void {
  return onPushToken((t) => {
    registerTokenWithBackend(t.value);
  });
}
