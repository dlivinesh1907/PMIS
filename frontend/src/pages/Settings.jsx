import React, { useState } from 'react';
import { Settings as SettingsIcon, Server, Database, Activity, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

export const Settings = () => {
  const { user } = useAuth();
  const { isConnected } = useSocket();

  const [mlStatus, setMlStatus] = useState(null);
  const [testingMl, setTestingMl] = useState(false);

  const testMlService = async () => {
    setTestingMl(true);
    try {
      const res = await axios.get('http://localhost:8000/health', { timeout: 3000 });
      setMlStatus({ success: true, data: res.data });
    } catch (err) {
      setMlStatus({
        success: false,
        message: 'Python ML service not detected on port 8000. Backend analytical fallback is active.'
      });
    } finally {
      setTestingMl(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">System & Telemetry Settings</h2>
        <p className="text-xs text-slate-500">Gateway configuration, ML service bindings, and sensor threshold envelopes</p>
      </div>

      {/* User Profile Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-3">Operator Profile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Authenticated User</span>
            <span className="font-bold text-slate-800 text-sm">{user?.name || 'Operator'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Email</span>
            <span className="font-bold text-slate-800 text-sm">{user?.email || 'operator@factory.com'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl">
            <span className="text-slate-400 block mb-0.5">Role Privileges</span>
            <span className="font-bold text-sky-600 text-sm">{user?.role || 'Operator'}</span>
          </div>
        </div>
      </div>

      {/* Infrastructure Health Status */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Microservice Connectivity</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Node.js Backend */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-slate-800">Node.js Express API</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Port: 5000 • REST Endpoints</p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
              <Check className="w-3.5 h-3.5" />
              <span>Active Online</span>
            </span>
          </div>

          {/* Socket.IO Real-time */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-sky-600" />
              <span className="font-bold text-slate-800">Socket.IO Gateway</span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">Port: 5000 • WebSocket</p>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
              isConnected ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {isConnected ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{isConnected ? 'Socket Connected' : 'Disconnected'}</span>
            </span>
          </div>

          {/* Python ML Service */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Database className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-slate-800">Python FastAPI ML</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-2">Port: 8000 • Isolation Forest & RF</p>
            </div>
            <button
              onClick={testMlService}
              disabled={testingMl}
              className="mt-2 w-full py-1.5 text-xs font-bold text-sky-700 bg-white border border-slate-200 hover:bg-sky-50 rounded-lg shadow-xs transition-colors"
            >
              {testingMl ? 'Testing...' : 'Test ML Connection'}
            </button>
          </div>
        </div>

        {mlStatus && (
          <div className={`p-3 rounded-xl border text-xs ${
            mlStatus.success ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
          }`}>
            {mlStatus.success ? (
              <span>Python ML Microservice is operational and responding on port 8000.</span>
            ) : (
              <span>{mlStatus.message}</span>
            )}
          </div>
        )}
      </div>

      {/* Industrial Threshold Envelopes */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-2">Sensor Threshold Envelopes (ISO 10816-3)</h3>
        <p className="text-xs text-slate-400 mb-4">Standardized operational boundary triggers used by the Alert Engine</p>

        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="font-bold text-slate-800 block">Vibration Velocity (ISO 10816 Class II)</span>
              <span className="text-[11px] text-slate-400">Rotary machinery mechanical oscillation</span>
            </div>
            <div className="flex gap-4 font-mono font-bold">
              <span className="text-emerald-600">Norm: &lt; 4.0 mm/s</span>
              <span className="text-amber-600">Warn: 4.0–7.0 mm/s</span>
              <span className="text-rose-600">Crit: &gt; 7.0 mm/s</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="font-bold text-slate-800 block">Operating Temperature</span>
              <span className="text-[11px] text-slate-400">Spindle bearing and motor winding heat</span>
            </div>
            <div className="flex gap-4 font-mono font-bold">
              <span className="text-emerald-600">Norm: 40–70°C</span>
              <span className="text-amber-600">Warn: 70–85°C</span>
              <span className="text-rose-600">Crit: &gt; 85°C</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div>
              <span className="font-bold text-slate-800 block">Hydraulic Lubrication Pressure</span>
              <span className="text-[11px] text-slate-400">Continuous oil delivery pressure</span>
            </div>
            <div className="flex gap-4 font-mono font-bold">
              <span className="text-emerald-600">Norm: 70–100 PSI</span>
              <span className="text-amber-600">Warn: &lt; 70 PSI</span>
              <span className="text-rose-600">Crit: &lt; 55 PSI</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
