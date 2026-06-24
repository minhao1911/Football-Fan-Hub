import { useState } from "react";
import { useListGroups, useCreateGroup, useJoinGroup, useLeaveGroup, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function GroupsPage() {
  const qc = useQueryClient();
  const { data: me } = useGetMe();
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [badgeEmoji, setBadgeEmoji] = useState("⚽");
  const [badgeColor, setBadgeColor] = useState("#22c55e");

  const { data: groups, isLoading, refetch } = useListGroups(search ? { search } : {});
  const { mutate: createGroup } = useCreateGroup();
  const { mutate: joinGroup } = useJoinGroup();
  const { mutate: leaveGroup } = useLeaveGroup();

  const refresh = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ["/api/users/me"] });
  };

  const handleCreate = () => {
    if (!name.trim() || !description.trim()) return;
    createGroup(
      { data: { name: name.trim(), description: description.trim(), badgeEmoji, badgeColor } },
      { onSuccess: () => { setName(""); setDescription(""); setShowForm(false); refresh(); } },
    );
  };

  const emojis = ["⚽", "🏆", "🔥", "⚡", "🦁", "🐯", "🦅", "🌟", "💪", "🎯"];
  const colors = ["#22c55e", "#3b82f6", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6"];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "rgba(29,185,84,0.15)" }}>
            <Globe size={20} className="text-[#1DB954]" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Fan <span className="text-[#1DB954]">Nations</span>
            </h1>
            <p className="text-white/40 text-xs">Join your global community</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white transition-all duration-200 active:scale-95"
          style={{
            background: showForm ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #1DB954, #22C55E)",
            boxShadow: showForm ? "none" : "0 0 16px rgba(29,185,84,0.3)",
          }}
        >
          <Plus size={14} /> {showForm ? "Cancel" : "Create"}
        </button>
      </div>

      {/* Current membership banner */}
      {me?.groupId && (
        <div
          className="rounded-2xl p-3.5 mb-5 border border-[#1DB954]/25 flex items-center gap-2"
          style={{ background: "rgba(29,185,84,0.08)" }}
        >
          <span className="text-lg">✅</span>
          <p className="text-[#1DB954] text-sm font-semibold">
            You're in <span className="text-white">{(me as any).groupName}</span>
          </p>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div
          className="rounded-2xl p-5 mb-6 border border-white/10 space-y-4"
          style={{ background: "rgba(255,255,255,0.05)", backdropFilter: "blur(12px)" }}
        >
          <h3 className="text-white font-bold text-base">Create a Fan Nation</h3>
          <input
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border border-white/10 focus:border-[#1DB954]/60 transition-colors"
            style={{ background: "rgba(255,255,255,0.07)" }}
            placeholder="Nation name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none border border-white/10 focus:border-[#1DB954]/60 transition-colors h-20 resize-none"
            style={{ background: "rgba(255,255,255,0.07)" }}
            placeholder="Description…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <div className="text-white/40 text-xs mb-2 font-semibold uppercase tracking-wider">Badge Emoji</div>
            <div className="flex gap-2 flex-wrap">
              {emojis.map((e) => (
                <button
                  key={e}
                  onClick={() => setBadgeEmoji(e)}
                  className={cn(
                    "text-xl p-2 rounded-xl transition-all",
                    badgeEmoji === e ? "bg-[#1DB954]/25 ring-2 ring-[#1DB954]/60" : "bg-white/5 hover:bg-white/10",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-white/40 text-xs mb-2 font-semibold uppercase tracking-wider">Badge Color</div>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button
                  key={c}
                  onClick={() => setBadgeColor(c)}
                  className={cn("w-7 h-7 rounded-full border-2 transition-transform", badgeColor === c ? "border-white scale-110" : "border-transparent")}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="font-bold px-5 py-2.5 rounded-xl text-sm text-white transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #1DB954, #22C55E)", boxShadow: "0 0 16px rgba(29,185,84,0.3)" }}
          >
            Create Nation
          </button>
        </div>
      )}

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          className="w-full rounded-2xl pl-10 pr-4 py-2.5 text-sm text-white outline-none border border-white/10 focus:border-[#1DB954]/50 transition-colors"
          style={{ background: "rgba(255,255,255,0.05)" }}
          placeholder="Search fan nations…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Skeletons */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" style={{ background: "rgba(255,255,255,0.06)" }} />
          ))}
        </div>
      )}

      {groups?.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <div className="text-4xl mb-2">🌍</div>
          <p className="text-white/35">No fan nations found</p>
        </div>
      )}

      {/* Group cards */}
      <div className="space-y-3">
        {groups?.map((group) => (
          <div
            key={group.id}
            className={cn(
              "rounded-2xl p-4 flex items-center gap-4 border transition-all duration-200",
              group.isMember
                ? "border-[#1DB954]/35 hover:border-[#1DB954]/60"
                : "border-white/8 hover:border-white/20",
            )}
            style={{
              background: group.isMember ? "rgba(29,185,84,0.06)" : "rgba(255,255,255,0.04)",
              backdropFilter: "blur(8px)",
            }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: (group.badgeColor ?? "#166534") + "33" }}
            >
              {group.badgeEmoji ?? "⚽"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-white font-bold text-sm">{group.name}</h3>
                {group.isMember && (
                  <span className="text-[10px] font-bold bg-[#1DB954]/20 text-[#1DB954] border border-[#1DB954]/30 px-2 py-0.5 rounded-full">
                    Joined
                  </span>
                )}
              </div>
              <p className="text-white/40 text-xs line-clamp-1 mt-0.5">{group.description}</p>
              <div className="flex items-center gap-3 mt-1.5 text-white/30 text-xs">
                <span className="flex items-center gap-1"><Users size={11} /> {group.memberCount} members</span>
                <span className="text-[#FACC15] font-semibold">⚡ {group.totalXp} XP</span>
              </div>
            </div>
            <button
              onClick={() => {
                if (group.isMember) {
                  leaveGroup({ groupId: group.id }, { onSuccess: refresh });
                } else {
                  joinGroup({ groupId: group.id }, { onSuccess: refresh });
                }
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shrink-0",
                group.isMember
                  ? "bg-white/8 hover:bg-red-500/15 text-white/50 hover:text-red-400 border border-white/10 hover:border-red-500/30"
                  : "text-white border border-white/10",
              )}
              style={!group.isMember ? { background: "linear-gradient(135deg, #1DB954, #22C55E)" } : {}}
            >
              {group.isMember ? "Leave" : "Join"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
