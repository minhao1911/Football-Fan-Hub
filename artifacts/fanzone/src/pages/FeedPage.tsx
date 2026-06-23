import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/UserContext";
import { Heart, Trash2, Send, Zap, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface FeedPost {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
  favoriteTeam: string | null;
  xp: number;
  likeCount: number;
  likedByMe: boolean;
}

function Avatar({ username, avatarUrl, size = 9 }: { username: string; avatarUrl?: string | null; size?: number }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={username}
        className={cn("rounded-full object-cover shrink-0", `w-${size} h-${size}`)}
      />
    );
  }
  return (
    <div
      className={cn(
        "rounded-full bg-green-700 flex items-center justify-center text-white font-bold shrink-0",
        `w-${size} h-${size}`,
      )}
      style={{ fontSize: size * 3.5 }}
    >
      {username[0]?.toUpperCase()}
    </div>
  );
}

function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId: number }) {
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/feed/${post.id}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${userId}` },
      });
      return res.json();
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const prev = queryClient.getQueryData<FeedPost[]>(["feed"]);
      queryClient.setQueryData<FeedPost[]>(["feed"], (old) =>
        old?.map((p) =>
          p.id === post.id
            ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 }
            : p,
        ),
      );
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["feed"], ctx.prev);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/feed/${post.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${userId}` },
      });
    },
    onSuccess: () => {
      queryClient.setQueryData<FeedPost[]>(["feed"], (old) => old?.filter((p) => p.id !== post.id));
    },
  });

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex gap-3">
        <Avatar username={post.username} avatarUrl={post.avatarUrl} size={10} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">{post.username}</span>
              {post.favoriteTeam && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users size={11} />
                  {post.favoriteTeam}
                </span>
              )}
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <Zap size={11} />
                {post.xp} XP
              </span>
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>

          <div className="flex items-center gap-4 mt-3">
            <button
              onClick={() => likeMutation.mutate()}
              className={cn(
                "flex items-center gap-1.5 text-xs transition-colors",
                post.likedByMe ? "text-red-400 hover:text-red-300" : "text-gray-500 hover:text-red-400",
              )}
            >
              <Heart size={14} fill={post.likedByMe ? "currentColor" : "none"} />
              <span>{post.likeCount}</span>
            </button>

            {post.userId === currentUserId && (
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors ml-auto"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PostComposer({ currentUserId }: { currentUserId: number }) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();
  const { userId } = useCurrentUser();

  const postMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/feed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userId}`,
        },
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) throw new Error("Failed to post");
      return res.json() as Promise<FeedPost>;
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<FeedPost[]>(["feed"], (old) => [newPost, ...(old ?? [])]);
      setContent("");
    },
  });

  const handleSubmit = () => {
    const trimmed = content.trim();
    if (!trimmed || postMutation.isPending) return;
    postMutation.mutate(trimmed);
  };

  const remaining = 500 - content.length;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
        }}
        placeholder="What's on your mind? Share a match reaction, opinion, or highlight..."
        rows={3}
        maxLength={500}
        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-green-500 transition-colors"
      />
      <div className="flex items-center justify-between mt-2">
        <span className={cn("text-xs", remaining < 50 ? "text-red-400" : "text-gray-600")}>
          {remaining} characters remaining
        </span>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || postMutation.isPending}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Send size={13} />
          {postMutation.isPending ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}

export function FeedPage() {
  const { userId } = useCurrentUser();

  const { data: posts, isLoading } = useQuery<FeedPost[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      const res = await fetch("/api/feed", {
        headers: { Authorization: `Bearer ${userId}` },
      });
      if (!res.ok) throw new Error("Failed to load feed");
      return res.json();
    },
    refetchInterval: 10_000,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-white mb-6">Fan Feed</h1>

      <div className="mb-5">
        <PostComposer currentUserId={userId} />
      </div>

      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : posts && posts.length > 0 ? (
          posts.map((post) => <PostCard key={post.id} post={post} currentUserId={userId} />)
        ) : (
          <div className="text-center py-16 text-gray-500">
            <div className="text-4xl mb-3">📢</div>
            <p className="font-medium">No posts yet</p>
            <p className="text-sm mt-1">Be the first to share something with the fan community!</p>
          </div>
        )}
      </div>
    </div>
  );
}
