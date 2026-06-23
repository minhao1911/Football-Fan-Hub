import { Link } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Zap } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { InstallPrompt } from "@/components/InstallPrompt";

export function TopBar() {
  const { data: me } = useGetMe();

  return (
    <header
      className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur border-b border-gray-800"
      style={{ paddingTop: "var(--sat, 0px)" }}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl leading-none">⚽</span>
          <span className="font-bold text-lg">
            <span className="text-green-400">Fan</span>
            <span className="text-white">Zone</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <InstallPrompt />
          {me && (
            <div className="flex items-center gap-1.5 text-sm">
              <Zap size={13} className="text-yellow-400" />
              <span className="font-bold text-yellow-400">{me.xp}</span>
              <span className="text-gray-500 text-xs hidden xs:inline">XP</span>
            </div>
          )}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
