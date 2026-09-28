import React, { useEffect, useRef, useState } from "react";
import api from "../services/api";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const ref = useRef(null);

  async function load() {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data.notifications);
      setUnreadCount(res.data.data.unreadCount);
    } catch {
      // Non-fatal - notification bell simply stays empty if the call fails.
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // poll every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function markAllRead() {
    await api.patch("/notifications/read-all");
    await load();
  }

  const TYPE_ICON = { ALERT: "⚠", ANOMALY: "∿", RECOMMENDATION: "◆", RECOVERY: "✓", SYSTEM: "ℹ" };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative text-base-400 hover:text-base-100 transition-colors w-8 h-8 flex items-center justify-center rounded-lg hover:bg-base-800"
      >
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 min-w-4 px-1 rounded-full bg-signal-red text-[10px] leading-4 text-white text-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto scrollbar-thin bg-base-900 border border-base-700 rounded-xl shadow-glow z-20">
          <div className="flex items-center justify-between px-4 py-3 border-b border-base-800">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-signal-cyan hover:underline">Mark all read</button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-base-500 text-center">No notifications yet.</div>
          ) : (
            <div className="divide-y divide-base-800">
              {notifications.map((n) => (
                <div key={n._id} className={`px-4 py-3 text-sm ${!n.readAt ? "bg-signal-cyan/5" : ""}`}>
                  <div className="flex gap-2">
                    <span className="text-base-400 shrink-0">{TYPE_ICON[n.type] || "•"}</span>
                    <div>
                      <div className="font-medium text-base-100">{n.title}</div>
                      <div className="text-xs text-base-500 mt-0.5">{n.message}</div>
                      <div className="text-[10px] text-base-500 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
