import { Link, useLocation } from "wouter";
import { useGetMe } from "@workspace/api-client-react";
import { Swords, Rss, Users, Trophy, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Matches", icon: Swords },
  { href: "/feed", label: "Feed", icon: Rss },
  { href: "/groups", label: "Groups", icon: Users },
  { href: "/leaderboard", label: "Board", icon: Trophy },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();
  const { data: me } = useGetMe();

  const items = [
    ...NAV_ITEMS,
    ...(me?.isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur border-t border-gray-800"
      style={{ paddingBottom: "var(--sab, 0px)" }}
    >
      <div className="flex items-stretch justify-around max-w-2xl mx-auto">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? location === "/" : location.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2.5 min-h-[56px] transition-colors active:scale-95 touch-none select-none",
                isActive ? "text-green-400" : "text-gray-500",
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.75} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-green-400 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
