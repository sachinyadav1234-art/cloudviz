import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Unable to sign in. Check your connection to the backend.");
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
          <h1 className="font-display font-semibold text-lg mb-1">Sign in</h1>
          <p className="text-sm text-base-500 mb-6">Unified multi-cloud resource intelligence.</p>
          {error && <div className="mb-4 text-sm text-signal-red bg-signal-red/10 border border-signal-red/30 rounded-lg px-3 py-2">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-base-500">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal-cyan focus:border-signal-cyan" />
            </div>
            <div>
              <label className="text-xs text-base-500">Password</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-base-800 border border-base-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-signal-cyan focus:border-signal-cyan" />
            </div>
            <button disabled={loading} type="submit"
              className="w-full bg-signal-cyan text-base-950 font-medium rounded-lg py-2 text-sm hover:opacity-90 transition disabled:opacity-50">
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-base-500 mt-4">
          No account? <Link to="/register" className="text-signal-cyan hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
