import React, { useEffect, useState } from "react";
import api from "../services/api";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

export default function Regions() {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/regions")
      .then((res) => setRegions(res.data.data.regions))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState />;
  if (regions.length === 0) return <EmptyState title="No regions yet" message="Connect a cloud provider to see resource distribution by region." />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {regions.map((r) => (
        <div key={r.region} className="rounded-xl border border-base-800 bg-base-900/60 p-5">
          <div className="font-medium">{r.region}</div>
          <div className="text-sm text-base-500 mt-1">{r.resourceCount} resource{r.resourceCount !== 1 ? "s" : ""}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(r.providers).map(([provider, count]) => (
              <span key={provider} className="text-xs px-2 py-1 rounded-full bg-base-800 text-base-400">
                {provider}: {count}
              </span>
            ))}
          </div>
          {r.avgHealth !== null && (
            <div className="mt-3 text-sm">
              Avg Health: <span className="metric-num text-signal-cyan">{r.avgHealth}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
