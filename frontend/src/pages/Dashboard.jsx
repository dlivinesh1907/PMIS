import React, { useState, useEffect } from 'react';
import {
  Cpu,
  ShieldAlert,
  AlertTriangle,
  Activity,
  HeartPulse,
  Wrench,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import { KpiCard } from '../components/common/KpiCard';
import { HealthGauge } from '../components/common/HealthGauge';
import { StatusBadge } from '../components/common/StatusBadge';
import { SensorChart } from '../components/sensors/SensorChart';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { dashboardService } from '../services/dashboardService';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';

export const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { liveReadings } = useSocket();

  const fetchSummary = async () => {
    try {
      const res = await dashboardService.getSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load dashboard summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
    const interval = setInterval(fetchSummary, 10000); // Polling refresh
    return () => clearInterval(interval);
  }, []);

  // Incorporate real-time updates into machine list if available
  const machines = data?.machines ? data.machines.map((m) => {
    const live = liveReadings[m.machineId];
    if (live) {
      return {
        ...m,
        healthScore: live.healthScore,
        status: live.status,
        temperature: live.reading?.temperature ?? m.temperature,
        vibration: live.reading?.vibration ?? m.vibration,
        failureProbability: live.prediction?.failureProbability ?? m.failureProbability,
        riskLevel: live.prediction?.riskLevel ?? m.riskLevel,
        rulHours: live.prediction?.rulHours ?? m.rulHours
      };
    }
    return m;
  }) : [];

  if (loading && !data) {
    return <LoadingSpinner message="Aggregating factory fleet telemetry..." />;
  }

  const kpis = data?.kpis || {};
  const recentAlerts = data?.recentAlerts || [];
  const sensorTrends = data?.sensorTrends || [];

  // Data for Machine Health Distribution Bar Chart
  const healthDistributionData = machines.map((m) => ({
    name: m.machineId,
    health: m.healthScore,
    risk: m.riskLevel
  }));

  const getBarColor = (health) => {
    if (health >= 80) return '#10b981';
    if (health >= 60) return '#f59e0b';
    if (health >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-950 text-white rounded-2xl shadow-sm">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400">Smart Manufacturing Operations</span>
          <h2 className="text-xl md:text-2xl font-black tracking-tight mt-1">Predictive Fleet Intelligence</h2>
          <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-xl">
            AI-driven anomaly detection, run-to-failure forecasting, and explainable maintenance alerts for active CNC workcells.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/live"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl shadow-sm transition-all"
          >
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Open Live Telemetry</span>
          </Link>
          <Link
            to="/maintenance"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 rounded-xl shadow-sm transition-all"
          >
            <Wrench className="w-4 h-4" />
            <span>Work Orders</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Machines"
          value={kpis.totalMachines || 0}
          icon={Cpu}
          color="sky"
          change="5 Active Monitored"
        />
        <KpiCard
          title="Average Health"
          value={`${kpis.averageHealthScore || 0}%`}
          icon={HeartPulse}
          color={kpis.averageHealthScore >= 80 ? 'emerald' : 'amber'}
          change={`${kpis.healthyMachines || 0} Healthy / ${kpis.warningMachines || 0} Warn / ${kpis.criticalMachines || 0} Crit`}
        />
        <KpiCard
          title="Predicted Failures"
          value={kpis.predictedFailures || 0}
          icon={ShieldAlert}
          color={kpis.predictedFailures > 0 ? 'rose' : 'emerald'}
          change={kpis.predictedFailures > 0 ? 'Action Required!' : 'Zero Imminent Risks'}
          changeType={kpis.predictedFailures > 0 ? 'decrease' : 'increase'}
        />
        <KpiCard
          title="Active Alerts"
          value={kpis.activeAlerts || 0}
          icon={AlertTriangle}
          color={kpis.activeAlerts > 0 ? 'amber' : 'emerald'}
          change={`${kpis.maintenanceDue || 0} Maintenance Tasks Due`}
        />
      </div>

      {/* Machine Fleet Health Overview Table / Cards */}
      <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Machine Fleet Health Status</h3>
            <p className="text-xs text-slate-400">Live composite health index synthesized from multi-sensor AI models</p>
          </div>
          <Link to="/machines" className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700">
            <span>Manage All Machines</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {machines.map((m) => (
            <Link
              key={m.machineId}
              to={`/machines/${m.machineId}`}
              className="p-4 rounded-xl border border-slate-200 hover:border-sky-300 hover:shadow-md transition-all bg-slate-50/50 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-sm text-slate-800 group-hover:text-sky-600 transition-colors">
                    {m.machineId}
                  </span>
                  <StatusBadge status={m.healthScore >= 80 ? 'Healthy' : (m.healthScore >= 60 ? 'Warning' : 'Critical')} />
                </div>
                <p className="text-xs text-slate-500 line-clamp-1 font-medium">{m.name}</p>
              </div>

              <div className="my-4 flex items-center justify-center">
                <HealthGauge score={m.healthScore} size={90} strokeWidth={8} showLabel={false} />
              </div>

              <div className="space-y-1.5 text-[11px] pt-3 border-t border-slate-200/80">
                <div className="flex justify-between text-slate-500">
                  <span>Failure Risk:</span>
                  <span className={`font-bold ${m.failureProbability >= 0.7 ? 'text-rose-600' : (m.failureProbability >= 0.3 ? 'text-amber-600' : 'text-emerald-600')}`}>
                    {Math.round((m.failureProbability || 0) * 100)}% ({m.riskLevel})
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Est. RUL:</span>
                  <span className="font-semibold text-slate-700">~{Math.round(m.rulHours || 0)} hrs</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Vibration / Temp:</span>
                  <span className="font-mono text-slate-700">{m.vibration} mm/s | {m.temperature}°C</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Charts Section: Health Distribution & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Machine Health Distribution Chart */}
        <div className="lg:col-span-2 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Fleet Health Score Distribution</h3>
              <p className="text-xs text-slate-400">Current machine health rankings (0 = Critical, 100 = Optimal)</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} domain={[0, 100]} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                  formatter={(val) => [`${val}% Health`, 'Health Score']}
                />
                <Bar dataKey="health" radius={[6, 6, 0, 0]}>
                  {healthDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.health)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Urgent Alerts */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-800 tracking-tight">Active Plant Alerts</h3>
              </div>
              <Link to="/alerts" className="text-[11px] font-semibold text-sky-600 hover:text-sky-700">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {recentAlerts && recentAlerts.length > 0 ? (
                recentAlerts.slice(0, 3).map((al) => (
                  <div
                    key={al._id}
                    className={`p-3 rounded-lg border text-xs ${
                      al.severity === 'CRITICAL'
                        ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                        : 'bg-amber-50/60 border-amber-200 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold font-mono">{al.machineId}</span>
                      <StatusBadge status={al.severity} />
                    </div>
                    <p className="font-semibold text-slate-800">{al.title}</p>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{al.message}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-xs">
                  <span>No active critical alerts. All systems nominal.</span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4">
            <Link
              to="/alerts"
              className="flex items-center justify-center gap-1.5 w-full py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <span>Review Alert Triage</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Comparative Degradation Trends: CNC-004 (Degrading) vs CNC-001 (Healthy) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SensorChart
          data={sensorTrends.filter(t => t.machineId === 'CNC-004')}
          dataKey="vibration"
          title="CNC-004 Vibration Telemetry (Critical Test Subject)"
          unit="mm/s"
          warningThreshold={4.0}
          criticalThreshold={7.0}
          strokeColor="#ef4444"
          fillColor="#fee2e2"
        />
        <SensorChart
          data={sensorTrends.filter(t => t.machineId === 'CNC-001')}
          dataKey="vibration"
          title="CNC-001 Vibration Telemetry (Healthy Reference)"
          unit="mm/s"
          warningThreshold={4.0}
          criticalThreshold={7.0}
          strokeColor="#10b981"
          fillColor="#d1fae5"
        />
      </div>
    </div>
  );
};
