import { useCommunityInsights } from "@/hooks/useAi";
import { AiPanel, AiLoading, AiError } from "./AiPanel";
import { TrendingUp } from "lucide-react";

export function CommunityInsightsWidget() {
  const { data, isLoading, isError } = useCommunityInsights();

  return (
    <AiPanel title="Community Insights" defaultOpen>
      {isLoading && <AiLoading />}
      {isError && <AiError />}
      {data && (
        <div className="space-y-3 pt-1">
          <p className="text-gray-300 text-sm leading-relaxed">{data.summary}</p>
          {data.highlights.length > 0 && (
            <div className="space-y-2">
              {data.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 bg-gray-700 rounded-lg px-3 py-2">
                  <TrendingUp size={13} className="text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300 text-sm">{h}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AiPanel>
  );
}
