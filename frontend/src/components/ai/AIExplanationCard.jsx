import React from 'react';
import { Brain, HelpCircle, CheckCircle2, Wrench } from 'lucide-react';

export const AIExplanationCard = ({
  contributingFactors = [],
  explanation = 'Nominal telemetry operating conditions.',
  recommendedAction = 'Continue normal automated telemetry monitoring.'
}) => {
  return (
    <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">Explainable AI Root-Cause Diagnostic</h3>
            <p className="text-[11px] text-slate-400">Sensor deviation attribution & degradation analysis</p>
          </div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
          XAI Layer
        </span>
      </div>

      {/* Synthesis Box */}
      <div className="mt-4 p-3.5 bg-slate-50 border border-slate-200/80 rounded-lg text-xs leading-relaxed text-slate-700">
        <span className="font-bold text-slate-900 block mb-1">AI Diagnostic Assessment:</span>
        {explanation}
      </div>

      {/* Recommended Action */}
      {recommendedAction && (
        <div className="mt-3 p-3 bg-sky-50/70 border border-sky-100 rounded-lg flex items-start gap-2.5 text-xs text-sky-900">
          <Wrench className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sky-950">Recommended Action:</span>
            {recommendedAction}
          </div>
        </div>
      )}

      {/* Contributing Factors Bar Breakdown */}
      <div className="mt-5">
        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
          Sensor Contribution Breakdown
        </h4>

        {contributingFactors && contributingFactors.length > 0 ? (
          <div className="space-y-2.5">
            {contributingFactors.slice(0, 5).map((factor, idx) => {
              const percent = Math.round((factor.importance || 0) * 100);
              const isHigh = percent >= 30;

              return (
                <div key={factor.feature || idx} className="text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-700 capitalize">
                      {factor.feature.replace('_', ' ')}
                      {factor.value !== undefined && (
                        <span className="text-slate-400 text-[11px] ml-1">
                          ({factor.value} {factor.unit || ''})
                        </span>
                      )}
                    </span>
                    <span className={`font-bold ${isHigh ? 'text-rose-600' : 'text-slate-600'}`}>
                      {percent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isHigh ? 'bg-rose-500' : (percent >= 15 ? 'bg-amber-500' : 'bg-sky-500')
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-slate-400">Baseline deviation is negligible across all parameters.</p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex items-center justify-between">
        <span>Attribution: Transparent Normalized Sensor Deviation</span>
        <span>Decision Support System</span>
      </div>
    </div>
  );
};
