import React, { useState, useEffect } from 'react';
import {
  Play,
  Square,
  AlertTriangle,
  Flame,
  Activity,
  RotateCcw,
  Zap,
  Gauge,
  Thermometer,
  Radio
} from 'lucide-react';
import { machineService } from '../services/machineService';
import { simulationService } from '../services/dashboardService';
import { SensorCard } from '../components/sensors/SensorCard';
import { HealthGauge } from '../components/common/HealthGauge';
import { StatusBadge } from '../components/common/StatusBadge';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useSocket } from '../context/SocketContext';
import { Link } from 'react-router-dom';

export const LiveMonitoring = () => {
  const [machines, setMachines] = useState([]);
  const [selectedMachineId, setSelectedMachineId] = useState('CNC-004');
  const [loading, setLoading] = useState(true);
  const [packetStream, setPacketStream] = useState([]);

  const { isConnected, liveReadings, simulationRunning, setSimulationRunning } = useSocket();

  useEffect(() => {
    const fetchMachines = async () => {
      try {
        const res = await machineService.getAll();
        setMachines(res.data || []);
      } catch (err) {
        console.error('Failed to load machine list:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMachines();
  }, []);

  // When a new reading arrives for the selected machine, push to packetStream log
  useEffect(() => {
    const currentLive = liveReadings[selectedMachineId];
    if (currentLive?.reading) {
      setPacketStream((prev) => [
        {
          id: `${selectedMachineId}-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          machineId: selectedMachineId,
          vibration: currentLive.reading.vibration,
          temperature: currentLive.reading.temperature,
          pressure: currentLive.reading.pressure,
          anomalyScore: currentLive.prediction?.anomalyScore || 0.1,
          healthScore: currentLive.healthScore
        },
        ...prev.slice(0, 19) // keep last 20 packets
      ]);
    }
  }, [liveReadings, selectedMachineId]);

  const handleToggleSimulation = async () => {
    try {
      if (simulationRunning) {
        await simulationService.stop();
        setSimulationRunning(false);
      } else {
        await simulationService.start();
        setSimulationRunning(true);
      }
    } catch (err) {
      console.error('Error toggling simulation:', err);
    }
  };

  const handleTriggerDegrade = async () => {
    try {
      await simulationService.degrade(selectedMachineId);
      if (!simulationRunning) {
        await simulationService.start();
        setSimulationRunning(true);
      }
    } catch (err) {
      console.error('Error triggering degradation:', err);
    }
  };

  const handleResetMachine = async () => {
    try {
      await simulationService.reset(selectedMachineId);
    } catch (err) {
      console.error('Error resetting machine:', err);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Initializing live telemetry feed..." />;
  }

  const activeMachine = machines.find((m) => m.machineId === selectedMachineId) || machines[0];
  const live = liveReadings[selectedMachineId];
  const currentReading = live?.reading || activeMachine?.latestReading || {
    temperature: 50,
    vibration: 2.2,
    pressure: 85,
    rpm: 1480,
    current: 10.5,
    acousticLevel: 60
  };
  const currentPrediction = live?.prediction || activeMachine?.latestPrediction || {};
  const currentHealth = live?.healthScore ?? activeMachine?.healthScore ?? 92;

  return (
    <div className="space-y-6">
      {/* Simulation Control Bar */}
      <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">Real-Time Telemetry Gateway</h2>
            <p className="text-xs text-slate-400">
              {isConnected ? 'Socket.IO channel open • Telemetry broadcast active' : 'Connecting to gateway...'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleToggleSimulation}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl shadow-sm transition-all ${
              simulationRunning
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
            }`}
          >
            {simulationRunning ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Simulator</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start Simulator</span>
              </>
            )}
          </button>

          <button
            onClick={handleTriggerDegrade}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-all"
            title="Accelerate bearing wear simulation to trigger AI anomaly detection"
          >
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>Simulate Degradation</span>
          </button>

          <button
            onClick={handleResetMachine}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
            title="Reset telemetry to baseline"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset Baseline</span>
          </button>
        </div>
      </div>

      {/* Machine Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {machines.map((m) => {
          const isSelected = m.machineId === selectedMachineId;
          const liveScore = liveReadings[m.machineId]?.healthScore ?? m.healthScore;
          return (
            <button
              key={m.machineId}
              onClick={() => setSelectedMachineId(m.machineId)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shrink-0 ${
                isSelected
                  ? 'bg-white border-sky-500 text-sky-700 shadow-md ring-2 ring-sky-500/20'
                  : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white hover:border-slate-300'
              }`}
            >
              <span className="font-mono">{m.machineId}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  liveScore >= 80 ? 'bg-emerald-500' : (liveScore >= 60 ? 'bg-amber-500' : 'bg-rose-500')
                }`}
              />
              <span className="text-[11px] font-medium text-slate-400">({liveScore}%)</span>
            </button>
          );
        })}
      </div>

      {/* Main Live Telemetry Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Machine Status Summary Box */}
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col justify-between items-center text-center">
          <div>
            <span className="font-mono font-black text-xl text-slate-900 block">{activeMachine?.machineId}</span>
            <h3 className="text-sm font-bold text-slate-700 mt-0.5">{activeMachine?.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{activeMachine?.location}</p>
          </div>

          <div className="my-6">
            <HealthGauge score={currentHealth} size={130} strokeWidth={11} />
          </div>

          <div className="w-full pt-4 border-t border-slate-100 space-y-2 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Failure Probability:</span>
              <span className="font-bold text-slate-800">
                {Math.round((currentPrediction?.failureProbability || 0.05) * 100)}%
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Anomaly Index:</span>
              <span className="font-bold text-slate-800">
                {((currentPrediction?.anomalyScore || 0.08) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Remaining Useful Life:</span>
              <span className="font-bold text-slate-800">
                ~{Math.round(currentPrediction?.rulHours || 280)} hrs
              </span>
            </div>
            <Link
              to={`/machines/${activeMachine?.machineId}`}
              className="mt-3 block w-full py-2 text-center text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors"
            >
              Full Diagnostics Page →
            </Link>
          </div>
        </div>

        {/* Live Multi-Sensor Telemetry Grid */}
        <div className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <SensorCard type="temperature" value={currentReading.temperature} isLive={true} />
            <SensorCard type="vibration" value={currentReading.vibration} isLive={true} />
            <SensorCard type="pressure" value={currentReading.pressure} isLive={true} />
            <SensorCard type="rpm" value={currentReading.rpm} isLive={true} />
            <SensorCard type="current" value={currentReading.current} isLive={true} />
            <SensorCard type="acousticLevel" value={currentReading.acousticLevel} isLive={true} />
          </div>

          {/* Real-time Telemetry Ingestion Log */}
          <div className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Live Sensor Packet Stream ({selectedMachineId})
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">Auto-scrolling telemetry</span>
            </div>

            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="py-2">Time</th>
                    <th className="py-2">Vibration</th>
                    <th className="py-2">Temperature</th>
                    <th className="py-2">Pressure</th>
                    <th className="py-2">Anomaly Score</th>
                    <th className="py-2">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 font-mono text-slate-700">
                  {packetStream.length > 0 ? (
                    packetStream.map((packet) => (
                      <tr key={packet.id} className="hover:bg-slate-50">
                        <td className="py-1.5 text-slate-400">{packet.time}</td>
                        <td className={`py-1.5 font-bold ${packet.vibration >= 7.0 ? 'text-rose-600' : (packet.vibration >= 4.0 ? 'text-amber-600' : 'text-slate-800')}`}>
                          {packet.vibration} mm/s
                        </td>
                        <td className={`py-1.5 ${packet.temperature >= 85 ? 'text-rose-600 font-bold' : (packet.temperature >= 70 ? 'text-amber-600' : 'text-slate-800')}`}>
                          {packet.temperature}°C
                        </td>
                        <td className="py-1.5">{packet.pressure} PSI</td>
                        <td className="py-1.5">{packet.anomalyScore}</td>
                        <td className="py-1.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            packet.healthScore >= 80 ? 'bg-emerald-100 text-emerald-800' : (packet.healthScore >= 60 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800')
                          }`}>
                            {packet.healthScore}%
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-400 font-sans">
                        Start the simulator above to see live incoming telemetry packets.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
