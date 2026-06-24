import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListPolls,
  useVoteMatchPoll,
  getListPollsQueryKey,
} from "@workspace/api-client-react";
import type { MatchPollSummary, MatchPoll } from "@workspace/api-client-react";

type PollOutcome = "home_win" | "draw" | "away_win";
type FilterKey = "all" | "live" | "upcoming" | "settled";

const STATUS_ORDER: Record<string, number> = { live: 0, upcoming: 1, settled: 2 };

function pct(votes: number, total: number) {
  if (total === 0) return 0;
  return Math.round((votes / total) * 100);
}

function PollBar({
  label,
  votes,
  total,
  isMyVote,
  hasVoted,
  outcome,
  onVote,
  isPending,
  color,
}: {
  label: string;
  votes: number;
  total: number;
  isMyVote: boolean;
  hasVoted: boolean;
  outcome: PollOutcome;
  onVote: (o: PollOutcome) => void;
  isPending: boolean;
  color: string;
}) {
  const percentage = pct(votes, total);
  const show = hasVoted || total > 0;

  return (
    <button
      onClick={() => !isPending && onVote(outcome)}
      disabled={isPending}
      className="w-full text-left transition-all duration-200 active:scale-[0.98] disabled:opacity-70"
    >
      <div
        className="relative rounded-xl overflow-hidden border transition-all duration-200"
        style={{
          borderColor: isMyVote ? color : "rgba(255,255,255,0.08)",
          background: isMyVote ? `${color}18` : "rgba(255,255,255,0.04)",
          boxShadow: isMyVote ? `0 0 12px ${color}30` : "none",
        }}
      >
        {show && (
          <div
            className="absolute inset-0 rounded-xl transition-all duration-700"
            style={{ width: `${percentage}%`, background: `${color}22` }}
          />
        )}
        <div className="relative flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-2">
            {isMyVote && (
              <span className="text-xs font-bold" style={{ color }}>✓</span>
            )}
            <span
              className="text-sm font-semibold"
              style={{ color: isMyVote ? color : "rgba(255,255,255,0.8)" }}
            >
              {label}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {show && (
              <span className="text-xs font-bold" style={{ color: isMyVote ? color : "rgba(255,255,255,0.45)" }}>
                {percentage}%
              </span>
            )}
            {!hasVoted && (
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                style={{ borderColor: color, color }}
              >
                Vote
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function PollCard({ item }: { item: MatchPollSummary }) {
  const queryClient = useQueryClient();
  const { poll, homeTeam, awayTeam, status, scheduledAt } = item;
  const hasVoted = !!poll.myVote;
  const isLive = status === "live";

  const { mutate, isPending } = useVoteMatchPoll({
    mutation: {
      onSuccess: (updatedPoll: MatchPoll) => {
        queryClient.setQueryData<MatchPollSummary[]>(getListPollsQueryKey(), (old) =>
          old?.map((s) =>
            s.matchId === item.matchId ? { ...s, poll: updatedPoll } : s,
          ) ?? [],
        );
      },
    },
  });

  const vote = (outcome: PollOutcome) => {
    mutate({ matchId: item.matchId, data: { outcome } });
  };

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{
        background: "rgba(255,255,255,0.04)",
        borderColor: isLive ? "rgba(29,185,84,0.3)" : "rgba(255,255,255,0.07)",
        boxShadow: isLive ? "0 0 20px rgba(29,185,84,0.08)" : "none",
      }}
    >
      {isLive && (
        <div
          className="h-0.5"
          style={{ background: "linear-gradient(90deg, transparent, #1DB954, transparent)" }}
        />
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            {isLive && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-[#1DB954] uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1DB954] animate-pulse" />
                Live
              </span>
            )}
            {status === "settled" && (
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Final</span>
            )}
            {status === "upcoming" && scheduledAt && (
              <span className="text-[10px] text-white/30 font-medium">
                {new Date(scheduledAt).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
          <span className="text-[10px] text-white/25 font-medium">
            {poll.totalVotes} {poll.totalVotes === 1 ? "vote" : "votes"}
          </span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-white/90 flex-1 text-left truncate">{homeTeam}</span>
          <span className="text-xs text-white/30 font-semibold mx-3 flex-shrink-0">vs</span>
          <span className="text-sm font-bold text-white/90 flex-1 text-right truncate">{awayTeam}</span>
        </div>

        <p className="text-[11px] text-white/40 font-semibold uppercase tracking-wider mb-3 text-center">
          Who will win?
        </p>

        <div className="flex flex-col gap-2">
          <PollBar
            label={homeTeam}
            votes={poll.homeWin}
            total={poll.totalVotes}
            isMyVote={poll.myVote === "home_win"}
            hasVoted={hasVoted}
            outcome="home_win"
            onVote={vote}
            isPending={isPending}
            color="#1DB954"
          />
          <PollBar
            label="Draw"
            votes={poll.draw}
            total={poll.totalVotes}
            isMyVote={poll.myVote === "draw"}
            hasVoted={hasVoted}
            outcome="draw"
            onVote={vote}
            isPending={isPending}
            color="#FACC15"
          />
          <PollBar
            label={awayTeam}
            votes={poll.awayWin}
            total={poll.totalVotes}
            isMyVote={poll.myVote === "away_win"}
            hasVoted={hasVoted}
            outcome="away_win"
            onVote={vote}
            isPending={isPending}
            color="#F97316"
          />
        </div>

        {hasVoted && (
          <p className="text-[10px] text-white/30 text-center mt-3 font-medium">
            You voted · tap to change
          </p>
        )}
      </div>
    </div>
  );
}

export function FanPollsPage() {
  const [filter, setFilter] = useState<FilterKey>("all");

  const { data: polls, isLoading, error } = useListPolls({
    query: { refetchInterval: 5_000 },
  });

  const sorted = [...(polls ?? [])].sort(
    (a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9),
  );

  const filtered = filter === "all" ? sorted : sorted.filter((p) => p.status === filter);
  const liveCnt = sorted.filter((p) => p.status === "live").length;
  const upcomingCnt = sorted.filter((p) => p.status === "upcoming").length;
  const settledCnt = sorted.filter((p) => p.status === "settled").length;

  const filters: [FilterKey, string, number][] = [
    ["all", "All", sorted.length],
    ["live", "Live", liveCnt],
    ["upcoming", "Upcoming", upcomingCnt],
    ["settled", "Settled", settledCnt],
  ];

  return (
    <div className="min-h-screen" style={{ background: "#071A0F" }}>
      <div className="max-w-2xl mx-auto px-4 pt-5 pb-8">
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📊</span>
            <h1 className="text-xl font-black text-white">Fan Polls</h1>
          </div>
          <p className="text-sm text-white/40 font-medium">
            Vote on match outcomes and see what the community thinks
          </p>
        </div>

        <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-1 px-1">
          {filters.map(([key, label, cnt]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95"
              style={
                filter === key
                  ? { background: "#1DB954", color: "#071A0F" }
                  : { background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }
              }
            >
              {label}
              {cnt > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={
                    filter === key
                      ? { background: "rgba(0,0,0,0.25)", color: "#071A0F" }
                      : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
                  }
                >
                  {cnt}
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl h-44 animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)" }}
              />
            ))}
          </div>
        )}

        {error && (
          <div
            className="rounded-2xl p-6 text-center border border-red-500/20"
            style={{ background: "rgba(239,68,68,0.05)" }}
          >
            <p className="text-red-400 font-semibold text-sm">Could not load polls</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div
            className="rounded-2xl p-10 text-center border border-white/8"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="text-4xl mb-3">📭</div>
            <p className="text-white/50 font-semibold text-sm">
              No {filter !== "all" ? filter : ""} matches to poll on yet
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {filtered.map((item) => (
            <PollCard key={item.matchId} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
