import React from "react";

// Signature visual element: a pulse ring representing overall infrastructure health.
export default function HealthRing({ score = 0, size = 96 }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.max(0, Math.min(100, score));
  const offset = circumference - (pct / 100) * circumference;
  const color = pct >= 90 ? "#3FD4C8" : pct >= 75 ? "#3FD4C8" : pct >= 50 ? "#F0A84E" : "#EF5B5B";

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#182233" strokeWidth="8" fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth="8" fill="none" strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease", filter: `drop-shadow(0 0 6px ${color}66)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="metric-num text-xl font-semibold text-base-100">{Math.round(pct)}</span>
        <span className="text-[10px] text-base-500">HEALTH</span>
      </div>
    </div>
  );
}
