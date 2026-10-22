import React from 'react';
import { AlertCircle, X, ArrowRight } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { Link } from 'react-router-dom';

export const NotificationToast = () => {
  const { latestAlertToast, dismissToast } = useSocket();

  if (!latestAlertToast) return null;

  const { alert, machineName } = latestAlertToast;
  const isCritical = alert?.severity === 'CRITICAL';

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
      <div className={`h-1.5 w-full ${isCritical ? 'bg-rose-500' : 'bg-amber-500'}`} />
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isCritical ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {alert?.severity} ALERT
              </span>
              <h4 className="text-xs font-bold text-slate-900 mt-1">{alert?.title}</h4>
            </div>
          </div>
          <button
            onClick={dismissToast}
            className="p-1 text-slate-400 rounded-lg hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-xs text-slate-600 line-clamp-2">
          {alert?.message}
        </p>

        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-500">{alert?.machineId}</span>
          <Link
            to={`/machines/${alert?.machineId}`}
            onClick={dismissToast}
            className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
          >
            <span>Inspect</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
