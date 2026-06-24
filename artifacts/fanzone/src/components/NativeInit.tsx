import { useEffect } from "react";
import { useLocation } from "wouter";
import { initCapacitor, hideSplashScreen, isNative } from "@/lib/capacitor";
import { initPushNotifications } from "@/lib/pushNotifications";
import { initDeepLinking, onDeepLink } from "@/lib/deepLinking";

export function NativeInit() {
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isNative) return;

    let cancelled = false;

    async function boot() {
      await initCapacitor();
      await initPushNotifications().catch(() => {});
      initDeepLinking();

      const removeDeepLink = onDeepLink((path) => {
        if (!cancelled) navigate(path);
      });

      await hideSplashScreen();

      return removeDeepLink;
    }

    const cleanupPromise = boot();

    return () => {
      cancelled = true;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [navigate]);

  return null;
}
