import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle,
  Filter,
  Check,
  RotateCcw,
  ArrowRight
} from 'lucide-react';
import { alertService } from '../services/alertService';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');

  const { isEngineer } = useAuth();

  const fetchAlerts = async () => {
    try {
      const res = await alertService.getAll();
      setAlerts(res.data || []);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleAcknowledge = async (id) => {
    try {
      await alertService.acknowledge(id);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertService.resolve(id);
      fetchAlerts();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const filteredAlerts = alerts.filter((a) => {
    const matchesSeverity = severityFilter === 'ALL' || a.severity === severityFilter;
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSeverity && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Active Plant Alerts & Warnings</h2>
          <p className="text-xs text-slate-500">Real-time alert triage, severity rankings, and maintenance resolution</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Status:</span>
          {['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'ALL'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Severity:</span>
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                severityFilter === sev
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      {loading ? (
        <LoadingSpinner message="Scanning alert logs..." />
      ) : filteredAlerts.length > 0 ? (
        <div className="space-y-3.5">
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isWarning = alert.severity === 'WARNING';

            return (
              <div
                key={alert._id}
                className={`p-5 bg-white border rounded-2xl shadow-sm transition-all ${
                  isCritical ? 'border-rose-200 bg-rose-50/20' : (isWarning ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200')
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                      isCritical ? 'bg-rose-100 text-rose-700' : (isWarning ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700')
                    }`}>
                      {isCritical ? <ShieldAlert className="w-5 h-5" /> : (isWarning ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="font-mono font-black text-sm text-slate-900">{alert.machineId}</span>
                        <StatusBadge status={alert.severity} />
                        <StatusBadge status={alert.status} />
                        <span className="text-[11px] text-slate-400">
                          {new Date(alert.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{alert.message}</p>

                      {alert.explanation && (
                        <div className="mt-2.5 p-3 bg-white border border-slate-200 rounded-lg text-xs text-slate-700">
                          <span className="font-bold text-slate-900 block mb-0.5">Diagnostic Explanation:</span>
                          {alert.explanation}
                        </div>
                      )}

                      {alert.recommendedAction && (
                        <div className="mt-2 text-xs font-semibold text-sky-800">
                          Recommended Action: <span className="font-normal text-slate-700">{alert.recommendedAction}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Right */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-2 shrink-0 pt-2 md:pt-0">
                    <Link
                      to={`/machines/${alert.machineId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <span>Machine Detail</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>

                    {isEngineer && alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleAcknowledge(alert._id)}
                        className="px-3 py-1.5 text-xs font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                      >
                        Acknowledge
                      </button>
                    )}

                    {isEngineer && alert.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleResolve(alert._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl">
          <p className="text-xs font-semibold text-slate-500">No alerts match the selected criteria.</p>
        </div>
      )}
    </div>
  );
};
