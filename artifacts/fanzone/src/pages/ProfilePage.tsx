import { useState } from "react";
import { useGetMe, useUpdateMe } from "@workspace/api-client-react";
import { useClerk, useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Zap, Edit2, Save, X, Shield, LogOut } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export function ProfilePage() {
  const qc = useQueryClient();
  const { signOut } = useClerk();
  const { user: clerkUser } = useUser();
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
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: ["/api/users/me"] });
          setEditing(false);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-32 bg-gray-800 rounded-xl" />
        <Skeleton className="h-48 bg-gray-800 rounded-xl" />
      </div>
    );
  }

  const avatarInitial = me?.username?.[0]?.toUpperCase() ?? clerkUser?.firstName?.[0]?.toUpperCase() ?? "?";

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-green-700 flex items-center justify-center text-white text-2xl font-bold">
            {avatarInitial}
          </div>
          <div className="flex-1">
            <h2 className="text-white text-xl font-bold">{me?.username}</h2>
            <div className="flex items-center gap-2 text-yellow-400 font-semibold">
              <Zap size={14} />
              {me?.xp} XP
            </div>
            {me?.isAdmin && (
              <span className="inline-flex items-center gap-1 text-xs text-purple-400 font-medium mt-0.5">
                <Shield size={11} /> Admin
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {!editing && (
              <button
                onClick={startEdit}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
              >
                <Edit2 size={15} />
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Username</label>
              <input
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Bio</label>
              <textarea
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500 resize-none"
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Favorite Team</label>
              <input
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-green-500"
                value={favoriteTeam}
                onChange={(e) => setFavoriteTeam(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEdit}
                className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Save size={14} /> Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            {me?.bio && <p className="text-gray-300">{me.bio}</p>}
            {me?.favoriteTeam && (
              <p className="text-gray-400">
                ⚽ Supports <span className="text-white font-medium">{me.favoriteTeam}</span>
              </p>
            )}
            {me?.groupId && (
              <p className="text-gray-400">
                👥 Member of{" "}
                <Link href="/groups" className="text-green-400 hover:underline">
                  {me.groupId ? "a fan group" : "no group"}
                </Link>
              </p>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">Account</h3>
        {clerkUser?.primaryEmailAddress && (
          <p className="text-sm text-gray-400 mb-4">
            Signed in as{" "}
            <span className="text-gray-200">{clerkUser.primaryEmailAddress.emailAddress}</span>
          </p>
        )}
        <button
          onClick={() => signOut({ redirectUrl: basePath || "/" })}
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 font-medium transition-colors"
        >
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  );
}

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
