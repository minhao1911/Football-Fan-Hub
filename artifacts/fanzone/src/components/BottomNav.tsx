import { Link, useLocation } from "wouter";
import { Rss, Swords, BarChart2, Trophy, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/feed",        label: "Home",       icon: Rss },
  { href: "/matches",     label: "Fixtures",   icon: Swords },
  { href: "/polls",       label: "Polls",      icon: BarChart2 },
  { href: "/leaderboard", label: "Leaders",    icon: Trophy },
  { href: "/profile",     label: "Profile",    icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/8"
      style={{
        paddingBottom: "var(--sab, 0px)",
        background: "rgba(7, 26, 15, 0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      <div className="flex items-stretch justify-around max-w-2xl mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = location === href || location.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 flex-1 py-2.5 min-h-[56px] transition-all duration-200 active:scale-90 touch-none select-none",
                isActive ? "text-[#1DB954]" : "text-white/35 hover:text-white/60",
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-[#1DB954] shadow-[0_0_8px_rgba(29,185,84,0.8)]" />
              )}
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 1.75}
                className={isActive ? "drop-shadow-[0_0_6px_rgba(29,185,84,0.6)]" : ""}
              />
              <span className={cn("text-[10px] font-semibold leading-none tracking-wide", isActive ? "text-[#1DB954]" : "")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
