import { useState } from "react";
import { Link } from "wouter";
import { useListMatches } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Flame, BarChart2, Calendar, Radio, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type StatusFilter = "all" | "live" | "upcoming" | "settled";

export function MatchesPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { data: matches, isLoading } = useListMatches(
    filter === "all" ? {} : { status: filter as "live" | "upcoming" | "settled" },
  );

  const tabs: { key: StatusFilter; label: string; emoji: string }[] = [
    { key: "all",      label: "All Fixtures", emoji: "🏟️" },
    { key: "live",     label: "Live",          emoji: "🔴" },
    { key: "upcoming", label: "Upcoming",      emoji: "📅" },
    { key: "settled",  label: "Settled",       emoji: "✅" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white tracking-tight">
          Match <span className="text-[#1DB954]">Fixtures</span>
        </h1>
        <p className="text-white/40 text-sm mt-0.5">Follow every match, live and settled</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-none">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 shrink-0",
              filter === t.key
                ? "bg-[#1DB954] text-white shadow-[0_0_16px_rgba(29,185,84,0.4)]"
                : "bg-white/5 border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/8",
            )}
          >
            <span className="text-base leading-none">{t.emoji}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && matches?.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-3">🏟️</div>
          <p className="text-white/40 font-medium">No fixtures found</p>
        </div>
      )}

      {/* Match cards */}
      <div className="space-y-4">
        {matches?.map((match) => (
          <Link key={match.id} href={`/matches/${match.id}`}>
            <div
              className={cn(
                "group relative rounded-2xl p-5 cursor-pointer transition-all duration-300 border overflow-hidden",
                match.status === "live"
                  ? "border-[#1DB954]/40 hover:border-[#1DB954]/80 hover:shadow-[0_0_24px_rgba(29,185,84,0.2)]"
                  : "border-white/8 hover:border-[#1DB954]/40 hover:shadow-[0_0_16px_rgba(29,185,84,0.12)]",
              )}
              style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(8px)" }}
            >
              {/* Live glow strip */}
              {match.status === "live" && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#1DB954] to-transparent" />
              )}

              {/* Top row: status + time */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {match.status === "live" && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#1DB954] bg-[#1DB954]/12 border border-[#1DB954]/30 px-2.5 py-1 rounded-full animate-pulse">
                      <Radio size={10} />
                      LIVE
                    </span>
                  )}
                  {match.status === "upcoming" && (
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-blue-300 bg-blue-500/10 border border-blue-500/25 px-2.5 py-1 rounded-full">
                      <Clock size={10} />
                      UPCOMING
                    </span>
                  )}
                  {match.status === "settled" && (
                    <span className="text-xs font-semibold text-white/40 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                      FT
                    </span>
                  )}
                  {match.status === "settled" && match.homeScore != null && (
                    <span className="text-white font-bold text-sm">
                      {match.homeScore} – {match.awayScore}
                    </span>
                  )}
                </div>
                <span className="text-white/30 text-xs flex items-center gap-1">
                  <Calendar size={11} />
                  {match.scheduledAt
                    ? formatDistanceToNow(new Date(match.scheduledAt), { addSuffix: true })
                    : formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
                </span>
              </div>

              {/* Teams */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">🏴</div>
                  <span className="text-white font-bold text-base leading-tight block">{match.homeTeam}</span>
                </div>

                <div className="flex flex-col items-center px-4">
                  <span className="text-[#1DB954]/60 text-xs font-bold tracking-widest uppercase">vs</span>
                  <div className="w-px h-6 bg-white/10 mt-1" />
                </div>

                <div className="flex-1 text-center">
                  <div className="text-2xl mb-1">🏴</div>
                  <span className="text-white font-bold text-base leading-tight block">{match.awayTeam}</span>
                </div>
              </div>

              {/* Description */}
              {match.description && (
                <p className="text-white/35 text-xs mb-4 line-clamp-1 text-center">{match.description}</p>
              )}

              {/* Divider */}
              <div className="border-t border-white/6 pt-3">
                <div className="flex items-center justify-around text-white/35 text-xs">
                  <span className="flex items-center gap-1.5 hover:text-[#1DB954] transition-colors">
                    <MessageSquare size={12} />
                    {match.chatCount ?? 0} chats
                  </span>
                  <span className="text-white/10">|</span>
                  <span className="flex items-center gap-1.5 hover:text-orange-400 transition-colors">
                    <Flame size={12} />
                    {match.pokeCount} pokes
                  </span>
                  <span className="text-white/10">|</span>
                  <span className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                    <BarChart2 size={12} />
                    {match.predictionCount ?? 0} picks
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
