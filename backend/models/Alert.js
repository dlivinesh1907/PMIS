const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    index: true,
    uppercase: true
  },
  type: {
    type: String,
    enum: ['ANOMALY_DETECTED', 'HIGH_FAILURE_RISK', 'LOW_RUL_CRITICAL', 'SENSOR_THRESHOLD_EXCEEDED', 'MAINTENANCE_DUE'],
    default: 'ANOMALY_DETECTED'
  },
  severity: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL'],
    default: 'WARNING',
    index: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  anomalyScore: {
    type: Number
  },
  failureProbability: {
    type: Number
  },
  rulHours: {
    type: Number
  },
  explanation: {
    type: String
  },
  recommendedAction: {
    type: String,
    default: 'Perform inspection and review sensor trends.'
  },
  status: {
    type: String,
    enum: ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'],
    default: 'ACTIVE',
    index: true
  },
  acknowledgedBy: {
    type: String
  },
  acknowledgedAt: {
    type: Date
  },
  resolvedBy: {
    type: String
  },
  resolvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

alertSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);
