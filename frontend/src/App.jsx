import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Providers from "./pages/Providers";
import Resources from "./pages/Resources";
import ResourceDetails from "./pages/ResourceDetails";
import Analytics from "./pages/Analytics";
import Alerts from "./pages/Alerts";
import Cost from "./pages/Cost";
import Optimization from "./pages/Optimization";
import Regions from "./pages/Regions";
import Settings from "./pages/Settings";

const TITLES = {
  "/": "Dashboard",
  "/providers": "Cloud Providers",
  "/resources": "Resources",
  "/analytics": "Analytics",
  "/alerts": "Alerts",
  "/cost": "Cost",
  "/optimization": "Optimization",
  "/regions": "Regions",
  "/settings": "Settings"
};

function ProtectedLayout({ children }) {
  const { authenticated, loading } = useAuth();
  const path = window.location.pathname;
  const title = TITLES[path] || (path.startsWith("/resources/") ? "Resource Details" : "CloudViz");

  if (loading) return <div className="min-h-screen flex items-center justify-center text-base-500">Loading...</div>;
  if (!authenticated) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar title={title} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">{children}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/providers" element={<ProtectedLayout><Providers /></ProtectedLayout>} />
      <Route path="/resources" element={<ProtectedLayout><Resources /></ProtectedLayout>} />
      <Route path="/resources/:id" element={<ProtectedLayout><ResourceDetails /></ProtectedLayout>} />
      <Route path="/analytics" element={<ProtectedLayout><Analytics /></ProtectedLayout>} />
      <Route path="/alerts" element={<ProtectedLayout><Alerts /></ProtectedLayout>} />
      <Route path="/cost" element={<ProtectedLayout><Cost /></ProtectedLayout>} />
      <Route path="/optimization" element={<ProtectedLayout><Optimization /></ProtectedLayout>} />
      <Route path="/regions" element={<ProtectedLayout><Regions /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
