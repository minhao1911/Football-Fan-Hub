import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { Keyboard } from "@capacitor/keyboard";
import { App } from "@capacitor/app";
import { Network } from "@capacitor/network";
import { SplashScreen } from "@capacitor/splash-screen";

export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();
export const isAndroid = platform === "android";
export const isIOS = platform === "ios";
export const isWeb = platform === "web";

export type NetworkStatus = {
  connected: boolean;
  connectionType: string;
};

let networkListeners: Array<(status: NetworkStatus) => void> = [];

export function onNetworkChange(cb: (status: NetworkStatus) => void) {
  networkListeners.push(cb);
  return () => {
    networkListeners = networkListeners.filter((l) => l !== cb);
  };
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
  if (!isNative) {
    return { connected: navigator.onLine, connectionType: "wifi" };
  }
  const status = await Network.getStatus();
  return { connected: status.connected, connectionType: status.connectionType };
}

export async function hideSplashScreen() {
  if (!isNative) return;
  try {
    await SplashScreen.hide({ fadeOutDuration: 300 });
  } catch {
  }
}

export async function initCapacitor() {
  if (!isNative) return;

  try {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: "#111827" });
  } catch {
  }

  if (isAndroid) {
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
    } catch {
    }
  }

  Network.addListener("networkStatusChange", (status) => {
    const ns: NetworkStatus = {
      connected: status.connected,
      connectionType: status.connectionType,
    };
    networkListeners.forEach((cb) => cb(ns));
  });

  if (isIOS) {
    Keyboard.addListener("keyboardWillShow", () => {
      document.documentElement.style.setProperty("--keyboard-open", "1");
    });
    Keyboard.addListener("keyboardWillHide", () => {
      document.documentElement.style.setProperty("--keyboard-open", "0");
    });
  }
}

export function addAppStateListener(cb: (active: boolean) => void) {
  if (!isNative) return () => {};
  const remove = App.addListener("appStateChange", (state) => {
    cb(state.isActive);
  });
  return () => {
    remove.then((h) => h.remove());
  };
}
