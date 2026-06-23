import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export function InstallPrompt() {
  const [canInstall, setCanInstall] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
      // Show banner after 3 seconds if not already installed
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
      if (!isStandalone && !localStorage.getItem("pwa-dismissed")) {
        setTimeout(() => setShowBanner(true), 3000);
      }
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      deferredPrompt = null;
      setCanInstall(false);
      setShowBanner(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("pwa-dismissed", "1");
  };

  if (!canInstall) return null;

  return (
    <>
      {/* Icon button in top bar */}
      <button
        onClick={handleInstall}
        title="Install FanZone app"
        className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-green-400 hover:bg-gray-800 transition-colors"
      >
        <Download size={16} />
      </button>

      {/* Install banner */}
      {showBanner && (
        <div className="fixed bottom-20 left-4 right-4 z-[60] bg-gray-800 border border-green-700/60 rounded-2xl shadow-2xl p-4 flex items-center gap-3"
          style={{ bottom: "calc(4.5rem + var(--sab, 0px))" }}
        >
          <span className="text-3xl shrink-0">⚽</span>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Install FanZone</p>
            <p className="text-gray-400 text-xs mt-0.5">Add to your home screen for the best experience</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstall}
              className="bg-green-600 hover:bg-green-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 p-1"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
