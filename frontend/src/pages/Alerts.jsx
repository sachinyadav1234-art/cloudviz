import React, { useEffect, useState } from "react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  async function load() {
    setLoading(true);
    const res = await api.get("/alerts");
    setAlerts(res.data.data.alerts);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function act(id, action) {
    setBusy(id);
    try {
      await api.patch(`/alerts/${id}/${action}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState />;
  if (alerts.length === 0) return <EmptyState title="No alerts" message="Threshold violations and anomalies will appear here." />;

  return (
    <div className="rounded-xl border border-base-800 bg-base-900/60 divide-y divide-base-800">
      {alerts.map((a) => (
        <div key={a._id} className="p-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm font-medium">{a.resourceId?.resourceName || "Resource"} <span className="text-base-500">· {a.metricType}</span></div>
            <div className="text-xs text-base-500 mt-1">{a.message}</div>
            <div className="text-xs text-base-500 mt-1">Occurred {a.occurrenceCount}x · Last seen {new Date(a.lastDetectedAt).toLocaleString()}</div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <StatusBadge status={a.severity} />
            <StatusBadge status={a.status} />
            {a.status === "ACTIVE" && (
              <button disabled={busy === a._id} onClick={() => act(a._id, "acknowledge")}
                className="text-xs px-3 py-1.5 rounded-md border border-base-700 hover:border-signal-amber text-base-300 hover:text-signal-amber transition disabled:opacity-50">
                Acknowledge
              </button>
            )}
            {a.status !== "RESOLVED" && (
              <button disabled={busy === a._id} onClick={() => act(a._id, "resolve")}
                className="text-xs px-3 py-1.5 rounded-md border border-base-700 hover:border-signal-cyan text-base-300 hover:text-signal-cyan transition disabled:opacity-50">
                Resolve
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
