import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Cpu, Wrench, ArrowUpRight, Trash2, Edit3 } from 'lucide-react';
import { machineService } from '../services/machineService';
import { HealthGauge } from '../components/common/HealthGauge';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export const Machines = () => {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMachine, setNewMachine] = useState({
    machineId: '',
    name: '',
    type: 'CNC Milling',
    manufacturer: '',
    location: 'Bay A - Factory Floor 1',
    operatingHours: 1000
  });

  const { isAdmin, isEngineer } = useAuth();
  const { liveReadings } = useSocket();

  const fetchMachines = async () => {
    try {
      const res = await machineService.getAll();
      setMachines(res.data || []);
    } catch (err) {
      console.error('Failed to load machines:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleCreateMachine = async (e) => {
    e.preventDefault();
    try {
      await machineService.create(newMachine);
      setIsAddModalOpen(false);
      setNewMachine({
        machineId: '',
        name: '',
        type: 'CNC Milling',
        manufacturer: '',
        location: 'Bay A - Factory Floor 1',
        operatingHours: 1000
      });
      fetchMachines();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating machine');
    }
  };

  const handleDeleteMachine = async (id, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete machine ${id}?`)) {
      try {
        await machineService.delete(id);
        fetchMachines();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete machine');
      }
    }
  };

  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      m.machineId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || m.status.toUpperCase() === statusFilter.toUpperCase();
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header with Search & Add button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Industrial Machines</h2>
          <p className="text-xs text-slate-500">Asset catalog, health telemetry & operational status</p>
        </div>

        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Machine</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Machine ID, Name, or Bay location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Status:</span>
          {['ALL', 'RUNNING', 'CRITICAL', 'MAINTENANCE', 'IDLE'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                statusFilter === st
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Machine Grid */}
      {loading ? (
        <LoadingSpinner message="Fetching machine catalog..." />
      ) : filteredMachines.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMachines.map((machine) => {
            const live = liveReadings[machine.machineId];
            const currentHealth = live?.healthScore ?? machine.healthScore;
            const currentStatus = live?.status ?? machine.status;
            const pred = live?.prediction ?? machine.latestPrediction;

            return (
              <div
                key={machine.machineId}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-base text-slate-900">{machine.machineId}</span>
                        <StatusBadge status={currentStatus} />
                      </div>
                      <h3 className="text-sm font-bold text-slate-700 mt-1">{machine.name}</h3>
                      <p className="text-xs text-slate-400">{machine.type} • {machine.location}</p>
                    </div>

                    {isAdmin && (
                      <button
                        onClick={(e) => handleDeleteMachine(machine.machineId, e)}
                        className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                        title="Delete Machine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 my-5 items-center bg-slate-50/70 p-3 rounded-xl border border-slate-100">
                    <div className="flex flex-col items-center">
                      <HealthGauge score={currentHealth} size={84} strokeWidth={7} />
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="text-slate-500">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Failure Risk</span>
                        <span className={`font-bold ${pred?.riskLevel === 'HIGH' ? 'text-rose-600' : (pred?.riskLevel === 'MEDIUM' ? 'text-amber-600' : 'text-emerald-600')}`}>
                          {pred ? `${Math.round(pred.failureProbability * 100)}% (${pred.riskLevel})` : 'Low (5%)'}
                        </span>
                      </div>
                      <div className="text-slate-500">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Remaining Life</span>
                        <span className="font-semibold text-slate-700">{pred ? `~${Math.round(pred.rulHours)} hrs` : '280 hrs'}</span>
                      </div>
                      <div className="text-slate-500">
                        <span className="block text-[10px] uppercase font-bold text-slate-400">Hours Run</span>
                        <span className="font-mono text-slate-700">{machine.operatingHours} hrs</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Next Maint: {new Date(machine.nextMaintenanceDate).toLocaleDateString()}
                  </span>
                  <Link
                    to={`/machines/${machine.machineId}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-700"
                  >
                    <span>Telemetry & AI</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl">
          <p className="text-sm font-semibold text-slate-500">No machines match your criteria.</p>
        </div>
      )}

      {/* Add Machine Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Industrial Machine"
      >
        <form onSubmit={handleCreateMachine} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Machine Identifier (e.g. CNC-006)</label>
            <input
              type="text"
              required
              placeholder="CNC-006"
              value={newMachine.machineId}
              onChange={(e) => setNewMachine({ ...newMachine, machineId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Machine Name</label>
            <input
              type="text"
              required
              placeholder="Hermle C42 Milling Center"
              value={newMachine.name}
              onChange={(e) => setNewMachine({ ...newMachine, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Type</label>
            <select
              value={newMachine.type}
              onChange={(e) => setNewMachine({ ...newMachine, type: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              <option>CNC Milling</option>
              <option>Lathe</option>
              <option>Hydraulic Press</option>
              <option>Robotic Arm</option>
              <option>Centrifugal Pump</option>
              <option>Industrial Turbine</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Manufacturer</label>
            <input
              type="text"
              placeholder="DMG Mori / Mazak / Haas"
              value={newMachine.manufacturer}
              onChange={(e) => setNewMachine({ ...newMachine, manufacturer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Location / Cell</label>
            <input
              type="text"
              placeholder="Bay A - Factory Floor 1"
              value={newMachine.location}
              onChange={(e) => setNewMachine({ ...newMachine, location: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold"
            >
              Save Machine
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
