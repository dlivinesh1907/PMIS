const mongoose = require('mongoose');

const maintenanceRecordSchema = new mongoose.Schema({
  machineId: {
    type: String,
    required: true,
    index: true,
    uppercase: true
  },
  technician: {
    type: String,
    required: [true, 'Technician name is required'],
    trim: true
  },
  maintenanceType: {
    type: String,
    enum: ['Preventive', 'Corrective', 'Predictive Overhaul', 'Lubrication', 'Sensor Calibration', 'Emergency Repair'],
    default: 'Preventive'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'MEDIUM'
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  scheduledDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  completedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled',
    index: true
  },
  cost: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('MaintenanceRecord', maintenanceRecordSchema);
