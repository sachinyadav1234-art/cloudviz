import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

const CONFIDENCE_COLOR = { HIGH: "text-signal-cyan", MEDIUM: "text-signal-amber", LOW: "text-base-400" };

export default function Optimization() {
  const [recs, setRecs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  async function load() {
    setLoading(true);
    const res = await api.get("/recommendations?status=OPEN");
    setRecs(res.data.data.recommendations);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function act(id, status) {
    setBusy(id);
    try {
      await api.patch(`/recommendations/${id}/status`, { status });
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState />;
  if (recs.length === 0) return <EmptyState title="No open recommendations" message="Optimization opportunities are generated after enough historical data has been collected (roughly 10+ observations per resource)." />;

  return (
    <div className="space-y-4">
      {recs.map((r) => (
        <div key={r._id} className="rounded-xl border border-base-800 bg-base-900/60 p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs text-base-500 uppercase tracking-wide">{r.type.replace(/_/g, " ")}</div>
              <div className="font-medium mt-1">{r.title}</div>
              <div className="text-sm text-base-400 mt-2">{r.observation}</div>
              <div className="text-sm text-base-100 mt-2">→ {r.recommendation}</div>
              <div className="text-xs text-base-500 mt-2">{r.reason}</div>
              <div className="text-xs mt-2">
                Confidence: <span className={CONFIDENCE_COLOR[r.confidence]}>{r.confidence}</span>
                {r.resourceId?.resourceName && <span className="text-base-500"> · {r.resourceId.resourceName} ({r.resourceId.provider})</span>}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button disabled={busy === r._id} onClick={() => act(r._id, "APPLIED")}
                className="text-xs px-3 py-1.5 rounded-md border border-signal-cyan/40 text-signal-cyan hover:bg-signal-cyan/10 transition disabled:opacity-50">
                Mark Applied
              </button>
              <button disabled={busy === r._id} onClick={() => act(r._id, "DISMISSED")}
                className="text-xs px-3 py-1.5 rounded-md border border-base-700 text-base-400 hover:border-signal-red hover:text-signal-red transition disabled:opacity-50">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
