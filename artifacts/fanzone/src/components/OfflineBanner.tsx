import { useNetwork } from "@/hooks/useCapacitor";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const { connected } = useNetwork();

  if (connected) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
      <WifiOff className="h-4 w-4 shrink-0" />
      <span>You're offline — some features may be unavailable</span>
    </div>
  );
}
