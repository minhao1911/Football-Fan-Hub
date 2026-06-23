import { useState } from "react";
import { Link } from "wouter";
import { useListMatches } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Flame, BarChart2, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

type StatusFilter = "all" | "live" | "upcoming" | "settled";

const statusColors: Record<string, string> = {
  live: "bg-red-500 text-white animate-pulse",
  upcoming: "bg-blue-500 text-white",
  settled: "bg-gray-500 text-white",
};

export function MatchesPage() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const { data: matches, isLoading } = useListMatches(
    filter === "all" ? {} : { status: filter as "live" | "upcoming" | "settled" },
  );

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "🔴 Live" },
    { key: "upcoming", label: "Upcoming" },
    { key: "settled", label: "Settled" },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Matches</h1>

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === t.key ? "bg-green-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 bg-gray-800 rounded-xl" />
          ))}
        </div>
      )}

      {matches?.length === 0 && (
        <div className="text-center text-gray-500 py-16">
          <p className="text-4xl mb-2">⚽</p>
          <p>No matches found.</p>
        </div>
      )}

      <div className="space-y-4">
        {matches?.map((match) => (
          <Link key={match.id} href={`/matches/${match.id}`}>
            <div className="bg-gray-800 border border-gray-700 hover:border-green-600 rounded-xl p-5 cursor-pointer transition-all hover:shadow-lg hover:shadow-green-900/20">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      statusColors[match.status] ?? "bg-gray-600 text-white",
                    )}
                  >
                    {match.status.toUpperCase()}
                  </span>
                  {match.status === "settled" && match.homeScore != null && (
                    <span className="text-gray-300 font-bold">
                      {match.homeScore} – {match.awayScore}
                    </span>
                  )}
                </div>
                <span className="text-gray-500 text-xs flex items-center gap-1">
                  <Calendar size={12} />
                  {match.scheduledAt
                    ? formatDistanceToNow(new Date(match.scheduledAt), { addSuffix: true })
                    : formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-semibold text-lg">{match.homeTeam}</span>
                <span className="text-gray-500 text-sm font-medium">vs</span>
                <span className="text-white font-semibold text-lg">{match.awayTeam}</span>
              </div>

              <p className="text-gray-400 text-sm mb-4 line-clamp-2">{match.description}</p>

              <div className="flex items-center gap-4 text-gray-500 text-xs">
                <span className="flex items-center gap-1">
                  <MessageSquare size={12} /> {match.chatCount ?? 0} messages
                </span>
                <span className="flex items-center gap-1">
                  <Flame size={12} /> {match.pokeCount} pokes
                </span>
                <span className="flex items-center gap-1">
                  <BarChart2 size={12} /> {match.predictionCount ?? 0} predictions
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
