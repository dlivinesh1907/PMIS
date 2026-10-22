import React from 'react';
import { Thermometer, Activity, Gauge, Zap, Volume2, RotateCw } from 'lucide-react';

const SENSOR_META = {
  temperature: {
    label: 'Temperature',
    unit: '°C',
    icon: Thermometer,
    warning: 70,
    critical: 85,
    normalRange: '40–70°C'
  },
  vibration: {
    label: 'Vibration Velocity',
    unit: 'mm/s',
    icon: Activity,
    warning: 4.0,
    critical: 7.0,
    normalRange: '1.0–4.0 mm/s'
  },
  pressure: {
    label: 'Hydraulic Pressure',
    unit: 'PSI',
    icon: Gauge,
    warning: 70,
    critical: 55,
    normalRange: '70–100 PSI'
  },
  rpm: {
    label: 'Spindle RPM',
    unit: 'RPM',
    icon: RotateCw,
    warning: 1400,
    critical: 1300,
    normalRange: '1450–1500 RPM'
  },
  current: {
    label: 'Motor Current',
    unit: 'A',
    icon: Zap,
    warning: 14.0,
    critical: 17.5,
    normalRange: '8.0–14.0 A'
  },
  acousticLevel: {
    label: 'Acoustic Noise',
    unit: 'dB',
    icon: Volume2,
    warning: 75,
    critical: 88,
    normalRange: '50–75 dB'
  }
};

export const SensorCard = ({ type = 'temperature', value = 0, isLive = false }) => {
  const meta = SENSOR_META[type] || {
    label: type,
    unit: '',
    icon: Activity,
    warning: 100,
    critical: 150,
    normalRange: 'Nominal'
  };

  const Icon = meta.icon;
  const numVal = Number(value) || 0;

  // Evaluate status
  let status = 'NORMAL';
  let badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  let cardBorder = 'border-slate-200';

  if (type === 'pressure') {
    if (numVal <= meta.critical) {
      status = 'CRITICAL';
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      cardBorder = 'border-rose-300 ring-1 ring-rose-300';
    } else if (numVal <= meta.warning) {
      status = 'WARNING';
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      cardBorder = 'border-amber-300';
    }
  } else {
    if (numVal >= meta.critical) {
      status = 'CRITICAL';
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-200';
      cardBorder = 'border-rose-300 ring-1 ring-rose-300';
    } else if (numVal >= meta.warning) {
      status = 'WARNING';
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-200';
      cardBorder = 'border-amber-300';
    }
  }

  return (
    <div className={`p-4 bg-white rounded-xl border ${cardBorder} shadow-sm transition-all hover:shadow-md relative overflow-hidden`}>
      {isLive && (
        <span className="absolute top-3 right-3 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
        </span>
      )}

      <div className="flex items-center gap-2 text-slate-500 mb-2">
        <div className="p-1.5 rounded-lg bg-slate-100 text-slate-700">
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-semibold uppercase tracking-wider">{meta.label}</span>
      </div>

      <div className="flex items-baseline gap-1 my-1">
        <span className="text-2xl font-black text-slate-900 tracking-tight">{numVal}</span>
        <span className="text-xs font-semibold text-slate-500">{meta.unit}</span>
      </div>

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 text-[11px]">
        <span className="text-slate-400">Norm: {meta.normalRange}</span>
        <span className={`px-2 py-0.5 rounded-md font-semibold border ${badgeStyle}`}>
          {status}
        </span>
      </div>
    </div>
  );
};
