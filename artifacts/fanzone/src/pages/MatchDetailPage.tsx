import { useState, useRef, useEffect } from "react";
import { useParams } from "wouter";
import {
  useGetMatch,
  useListChatMessages,
  useSendChatMessage,
  useListForumPosts,
  useCreateForumPost,
  useListPokes,
  useSendPoke,
  useGetMyPrediction,
  useSubmitPrediction,
} from "@workspace/api-client-react";
import { useCurrentUser } from "@/contexts/UserContext";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Send, Plus, Zap, Target, MessageCircle, BookOpen, Flame } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type Tab = "chat" | "forum" | "predict" | "pokes";

export function MatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const matchId = parseInt(id);
  const { userId } = useCurrentUser();
  const [tab, setTab] = useState<Tab>("chat");

  const { data: match, isLoading } = useGetMatch(matchId);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-40 bg-gray-800 rounded-xl" />
        <Skeleton className="h-96 bg-gray-800 rounded-xl" />
      </div>
    );
  }

  if (!match) return <div className="text-gray-400 p-8">Match not found.</div>;

  const tabs = [
    { key: "chat" as Tab, label: "Live Chat", icon: MessageCircle },
    { key: "forum" as Tab, label: "Forum", icon: BookOpen },
    { key: "predict" as Tab, label: "Predict", icon: Target },
    { key: "pokes" as Tab, label: "Pokes", icon: Flame },
  ];

  const statusBadge: Record<string, string> = {
    live: "bg-red-500 animate-pulse",
    upcoming: "bg-blue-500",
    settled: "bg-gray-500",
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className={cn("text-xs text-white px-2 py-0.5 rounded-full font-medium", statusBadge[match.status])}>
            {match.status.toUpperCase()}
          </span>
          {match.status === "settled" && match.homeScore != null && (
            <span className="text-white font-bold text-lg">
              {match.homeScore} – {match.awayScore}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-white">
          <div className="text-center flex-1">
            <div className="text-2xl font-bold">{match.homeTeam}</div>
            <div className="text-gray-400 text-sm">Home</div>
          </div>
          <div className="text-gray-500 font-bold text-xl px-4">VS</div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold">{match.awayTeam}</div>
            <div className="text-gray-400 text-sm">Away</div>
          </div>
        </div>

        <p className="text-gray-400 text-sm mt-4 text-center">{match.description}</p>
      </div>

      <div className="flex gap-1 mb-4 bg-gray-800 p-1 rounded-lg">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-sm font-medium transition-colors",
              tab === key ? "bg-green-600 text-white" : "text-gray-400 hover:text-white",
            )}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === "chat" && <ChatTab matchId={matchId} userId={userId} />}
      {tab === "forum" && <ForumTab matchId={matchId} userId={userId} />}
      {tab === "predict" && <PredictTab matchId={matchId} match={match} userId={userId} />}
      {tab === "pokes" && <PokesTab matchId={matchId} userId={userId} />}
    </div>
  );
}

function ChatTab({ matchId, userId }: { matchId: number; userId: number }) {
  const { data: messages, refetch } = useListChatMessages(matchId);
  const { mutate: send } = useSendChatMessage();
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(() => refetch(), 3000);
    return () => clearInterval(interval);
  }, [refetch]);

  const handleSend = () => {
    if (!input.trim()) return;
    send(
      { matchId, data: { content: input.trim() } },
      { onSuccess: () => { setInput(""); refetch(); } },
    );
  };

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700">
      <div className="h-96 overflow-y-auto p-4 space-y-3">
        {messages?.length === 0 && (
          <p className="text-gray-500 text-center py-8">No messages yet. Be the first!</p>
        )}
        {messages?.map((msg) => (
          <div key={msg.id} className={cn("flex gap-2", msg.userId === userId ? "flex-row-reverse" : "")}>
            <div className="w-8 h-8 rounded-full bg-green-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {msg.username[0].toUpperCase()}
            </div>
            <div className={cn("max-w-xs", msg.userId === userId ? "items-end" : "items-start", "flex flex-col")}>
              <span className="text-gray-400 text-xs mb-1">{msg.username}</span>
              <div
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm",
                  msg.userId === userId ? "bg-green-600 text-white rounded-tr-sm" : "bg-gray-700 text-gray-100 rounded-tl-sm",
                )}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-700 p-3 flex gap-2">
        <input
          className="flex-1 bg-gray-700 text-white rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <button
          onClick={handleSend}
          className="bg-green-600 hover:bg-green-500 text-white rounded-full p-2 transition-colors"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

function ForumTab({ matchId, userId }: { matchId: number; userId: number }) {
  const { data: posts, refetch } = useListForumPosts(matchId);
  const { mutate: createPost } = useCreateForumPost();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!title.trim() || !content.trim()) return;
    createPost(
      { matchId, data: { title: title.trim(), content: content.trim() } },
      { onSuccess: () => { setTitle(""); setContent(""); setShowForm(false); refetch(); } },
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={14} /> New Post
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <input
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Post title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 h-24 resize-none"
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Post
          </button>
        </div>
      )}

      {posts?.length === 0 && <p className="text-gray-500 text-center py-8">No forum posts yet.</p>}

      <div className="space-y-3">
        {posts?.map((post) => (
          <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-green-800 flex items-center justify-center text-white text-xs font-bold">
                {post.username[0].toUpperCase()}
              </div>
              <span className="text-gray-400 text-xs">{post.username}</span>
              <span className="text-gray-600 text-xs">· {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}</span>
            </div>
            <h3 className="text-white font-semibold mb-1">{post.title}</h3>
            <p className="text-gray-400 text-sm">{post.content}</p>
            <div className="mt-3 text-gray-500 text-xs">{post.replyCount} replies</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PredictTab({ matchId, match, userId }: { matchId: number; match: { homeTeam: string; awayTeam: string; status: string }; userId: number }) {
  const { data: myPrediction, refetch } = useGetMyPrediction(matchId);
  const { mutate: submit } = useSubmitPrediction();
  const [home, setHome] = useState(0);
  const [away, setAway] = useState(0);

  const locked = match.status === "settled";

  const handleSubmit = () => {
    submit(
      { matchId, data: { homeScore: home, awayScore: away } },
      { onSuccess: () => refetch() },
    );
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-white font-semibold text-lg mb-1 flex items-center gap-2">
        <Target size={18} className="text-green-400" /> Score Prediction
      </h3>
      <p className="text-gray-400 text-sm mb-6">
        Predict the final score. Correct predictions earn <span className="text-yellow-400 font-semibold">100 XP</span>!
      </p>

      {myPrediction && (
        <div className="bg-gray-700 rounded-lg p-3 mb-4 text-sm text-gray-300">
          Your current prediction: <span className="font-bold text-white">{myPrediction.homeScore} – {myPrediction.awayScore}</span>
          {myPrediction.isCorrect === true && <span className="ml-2 text-green-400">✓ Correct! +{myPrediction.xpAwarded} XP</span>}
          {myPrediction.isCorrect === false && <span className="ml-2 text-red-400">✗ Incorrect</span>}
        </div>
      )}

      {!locked && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 text-center">
              <div className="text-gray-400 text-sm mb-2">{match.homeTeam}</div>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setHome(Math.max(0, home - 1))} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold transition-colors">−</button>
                <span className="text-white font-bold text-2xl w-8 text-center">{home}</span>
                <button onClick={() => setHome(home + 1)} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold transition-colors">+</button>
              </div>
            </div>
            <div className="text-gray-500 font-bold">–</div>
            <div className="flex-1 text-center">
              <div className="text-gray-400 text-sm mb-2">{match.awayTeam}</div>
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => setAway(Math.max(0, away - 1))} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold transition-colors">−</button>
                <span className="text-white font-bold text-2xl w-8 text-center">{away}</span>
                <button onClick={() => setAway(away + 1)} className="w-8 h-8 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-bold transition-colors">+</button>
              </div>
            </div>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 hover:bg-green-500 text-white py-2.5 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Zap size={16} /> {myPrediction ? "Update Prediction" : "Submit Prediction"}
          </button>
        </div>
      )}

      {locked && <p className="text-gray-500 text-sm text-center">Match is settled. Predictions are closed.</p>}
    </div>
  );
}

function PokesTab({ matchId, userId }: { matchId: number; userId: number }) {
  const { data: pokes, refetch } = useListPokes(matchId);
  const { mutate: sendPoke } = useSendPoke();
  const [toUserId, setToUserId] = useState("");

  const handlePoke = () => {
    const id = parseInt(toUserId);
    if (!id || isNaN(id)) return;
    sendPoke(
      { matchId, data: { toUserId: id } },
      { onSuccess: () => { setToUserId(""); refetch(); } },
    );
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Flame size={20} className="text-orange-400" />
        <h3 className="text-white font-semibold text-lg">Pokes</h3>
        <span className="text-orange-400 font-bold text-lg">{pokes?.totalPokes ?? 0}</span>
      </div>

      <div className="flex gap-2 mb-6">
        <input
          type="number"
          className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="User ID to poke…"
          value={toUserId}
          onChange={(e) => setToUserId(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handlePoke()}
        />
        <button
          onClick={handlePoke}
          className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          Poke 👉
        </button>
      </div>

      {pokes?.recentPokes.length === 0 && <p className="text-gray-500 text-sm text-center">No pokes yet!</p>}

      <div className="space-y-2">
        {pokes?.recentPokes.map((p) => (
          <div key={p.id} className="flex items-center gap-2 text-sm text-gray-300 bg-gray-700 rounded-lg px-3 py-2">
            <span className="font-medium text-white">{p.fromUsername}</span>
            <span className="text-orange-400">👉</span>
            <span className="font-medium text-white">{p.toUsername}</span>
            <span className="ml-auto text-gray-500 text-xs">{formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
