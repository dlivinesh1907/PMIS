import React from 'react';
import { Hourglass, Clock, ShieldAlert } from 'lucide-react';

export const RULCard = ({ rulHours = 120, confidence = 0.88 }) => {
  const hours = Math.max(0, Math.round(rulHours));
  const days = (hours / 24).toFixed(1);
  const shifts = (hours / 8).toFixed(0);

  const getUrgency = (h) => {
    if (h <= 24) {
      return {
        bg: 'bg-rose-50 border-rose-200 text-rose-800',
        badge: 'bg-rose-600 text-white',
        status: 'CRITICAL OVERHAUL REQUIRED',
        icon: ShieldAlert
      };
    }
    if (h <= 72) {
      return {
        bg: 'bg-amber-50 border-amber-200 text-amber-800',
        badge: 'bg-amber-500 text-white',
        status: 'PREVENTIVE WINDOW CLOSING',
        icon: Clock
      };
    }
    return {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      badge: 'bg-emerald-600 text-white',
      status: 'HEALTHY OPERATIONAL ENVELOPE',
      icon: Hourglass
    };
  };

  const urgency = getUrgency(hours);
  const Icon = urgency.icon;

  return (
    <div className={`p-5 rounded-xl border ${urgency.bg} shadow-sm`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">Remaining Useful Life (RUL)</span>
        </div>
        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider ${urgency.badge}`}>
          {urgency.status}
        </span>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-4xl md:text-5xl font-black tracking-tight">{hours}</span>
        <span className="text-lg font-semibold">Hours</span>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-current/10 text-xs">
        <div>
          <span className="opacity-70 block">Equivalent Shifts</span>
          <span className="font-bold text-sm">~{shifts} Work Shifts (8h)</span>
        </div>
        <div>
          <span className="opacity-70 block">Estimated Days</span>
          <span className="font-bold text-sm">~{days} Production Days</span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] opacity-75">
        <span>Model Confidence: {Math.round(confidence * 100)}%</span>
        <span>Algorithm: Random Forest Regressor</span>
      </div>
    </div>
  );
};
