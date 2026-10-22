import React from 'react';

export const StatusBadge = ({ status }) => {
  const getBadgeConfig = (st) => {
    switch (String(st).toLowerCase()) {
      case 'running':
      case 'healthy':
      case 'active':
      case 'normal':
      case 'low':
      case 'completed':
        return {
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          label: st
        };
      case 'warning':
      case 'medium':
      case 'in progress':
      case 'scheduled':
        return {
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          dot: 'bg-amber-500',
          label: st
        };
      case 'critical':
      case 'high':
      case 'anomaly':
      case 'overdue':
        return {
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          dot: 'bg-rose-500 animate-ping',
          label: st
        };
      case 'maintenance':
      case 'acknowledged':
        return {
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          dot: 'bg-sky-500',
          label: st
        };
      case 'idle':
      case 'offline':
      case 'cancelled':
      default:
        return {
          bg: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: 'bg-slate-400',
          label: st
        };
    }
  };

  const config = getBadgeConfig(status);

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{config.label}</span>
    </span>
  );
};
