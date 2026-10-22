import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export const RiskIndicator = ({ level = 'LOW', probability = 0.05 }) => {
  const probPercent = Math.round((Number(probability) || 0) * 100);

  const getStyle = (lvl) => {
    switch (String(lvl).toUpperCase()) {
      case 'HIGH':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-700',
          bar: 'bg-rose-500',
          icon: ShieldAlert,
          label: 'HIGH FAILURE RISK'
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-700',
          bar: 'bg-amber-500',
          icon: AlertTriangle,
          label: 'MEDIUM RISK'
        };
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          bar: 'bg-emerald-500',
          icon: CheckCircle,
          label: 'LOW RISK'
        };
    }
  };

  const config = getStyle(level);
  const Icon = config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.bg}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span className="text-xs font-bold tracking-wider">{config.label}</span>
        </div>
        <span className="text-lg font-black">{probPercent}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 mt-3 bg-white/70 rounded-full overflow-hidden">
        <div
          className={`h-full ${config.bar} transition-all duration-500`}
          style={{ width: `${Math.max(5, probPercent)}%` }}
        />
      </div>
      <p className="mt-2 text-[11px] opacity-80">
        AI-calculated failure probability for the active operating shift.
      </p>
    </div>
  );
};
