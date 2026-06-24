import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/contexts/UserContext";
import { useGetMe } from "@workspace/api-client-react";
import {
  Heart, Trash2, Send, Zap, Users, MessageCircle,
  ChevronDown, ChevronUp, Radio, X, ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const EMOJI_REACTIONS = ["⚽", "🔥", "❤️", "😱", "👏", "🎉"];

interface ReactionMap {
  [emoji: string]: { count: number; reactedByMe: boolean };
}

interface FeedPost {
  id: number;
  userId: number;
  content: string;
  isStream: boolean;
  streamUrl: string | null;
  streamTitle: string | null;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
  favoriteTeam: string | null;
  xp: number;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  reactions: ReactionMap;
}

interface FeedComment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  createdAt: string;
  username: string;
  avatarUrl: string | null;
  xp: number;
}

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const ytId =
      (u.hostname.includes("youtube.com") && u.searchParams.get("v")) ||
      (u.hostname === "youtu.be" && u.pathname.slice(1));
    if (ytId) return `https://www.youtube.com/embed/${ytId}?autoplay=0&rel=0`;
    if (u.hostname.includes("twitch.tv")) {
      const channel = u.pathname.split("/").filter(Boolean)[0];
      if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&muted=true`;
    }
    const dmMatch = url.match(/dailymotion\.com\/video\/([^_]+)/);
    if (dmMatch) return `https://www.dailymotion.com/embed/video/${dmMatch[1]}`;
    return url;
  } catch {
    return null;
  }
}

function Avatar({ username, avatarUrl, size = 10 }: { username: string; avatarUrl?: string | null; size?: number }) {
  const sizeClass = `w-${size} h-${size}`;
  if (avatarUrl) {
    return <img src={avatarUrl} alt={username} className={cn("rounded-full object-cover shrink-0", sizeClass)} />;
  }
  return (
    <div
      className={cn("rounded-full bg-green-700 flex items-center justify-center text-white font-bold shrink-0 select-none", sizeClass)}
      style={{ fontSize: size * 3.5 }}
    >
      {username[0]?.toUpperCase()}
    </div>
  );
}

function StreamPlayer({ url, title }: { url: string; title?: string | null }) {
  const [error, setError] = useState(false);
  const embedUrl = useMemo(() => getEmbedUrl(url), [url]);

  if (!embedUrl || error) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 justify-center w-full aspect-video bg-gray-800 rounded-xl border border-red-900/40 hover:border-red-500 transition-colors text-gray-400 hover:text-red-400"
      >
        <ExternalLink size={18} />
        <span className="text-sm font-medium">Watch Live Stream</span>
      </a>
    );
  }

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border border-gray-800">
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        onError={() => setError(true)}
      />
    </div>
  );
}

function EmojiReactionBar({ post }: { post: FeedPost }) {
  const queryClient = useQueryClient();

  const reactMutation = useMutation({
    mutationFn: async (emoji: string) => {
      const res = await fetch(`/api/feed/${post.id}/react`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emoji }),
      });
      return res.json() as Promise<{ reacted: boolean; emoji: string }>;
    },
    onMutate: async (emoji) => {
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const prev = queryClient.getQueryData<FeedPost[]>(["feed"]);
      queryClient.setQueryData<FeedPost[]>(["feed"], (old) =>
        old?.map((p) => {
          if (p.id !== post.id) return p;
          const current = p.reactions[emoji] ?? { count: 0, reactedByMe: false };
          return {
            ...p,
            reactions: {
              ...p.reactions,
              [emoji]: {
                count: current.reactedByMe ? current.count - 1 : current.count + 1,
                reactedByMe: !current.reactedByMe,
              },
            },
          };
        }),
      );
      return { prev };
    },
    onError: (_err, _v, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(["feed"], ctx.prev);
    },
  });

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {EMOJI_REACTIONS.map((emoji) => {
        const r = post.reactions[emoji];
        const count = r?.count ?? 0;
        const active = r?.reactedByMe ?? false;
        return (
          <button
            key={emoji}
            onClick={() => reactMutation.mutate(emoji)}
            className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-all",
              active
                ? "bg-green-900/40 border-green-500 text-green-300"
                : "bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500",
            )}
          >
            <span>{emoji}</span>
            {count > 0 && <span className="text-xs font-semibold">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function CommentSection({ post }: { post: FeedPost }) {
  const { userId } = useCurrentUser();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: comments = [], isLoading } = useQuery<FeedComment[]>({
    queryKey: ["feed-comments", post.id],
    queryFn: async () => {
      const res = await fetch(`/api/feed/${post.id}/comments`, {
        credentials: "include",
      });
      return res.json();
    },
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/feed/${post.id}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json() as Promise<FeedComment>;
    },
    onSuccess: (c) => {
      queryClient.setQueryData<FeedComment[]>(["feed-comments", post.id], (old) => [...(old ?? []), c]);
      queryClient.setQueryData<FeedPost[]>(["feed"], (old) =>
        old?.map((p) => (p.id === post.id ? { ...p, commentCount: p.commentCount + 1 } : p)),
      );
      setCommentText("");
    },
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: number) => {
      await fetch(`/api/feed/${post.id}/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: (_data, commentId) => {
      queryClient.setQueryData<FeedComment[]>(["feed-comments", post.id], (old) => old?.filter((c) => c.id !== commentId));
      queryClient.setQueryData<FeedPost[]>(["feed"], (old) =>
        old?.map((p) => (p.id === post.id ? { ...p, commentCount: Math.max(0, p.commentCount - 1) } : p)),
      );
    },
  });

  return (
    <div className="mt-3 pt-3 border-t border-gray-800">
      {isLoading ? (
        <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-3/4" /></div>
      ) : (
        <div className="space-y-2.5">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 group">
              <Avatar username={c.username} avatarUrl={c.avatarUrl} size={7} />
              <div className="flex-1 min-w-0">
                <div className="bg-gray-800 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-white">{c.username}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-500">
                        {formatDistanceToNow(new Date(c.createdAt), { addSuffix: true })}
                      </span>
                      {c.userId === userId && (
                        <button
                          onClick={() => deleteComment.mutate(c.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-300 mt-0.5 break-words">{c.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2 mt-3">
        <Avatar username="You" avatarUrl={null} size={7} />
        <div className="flex-1 flex gap-1.5">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (commentText.trim()) addComment.mutate(commentText.trim()); }
            }}
            placeholder="Write a comment…"
            maxLength={300}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
          />
          <button
            onClick={() => { if (commentText.trim()) addComment.mutate(commentText.trim()); }}
            disabled={!commentText.trim() || addComment.isPending}
            className="flex items-center justify-center w-8 h-8 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white rounded-lg transition-colors shrink-0"
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, currentUserId, isAdmin }: { post: FeedPost; currentUserId: number; isAdmin: boolean }) {
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);

  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/feed/${post.id}/like`, {
        method: "POST",
        credentials: "include",
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
    onError: (_err, _v, ctx) => { if (ctx?.prev) queryClient.setQueryData(["feed"], ctx.prev); },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/feed/${post.id}`, {
        method: "DELETE",
        credentials: "include",
      });
    },
    onSuccess: () => {
      queryClient.setQueryData<FeedPost[]>(["feed"], (old) => old?.filter((p) => p.id !== post.id));
    },
  });

  const canDelete = post.userId === currentUserId || isAdmin;

  return (
    <div className={cn(
      "border rounded-xl p-4 transition-colors",
      post.isStream
        ? "bg-gray-900 border-red-900/60 hover:border-red-700/60"
        : "bg-gray-900 border-gray-800 hover:border-gray-700",
    )}>
      {post.isStream && (
        <div className="flex items-center gap-2 mb-3">
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400 bg-red-950/60 border border-red-900/60 px-2.5 py-1 rounded-full animate-pulse">
            <Radio size={11} />
            LIVE STREAM
          </span>
          {post.streamTitle && (
            <span className="text-sm font-semibold text-white truncate">{post.streamTitle}</span>
          )}
        </div>
      )}

      {post.isStream && post.streamUrl && (
        <div className="mb-4">
          <StreamPlayer url={post.streamUrl} title={post.streamTitle} />
        </div>
      )}

      <div className="flex gap-3">
        <Avatar username={post.username} avatarUrl={post.avatarUrl} size={10} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white text-sm">{post.username}</span>
              {post.favoriteTeam && (
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Users size={11} />{post.favoriteTeam}
                </span>
              )}
              <span className="text-xs text-yellow-400 flex items-center gap-1">
                <Zap size={11} />{post.xp} XP
              </span>
            </div>
            <span className="text-xs text-gray-500 shrink-0">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-200 leading-relaxed whitespace-pre-wrap break-words">{post.content}</p>

          <EmojiReactionBar post={post} />

          <div className="flex items-center gap-4 mt-2">
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

            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-400 transition-colors"
            >
              <MessageCircle size={14} />
              <span>{post.commentCount}</span>
              {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {canDelete && (
              <button
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-red-400 transition-colors ml-auto"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>

          {showComments && <CommentSection post={post} />}
        </div>
      </div>
    </div>
  );
}

function GoLiveDialog({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: "", url: "", caption: "" });

  const postStream = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/feed", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: form.caption || `🔴 LIVE NOW: ${form.title}`,
          isStream: true,
          streamUrl: form.url,
          streamTitle: form.title,
        }),
      });
      if (!res.ok) throw new Error("Failed to post stream");
      return res.json() as Promise<FeedPost>;
    },
    onSuccess: (newPost) => {
      queryClient.setQueryData<FeedPost[]>(["feed"], (old) => [newPost, ...(old ?? [])]);
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-red-900/60 rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-red-400 animate-pulse" />
            <h3 className="text-white font-bold text-lg">Post Live Stream</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Stream Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Arsenal vs Liverpool — Premier League"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Stream URL *</label>
            <input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="YouTube, Twitch, or direct stream URL"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            />
            <p className="text-[10px] text-gray-600 mt-1">Supports YouTube, Twitch, Dailymotion, and more</p>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Caption (optional)</label>
            <textarea
              value={form.caption}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="Add a message for fans…"
              rows={2}
              maxLength={500}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-red-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={() => postStream.mutate()}
            disabled={!form.title.trim() || !form.url.trim() || postStream.isPending}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-semibold transition-colors"
          >
            <Radio size={15} />
            {postStream.isPending ? "Going Live…" : "Go Live"}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function PostComposer({ isAdmin }: { isAdmin: boolean }) {
  const [content, setContent] = useState("");
  const [showGoLive, setShowGoLive] = useState(false);
  const queryClient = useQueryClient();

  const postMutation = useMutation({
    mutationFn: async (text: string) => {
      const res = await fetch("/api/feed", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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

  const remaining = 500 - content.length;

  return (
    <>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && content.trim()) postMutation.mutate(content.trim());
          }}
          placeholder="What's on your mind? Share a match reaction, opinion, or highlight…"
          rows={3}
          maxLength={500}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-green-500 transition-colors"
        />
        <div className="flex items-center justify-between mt-2 gap-2">
          <span className={cn("text-xs", remaining < 50 ? "text-red-400" : "text-gray-600")}>
            {remaining} remaining
          </span>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => setShowGoLive(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <Radio size={13} />
                Go Live
              </button>
            )}
            <button
              onClick={() => { if (content.trim()) postMutation.mutate(content.trim()); }}
              disabled={!content.trim() || postMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
            >
              <Send size={13} />
              {postMutation.isPending ? "Posting…" : "Post"}
            </button>
          </div>
        </div>
      </div>
      {showGoLive && <GoLiveDialog onClose={() => setShowGoLive(false)} />}
    </>
  );
}

export function FeedPage() {
  const { userId } = useCurrentUser();
  const { data: me } = useGetMe();
  const isAdmin = me?.isAdmin ?? false;

  const { data: posts, isLoading } = useQuery<FeedPost[]>({
    queryKey: ["feed"],
    queryFn: async () => {
      const res = await fetch("/api/feed", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load feed");
      return res.json();
    },
    refetchInterval: 8_000,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <PostComposer isAdmin={isAdmin} />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <div className="text-4xl mb-3">📣</div>
          <p className="font-medium text-gray-400">No posts yet</p>
          <p className="text-sm mt-1">Be the first to share something with the community!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={userId}
              isAdmin={isAdmin}
            />
          ))}
        </div>
      )}
    </div>
  );
}
