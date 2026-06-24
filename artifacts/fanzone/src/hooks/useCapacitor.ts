import { useEffect, useState, useCallback } from "react";
import {
  isNative,
  isAndroid,
  isIOS,
  platform,
  getNetworkStatus,
  onNetworkChange,
  addAppStateListener,
  type NetworkStatus,
} from "@/lib/capacitor";
import { onDeepLink } from "@/lib/deepLinking";
import { onPushNotification, onPushToken } from "@/lib/pushNotifications";

export function usePlatform() {
  return { isNative, isAndroid, isIOS, isWeb: !isNative, platform };
}

export function useNetwork() {
  const [status, setStatus] = useState<NetworkStatus>({
    connected: true,
    connectionType: "wifi",
  });

  useEffect(() => {
    getNetworkStatus().then(setStatus);
    return onNetworkChange(setStatus);
  }, []);

  return status;
}

export function useAppState() {
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isNative) return;
    return addAppStateListener(setIsActive);
  }, []);

  return isActive;
}

export function useDeepLink(handler: (path: string, params: Record<string, string>) => void) {
  useEffect(() => {
    return onDeepLink(handler);
  }, [handler]);
}

export function usePushNotifications() {
  const [lastNotification, setLastNotification] = useState<{
    title?: string;
    body?: string;
    data?: Record<string, unknown>;
  } | null>(null);

  const [pushToken, setPushToken] = useState<string | null>(null);

  useEffect(() => {
    const removeNotif = onPushNotification((n) => setLastNotification(n));
    const removeToken = onPushToken((t) => setPushToken(t.value));
    return () => {
      removeNotif();
      removeToken();
    };
  }, []);

  return { lastNotification, pushToken };
}

export function useOfflineBanner() {
  const { connected } = useNetwork();
  return !connected;
}

export function useAndroidBackButton(handler: () => void) {
  useEffect(() => {
    if (!isAndroid) return;
    const App = (window as Window & typeof globalThis & { Capacitor?: unknown })?.Capacitor;
    if (!App) return;

    const onBack = (ev: Event) => {
      ev.preventDefault();
      handler();
    };

    document.addEventListener("backbutton", onBack);
    return () => document.removeEventListener("backbutton", onBack);
  }, [handler]);
}

export function useSafeAreaInsets() {
  const [insets, setInsets] = useState({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    if (!isNative) return;
    const update = () => {
      const style = getComputedStyle(document.documentElement);
      setInsets({
        top: parseInt(style.getPropertyValue("--sat") || "0", 10),
        bottom: parseInt(style.getPropertyValue("--sab") || "0", 10),
        left: parseInt(style.getPropertyValue("--sal") || "0", 10),
        right: parseInt(style.getPropertyValue("--sar") || "0", 10),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return insets;
}
