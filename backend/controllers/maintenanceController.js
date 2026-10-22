const MaintenanceRecord = require('../models/MaintenanceRecord');
const Machine = require('../models/Machine');
const simulator = require('../services/sensorSimulator');

exports.getAllMaintenance = async (req, res, next) => {
  try {
    const { status, machineId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (machineId) filter.machineId = machineId.toUpperCase();

    const records = await MaintenanceRecord.find(filter).sort({ scheduledDate: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (err) {
    next(err);
  }
};

exports.createMaintenance = async (req, res, next) => {
  try {
    const { machineId, technician, maintenanceType, priority, description, scheduledDate, cost, notes } = req.body;

    const machine = await Machine.findOne({ machineId: machineId.toUpperCase() });
    if (!machine) {
      return res.status(404).json({ success: false, message: `Machine ${machineId} not found.` });
    }

    const record = await MaintenanceRecord.create({
      machineId: machine.machineId,
      technician,
      maintenanceType: maintenanceType || 'Preventive',
      priority: priority || 'MEDIUM',
      description,
      scheduledDate: scheduledDate || new Date(),
      cost: cost || 0,
      notes: notes || ''
    });

    // Optionally set machine status to Maintenance if in progress
    if (req.body.status === 'In Progress') {
      machine.status = 'Maintenance';
      await machine.save();
    }

    res.status(201).json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMaintenance = async (req, res, next) => {
  try {
    const record = await MaintenanceRecord.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    }

    const previousStatus = record.status;
    const { status, notes, cost, completedDate, technician, description } = req.body;

    if (status) record.status = status;
    if (notes !== undefined) record.notes = notes;
    if (cost !== undefined) record.cost = cost;
    if (technician) record.technician = technician;
    if (description) record.description = description;

    if (status === 'Completed' && !record.completedDate) {
      record.completedDate = completedDate || new Date();
      
      // Reset machine health and status back to pristine operation
      const machine = await Machine.findOne({ machineId: record.machineId });
      if (machine) {
        machine.status = 'Running';
        machine.healthScore = 96;
        machine.lastMaintenanceDate = new Date();
        machine.nextMaintenanceDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000);
        await machine.save();

        // Reset simulator degradation state
        simulator.resetMachine(machine.machineId);

        const io = req.app.get('io');
        if (io) {
          io.emit('machine_updated', machine);
        }
      }
    }

    await record.save();

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteMaintenance = async (req, res, next) => {
  try {
    const record = await MaintenanceRecord.findByIdAndDelete(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Maintenance task deleted successfully.'
    });
  } catch (err) {
    next(err);
  }
};
