import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AiPanelProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export function AiPanel({ title, children, defaultOpen = false, className }: AiPanelProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={cn("bg-gray-800 border border-green-900/50 rounded-xl overflow-hidden", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-750 transition-colors"
      >
        <Sparkles size={15} className="text-green-400 flex-shrink-0" />
        <span className="text-green-400 font-semibold text-sm flex-1">{title}</span>
        {open ? <ChevronUp size={15} className="text-gray-500" /> : <ChevronDown size={15} className="text-gray-500" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function AiLoading() {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
      <Loader2 size={14} className="animate-spin text-green-400" />
      <span>FanHub AI is thinking…</span>
    </div>
  );
}

export function AiError({ message = "AI unavailable. Try again shortly." }: { message?: string }) {
  return <p className="text-red-400 text-xs py-2">{message}</p>;
}
