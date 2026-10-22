import React, { useState, useEffect } from 'react';
import { Brain, Filter, ChevronDown, ChevronUp, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { machineService } from '../services/machineService';
import { predictionService } from '../services/predictionService';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';

export const Predictions = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('ALL');
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const mRes = await machineService.getAll();
        const machineList = mRes.data || [];
        setMachines(machineList);

        // Fetch predictions for all machines
        const allPreds = [];
        for (const m of machineList) {
          const hist = await predictionService.getHistory(m.machineId, 10).catch(() => []);
          allPreds.push(...hist);
        }

        // Sort descending by timestamp
        allPreds.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setPredictions(allPreds);
      } catch (err) {
        console.error('Failed to load predictions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPredictions = predictions.filter((p) => {
    return selectedMachine === 'ALL' || p.machineId === selectedMachine;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">AI Predictions & Health Analytics</h2>
          <p className="text-xs text-slate-500">
            Anomaly scores, failure probabilities, and remaining useful life forecasts
          </p>
        </div>

        {/* Machine Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500/20"
          >
            <option value="ALL">All Machines</option>
            {machines.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineId} - {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Predictions Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Retrieving ML prediction matrix..." />
        ) : filteredPredictions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Machine</th>
                  <th className="py-3.5 px-4">Recorded At</th>
                  <th className="py-3.5 px-4">Anomaly Score</th>
                  <th className="py-3.5 px-4">Failure Probability</th>
                  <th className="py-3.5 px-4">Est. RUL</th>
                  <th className="py-3.5 px-4">Health</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPredictions.map((pred) => {
                  const isExpanded = expandedId === pred._id;
                  const isHigh = pred.failureProbability >= 0.70 || pred.riskLevel === 'HIGH';

                  return (
                    <React.Fragment key={pred._id || `${pred.machineId}-${pred.timestamp}`}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : pred._id)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                          isHigh ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {pred.machineId}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {new Date(pred.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`font-mono font-semibold ${pred.isAnomaly ? 'text-rose-600' : 'text-slate-700'}`}>
                            {(pred.anomalyScore * 100).toFixed(0)}%
                          </span>
                          {pred.isAnomaly && (
                            <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold bg-rose-100 text-rose-700 rounded">
                              ANOMALY
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge status={pred.riskLevel || 'LOW'} />
                          <span className="ml-2 font-mono font-bold text-slate-700">
                            {Math.round(pred.failureProbability * 100)}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          ~{Math.round(pred.rulHours)} hrs
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            pred.healthScore >= 80 ? 'bg-emerald-100 text-emerald-800' : (pred.healthScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                          }`}>
                            {pred.healthScore}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button className="p-1 text-slate-400 hover:text-slate-600">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable Explanation Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="p-5">
                            <div className="space-y-3">
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                  AI Diagnostic Explanation:
                                </h4>
                                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                  {pred.explanation || 'Sensor telemetry indicates steady baseline operation.'}
                                </p>
                              </div>

                              {pred.contributingFactors && pred.contributingFactors.length > 0 && (
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                    Primary Contributing Factors:
                                  </h4>
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                    {pred.contributingFactors.slice(0, 4).map((f) => (
                                      <div key={f.feature} className="p-2 bg-white rounded-lg border border-slate-200 text-xs">
                                        <div className="flex justify-between font-semibold text-slate-700 capitalize">
                                          <span>{f.feature.replace('_', ' ')}:</span>
                                          <span className="text-sky-600">{Math.round(f.importance * 100)}%</span>
                                        </div>
                                        {f.value !== undefined && (
                                          <span className="text-[11px] text-slate-400 font-mono block mt-0.5">
                                            Observed: {f.value} {f.unit || ''}
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="pt-2 flex justify-end">
                                <Link
                                  to={`/machines/${pred.machineId}`}
                                  className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700"
                                >
                                  <span>View Machine Telemetry</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs font-semibold">
            No prediction logs found.
          </div>
        )}
      </div>
    </div>
  );
};
