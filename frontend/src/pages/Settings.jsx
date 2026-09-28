import React, { useEffect, useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingState from "../components/LoadingState";

export default function Settings() {
  const { user } = useAuth();
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ metricType: "cpuUsage", operator: ">", threshold: 80, severity: "WARNING" });

  async function load() {
    setLoading(true);
    const res = await api.get("/alerts/rules");
    setRules(res.data.data.rules);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createRule(e) {
    e.preventDefault();
    await api.post("/alerts/rules", form);
    await load();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-base-800 bg-base-900/60 p-5">
        <div className="text-sm text-base-500 mb-3">Profile</div>
        <div className="text-sm">{user?.name} · {user?.email}</div>
      </div>

      <div className="rounded-xl border border-base-800 bg-base-900/60 p-5">
        <div className="text-sm text-base-500 mb-3">Alert Rules</div>
        {loading ? <LoadingState /> : (
          <div className="divide-y divide-base-800 mb-4">
            {rules.map((r) => (
              <div key={r._id} className="py-2 text-sm flex justify-between">
                <span>{r.metricType} {r.operator} {r.threshold}%</span>
                <span className="text-base-500">{r.severity}</span>
              </div>
            ))}
          </div>
        )}
        <form onSubmit={createRule} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-base-500 block mb-1">Metric</label>
            <select value={form.metricType} onChange={(e) => setForm({ ...form, metricType: e.target.value })}
              className="bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm">
              <option value="cpuUsage">CPU</option>
              <option value="memoryUsage">Memory</option>
              <option value="storageUsage">Storage</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-base-500 block mb-1">Threshold %</label>
            <input type="number" value={form.threshold} onChange={(e) => setForm({ ...form, threshold: Number(e.target.value) })}
              className="bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm w-24" />
          </div>
          <div>
            <label className="text-xs text-base-500 block mb-1">Severity</label>
            <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value })}
              className="bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm">
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
          <button type="submit" className="text-sm bg-signal-cyan text-base-950 font-medium px-4 py-2 rounded-lg hover:opacity-90">
            Add Rule
          </button>
        </form>
      </div>
    </div>
  );
}
