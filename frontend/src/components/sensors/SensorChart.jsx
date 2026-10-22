import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid
} from 'recharts';

export const SensorChart = ({
  data = [],
  dataKey = 'vibration',
  title = 'Sensor Telemetry',
  unit = '',
  warningThreshold = null,
  criticalThreshold = null,
  strokeColor = '#0284c7',
  fillColor = '#e0f2fe',
  height = 240
}) => {
  // Format timestamps for chart axis
  const formattedData = data.map((item) => ({
    ...item,
    formattedTime: item.timestamp
      ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : ''
  }));

  return (
    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">{title}</h3>
          <span className="text-xs text-slate-400">Time-series history ({unit})</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium">
          {warningThreshold && (
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-2 h-0.5 bg-amber-500 inline-block border-dashed"></span>
              Warn: {warningThreshold}{unit}
            </span>
          )}
          {criticalThreshold && (
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2 h-0.5 bg-rose-500 inline-block"></span>
              Crit: {criticalThreshold}{unit}
            </span>
          )}
        </div>
      </div>

      <div style={{ width: '100%', height }}>
        {formattedData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="formattedTime" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderRadius: '8px',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px'
                }}
                formatter={(val) => [`${val} ${unit}`, title]}
              />
              {warningThreshold && (
                <ReferenceLine y={warningThreshold} stroke="#f59e0b" strokeDasharray="3 3" />
              )}
              {criticalThreshold && (
                <ReferenceLine y={criticalThreshold} stroke="#ef4444" strokeWidth={1.5} />
              )}
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#gradient-${dataKey})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-slate-400">
            No historical telemetry recorded.
          </div>
        )}
      </div>
    </div>
  );
};
