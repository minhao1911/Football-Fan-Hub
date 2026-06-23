import { useState } from "react";
import { useGetGroupLeaderboard, useGetUserLeaderboard } from "@workspace/api-client-react";
import { Trophy, Users, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LeaderTab = "users" | "groups";

const medals: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

export function LeaderboardPage() {
  const [tab, setTab] = useState<LeaderTab>("users");
  const { data: users, isLoading: usersLoading } = useGetUserLeaderboard();
  const { data: groups, isLoading: groupsLoading } = useGetGroupLeaderboard();

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Trophy size={24} className="text-yellow-400" />
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("users")}
          className={cn("px-5 py-2 rounded-full text-sm font-medium transition-colors", tab === "users" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700")}
        >
          Top Fans
        </button>
        <button
          onClick={() => setTab("groups")}
          className={cn("px-5 py-2 rounded-full text-sm font-medium transition-colors", tab === "groups" ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700")}
        >
          Fan Groups
        </button>
      </div>

      {tab === "users" && (
        <div className="space-y-2">
          {usersLoading && [1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 bg-gray-800 rounded-xl" />)}
          {users?.map((u) => (
            <div
              key={u.userId}
              className={cn(
                "bg-gray-800 border rounded-xl px-4 py-3 flex items-center gap-3",
                u.rank <= 3 ? "border-yellow-700/40" : "border-gray-700",
              )}
            >
              <span className="text-xl w-8 text-center">
                {medals[u.rank] ?? <span className="text-gray-500 text-sm font-bold">#{u.rank}</span>}
              </span>
              <div className="w-9 h-9 rounded-full bg-green-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {u.username[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">{u.username}</div>
                <div className="text-gray-500 text-xs">
                  {u.favoriteTeam && <span>{u.favoriteTeam} · </span>}
                  {u.groupName && <span className="text-green-400">{u.groupName}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1 text-yellow-400 font-bold">
                <Zap size={14} />
                {u.xp}
              </div>
            </div>
          ))}
          {users?.length === 0 && <p className="text-gray-500 text-center py-12">No users yet.</p>}
        </div>
      )}

      {tab === "groups" && (
        <div className="space-y-2">
          {groupsLoading && [1, 2, 3].map((i) => <Skeleton key={i} className="h-16 bg-gray-800 rounded-xl" />)}
          {groups?.map((g) => (
            <div
              key={g.groupId}
              className={cn(
                "bg-gray-800 border rounded-xl px-4 py-3 flex items-center gap-3",
                g.rank <= 3 ? "border-yellow-700/40" : "border-gray-700",
              )}
            >
              <span className="text-xl w-8 text-center">
                {medals[g.rank] ?? <span className="text-gray-500 text-sm font-bold">#{g.rank}</span>}
              </span>
              <div className="w-9 h-9 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                {g.badgeEmoji ?? "⚽"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-semibold">{g.groupName}</div>
                <div className="text-gray-500 text-xs flex items-center gap-1">
                  <Users size={11} /> {g.memberCount} members
                </div>
              </div>
              <div className="flex items-center gap-1 text-yellow-400 font-bold">
                <Zap size={14} />
                {g.totalXp}
              </div>
            </div>
          ))}
          {groups?.length === 0 && <p className="text-gray-500 text-center py-12">No groups yet.</p>}
        </div>
      )}
    </div>
  );
}
