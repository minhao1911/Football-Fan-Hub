import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { AiPanel, AiLoading, AiError } from "./AiPanel";
import {
  useMatchPreview,
  useDiscussionPrompt,
  usePredictionAnalysis,
  useMatchRecap,
  useMatchSentiment,
  useAiAssistant,
} from "@/hooks/useAi";

interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  status: string;
  title: string;
}

export function MatchAiInsights({ match }: { match: Match }) {
  const isSettled = match.status === "settled";
  const isLive = match.status === "live";
  const phase = isSettled ? "post" : isLive ? "halftime" : "pre";

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-green-400" />
        <span className="text-green-400 font-bold text-sm uppercase tracking-wide">FanHub AI</span>
      </div>

      {!isSettled && <MatchPreviewPanel matchId={match.id} />}
      <DiscussionPanel matchId={match.id} phase={phase} />
      <PredictionAnalysisPanel matchId={match.id} />
      <SentimentPanel matchId={match.id} />
      {isSettled && <RecapPanel matchId={match.id} />}
      <AiAssistantPanel matchContext={`${match.homeTeam} vs ${match.awayTeam} (${match.status})`} />
    </div>
  );
}

function MatchPreviewPanel({ matchId }: { matchId: number }) {
  const { data, isLoading, isError } = useMatchPreview(matchId);
  return (
    <AiPanel title="Match Preview" defaultOpen>
      {isLoading && <AiLoading />}
      {isError && <AiError />}
      {data && (
        <div className="space-y-3 pt-1">
          <p className="text-white font-semibold text-sm leading-snug">{data.headline}</p>
          <p className="text-gray-400 text-sm leading-relaxed">{data.overview}</p>
          {data.keyStorylines.length > 0 && (
            <div>
              <p className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-1.5">Key Storylines</p>
              <ul className="space-y-1">
                {data.keyStorylines.map((s, i) => (
                  <li key={i} className="flex gap-2 text-gray-400 text-sm">
                    <span className="text-green-400 flex-shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.discussionQuestions.length > 0 && (
            <div>
              <p className="text-gray-300 text-xs font-semibold uppercase tracking-wide mb-1.5">Fan Discussion</p>
              <ul className="space-y-1">
                {data.discussionQuestions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-gray-400 text-sm">
                    <span className="text-yellow-400 flex-shrink-0">?</span>{q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </AiPanel>
  );
}

function DiscussionPanel({ matchId, phase }: { matchId: number; phase: "pre" | "halftime" | "post" }) {
  const label = phase === "pre" ? "Pre-Match Discussion" : phase === "halftime" ? "Halftime Prompt" : "Post-Match Discussion";
  const { data, isLoading, isError } = useDiscussionPrompt(matchId, phase);
  return (
    <AiPanel title={label}>
      {isLoading && <AiLoading />}
      {isError && <AiError />}
      {data && (
        <p className="text-gray-300 text-sm leading-relaxed pt-1 italic">"{data.prompt}"</p>
      )}
    </AiPanel>
  );
}

function PredictionAnalysisPanel({ matchId }: { matchId: number }) {
  const { data, isLoading, isError } = usePredictionAnalysis(matchId, true);
  return (
    <AiPanel title="Community Prediction Analysis">
      {isLoading && <AiLoading />}
      {isError && <AiError />}
      {data && (
        <div className="space-y-3 pt-1">
          <p className="text-gray-300 text-sm leading-relaxed">{data.analysis}</p>
          {data.stats && data.stats.total > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Home Win", pct: data.stats.homeWinPct, color: "bg-green-500" },
                { label: "Draw", pct: data.stats.drawPct, color: "bg-yellow-500" },
                { label: "Away Win", pct: data.stats.awayWinPct, color: "bg-blue-500" },
              ].map(({ label, pct, color }) => (
                <div key={label} className="bg-gray-700 rounded-lg p-2 text-center">
                  <div className={`h-1 rounded-full ${color} mb-1.5`} style={{ width: `${pct}%` }} />
                  <div className="text-white font-bold text-sm">{pct.toFixed(0)}%</div>
                  <div className="text-gray-400 text-xs">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AiPanel>
  );
}

function SentimentPanel({ matchId }: { matchId: number }) {
  const { data, isLoading, isError } = useMatchSentiment(matchId, true);
  return (
    <AiPanel title="Fan Sentiment">
      {isLoading && <AiLoading />}
      {isError && <AiError />}
      {data && (
        <div className="space-y-3 pt-1">
          <p className="text-gray-300 text-sm leading-relaxed">{data.summary}</p>
          <div className="flex gap-1 h-2 rounded-full overflow-hidden">
            <div className="bg-green-500 transition-all" style={{ width: `${data.positive}%` }} />
            <div className="bg-gray-500 transition-all" style={{ width: `${data.neutral}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${data.negative}%` }} />
          </div>
          <div className="flex gap-4 text-xs text-gray-400">
            <span><span className="text-green-400 font-bold">{data.positive}%</span> Positive</span>
            <span><span className="text-gray-300 font-bold">{data.neutral}%</span> Neutral</span>
            <span><span className="text-red-400 font-bold">{data.negative}%</span> Negative</span>
          </div>
        </div>
      )}
    </AiPanel>
  );
}

function RecapPanel({ matchId }: { matchId: number }) {
  const { data, isLoading, isError } = useMatchRecap(matchId, true);
  return (
    <AiPanel title="Post-Match Recap" defaultOpen>
      {isLoading && <AiLoading />}
      {isError && <AiError />}
      {data && (
        <p className="text-gray-300 text-sm leading-relaxed pt-1">{data.recap}</p>
      )}
    </AiPanel>
  );
}

function AiAssistantPanel({ matchContext }: { matchContext: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const { mutate, isPending } = useAiAssistant();

  const handleAsk = () => {
    if (!question.trim()) return;
    setAnswer(null);
    mutate(
      { question: question.trim(), matchContext },
      { onSuccess: (data) => { setAnswer(data.answer); } },
    );
  };

  return (
    <AiPanel title="Ask FanHub AI">
      <div className="space-y-3 pt-1">
        <p className="text-gray-500 text-xs">Ask about tactics, rules, players, or this match.</p>
        <div className="flex gap-2">
          <input
            className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 placeholder:text-gray-500"
            placeholder="e.g. Who should I watch in this match?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          />
          <button
            onClick={handleAsk}
            disabled={isPending || !question.trim()}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        {answer && (
          <div className="bg-gray-700 rounded-lg p-3 text-gray-300 text-sm leading-relaxed">
            {answer}
          </div>
        )}
      </div>
    </AiPanel>
  );
}
