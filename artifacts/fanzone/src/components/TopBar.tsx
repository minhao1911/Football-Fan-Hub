import { Link } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Zap } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { InstallPrompt } from "@/components/InstallPrompt";

export function TopBar() {
  const { data: me } = useGetMe();

  return (
    <header
      className="sticky top-0 z-50 border-b border-white/8"
      style={{
        paddingTop: "var(--sat, 0px)",
        background: "rgba(7, 26, 15, 0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
      }}
    >
      <div className="flex items-center justify-between h-14 px-4 max-w-2xl mx-auto w-full">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative">
            <span className="text-2xl leading-none">⚽</span>
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-[#1DB954] rounded-full animate-pulse" />
          </div>
          <span className="font-extrabold text-lg tracking-tight">
            <span className="text-[#1DB954]">Fan</span>
            <span className="text-white">Hub</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <InstallPrompt />
          {me && (
            <div className="flex items-center gap-1.5 bg-[#FACC15]/10 border border-[#FACC15]/25 rounded-full px-2.5 py-1">
              <Zap size={12} className="text-[#FACC15]" fill="currentColor" />
              <span className="font-bold text-[#FACC15] text-sm">{me.xp}</span>
              <span className="text-[#FACC15]/60 text-xs hidden xs:inline">XP</span>
            </div>
          )}
          <NotificationBell />
        </div>
      </div>
    </header>
  );
}
