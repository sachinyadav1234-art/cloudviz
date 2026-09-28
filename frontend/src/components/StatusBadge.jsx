import React from "react";

const STYLES = {
  EXCELLENT: "bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30",
  HEALTHY: "bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30",
  WARNING: "bg-signal-amber/10 text-signal-amber border-signal-amber/30",
  CRITICAL: "bg-signal-red/10 text-signal-red border-signal-red/30",
  ACTIVE: "bg-signal-red/10 text-signal-red border-signal-red/30",
  ACKNOWLEDGED: "bg-signal-amber/10 text-signal-amber border-signal-amber/30",
  RESOLVED: "bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30",
  CONNECTED: "bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30",
  DISCONNECTED: "bg-base-700/40 text-base-400 border-base-600",
  ERROR: "bg-signal-red/10 text-signal-red border-signal-red/30",
  OPEN: "bg-signal-violet/10 text-signal-violet border-signal-violet/30",
  RUNNING: "bg-signal-cyan/10 text-signal-cyan border-signal-cyan/30",
  STOPPED: "bg-base-700/40 text-base-400 border-base-600"
};

export default function StatusBadge({ status }) {
  const style = STYLES[status] || "bg-base-700/40 text-base-400 border-base-600";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${style}`}>
      {status}
    </span>
  );
}
