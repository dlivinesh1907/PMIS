import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  PieChart as PieIcon,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

export const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');

  // Risk Distribution Data
  const riskDistributionData = [
    { name: 'Low Risk (Healthy)', value: 65, color: '#10b981' },
    { name: 'Medium Risk (Warning)', value: 22, color: '#f59e0b' },
    { name: 'High Risk (Critical)', value: 13, color: '#ef4444' }
  ];

  // Anomaly frequency by machine
  const anomalyByMachine = [
    { machine: 'CNC-001', anomalies: 2, falseAlarms: 0 },
    { machine: 'CNC-002', anomalies: 4, falseAlarms: 1 },
    { machine: 'CNC-003', anomalies: 12, falseAlarms: 2 },
    { machine: 'CNC-004', anomalies: 28, falseAlarms: 1 },
    { machine: 'CNC-005', anomalies: 1, falseAlarms: 0 }
  ];

  // Downtime avoided by predictive intervention (estimated savings)
  const downtimeTrend = [
    { month: 'Jan', reactiveBreakdowns: 4, predictiveInterventions: 8, hoursSaved: 36 },
    { month: 'Feb', reactiveBreakdowns: 3, predictiveInterventions: 11, hoursSaved: 48 },
    { month: 'Mar', reactiveBreakdowns: 2, predictiveInterventions: 14, hoursSaved: 62 },
    { month: 'Apr', reactiveBreakdowns: 1, predictiveInterventions: 19, hoursSaved: 84 },
    { month: 'May', reactiveBreakdowns: 1, predictiveInterventions: 22, hoursSaved: 95 }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Date Range Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Industrial Reliability Analytics</h2>
          <p className="text-xs text-slate-500">Historical MTBF metrics, anomaly clustering, and downtime prevention trends</p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-4 h-4 text-slate-400" />
          {['7d', '30d', '90d'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                timeRange === range
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </button>
          ))}
        </div>
      </div>

      {/* High-Level Plant Reliability KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Fleet MTBF</span>
          <span className="text-2xl md:text-3xl font-black text-slate-900 mt-2 block">412 hrs</span>
          <p className="text-xs text-emerald-600 font-semibold mt-1">+18% vs reactive baseline</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Mean Time to Repair</span>
          <span className="text-2xl md:text-3xl font-black text-slate-900 mt-2 block">2.4 hrs</span>
          <p className="text-xs text-emerald-600 font-semibold mt-1">-35% planned overhauls</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Overall Plant Uptime</span>
          <span className="text-2xl md:text-3xl font-black text-slate-900 mt-2 block">98.6%</span>
          <p className="text-xs text-emerald-600 font-semibold mt-1">World-class OEE</p>
        </div>

        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">Predicted Catastrophic Avoided</span>
          <span className="text-2xl md:text-3xl font-black text-slate-900 mt-2 block">14 Failures</span>
          <p className="text-xs text-sky-600 font-semibold mt-1">~$142,000 saved</p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime Avoidance vs Reactive Breakdown Trend */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-1">
            Reactive Breakdowns vs Predictive Interventions
          </h3>
          <p className="text-xs text-slate-400 mb-4">Tracking shift from unplanned downtime to scheduled maintenance</p>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimeTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="predictiveInterventions" name="Predictive Interventions" fill="#0284c7" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reactiveBreakdowns" name="Reactive Breakdowns" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Anomaly Detection Frequency by Asset */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-1">
            Anomaly Triggers by Machine Asset
          </h3>
          <p className="text-xs text-slate-400 mb-4">Total Isolation Forest outlier telemetry triggers ({timeRange})</p>

          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={anomalyByMachine} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="machine" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="anomalies" name="True Sensor Anomalies" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="falseAlarms" name="Sensor Noise / Rejections" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Donut Risk Breakdown */}
      <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 block">Fleet Risk Stratification</span>
          <h3 className="text-base font-bold text-slate-900 mt-1">Operational Risk Distribution</h3>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Machine state clustering based on composite failure likelihood. CNC-004 accounts for current High-Risk segment.
          </p>
        </div>

        <div className="flex justify-center">
          <div style={{ width: 180, height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={riskDistributionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {riskDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {riskDistributionData.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-2 rounded-lg bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-semibold text-slate-700">{item.name}</span>
              </div>
              <span className="font-mono font-bold text-slate-900">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
