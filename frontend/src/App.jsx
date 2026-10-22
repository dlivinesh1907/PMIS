import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { NotificationToast } from './components/common/NotificationToast';

import { Dashboard } from './pages/Dashboard';
import { Machines } from './pages/Machines';
import { MachineDetail } from './pages/MachineDetail';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { Predictions } from './pages/Predictions';
import { Alerts } from './pages/Alerts';
import { Maintenance } from './pages/Maintenance';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

// Protected layout wrapper
const ProtectedLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-xs">
        Initializing PMIS session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Fleet Overview & KPIs';
    if (pathname.startsWith('/machines/')) return 'Machine Telemetry & AI Diagnosis';
    if (pathname === '/machines') return 'Asset Catalog';
    if (pathname === '/live') return 'Real-Time Telemetry Monitor';
    if (pathname === '/predictions') return 'ML Predictions & Forecasting';
    if (pathname === '/alerts') return 'Alert Triage Center';
    if (pathname === '/maintenance') return 'Maintenance Work Orders';
    if (pathname === '/analytics') return 'Reliability Analytics & Trends';
    if (pathname === '/settings') return 'System Configuration';
    return 'Industrial Operations';
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(true)}
          title={getPageTitle(location.pathname)}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/machines" element={<Machines />} />
              <Route path="/machines/:id" element={<MachineDetail />} />
              <Route path="/live" element={<LiveMonitoring />} />
              <Route path="/predictions" element={<Predictions />} />
              <Route path="/alerts" element={<Alerts />} />
              <Route path="/maintenance" element={<Maintenance />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        <NotificationToast />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
