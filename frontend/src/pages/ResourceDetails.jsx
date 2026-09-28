import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";
import HealthRing from "../components/HealthRing";

export default function ResourceDetails() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/resources/${id}`),
      api.get(`/resources/${id}/metrics?hours=24`)
    ]).then(([d, m]) => {
      setDetail(d.data.data);
      setMetrics(m.data.data.metrics.map(x => ({ ...x, time: new Date(x.timestamp).toLocaleTimeString() })));
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState />;
  if (!detail) return null;
  const { resource, health, alerts, anomalies, recommendations } = detail;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-base-800 bg-base-900/60 p-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="text-lg font-display font-semibold">{resource.resourceName}</div>
          <div className="text-sm text-base-500 mt-1">{resource.provider} · {resource.region} · <StatusBadge status={resource.status} /></div>
        </div>
        {health && <HealthRing score={health.overallScore} />}
      </div>

      <div className="rounded-xl border border-base-800 bg-base-900/60 p-5">
        <div className="text-sm text-base-500 mb-4">CPU History (last 24h)</div>
        {metrics.length === 0 ? <div className="text-sm text-base-500">No historical data yet — sync the cloud account to start collecting metrics.</div> : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="#182233" />
              <XAxis dataKey="time" stroke="#5B7196" fontSize={11} />
              <YAxis stroke="#5B7196" fontSize={11} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#131A27", border: "1px solid #25324A", fontSize: 12 }} />
              <Line type="monotone" dataKey="cpuUsage" stroke="#3FD4C8" strokeWidth={2} dot={false} name="CPU %" />
              <Line type="monotone" dataKey="memoryUsage" stroke="#8B7FE8" strokeWidth={2} dot={false} name="Memory %" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Alerts" items={alerts} render={(a) => (
          <div key={a._id} className="text-sm py-2 border-b border-base-800 last:border-0">
            <div className="flex justify-between"><span>{a.metricType}</span><StatusBadge status={a.status} /></div>
            <div className="text-xs text-base-500">{a.message}</div>
          </div>
        )} />
        <Panel title="Anomalies" items={anomalies} render={(a) => (
          <div key={a._id} className="text-sm py-2 border-b border-base-800 last:border-0">
            <div className="flex justify-between"><span>{a.metricType}</span><span className="text-xs text-base-500">{a.severity}</span></div>
            <div className="text-xs text-base-500">Current {a.currentValue}% vs baseline {a.baselineValue}%</div>
          </div>
        )} />
        <Panel title="Recommendations" items={recommendations} render={(r) => (
          <div key={r._id} className="text-sm py-2 border-b border-base-800 last:border-0">
            <div className="font-medium">{r.title}</div>
            <div className="text-xs text-base-500">{r.recommendation}</div>
          </div>
        )} />
      </div>
    </div>
  );
}

function Panel({ title, items, render }) {
  return (
    <div className="rounded-xl border border-base-800 bg-base-900/60 p-4">
      <div className="text-sm text-base-500 mb-2">{title}</div>
      {(!items || items.length === 0) ? <div className="text-xs text-base-500">None</div> : items.map(render)}
    </div>
  );
}
