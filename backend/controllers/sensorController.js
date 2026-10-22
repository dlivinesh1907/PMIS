const SensorReading = require('../models/SensorReading');
const Machine = require('../models/Machine');
const Prediction = require('../models/Prediction');
const { getPredictions } = require('../services/mlService');
const { evaluateAndGenerateAlert } = require('../services/alertEngine');

/**
 * Ingests incoming sensor telemetry, triggers ML prediction, updates health, and broadcasts real-time updates.
 */
exports.ingestReading = async (req, res, next) => {
  try {
    const {
      machineId,
      temperature,
      vibration,
      pressure,
      rpm,
      current,
      voltage,
      acousticLevel,
      timestamp
    } = req.body;

    if (!machineId || temperature === undefined || vibration === undefined) {
      return res.status(400).json({
        success: false,
        message: 'machineId, temperature, and vibration are mandatory fields.'
      });
    }

    const machine = await Machine.findOne({ machineId: machineId.toUpperCase() });
    if (!machine) {
      return res.status(404).json({ success: false, message: `Machine ${machineId} not found.` });
    }

    // 1. Store sensor reading
    const reading = await SensorReading.create({
      machineId: machine.machineId,
      timestamp: timestamp || new Date(),
      temperature,
      vibration,
      pressure: pressure || 85,
      rpm: rpm || 1480,
      current: current || 10.5,
      voltage: voltage || 230,
      acousticLevel: acousticLevel || 60
    });

    // 2. Call ML Service (with fallback)
    const predictionData = await getPredictions({
      temperature,
      vibration,
      pressure,
      rpm,
      current,
      voltage,
      acousticLevel,
      operatingHours: machine.operatingHours
    });

    // 3. Persist Prediction
    const prediction = await Prediction.create({
      machineId: machine.machineId,
      timestamp: reading.timestamp,
      anomalyScore: predictionData.anomalyScore,
      isAnomaly: predictionData.isAnomaly,
      failureProbability: predictionData.failureProbability,
      riskLevel: predictionData.riskLevel,
      rulHours: predictionData.rulHours,
      healthScore: predictionData.healthScore,
      predictionStatus: predictionData.isAnomaly ? 'ANOMALY' : (predictionData.riskLevel === 'HIGH' ? 'CRITICAL' : 'NORMAL'),
      contributingFactors: predictionData.contributingFactors,
      explanation: predictionData.explanation
    });

    // 4. Update Machine Entity Status & Health Score
    machine.healthScore = predictionData.healthScore;
    if (predictionData.riskLevel === 'HIGH' || predictionData.healthScore < 40) {
      machine.status = 'Critical';
    } else if (predictionData.riskLevel === 'MEDIUM' || predictionData.healthScore < 80) {
      machine.status = 'Running';
    } else if (machine.status !== 'Maintenance') {
      machine.status = 'Running';
    }
    await machine.save();

    // 5. Evaluate and emit Alert
    const io = req.app.get('io');
    const alert = await evaluateAndGenerateAlert(machine, reading, predictionData, io);

    // 6. Real-time WebSocket emission
    if (io) {
      io.emit('sensor_reading', {
        machineId: machine.machineId,
        reading,
        prediction: predictionData,
        healthScore: machine.healthScore,
        status: machine.status
      });
    }

    res.status(201).json({
      success: true,
      reading,
      prediction: predictionData,
      alertGenerated: Boolean(alert)
    });
  } catch (err) {
    next(err);
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const machineId = req.params.machineId.toUpperCase();
    const limit = parseInt(req.query.limit, 10) || 50;

    const readings = await SensorReading.find({ machineId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: readings.length,
      // Reverse to chronological order for charts
      data: readings.reverse()
    });
  } catch (err) {
    next(err);
  }
};

exports.getLatest = async (req, res, next) => {
  try {
    const machineId = req.params.machineId.toUpperCase();
    const latest = await SensorReading.findOne({ machineId }).sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ success: false, message: `No sensor telemetry recorded for ${machineId}.` });
    }

    res.status(200).json({
      success: true,
      data: latest
    });
  } catch (err) {
    next(err);
  }
};
