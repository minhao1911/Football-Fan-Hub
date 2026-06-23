import { useState, useEffect, useCallback, useRef } from "react";
import { Bell } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/contexts/UserContext";

interface Notification {
  id: number;
  type: "poke" | "forum_reply" | "match_live" | "stream_live";
  title: string;
  body: string;
  matchId: number | null;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_ICON: Record<string, string> = {
  poke: "👉",
  forum_reply: "💬",
  match_live: "🔴",
  stream_live: "📡",
};

function requestDesktopPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showDesktopNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "/favicon.svg",
        badge: "/favicon.svg",
      });
    } catch {
      // Some browsers restrict Notification in iframes — silently ignore
    }
  }
}

export function NotificationBell() {
  const { userId } = useCurrentUser();
  const [, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const seenIds = useRef<Set<number>>(new Set());
  const isFirstFetch = useRef(true);

  // Ask for desktop notification permission once
  useEffect(() => {
    requestDesktopPermission();
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${userId}` },
      });
      if (!res.ok) return;
      const data: Notification[] = await res.json();

      // On subsequent polls, fire desktop notifications for new unread items
      if (!isFirstFetch.current) {
        for (const n of data) {
          if (!n.isRead && !seenIds.current.has(n.id)) {
            showDesktopNotification(n.title, n.body);
          }
        }
      } else {
        isFirstFetch.current = false;
      }

      // Track all notification IDs we've seen
      data.forEach((n) => seenIds.current.add(n.id));

      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch {
      // silently ignore
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${userId}` },
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: number) => {
    await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${userId}` },
    });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
    setOpen(false);
    if (n.matchId) navigate(`/matches/${n.matchId}`);
    else if (n.type === "stream_live") navigate("/feed");
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative flex items-center justify-center w-8 h-8 rounded-md transition-colors",
          open ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-800 hover:text-white",
        )}
        aria-label="Notifications"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[16px] h-4 px-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-700">
              <span className="text-sm font-semibold text-white">Notifications</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs text-green-400 hover:text-green-300 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-gray-800">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  <Bell size={24} className="mx-auto mb-2 opacity-30" />
                  No notifications yet
                </div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-gray-800",
                      !n.isRead && "bg-gray-800/60",
                    )}
                  >
                    <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[n.type] ?? "🔔"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{n.title}</p>
                        {!n.isRead && <span className="shrink-0 w-2 h-2 rounded-full bg-green-500" />}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.body}</p>
                      <p className="text-[10px] text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
