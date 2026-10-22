const Prediction = require('../models/Prediction');
const SensorReading = require('../models/SensorReading');
const Machine = require('../models/Machine');
const { getPredictions } = require('../services/mlService');

exports.analyzeMachine = async (req, res, next) => {
  try {
    const machineId = req.params.machineId.toUpperCase();
    const machine = await Machine.findOne({ machineId });

    if (!machine) {
      return res.status(404).json({ success: false, message: `Machine ${machineId} not found.` });
    }

    const latestReading = await SensorReading.findOne({ machineId }).sort({ timestamp: -1 });
    if (!latestReading) {
      return res.status(400).json({ success: false, message: `No telemetry available to analyze for ${machineId}.` });
    }

    const predictionData = await getPredictions({
      ...latestReading.toObject(),
      operatingHours: machine.operatingHours
    });

    const prediction = await Prediction.create({
      machineId,
      timestamp: new Date(),
      ...predictionData,
      predictionStatus: predictionData.isAnomaly ? 'ANOMALY' : (predictionData.riskLevel === 'HIGH' ? 'CRITICAL' : 'NORMAL')
    });

    machine.healthScore = predictionData.healthScore;
    await machine.save();

    res.status(200).json({
      success: true,
      data: prediction
    });
  } catch (err) {
    next(err);
  }
};

exports.getLatestPrediction = async (req, res, next) => {
  try {
    const machineId = req.params.machineId.toUpperCase();
    const latest = await Prediction.findOne({ machineId }).sort({ timestamp: -1 });

    if (!latest) {
      return res.status(404).json({ success: false, message: `No predictions found for ${machineId}.` });
    }

    res.status(200).json({
      success: true,
      data: latest
    });
  } catch (err) {
    next(err);
  }
};

exports.getPredictionHistory = async (req, res, next) => {
  try {
    const machineId = req.params.machineId.toUpperCase();
    const limit = parseInt(req.query.limit, 10) || 30;

    const history = await Prediction.find({ machineId })
      .sort({ timestamp: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      count: history.length,
      data: history
    });
  } catch (err) {
    next(err);
  }
};
