import React from "react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Topbar({ title }) {
  const { user, logout } = useAuth();
  return (
    <header className="h-16 shrink-0 border-b border-base-800 flex items-center justify-between px-6">
      <h1 className="font-display font-semibold text-lg text-base-100">{title}</h1>
      <div className="flex items-center gap-4">
        <NotificationBell />
        <div className="text-sm text-base-400">
          <span className="text-base-100">{user?.name}</span>
        </div>
        <button
          onClick={logout}
          className="text-xs px-3 py-1.5 rounded-md border border-base-700 text-base-400 hover:text-base-100 hover:border-base-500 transition-colors"
        >
          Log out
        </button>
      </div>
    </header>
  );
}
