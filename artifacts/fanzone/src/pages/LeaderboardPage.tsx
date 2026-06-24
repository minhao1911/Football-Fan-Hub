import { useState } from "react";
import { useGetGroupLeaderboard, useGetUserLeaderboard } from "@workspace/api-client-react";
import { Trophy, Users, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { CommunityInsightsWidget } from "@/components/LeaderboardAi";

type LeaderTab = "users" | "groups";

const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function LeaderboardPage() {
  const [tab, setTab] = useState<LeaderTab>("users");
  const { data: users, isLoading: usersLoading } = useGetUserLeaderboard();
  const { data: groups, isLoading: groupsLoading } = useGetGroupLeaderboard();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(250,204,21,0.15)" }}>
          <Trophy size={20} className="text-[#FACC15]" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Leader<span className="text-[#FACC15]">board</span>
          </h1>
          <p className="text-white/40 text-xs">Top fans &amp; communities worldwide</p>
        </div>
      </div>

      <div className="mb-6">
        <CommunityInsightsWidget />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(["users", "groups"] as LeaderTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200",
              tab === t
                ? "bg-[#FACC15] text-[#071A0F] shadow-[0_0_16px_rgba(250,204,21,0.3)]"
                : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80",
            )}
          >
            {t === "users" ? "🏅 Top Fans" : "🌍 Fan Nations"}
          </button>
        ))}
      </div>

      {/* Users list */}
      {tab === "users" && (
        <div className="space-y-2">
          {usersLoading && [1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
          {users?.map((u) => (
            <div
              key={u.userId}
              className={cn(
                "rounded-2xl px-4 py-3 flex items-center gap-3 border transition-all duration-200",
                u.rank <= 3
                  ? "border-[#FACC15]/25 hover:border-[#FACC15]/50"
                  : "border-white/8 hover:border-[#1DB954]/30",
              )}
              style={{
                background: u.rank <= 3 ? "rgba(250,204,21,0.05)" : "rgba(255,255,255,0.04)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="text-xl w-8 text-center shrink-0">
                {medals[u.rank] ?? <span className="text-white/30 text-sm font-bold">#{u.rank}</span>}
              </span>
              <div className="w-9 h-9 rounded-full bg-[#166534] border border-[#1DB954]/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{u.username}</div>
                <div className="text-white/35 text-xs flex items-center gap-1 mt-0.5">
                  {u.favoriteTeam && <span>{u.favoriteTeam}</span>}
                  {u.favoriteTeam && u.groupName && <span className="text-white/15">·</span>}
                  {u.groupName && <span className="text-[#1DB954]">{u.groupName}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-[#FACC15]">
                <Zap size={13} fill="currentColor" />
                <span className="text-sm">{u.xp}</span>
              </div>
            </div>
          ))}
          {users?.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-2">🏅</div>
              <p className="text-white/35">No fans ranked yet</p>
            </div>
          )}
        </div>
      )}

      {/* Groups list */}
      {tab === "groups" && (
        <div className="space-y-2">
          {groupsLoading && [1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
          {groups?.map((g) => (
            <div
              key={g.groupId}
              className={cn(
                "rounded-2xl px-4 py-3 flex items-center gap-3 border transition-all duration-200",
                g.rank <= 3
                  ? "border-[#FACC15]/25 hover:border-[#FACC15]/50"
                  : "border-white/8 hover:border-[#1DB954]/30",
              )}
              style={{
                background: g.rank <= 3 ? "rgba(250,204,21,0.05)" : "rgba(255,255,255,0.04)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span className="text-xl w-8 text-center shrink-0">
                {medals[g.rank] ?? <span className="text-white/30 text-sm font-bold">#{g.rank}</span>}
              </span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-2xl shrink-0">
                {g.badgeEmoji ?? "⚽"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold text-sm">{g.groupName}</div>
                <div className="text-white/35 text-xs flex items-center gap-1 mt-0.5">
                  <Users size={10} /> {g.memberCount} members
                </div>
              </div>
              <div className="flex items-center gap-1 font-bold text-[#FACC15]">
                <Zap size={13} fill="currentColor" />
                <span className="text-sm">{g.totalXp}</span>
              </div>
            </div>
          ))}
          {groups?.length === 0 && (
            <div className="text-center py-16">
              <div className="text-4xl mb-2">🌍</div>
              <p className="text-white/35">No fan nations yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
