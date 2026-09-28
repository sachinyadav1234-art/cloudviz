import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import EmptyState from "../components/EmptyState";

export default function Resources() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [provider, setProvider] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (provider) params.set("provider", provider);
    api.get(`/resources?${params.toString()}`)
      .then((res) => setResources(res.data.data.resources))
      .finally(() => setLoading(false));
  }, [search, provider]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:ring-1 focus:ring-signal-cyan"
        />
        <select value={provider} onChange={(e) => setProvider(e.target.value)}
          className="bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal-cyan">
          <option value="">All providers</option>
          <option value="AWS">AWS</option>
          <option value="OCI">OCI</option>
          <option value="DEMO">Demo</option>
        </select>
      </div>

      {loading ? <LoadingState /> : resources.length === 0 ? (
        <EmptyState title="No resources found" message="Connect a cloud provider or adjust your filters." />
      ) : (
        <div className="rounded-xl border border-base-800 bg-base-900/60 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-base-800/60 text-base-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Provider</th>
                <th className="text-left px-4 py-3">Region</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">CPU</th>
                <th className="text-left px-4 py-3">Memory</th>
                <th className="text-left px-4 py-3">Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-800">
              {resources.map((r) => (
                <tr key={r._id} className="hover:bg-base-800/40">
                  <td className="px-4 py-3">
                    <Link to={`/resources/${r._id}`} className="text-signal-cyan hover:underline">{r.resourceName}</Link>
                  </td>
                  <td className="px-4 py-3 text-base-400">{r.provider}</td>
                  <td className="px-4 py-3 text-base-400">{r.region}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-4 py-3 metric-num">{r.latestMetric?.cpuUsage ?? "—"}{r.latestMetric?.cpuUsage != null ? "%" : ""}</td>
                  <td className="px-4 py-3 metric-num">{r.latestMetric?.memoryUsage ?? "—"}{r.latestMetric?.memoryUsage != null ? "%" : ""}</td>
                  <td className="px-4 py-3">{r.health ? <StatusBadge status={r.health.classification} /> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
