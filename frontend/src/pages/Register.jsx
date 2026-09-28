import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Unable to create account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="h-9 w-9 rounded-md bg-gradient-to-br from-signal-cyan to-signal-violet flex items-center justify-center text-base-950 font-display font-bold">C</div>
          <div className="font-display font-semibold text-xl">CloudViz</div>
        </div>
        <div className="border border-base-800 bg-base-900/60 rounded-xl p-6">
          <h1 className="font-display font-semibold text-lg mb-1">Create account</h1>
          <p className="text-sm text-base-500 mb-6">Start monitoring AWS and OCI in one place.</p>
          {error && <div className="mb-4 text-sm text-signal-red bg-signal-red/10 border border-signal-red/30 rounded-lg px-3 py-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-base-500">Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1 w-full bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal-cyan focus:border-signal-cyan" />
            </div>
            <div>
              <label className="text-xs text-base-500">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal-cyan focus:border-signal-cyan" />
            </div>
            <div>
              <label className="text-xs text-base-500">Password (min 8 characters)</label>
              <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="mt-1 w-full bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal-cyan focus:border-signal-cyan" />
            </div>
            <button disabled={loading} type="submit"
              className="w-full bg-signal-cyan text-base-950 font-medium rounded-lg py-2 text-sm hover:opacity-90 transition disabled:opacity-50">
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-base-500 mt-4">
          Already have an account? <Link to="/login" className="text-signal-cyan hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
