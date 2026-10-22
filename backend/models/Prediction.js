const mongoose = require('mongoose');

const contributingFactorSchema = new mongoose.Schema({
  feature: { type: String, required: true },
  importance: { type: Number, required: true },
  value: { type: Number },
  unit: { type: String }
}, { _id: false });

const predictionSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    index: true,
    uppercase: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  anomalyScore: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  isAnomaly: {
    type: Boolean,
    default: false
  },
  failureProbability: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'LOW'
  },
  rulHours: {
    type: Number,
    required: true,
    min: 0
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  predictionStatus: {
    type: String,
    enum: ['NORMAL', 'ANOMALY', 'WARNING', 'CRITICAL'],
    default: 'NORMAL'
  },
  contributingFactors: [contributingFactorSchema],
  explanation: {
    type: String
  }
});

predictionSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model('Prediction', predictionSchema);
