const Alert = require('../models/Alert');

// In-memory throttle tracker: machineId -> lastAlertTimestamp
const alertThrottle = new Map();
const THROTTLE_MS = 90 * 1000; // 1.5 minutes per machine

const evaluateAndGenerateAlert = async (machine, sensorReading, prediction, io) => {
  try {
    const { machineId } = machine;
    const now = Date.now();
    const lastAlertTime = alertThrottle.get(machineId) || 0;

    const isHighRisk = prediction.riskLevel === 'HIGH' || prediction.failureProbability >= 0.70;
    const isMediumRisk = prediction.riskLevel === 'MEDIUM' || prediction.failureProbability >= 0.35;
    const isAnomaly = prediction.isAnomaly || prediction.anomalyScore >= 0.65;
    const isExtremeSensor = sensorReading.vibration >= 7.0 || sensorReading.temperature >= 85.0;

    // Check if an alert condition is met
    if (!isHighRisk && !isMediumRisk && !isAnomaly && !isExtremeSensor) {
      return null;
    }

    // Check throttling
    if (now - lastAlertTime < THROTTLE_MS) {
      return null;
    }

    let severity = 'WARNING';
    let type = 'ANOMALY_DETECTED';
    let title = `Telemetry Warning on ${machineId}`;
    let message = `Abnormal operating parameters detected on ${machine.name}.`;
    let recommendedAction = 'Review sensor charts and inspect machine during next shift.';

    if (isHighRisk || isExtremeSensor || prediction.rulHours <= 24) {
      severity = 'CRITICAL';
      type = prediction.rulHours <= 24 ? 'LOW_RUL_CRITICAL' : 'HIGH_FAILURE_RISK';
      title = `Critical Failure Risk: ${machineId}`;
      message = `Imminent failure probability ${Math.round(prediction.failureProbability * 100)}% with estimated RUL of only ${Math.round(prediction.rulHours)} hours.`;
      recommendedAction = 'Take machine offline or schedule emergency inspection immediately.';
    } else if (isAnomaly) {
      type = 'ANOMALY_DETECTED';
      title = `Anomaly Detected on ${machineId}`;
      message = `Multi-sensor variance exceeds normal baseline (Anomaly Score: ${(prediction.anomalyScore * 100).toFixed(0)}%).`;
      recommendedAction = 'Verify lubrication, acoustic noise, and spindle vibration.';
    }

    const alert = await Alert.create({
      machineId,
      type,
      severity,
      title,
      message,
      anomalyScore: prediction.anomalyScore,
      failureProbability: prediction.failureProbability,
      rulHours: prediction.rulHours,
      explanation: prediction.explanation,
      recommendedAction,
      status: 'ACTIVE'
    });

    alertThrottle.set(machineId, now);

    // Broadcast through Socket.IO if available
    if (io) {
      io.emit('new_alert', {
        alert,
        machineId,
        machineName: machine.name
      });
    }

    return alert;
  } catch (error) {
    console.error('Error evaluating alert:', error.message);
    return null;
  }
};

module.exports = { evaluateAndGenerateAlert };
