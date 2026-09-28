import React from "react";

export default function MetricCard({ label, value, suffix = "", accent = "cyan", sub }) {
  const accentClass = {
    cyan: "text-signal-cyan",
    amber: "text-signal-amber",
    red: "text-signal-red",
    violet: "text-signal-violet",
    plain: "text-base-100"
  }[accent];

  return (
    <div className="rounded-xl border border-base-800 bg-base-900/60 p-4">
      <div className="text-xs text-base-500 uppercase tracking-wide">{label}</div>
      <div className={`metric-num text-3xl font-semibold mt-2 ${accentClass}`}>
        {value ?? "—"}{value !== null && value !== undefined ? suffix : ""}
      </div>
      {sub && <div className="text-xs text-base-500 mt-1">{sub}</div>}
    </div>
  );
}
