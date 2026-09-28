import React, { useEffect, useState } from "react";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import LoadingState from "../components/LoadingState";

const PROVIDER_INFO = {
  DEMO: { label: "Demo Mode", desc: "Zero-cost simulated AWS + OCI environment. No credentials required." },
  AWS: { label: "Amazon Web Services", desc: "Connect using read-only IAM credentials." },
  OCI: { label: "Oracle Cloud Infrastructure", desc: "Connect using an OCI API signing key." }
};

export default function Providers() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const res = await api.get("/cloud-accounts");
    setAccounts(res.data.data.accounts);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function connect(provider) {
    setBusy(provider);
    setMessage("");
    try {
      const res = await api.post("/cloud-accounts", { provider, accountName: `${provider} Account` });
      setMessage(res.data.data.connectionTest.success
        ? `${provider} connected. Syncing resources now — this can take a few seconds.`
        : `${provider} account created, but the connection test failed: ${res.data.data.connectionTest.message}`);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.error?.message || "Connection failed");
    } finally {
      setBusy(null);
    }
  }

  async function sync(id) {
    setBusy(id);
    try {
      await api.post(`/cloud-accounts/${id}/sync`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function disconnect(id) {
    setBusy(id);
    try {
      await api.delete(`/cloud-accounts/${id}`);
      await load();
    } finally {
      setBusy(null);
    }
  }

  if (loading) return <LoadingState label="Loading cloud accounts..." />;

  const connectedProviders = new Set(accounts.map(a => a.provider));

  return (
    <div className="space-y-6">
      {message && <div className="text-sm bg-base-800 border border-base-700 rounded-lg px-4 py-3 text-base-300">{message}</div>}

      <div>
        <h2 className="text-sm text-base-500 mb-3">Add a cloud account</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(PROVIDER_INFO).map(([key, info]) => (
            <div key={key} className="rounded-xl border border-base-800 bg-base-900/60 p-5 flex flex-col">
              <div className="font-medium">{info.label}</div>
              <div className="text-xs text-base-500 mt-1 flex-1">{info.desc}</div>
              <button
                disabled={busy === key || connectedProviders.has(key)}
                onClick={() => connect(key)}
                className="mt-4 text-sm bg-signal-cyan/10 text-signal-cyan border border-signal-cyan/30 rounded-lg py-2 hover:bg-signal-cyan/20 transition disabled:opacity-50">
                {connectedProviders.has(key) ? "Connected" : busy === key ? "Connecting..." : "Connect"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm text-base-500 mb-3">Connected accounts</h2>
        <div className="rounded-xl border border-base-800 bg-base-900/60 divide-y divide-base-800">
          {accounts.length === 0 && <div className="p-5 text-sm text-base-500">No cloud accounts connected yet.</div>}
          {accounts.map((a) => (
            <div key={a._id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-sm">{a.accountName} <span className="text-base-500">· {a.provider}</span></div>
                <div className="text-xs text-base-500 mt-1">
                  Last sync: {a.lastSyncAt ? new Date(a.lastSyncAt).toLocaleString() : "never"}
                  {a.lastSyncError ? ` — ${a.lastSyncError}` : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={a.status} />
                <button disabled={busy === a._id} onClick={() => sync(a._id)}
                  className="text-xs px-3 py-1.5 rounded-md border border-base-700 hover:border-signal-cyan text-base-300 hover:text-signal-cyan transition disabled:opacity-50">
                  {busy === a._id ? "Syncing..." : "Sync now"}
                </button>
                <button disabled={busy === a._id} onClick={() => disconnect(a._id)}
                  className="text-xs px-3 py-1.5 rounded-md border border-base-700 hover:border-signal-red text-base-300 hover:text-signal-red transition disabled:opacity-50">
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
