import React from 'react';

export const KpiCard = ({ title, value, unit = '', change, changeType = 'neutral', icon: Icon, color = 'sky' }) => {
  const colorStyles = {
    sky: 'bg-sky-50 text-sky-600 border-sky-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100'
  };

  return (
    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg border ${colorStyles[color] || colorStyles.sky}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">{value}</span>
        {unit && <span className="text-sm font-medium text-slate-500">{unit}</span>}
      </div>

      {change && (
        <div className="mt-2 text-xs font-medium text-slate-500">
          <span className={`inline-block font-semibold ${
            changeType === 'increase' ? 'text-emerald-600' : (changeType === 'decrease' ? 'text-rose-600' : 'text-slate-600')
          }`}>
            {change}
          </span>
        </div>
      )}
    </div>
  );
};
