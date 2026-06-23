import { useState } from "react";
import { useListGroups, useCreateGroup, useJoinGroup, useLeaveGroup, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Users, Plus, Search } from "lucide-react";
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
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Fan Groups</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} /> Create Group
        </button>
      </div>

      {me?.groupId && (
        <div className="bg-green-900/30 border border-green-700 rounded-xl p-3 mb-4 text-sm text-green-300">
          You are a member of <span className="font-semibold text-green-200">{me.groupName}</span>
        </div>
      )}

      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 mb-6 space-y-4">
          <h3 className="text-white font-semibold">Create a Fan Group</h3>
          <input
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Group name…"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 h-20 resize-none"
            placeholder="Description…"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div>
            <div className="text-gray-400 text-xs mb-2">Badge Emoji</div>
            <div className="flex gap-2 flex-wrap">
              {emojis.map((e) => (
                <button key={e} onClick={() => setBadgeEmoji(e)} className={cn("text-xl p-1.5 rounded", badgeEmoji === e ? "bg-green-600" : "bg-gray-700 hover:bg-gray-600")}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-xs mb-2">Badge Color</div>
            <div className="flex gap-2">
              {colors.map((c) => (
                <button key={c} onClick={() => setBadgeColor(c)} className={cn("w-7 h-7 rounded-full border-2 transition-transform", badgeColor === c ? "border-white scale-110" : "border-transparent")} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <button
            onClick={handleCreate}
            className="bg-green-600 hover:bg-green-500 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Create Group
          </button>
        </div>
      )}

      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          className="w-full bg-gray-800 text-white rounded-lg pl-9 pr-3 py-2 text-sm border border-gray-700 outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Search groups…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 bg-gray-800 rounded-xl" />)}
        </div>
      )}

      {groups?.length === 0 && <p className="text-gray-500 text-center py-12">No groups found.</p>}

      <div className="space-y-3">
        {groups?.map((group) => (
          <div key={group.id} className={cn("bg-gray-800 border rounded-xl p-4 flex items-center gap-4", group.isMember ? "border-green-700" : "border-gray-700")}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: group.badgeColor ?? "#374151" }}>
              {group.badgeEmoji ?? "⚽"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-white font-semibold">{group.name}</h3>
                {group.isMember && <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">Joined</span>}
              </div>
              <p className="text-gray-400 text-sm line-clamp-1">{group.description}</p>
              <div className="flex items-center gap-3 mt-1 text-gray-500 text-xs">
                <span className="flex items-center gap-1"><Users size={11} /> {group.memberCount} members</span>
                <span className="text-yellow-400 font-medium">⚡ {group.totalXp} XP</span>
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
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0",
                group.isMember
                  ? "bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-300"
                  : "bg-green-600 hover:bg-green-500 text-white",
              )}
            >
              {group.isMember ? "Leave" : "Join"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
