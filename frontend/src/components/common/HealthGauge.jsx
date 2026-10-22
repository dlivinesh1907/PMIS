import React from 'react';

export const HealthGauge = ({ score = 95, size = 120, strokeWidth = 10, showLabel = true }) => {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  const getColor = (s) => {
    if (s >= 80) return { stroke: '#10b981', text: 'text-emerald-600', bg: 'text-emerald-100', status: 'Healthy' };
    if (s >= 60) return { stroke: '#f59e0b', text: 'text-amber-500', bg: 'text-amber-100', status: 'Warning' };
    if (s >= 40) return { stroke: '#f97316', text: 'text-orange-500', bg: 'text-orange-100', status: 'Poor' };
    return { stroke: '#ef4444', text: 'text-rose-600', bg: 'text-rose-100', status: 'Critical' };
  };

  const config = getColor(safeScore);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={config.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center label */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-xl md:text-2xl font-black text-slate-800 tracking-tight leading-none">
            {safeScore}%
          </span>
        </div>
      </div>

      {showLabel && (
        <span className={`mt-1 text-xs font-semibold ${config.text}`}>
          {config.status}
        </span>
      )}
    </div>
  );
};
