import { useState } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Edit2, Save, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const DEMO_USERS = [1, 2, 3, 4, 5];

export function ProfilePage() {
  const { userId, setUserId } = useCurrentUser();
  const qc = useQueryClient();
  const { data: me, isLoading } = useGetMe();
  const { mutate: updateMe } = useUpdateMe();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [favoriteTeam, setFavoriteTeam] = useState("");

  const startEdit = () => {
    setUsername(me?.username ?? "");
    setBio(me?.bio ?? "");
    setFavoriteTeam(me?.favoriteTeam ?? "");
    setEditing(true);
  };

  const saveEdit = () => {
    updateMe(
      { data: { username, bio, favoriteTeam } },
      { onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/users/me"] }); setEditing(false); } },
    );
  };

  const switchUser = (id: number) => {
    setUserId(id);
    qc.invalidateQueries();
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-32 bg-gray-800 rounded-xl" />
        <Skeleton className="h-48 bg-gray-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center text-white text-2xl font-bold">
            {me?.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div className="flex-1">
            <h2 className="text-white text-xl font-bold">{me?.username}</h2>
            <div className="flex items-center gap-2 text-yellow-400 font-semibold">
              <Zap size={14} />
              {me?.xp} XP
            </div>
            {me?.groupName && (
              <span className="text-xs bg-green-800 text-green-200 px-2 py-0.5 rounded-full mt-1 inline-block">
                {me.groupName}
              </span>
            )}
          </div>
          <button
            onClick={startEdit}
            className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
          >
            <Edit2 size={14} />
          </button>
        </div>

        {me?.bio && !editing && (
          <p className="text-gray-400 text-sm mb-2">{me.bio}</p>
        )}
        {me?.favoriteTeam && !editing && (
          <p className="text-gray-500 text-xs">⚽ Supports: <span className="text-gray-300">{me.favoriteTeam}</span></p>
        )}

        {editing && (
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Username</label>
              <input
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Bio</label>
              <textarea
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 h-20 resize-none"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Favorite Team</label>
              <input
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={saveEdit} className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <Save size={13} /> Save
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <X size={13} /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 text-sm">Demo: Switch User</h3>
        <p className="text-gray-500 text-xs mb-3">Switch between demo users to test multi-user features (chat, pokes, predictions).</p>
        <div className="flex gap-2 flex-wrap">
          {DEMO_USERS.map((id) => (
            <button
              key={id}
              onClick={() => switchUser(id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                userId === id ? "bg-green-600 text-white" : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              User {id}
            </button>
          ))}
        </div>
      </div>

      {me?.isAdmin && (
        <div className="bg-gray-800 border border-yellow-700/40 rounded-xl p-4">
          <span className="text-yellow-400 text-sm font-semibold">👑 Admin User</span>
          <p className="text-gray-500 text-xs mt-1">You can create and manage matches via the API.</p>
        </div>
      )}
    </div>
  );
}
