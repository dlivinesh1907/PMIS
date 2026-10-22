const mongoose = require('mongoose');

const sensorReadingSchema = new mongoose.Schema({
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
  temperature: {
    type: Number,
    required: true // °C
  },
  vibration: {
    type: Number,
    required: true // mm/s
  },
  pressure: {
    type: Number,
    required: true // PSI
  },
  rpm: {
    type: Number,
    required: true // RPM
  },
  current: {
    type: Number,
    required: true // A
  },
  voltage: {
    type: Number,
    default: 230 // V
  },
  acousticLevel: {
    type: Number,
    default: 60 // dB
  }
});

// Compound index for efficient historical time-series queries
sensorReadingSchema.index({ machineId: 1, timestamp: -1 });

module.exports = mongoose.model('SensorReading', sensorReadingSchema);
