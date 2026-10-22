const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: [true, 'Machine ID is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  name: {
    type: String,
    required: [true, 'Machine name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Machine type is required'],
    enum: ['CNC Milling', 'Lathe', 'Hydraulic Press', 'Robotic Arm', 'Centrifugal Pump', 'Industrial Turbine'],
    default: 'CNC Milling'
  },
  manufacturer: {
    type: String,
    default: 'DMG Mori'
  },
  location: {
    type: String,
    default: 'Bay A - Factory Floor 1'
  },
  installationDate: {
    type: Date,
    default: () => new Date('2022-01-15')
  },
  status: {
    type: String,
    enum: ['Running', 'Idle', 'Maintenance', 'Offline', 'Critical'],
    default: 'Running'
  },
  healthScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 95
  },
  operatingHours: {
    type: Number,
    default: 1200
  },
  lastMaintenanceDate: {
    type: Date,
    default: () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  },
  nextMaintenanceDate: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Machine', machineSchema);
