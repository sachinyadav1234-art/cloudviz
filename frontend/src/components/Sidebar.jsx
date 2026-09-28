import React from "react";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", icon: "◈" },
  { to: "/providers", label: "Providers", icon: "☁" },
  { to: "/resources", label: "Resources", icon: "▤" },
  { to: "/analytics", label: "Analytics", icon: "∿" },
  { to: "/alerts", label: "Alerts", icon: "⚠" },
  { to: "/cost", label: "Cost", icon: "₹" },
  { to: "/optimization", label: "Optimization", icon: "◆" },
  { to: "/regions", label: "Regions", icon: "◎" },
  { to: "/settings", label: "Settings", icon: "⚙" }
];

export default function Sidebar() {
  return (
    <aside className="w-60 shrink-0 border-r border-base-800 bg-base-900/60 backdrop-blur-sm flex flex-col">
      <div className="px-5 py-6 flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-gradient-to-br from-signal-cyan to-signal-violet flex items-center justify-center text-base-950 font-display font-bold">C</div>
        <div>
          <div className="font-display font-semibold text-base-100 leading-none">CloudViz</div>
          <div className="text-[10px] text-base-500 tracking-wide mt-0.5">RESOURCE INTELLIGENCE</div>
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/20"
                  : "text-base-400 hover:text-base-100 hover:bg-base-800/60 border border-transparent"
              }`
            }
          >
            <span className="w-4 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 text-[11px] text-base-500 border-t border-base-800">
        CloudViz v1.0 · Demo Mode Ready
      </div>
    </aside>
  );
}
