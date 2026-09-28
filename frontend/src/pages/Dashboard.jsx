import React, { useEffect, useState } from "react";
import api from "../services/api";
import MetricCard from "../components/MetricCard";
import HealthRing from "../components/HealthRing";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    api.get("/dashboard/overview")
      .then((res) => { if (!cancelled) setData(res.data.data); })
      .catch(() => { if (!cancelled) setError("Unable to load dashboard data."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <LoadingState label="Loading dashboard..." />;
  if (error) return <EmptyState title="Data temporarily unavailable" message={error} />;

  const total = data?.resources?.total || 0;
  const avgHealth = total > 0
    ? Math.round(((data.resources.excellent * 95 + data.resources.healthy * 82 + data.resources.warning * 60 + data.resources.critical * 30) / total))
    : 0;

  if (total === 0) {
    return (
      <EmptyState
        title="No resources yet"
        message="Connect a cloud provider — or activate Demo Mode — to start seeing live infrastructure intelligence here."
        action={<Link to="/providers" className="mt-4 inline-block text-sm bg-signal-cyan text-base-950 font-medium px-4 py-2 rounded-lg hover:opacity-90">Connect a cloud</Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard label="Total Resources" value={total} accent="plain" />
        <MetricCard label="Average CPU" value={data.averageCpu} suffix="%" accent="cyan" />
        <MetricCard label="Active Alerts" value={data.activeAlerts} accent={data.activeAlerts > 0 ? "red" : "cyan"} />
        <MetricCard label="Open Recommendations" value={data.openRecommendations} accent="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-base-800 bg-base-900/60 p-5 flex items-center gap-5">
          <HealthRing score={avgHealth} />
          <div>
            <div className="text-sm text-base-500">Overall Infrastructure Health</div>
            <div className="text-xs text-base-500 mt-2 space-y-1">
              <div><span className="text-signal-cyan">●</span> Excellent/Healthy: {data.resources.excellent + data.resources.healthy}</div>
              <div><span className="text-signal-amber">●</span> Warning: {data.resources.warning}</div>
              <div><span className="text-signal-red">●</span> Critical: {data.resources.critical}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-base-800 bg-base-900/60 p-5">
          <div className="text-sm text-base-500 mb-4">Resources by Provider</div>
          <div className="space-y-3">
            {Object.entries(data.providers || {}).map(([provider, count]) => (
              <div key={provider} className="flex items-center gap-3">
                <span className="w-14 text-xs text-base-400">{provider}</span>
                <div className="flex-1 h-2 rounded-full bg-base-800 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-signal-cyan to-signal-violet" style={{ width: `${(count / total) * 100}%` }} />
                </div>
                <span className="metric-num text-sm w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/alerts" className="rounded-xl border border-base-800 bg-base-900/60 p-5 hover:border-signal-cyan/40 transition-colors block">
          <div className="text-sm text-base-500">Active Alerts</div>
          <div className="text-2xl font-semibold mt-1 metric-num">{data.activeAlerts}</div>
          <div className="text-xs text-signal-cyan mt-2">View alerts →</div>
        </Link>
        <Link to="/optimization" className="rounded-xl border border-base-800 bg-base-900/60 p-5 hover:border-signal-cyan/40 transition-colors block">
          <div className="text-sm text-base-500">Optimization Opportunities</div>
          <div className="text-2xl font-semibold mt-1 metric-num">{data.openRecommendations}</div>
          <div className="text-xs text-signal-cyan mt-2">View recommendations →</div>
        </Link>
      </div>
    </div>
  );
}
