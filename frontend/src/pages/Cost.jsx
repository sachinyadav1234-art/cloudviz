import React, { useEffect, useState } from "react";
import api from "../services/api";
import MetricCard from "../components/MetricCard";
import LoadingState from "../components/LoadingState";

export default function Cost() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setLoading(true);
    const res = await api.get("/cost");
    setSummary(res.data.data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      await api.post("/cost/refresh");
      await load();
    } catch (err) {
      // No demo account connected yet - surfaced via summary staying empty
    } finally {
      setRefreshing(false);
    }
  }

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="text-sm text-base-500">
          Figures are {summary?.recentRecords?.[0]?.isEstimated === false ? "actual" : "estimated / demo"} unless your live billing API is enabled.
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="text-xs px-3 py-1.5 rounded-md border border-base-700 hover:border-signal-cyan text-base-300 hover:text-signal-cyan transition disabled:opacity-50">
          {refreshing ? "Refreshing..." : "Refresh demo cost data"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard label="Total Monthly Cost" value={summary?.total ? `₹${summary.total.toLocaleString("en-IN")}` : null} accent="plain" />
        {Object.entries(summary?.byProvider || {}).map(([provider, v]) => (
          <MetricCard key={provider} label={`${provider} Cost`} value={`₹${v.amount.toLocaleString("en-IN")}`} accent="cyan" sub={v.isEstimated ? "Estimated" : "Actual"} />
        ))}
      </div>

      {(!summary || summary.total === 0) && (
        <div className="text-sm text-base-500">
          No cost data yet. Connect Demo Mode (or a live provider with billing access) and click "Refresh demo cost data."
        </div>
      )}
    </div>
  );
}
