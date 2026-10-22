import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Calendar,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  User,
  Check
} from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';
import { machineService } from '../services/machineService';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAuth } from '../context/AuthContext';

export const Maintenance = () => {
  const [records, setRecords] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    machineId: 'CNC-004',
    technician: 'Sarah Connor',
    maintenanceType: 'Preventive',
    priority: 'HIGH',
    description: '',
    cost: 450,
    scheduledDate: new Date().toISOString().split('T')[0]
  });

  const { isEngineer } = useAuth();

  const loadData = async () => {
    try {
      const [mRes, recRes] = await Promise.all([
        machineService.getAll(),
        maintenanceService.getAll()
      ]);
      setMachines(mRes.data || []);
      setRecords(recRes.data || []);
    } catch (err) {
      console.error('Failed to load maintenance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await maintenanceService.create(form);
      setIsModalOpen(false);
      setForm({
        machineId: 'CNC-004',
        technician: 'Sarah Connor',
        maintenanceType: 'Preventive',
        priority: 'HIGH',
        description: '',
        cost: 450,
        scheduledDate: new Date().toISOString().split('T')[0]
      });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating maintenance task');
    }
  };

  const handleMarkCompleted = async (id, machineId) => {
    try {
      await maintenanceService.update(id, {
        status: 'Completed',
        completedDate: new Date(),
        notes: 'Service inspected and completed. Replaced worn components. Machine returned to healthy operating envelope.'
      });
      alert(`Maintenance marked as Completed! Machine ${machineId} health restored to 96% Healthy.`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update record');
    }
  };

  const filteredRecords = records.filter((r) => {
    return statusFilter === 'ALL' || r.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Maintenance Work Orders</h2>
          <p className="text-xs text-slate-500">
            Schedule work orders, track technician execution, and close preventive maintenance loops
          </p>
        </div>

        {isEngineer && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Work Order</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1">
        {['ALL', 'Scheduled', 'In Progress', 'Completed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-2 rounded-xl font-semibold transition-colors ${
              statusFilter === st
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Records Table Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <LoadingSpinner message="Loading work orders..." />
        ) : filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 px-4">Machine</th>
                  <th className="py-3.5 px-4">Type</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Technician</th>
                  <th className="py-3.5 px-4">Scheduled Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Cost</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {r.machineId}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {r.maintenanceType}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.priority} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {r.technician}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(r.scheduledDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                      ${r.cost || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isEngineer && r.status !== 'Completed' && (
                        <button
                          onClick={() => handleMarkCompleted(r._id, r.machineId)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Complete & Restore</span>
                        </button>
                      )}
                      {r.status === 'Completed' && (
                        <span className="text-[11px] font-bold text-emerald-600">
                          Restored
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs font-semibold">
            No maintenance records found.
          </div>
        )}
      </div>

      {/* Create Maintenance Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Preventive / Corrective Maintenance"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">Target Machine</label>
            <select
              value={form.machineId}
              onChange={(e) => setForm({ ...form, machineId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            >
              {machines.map((m) => (
                <option key={m.machineId} value={m.machineId}>
                  {m.machineId} - {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Technician</label>
            <input
              type="text"
              required
              value={form.technician}
              onChange={(e) => setForm({ ...form, technician: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">Maintenance Type</label>
            <select
              value={form.maintenanceType}
              onChange={(e) => setForm({ ...form, maintenanceType: e.target.value })}
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
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
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
              placeholder="e.g. Disassemble spindle housing, replace ball bearings, test run vibration."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">Scheduled Date</label>
              <input
                type="date"
                required
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">Estimated Cost ($)</label>
              <input
                type="number"
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-sky-600 hover:bg-sky-700 rounded-lg font-semibold"
            >
              Confirm Task
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
