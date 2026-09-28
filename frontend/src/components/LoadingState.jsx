import React from "react";

export default function LoadingState({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-base-400 text-sm py-10 justify-center">
      <span className="h-2 w-2 rounded-full bg-signal-cyan animate-pulse" />
      {label}
    </div>
  );
}
