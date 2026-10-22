const mongoose = require('mongoose');
const Machine = require('../models/Machine');
const SensorReading = require('../models/SensorReading');
const Prediction = require('../models/Prediction');

const DEMO_MACHINES = [
  { machineId: 'CNC-001', name: 'DMG Mori 5-Axis Milling Center', type: 'CNC Milling', manufacturer: 'DMG Mori', location: 'Bay A - Factory Floor 1', status: 'Running', healthScore: 94, operatingHours: 3200, nextMaintenanceDate: new Date(Date.now() + 86400000 * 20), latestPrediction: { failureProbability: 0.06, riskLevel: 'LOW', rulHours: 320, anomalyScore: 0.08 } },
  { machineId: 'CNC-002', name: 'Mazak Precision Lathe Unit', type: 'Lathe', manufacturer: 'Mazak Corp', location: 'Bay A - Factory Floor 1', status: 'Running', healthScore: 88, operatingHours: 2850, nextMaintenanceDate: new Date(Date.now() + 86400000 * 35), latestPrediction: { failureProbability: 0.12, riskLevel: 'LOW', rulHours: 260, anomalyScore: 0.15 } },
  { machineId: 'CNC-003', name: 'Trumpf High-Tonnage Hydraulic Press', type: 'Hydraulic Press', manufacturer: 'Trumpf Group', location: 'Bay B - Heavy Forming', status: 'Running', healthScore: 68, operatingHours: 4600, nextMaintenanceDate: new Date(Date.now() + 86400000 * 5), latestPrediction: { failureProbability: 0.44, riskLevel: 'MEDIUM', rulHours: 72, anomalyScore: 0.42 } },
  { machineId: 'CNC-004', name: 'Haas VF-4SS Super-Speed Machining Center', type: 'CNC Milling', manufacturer: 'Haas Automation', location: 'Bay B - Precision Cell', status: 'Critical', healthScore: 28, operatingHours: 5120, nextMaintenanceDate: new Date(Date.now() - 86400000 * 5), latestPrediction: { failureProbability: 0.91, riskLevel: 'HIGH', rulHours: 18, anomalyScore: 0.91, contributingFactors: [{ feature: 'vibration', importance: 0.46, value: 8.6, unit: 'mm/s' }, { feature: 'temperature', importance: 0.32, value: 88.0, unit: '°C' }], explanation: 'Critical machine degradation detected. Main contributing factors: vibration (46%) and temperature (32%).' } },
  { machineId: 'CNC-005', name: 'Fanuc 6-Axis Robotic Assembly Cell', type: 'Robotic Arm', manufacturer: 'Fanuc Robotics', location: 'Bay C - Automated Assembly', status: 'Running', healthScore: 96, operatingHours: 1400, nextMaintenanceDate: new Date(Date.now() + 86400000 * 45), latestPrediction: { failureProbability: 0.04, riskLevel: 'LOW', rulHours: 410, anomalyScore: 0.05 } }
];

exports.getAllMachines = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, count: DEMO_MACHINES.length, data: DEMO_MACHINES });
    }

    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const machines = await Machine.find(filter).sort({ machineId: 1 });
    if (!machines || machines.length === 0) {
      return res.status(200).json({ success: true, count: DEMO_MACHINES.length, data: DEMO_MACHINES });
    }
    
    const machineCards = await Promise.all(
      machines.map(async (m) => {
        const latestReading = await SensorReading.findOne({ machineId: m.machineId }).sort({ timestamp: -1 });
        const latestPrediction = await Prediction.findOne({ machineId: m.machineId }).sort({ timestamp: -1 });
        return {
          ...m.toObject(),
          latestReading: latestReading || null,
          latestPrediction: latestPrediction || null
        };
      })
    );

    res.status(200).json({
      success: true,
      count: machineCards.length,
      data: machineCards
    });
  } catch (err) {
    res.status(200).json({ success: true, count: DEMO_MACHINES.length, data: DEMO_MACHINES });
  }
};

exports.getMachineById = async (req, res, next) => {
  try {
    const machineId = req.params.id.toUpperCase();
    if (mongoose.connection.readyState !== 1) {
      const demo = DEMO_MACHINES.find(m => m.machineId === machineId) || DEMO_MACHINES[3];
      return res.status(200).json({ success: true, data: demo });
    }

    const machine = await Machine.findOne({ machineId });
    if (!machine) {
      const demo = DEMO_MACHINES.find(m => m.machineId === machineId);
      if (demo) return res.status(200).json({ success: true, data: demo });
      return res.status(404).json({ success: false, message: `Machine ${machineId} not found.` });
    }

    const latestReading = await SensorReading.findOne({ machineId }).sort({ timestamp: -1 });
    const latestPrediction = await Prediction.findOne({ machineId }).sort({ timestamp: -1 });

    res.status(200).json({
      success: true,
      data: {
        ...machine.toObject(),
        latestReading,
        latestPrediction
      }
    });
  } catch (err) {
    const machineId = req.params.id.toUpperCase();
    const demo = DEMO_MACHINES.find(m => m.machineId === machineId) || DEMO_MACHINES[3];
    return res.status(200).json({ success: true, data: demo });
  }
};

exports.createMachine = async (req, res, next) => {
  try {
    const { machineId, name, type, manufacturer, location, installationDate, operatingHours } = req.body;

    const existing = await Machine.findOne({ machineId: machineId.toUpperCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Machine ID ${machineId} already exists.` });
    }

    const machine = await Machine.create({
      machineId: machineId.toUpperCase(),
      name,
      type,
      manufacturer,
      location,
      installationDate: installationDate || new Date(),
      operatingHours: operatingHours || 0,
      healthScore: 98,
      status: 'Running'
    });

    res.status(201).json({
      success: true,
      data: machine
    });
  } catch (err) {
    next(err);
  }
};

exports.updateMachine = async (req, res, next) => {
  try {
    const machineId = req.params.id.toUpperCase();
    const machine = await Machine.findOneAndUpdate(
      { machineId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!machine) {
      return res.status(404).json({ success: false, message: `Machine ${machineId} not found.` });
    }

    res.status(200).json({
      success: true,
      data: machine
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteMachine = async (req, res, next) => {
  try {
    const machineId = req.params.id.toUpperCase();
    const machine = await Machine.findOneAndDelete({ machineId });

    if (!machine) {
      return res.status(404).json({ success: false, message: `Machine ${machineId} not found.` });
    }

    // Clean up related sensor records
    await SensorReading.deleteMany({ machineId });
    await Prediction.deleteMany({ machineId });

    res.status(200).json({
      success: true,
      message: `Machine ${machineId} deleted successfully.`
    });
  } catch (err) {
    next(err);
  }
};
