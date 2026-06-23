import { useState } from "react";
import { useListMatches, useCreateMatch, useUpdateMatch, useSettleMatch, useGetAdminStats } from "@workspace/api-client-react";
import { useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Plus, Zap, Users, Trophy, Activity, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  upcoming: "bg-blue-800 text-blue-200",
  live: "bg-red-800 text-red-200",
  settled: "bg-gray-700 text-gray-400",
};

const nextStatus: Record<string, "live" | "upcoming" | "settled"> = {
  upcoming: "live",
  live: "settled",
};

export function AdminPage() {
  const { data: me } = useGetMe();
  const { data: stats } = useGetAdminStats();
  const { data: matches, isLoading, refetch } = useListMatches({});
  const { mutate: createMatch } = useCreateMatch();
  const { mutate: updateMatch } = useUpdateMatch();
  const { mutate: settleMatch } = useSettleMatch();
  const qc = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [settlePending, setSettlePending] = useState<{ matchId: number; home: number; away: number } | null>(null);

  // Create match form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    homeTeam: "",
    awayTeam: "",
    liveUrl: "",
    scheduledAt: "",
    status: "upcoming" as "upcoming" | "live" | "settled",
  });

  if (!me?.isAdmin) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Shield size={48} className="mx-auto text-gray-600 mb-4" />
        <h2 className="text-white font-bold text-xl mb-2">Admin Only</h2>
        <p className="text-gray-500 text-sm">Switch to User 1 (GoalMachine) in the Profile page to access the admin panel.</p>
      </div>
    );
  }

  const handleCreate = () => {
    if (!form.title || !form.homeTeam || !form.awayTeam) return;
    createMatch(
      {
        data: {
          title: form.title,
          description: form.description,
          homeTeam: form.homeTeam,
          awayTeam: form.awayTeam,
          liveUrl: form.liveUrl || "https://example.com/live",
          scheduledAt: form.scheduledAt || undefined,
          status: form.status,
        },
      },
      {
        onSuccess: () => {
          setForm({ title: "", description: "", homeTeam: "", awayTeam: "", liveUrl: "", scheduledAt: "", status: "upcoming" });
          setShowCreate(false);
          refetch();
        },
      },
    );
  };

  const handleStatusChange = (matchId: number, newStatus: "live" | "upcoming" | "settled") => {
    if (newStatus === "settled") {
      setSettlePending({ matchId, home: 1, away: 0 });
      return;
    }
    updateMatch({ matchId, data: { status: newStatus } }, { onSuccess: () => { refetch(); qc.invalidateQueries(); } });
  };

  const handleSettle = () => {
    if (!settlePending) return;
    settleMatch(
      { matchId: settlePending.matchId, data: { homeScore: settlePending.home, awayScore: settlePending.away } },
      {
        onSuccess: () => {
          setSettlePending(null);
          refetch();
          qc.invalidateQueries();
        },
      },
    );
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Shield size={22} className="text-yellow-400" />
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
        <span className="text-xs bg-yellow-700 text-yellow-200 px-2 py-0.5 rounded-full">Admin</span>
      </div>

      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: "Total Users", value: stats.totalUsers, icon: Users, color: "text-blue-400" },
            { label: "Fan Groups", value: stats.totalGroups, icon: Trophy, color: "text-green-400" },
            { label: "Total Matches", value: stats.totalMatches, icon: Activity, color: "text-purple-400" },
            { label: "Live Matches", value: stats.liveMatches, icon: Activity, color: "text-red-400" },
            { label: "Predictions", value: stats.totalPredictions, icon: Zap, color: "text-yellow-400" },
            { label: "XP Awarded", value: stats.totalXpAwarded, icon: Zap, color: "text-orange-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <Icon size={16} className={cn("mb-1", color)} />
              <div className="text-white font-bold text-2xl">{value.toLocaleString()}</div>
              <div className="text-gray-500 text-xs">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Settle score dialog */}
      {settlePending && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-sm">
            <h3 className="text-white font-bold text-lg mb-1">Settle Match</h3>
            <p className="text-gray-400 text-sm mb-5">Enter the final score. Correct predictions earn 100 XP.</p>

            {(() => {
              const match = matches?.find((m) => m.id === settlePending.matchId);
              return (
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex-1 text-center">
                    <div className="text-gray-400 text-xs mb-1">{match?.homeTeam}</div>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setSettlePending((p) => p && { ...p, home: Math.max(0, p.home - 1) })} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold">−</button>
                      <span className="text-white font-bold text-2xl w-8 text-center">{settlePending.home}</span>
                      <button onClick={() => setSettlePending((p) => p && { ...p, home: p.home + 1 })} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold">+</button>
                    </div>
                  </div>
                  <span className="text-gray-500 font-bold text-xl">–</span>
                  <div className="flex-1 text-center">
                    <div className="text-gray-400 text-xs mb-1">{match?.awayTeam}</div>
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setSettlePending((p) => p && { ...p, away: Math.max(0, p.away - 1) })} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold">−</button>
                      <span className="text-white font-bold text-2xl w-8 text-center">{settlePending.away}</span>
                      <button onClick={() => setSettlePending((p) => p && { ...p, away: p.away + 1 })} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold">+</button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex gap-2">
              <button onClick={handleSettle} className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-xl font-semibold transition-colors">
                <Check size={16} /> Settle & Award XP
              </button>
              <button onClick={() => setSettlePending(null)} className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-xl transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match management */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-semibold text-lg">Matches</h2>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} /> New Match
        </button>
      </div>

      {showCreate && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-5 space-y-3">
          <h3 className="text-white font-semibold text-sm">Create Match</h3>
          <div className="grid grid-cols-2 gap-3">
            <input
              className="col-span-2 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Match title (e.g. Premier League: Arsenal vs Chelsea)"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Home team"
              value={form.homeTeam}
              onChange={(e) => setForm({ ...form, homeTeam: e.target.value })}
            />
            <input
              className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Away team"
              value={form.awayTeam}
              onChange={(e) => setForm({ ...form, awayTeam: e.target.value })}
            />
            <textarea
              className="col-span-2 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 h-16 resize-none"
              placeholder="Description…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
            <input
              type="datetime-local"
              className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              value={form.scheduledAt}
              onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })}
            />
            <select
              className="bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "upcoming" | "live" | "settled" })}
            >
              <option value="upcoming">Upcoming</option>
              <option value="live">Live</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors">
              Create
            </button>
            <button onClick={() => setShowCreate(false)} className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 bg-gray-800 rounded-xl" />)}
        </div>
      )}

      <div className="space-y-3">
        {matches
          ?.slice()
          .sort((a, b) => {
            const order = { live: 0, upcoming: 1, settled: 2 };
            return (order[a.status] ?? 3) - (order[b.status] ?? 3);
          })
          .map((match) => (
            <div key={match.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", statusColors[match.status])}>
                    {match.status.toUpperCase()}
                  </span>
                  {match.status === "settled" && match.homeScore != null && (
                    <span className="text-gray-400 text-sm font-bold">{match.homeScore}–{match.awayScore}</span>
                  )}
                </div>
                <div className="text-white text-sm font-medium">{match.homeTeam} vs {match.awayTeam}</div>
                <div className="text-gray-500 text-xs">
                  {match.chatCount ?? 0} chats · {match.pokeCount} pokes · {match.predictionCount ?? 0} predictions
                  {match.scheduledAt && <span> · {formatDistanceToNow(new Date(match.scheduledAt), { addSuffix: true })}</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {match.status !== "settled" && (
                  <button
                    onClick={() => handleStatusChange(match.id, nextStatus[match.status]!)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      match.status === "upcoming"
                        ? "bg-red-700 hover:bg-red-600 text-white"
                        : "bg-green-700 hover:bg-green-600 text-white",
                    )}
                  >
                    {match.status === "upcoming" ? "→ Go Live" : "→ Settle"}
                  </button>
                )}
                {match.status === "settled" && (
                  <span className="text-gray-600 text-xs">Closed</span>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
