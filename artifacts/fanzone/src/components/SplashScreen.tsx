import { useEffect, useState } from "react";

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    // in → hold after 600ms, hold → out after 1800ms, done after fade
    const t1 = setTimeout(() => setPhase("hold"), 600);
    const t2 = setTimeout(() => setPhase("out"), 1900);
    const t3 = setTimeout(() => onDone(), 2500);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-gray-950"
      style={{
        transition: "opacity 600ms ease",
        opacity: phase === "out" ? 0 : 1,
        pointerEvents: phase === "out" ? "none" : "auto",
      }}
    >
      {/* Radial glow behind ball */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        aria-hidden
      >
        <div
          className="w-64 h-64 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(22,163,74,0.18) 0%, transparent 70%)",
            transform: phase === "in" ? "scale(0.4)" : "scale(1)",
            transition: "transform 700ms cubic-bezier(0.34,1.56,0.64,1)",
          }}
        />
      </div>

      {/* Football */}
      <div
        style={{
          fontSize: 96,
          lineHeight: 1,
          transform: phase === "in" ? "scale(0.3) translateY(30px)" : "scale(1) translateY(0px)",
          opacity: phase === "in" ? 0 : 1,
          transition: "transform 600ms cubic-bezier(0.34,1.56,0.64,1), opacity 400ms ease",
          filter: "drop-shadow(0 0 32px rgba(22,163,74,0.5))",
        }}
      >
        ⚽
      </div>

      {/* Wordmark */}
      <div
        className="mt-5 flex items-baseline gap-0"
        style={{
          transform: phase === "in" ? "translateY(16px)" : "translateY(0)",
          opacity: phase === "in" ? 0 : 1,
          transition: "transform 550ms 150ms cubic-bezier(0.34,1.2,0.64,1), opacity 500ms 150ms ease",
        }}
      >
        <span className="text-4xl font-black tracking-tight text-green-400">Fan</span>
        <span className="text-4xl font-black tracking-tight text-white">Zone</span>
      </div>

      {/* Tagline */}
      <p
        className="mt-2 text-gray-500 text-sm tracking-widest uppercase"
        style={{
          opacity: phase === "in" ? 0 : 0.8,
          transition: "opacity 600ms 350ms ease",
        }}
      >
        Your game. Your tribe.
      </p>

      {/* Bottom loader bar */}
      <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-24 h-0.5 rounded-full bg-gray-800 overflow-hidden">
        <div
          className="h-full bg-green-500 rounded-full"
          style={{
            width: phase === "in" ? "10%" : phase === "hold" ? "80%" : "100%",
            transition:
              phase === "in"
                ? "width 500ms ease"
                : phase === "hold"
                ? "width 1200ms ease"
                : "width 500ms ease",
          }}
        />
      </div>
    </div>
  );
}
