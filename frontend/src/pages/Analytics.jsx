import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";
import StatusBadge from "../components/StatusBadge";

export default function Analytics() {
  const [comparison, setComparison] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get("/analytics/comparison"), api.get("/analytics/anomalies")])
      .then(([c, a]) => { setComparison(c.data.data.comparison); setAnomalies(a.data.data.anomalies); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;

  const chartData = Object.entries(comparison || {}).map(([provider, m]) => ({ provider, ...m }));

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-base-800 bg-base-900/60 p-5">
        <div className="text-sm text-base-500 mb-4">Cross-Cloud Comparison</div>
        {chartData.length === 0 ? <EmptyState title="No comparison data yet" message="Connect at least one provider and let a monitoring cycle run." /> : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#182233" />
                <XAxis dataKey="provider" stroke="#5B7196" fontSize={12} />
                <YAxis stroke="#5B7196" fontSize={12} />
                <Tooltip contentStyle={{ background: "#131A27", border: "1px solid #25324A", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="avgCpu" fill="#3FD4C8" name="Avg CPU %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgMemory" fill="#8B7FE8" name="Avg Memory %" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgHealth" fill="#F0A84E" name="Avg Health" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              {chartData.map((c) => (
                <div key={c.provider} className="text-xs text-base-500 border border-base-800 rounded-lg px-3 py-2">
                  <span className="text-base-100">{c.provider}</span> efficiency:{" "}
                  <span className="text-signal-cyan metric-num">{c.efficiency ?? "—"}</span>
                </div>
              ))}
            </div>
          </>
        )}
        <p className="text-xs text-base-500 mt-3">
          Comparison reflects measured metrics only — CloudViz does not claim one provider is universally "better."
        </p>
      </div>

      <div className="rounded-xl border border-base-800 bg-base-900/60 p-5">
        <div className="text-sm text-base-500 mb-4">Recent Anomalies</div>
        {anomalies.length === 0 ? <div className="text-sm text-base-500">No anomalies detected yet.</div> : (
          <div className="divide-y divide-base-800">
            {anomalies.map((a) => (
              <div key={a._id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{a.resourceId?.resourceName || "Unknown resource"} <span className="text-base-500">· {a.metricType}</span></div>
                  <div className="text-xs text-base-500">Current {a.currentValue}% vs baseline {a.baselineValue}% (deviation {a.deviation})</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
