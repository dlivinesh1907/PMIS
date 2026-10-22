import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Wrench,
  Activity,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Clock,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { machineService } from '../services/machineService';
import { sensorService } from '../services/sensorService';
import { predictionService } from '../services/predictionService';
import { maintenanceService } from '../services/maintenanceService';
import { SensorCard } from '../components/sensors/SensorCard';
import { SensorChart } from '../components/sensors/SensorChart';
import { HealthGauge } from '../components/common/HealthGauge';
import { StatusBadge } from '../components/common/StatusBadge';
import { RiskIndicator } from '../components/common/RiskIndicator';
import { RULCard } from '../components/ai/RULCard';
import { AIExplanationCard } from '../components/ai/AIExplanationCard';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

export const MachineDetail = () => {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [sensorHistory, setSensorHistory] = useState([]);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    technician: 'Sarah Connor',
    maintenanceType: 'Preventive',
    priority: 'HIGH',
    description: '',
    cost: 350
  });

  const { liveReadings } = useSocket();
  const { isEngineer } = useAuth();

  const loadData = async () => {
    try {
      const mData = await machineService.getById(id);
      const sData = await sensorService.getHistory(id, 40);
      const pData = await predictionService.getLatest(id).catch(() => null);

      setMachine(mData);
      setSensorHistory(sData || []);
      setPrediction(pData);
    } catch (err) {
      console.error('Failed to load machine detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [id]);

  // Merge live telemetry if socket emits for this machine
  const live = liveReadings[id?.toUpperCase()];
  const latestTelemetry = live?.reading || machine?.latestReading || {};
  const currentPrediction = live?.prediction || prediction || {};
  const currentHealth = live?.healthScore ?? machine?.healthScore ?? 90;
  const currentStatus = live?.status ?? machine?.status ?? 'Running';

  const handleScheduleMaintenance = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.create({
        machineId: id,
        ...maintenanceForm
      });
      setIsMaintenanceModalOpen(false);
      alert(`Maintenance successfully scheduled for ${id}!`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to schedule maintenance');
    }
  };

  if (loading && !machine) {
    return <LoadingSpinner message={`Accessing telemetry for machine ${id}...`} />;
  }

  if (!machine) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
        <p className="text-slate-600 font-bold">Machine not found.</p>
        <Link to="/machines" className="mt-3 inline-block text-xs font-bold text-sky-600">
          Back to machines
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link
              to="/machines"
              className="p-2 text-slate-400 hover:text-slate-700 bg-slate-100 rounded-lg transition-colors mt-1"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="font-mono font-black text-xl text-slate-900">{machine.machineId}</span>
                <StatusBadge status={currentStatus} />
                {live && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-ping"></span>
                    Live Streaming
                  </span>
                )}
              </div>
              <h2 className="text-lg font-bold text-slate-800 mt-1">{machine.name}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {machine.type} • {machine.manufacturer} • {machine.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEngineer && (
              <button
                onClick={() => setIsMaintenanceModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all"
              >
                <Wrench className="w-4 h-4" />
                <span>Schedule Maintenance</span>
              </button>
            )}
            <button
              onClick={loadData}
              className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* AI Intelligence & Health Hero Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Health Gauge Box */}
        <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Machine Health Index</span>
          <HealthGauge score={currentHealth} size={130} strokeWidth={11} />
          <p className="text-[11px] text-slate-400 mt-2">Weighted composite AI health rating</p>
        </div>

        {/* Risk Probability Box */}
        <div className="flex flex-col justify-between">
          <RiskIndicator
            level={currentPrediction?.riskLevel || 'LOW'}
            probability={currentPrediction?.failureProbability ?? 0.05}
          />
          <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm mt-3 text-xs space-y-1">
            <div className="flex justify-between text-slate-500">
              <span>Operating Hours:</span>
              <span className="font-bold text-slate-800">{machine.operatingHours} hrs</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Last Maintenance:</span>
              <span className="font-medium text-slate-700">{new Date(machine.lastMaintenanceDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Next Service Due:</span>
              <span className="font-medium text-slate-700">{new Date(machine.nextMaintenanceDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Remaining Useful Life Box */}
        <div>
          <RULCard
            rulHours={currentPrediction?.rulHours ?? 280}
            confidence={0.88}
          />
        </div>
      </div>

      {/* Live Sensor Telemetry Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">Current Sensor Telemetry</h3>
          <span className="text-xs text-slate-400">Updates in real time via Socket.IO</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <SensorCard type="temperature" value={latestTelemetry.temperature || 50} isLive={Boolean(live)} />
          <SensorCard type="vibration" value={latestTelemetry.vibration || 2.2} isLive={Boolean(live)} />
          <SensorCard type="pressure" value={latestTelemetry.pressure || 85} isLive={Boolean(live)} />
          <SensorCard type="rpm" value={latestTelemetry.rpm || 1480} isLive={Boolean(live)} />
          <SensorCard type="current" value={latestTelemetry.current || 10.5} isLive={Boolean(live)} />
          <SensorCard type="acousticLevel" value={latestTelemetry.acousticLevel || 60} isLive={Boolean(live)} />
        </div>
      </div>

      {/* Explainable AI Diagnostics & Contributing Factors */}
      <div>
        <AIExplanationCard
          contributingFactors={currentPrediction?.contributingFactors}
          explanation={currentPrediction?.explanation}
          recommendedAction={
            currentPrediction?.riskLevel === 'HIGH'
              ? 'Perform immediate dynamic vibration test and inspect spindle bearings before catastrophic seizure.'
              : (currentPrediction?.riskLevel === 'MEDIUM'
                ? 'Check lubrication viscosity and clean hydraulic filter during next maintenance window.'
                : 'All sensor telemetry within nominal tolerance. Continue standard operations.')
          }
        />
      </div>

      {/* Historical Telemetry Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SensorChart
          data={sensorHistory}
          dataKey="vibration"
          title="Vibration Velocity Over Time"
          unit="mm/s"
          warningThreshold={4.0}
          criticalThreshold={7.0}
          strokeColor="#0284c7"
          fillColor="#e0f2fe"
        />
        <SensorChart
          data={sensorHistory}
          dataKey="temperature"
          title="Operating Temperature"
          unit="°C"
          warningThreshold={70}
          criticalThreshold={85}
          strokeColor="#f59e0b"
          fillColor="#fef3c7"
        />
        <SensorChart
          data={sensorHistory}
          dataKey="pressure"
          title="Hydraulic Pressure"
          unit="PSI"
          warningThreshold={70}
          criticalThreshold={55}
          strokeColor="#10b981"
          fillColor="#d1fae5"
        />
      </div>

      {/* Schedule Maintenance Modal */}
      <Modal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        title={`Schedule Maintenance for ${machine.machineId}`}
      >
        <form onSubmit={handleScheduleMaintenance} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Technician</label>
            <input
              type="text"
              required
              value={maintenanceForm.technician}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, technician: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Maintenance Type</label>
            <select
              value={maintenanceForm.maintenanceType}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, maintenanceType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option>Preventive</option>
              <option>Corrective</option>
              <option>Predictive Overhaul</option>
              <option>Lubrication</option>
              <option>Sensor Calibration</option>
              <option>Emergency Repair</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Priority</label>
            <select
              value={maintenanceForm.priority}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, priority: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option>LOW</option>
              <option>MEDIUM</option>
              <option>HIGH</option>
              <option>CRITICAL</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Scope & Description</label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Inspect spindle bearing assembly and replace lubrication fluid."
              value={maintenanceForm.description}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Estimated Cost ($)</label>
            <input
              type="number"
              value={maintenanceForm.cost}
              onChange={(e) => setMaintenanceForm({ ...maintenanceForm, cost: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsMaintenanceModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold"
            >
              Confirm Work Order
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
