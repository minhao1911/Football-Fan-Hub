import { Link, useLocation } from "wouter";
import { useCurrentUser } from "@/contexts/UserContext";
import { useGetMe } from "@workspace/api-client-react";
import { Trophy, Users, Swords, User, Zap, Shield, Rss } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/NotificationBell";

export function NavBar() {
  const [location] = useLocation();
  const { data: me } = useGetMe();

  const links = [
    { href: "/", label: "Matches", icon: Swords },
    { href: "/feed", label: "Feed", icon: Rss },
    { href: "/groups", label: "Groups", icon: Users },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile", icon: User },
    ...(me?.isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg">
            <span className="text-2xl">⚽</span>
            <span className="text-green-400">Fan</span>Zone
          </Link>

          <div className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  location === href
                    ? "bg-green-600 text-white"
                    : "text-gray-300 hover:bg-gray-800 hover:text-white",
                )}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            ))}
          </div>

          {me && (
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <NotificationBell />
              <Zap size={14} className="text-yellow-400" />
              <span className="font-semibold text-yellow-400">{me.xp} XP</span>
              <span className="hidden sm:inline text-gray-500">·</span>
              <span className="hidden sm:inline">{me.username}</span>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
