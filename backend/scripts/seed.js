const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Machine = require('../models/Machine');
const SensorReading = require('../models/SensorReading');
const Prediction = require('../models/Prediction');
const Alert = require('../models/Alert');
const MaintenanceRecord = require('../models/MaintenanceRecord');

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/predictive_maintenance';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed] Connected. Clearing existing collections...');

    await Promise.all([
      User.deleteMany({}),
      Machine.deleteMany({}),
      SensorReading.deleteMany({}),
      Prediction.deleteMany({}),
      Alert.deleteMany({}),
      MaintenanceRecord.deleteMany({})
    ]);

    // 1. Seed Demo Users
    console.log('[Seed] Creating demo users...');
    await User.create([
      {
        name: 'Alex Vance (Admin)',
        email: 'admin@factory.com',
        password: 'password123',
        role: 'Admin'
      },
      {
        name: 'Sarah Connor (Lead Engineer)',
        email: 'engineer@factory.com',
        password: 'password123',
        role: 'Maintenance Engineer'
      },
      {
        name: 'David Chen (Shift Operator)',
        email: 'operator@factory.com',
        password: 'password123',
        role: 'Operator'
      }
    ]);

    // 2. Seed Machines
    console.log('[Seed] Creating 5 industrial machines...');
    const machines = await Machine.create([
      {
        machineId: 'CNC-001',
        name: 'DMG Mori 5-Axis Milling Center',
        type: 'CNC Milling',
        manufacturer: 'DMG Mori',
        location: 'Bay A - Factory Floor 1',
        installationDate: new Date('2021-03-15'),
        status: 'Running',
        healthScore: 94,
        operatingHours: 3200,
        lastMaintenanceDate: new Date(Date.now() - 40 * 24 * 3600 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 20 * 24 * 3600 * 1000)
      },
      {
        machineId: 'CNC-002',
        name: 'Mazak Precision Lathe Unit',
        type: 'Lathe',
        manufacturer: 'Mazak Corp',
        location: 'Bay A - Factory Floor 1',
        installationDate: new Date('2021-08-20'),
        status: 'Running',
        healthScore: 88,
        operatingHours: 2850,
        lastMaintenanceDate: new Date(Date.now() - 25 * 24 * 3600 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 35 * 24 * 3600 * 1000)
      },
      {
        machineId: 'CNC-003',
        name: 'Trumpf High-Tonnage Hydraulic Press',
        type: 'Hydraulic Press',
        manufacturer: 'Trumpf Group',
        location: 'Bay B - Heavy Forming',
        installationDate: new Date('2020-11-10'),
        status: 'Running',
        healthScore: 68,
        operatingHours: 4600,
        lastMaintenanceDate: new Date(Date.now() - 60 * 24 * 3600 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 5 * 24 * 3600 * 1000)
      },
      {
        machineId: 'CNC-004',
        name: 'Haas VF-4SS Super-Speed Machining Center',
        type: 'CNC Milling',
        manufacturer: 'Haas Automation',
        location: 'Bay B - Precision Cell',
        installationDate: new Date('2022-01-12'),
        status: 'Critical',
        healthScore: 28,
        operatingHours: 5120,
        lastMaintenanceDate: new Date(Date.now() - 90 * 24 * 3600 * 1000),
        nextMaintenanceDate: new Date(Date.now() - 5 * 24 * 3600 * 1000) // Overdue!
      },
      {
        machineId: 'CNC-005',
        name: 'Fanuc 6-Axis Robotic Assembly Cell',
        type: 'Robotic Arm',
        manufacturer: 'Fanuc Robotics',
        location: 'Bay C - Automated Assembly',
        installationDate: new Date('2023-04-10'),
        status: 'Running',
        healthScore: 96,
        operatingHours: 1400,
        lastMaintenanceDate: new Date(Date.now() - 15 * 24 * 3600 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 45 * 24 * 3600 * 1000)
      }
    ]);

    // 3. Seed Historical Telemetry & Predictions
    console.log('[Seed] Generating historical telemetry and ML predictions...');
    const now = Date.now();
    const readings = [];
    const predictions = [];

    // 24 time steps (every 1 hour for past 24h)
    for (let i = 24; i >= 0; i--) {
      const timestamp = new Date(now - i * 3600 * 1000);

      // CNC-001 (Healthy)
      readings.push({
        machineId: 'CNC-001',
        timestamp,
        temperature: parseFloat((49.5 + Math.sin(i) * 2.1).toFixed(1)),
        vibration: parseFloat((2.1 + Math.cos(i) * 0.3).toFixed(2)),
        pressure: parseFloat((86.0 + Math.sin(i) * 2.0).toFixed(1)),
        rpm: 1480,
        current: 10.4,
        voltage: 230,
        acousticLevel: 59
      });
      predictions.push({
        machineId: 'CNC-001',
        timestamp,
        anomalyScore: 0.08,
        isAnomaly: false,
        failureProbability: 0.06,
        riskLevel: 'LOW',
        rulHours: 320,
        healthScore: 94,
        predictionStatus: 'NORMAL',
        contributingFactors: [
          { feature: 'vibration', importance: 0.22, value: 2.1, unit: 'mm/s' },
          { feature: 'temperature', importance: 0.20, value: 49.5, unit: '°C' }
        ],
        explanation: 'All machine telemetry parameters are within nominal operational tolerances.'
      });

      // CNC-003 (Warning: elevated temperature and pressure drop)
      readings.push({
        machineId: 'CNC-003',
        timestamp,
        temperature: parseFloat((74.0 + Math.sin(i) * 3.5).toFixed(1)),
        vibration: parseFloat((4.6 + Math.cos(i) * 0.6).toFixed(2)),
        pressure: parseFloat((72.0 - Math.sin(i) * 3.0).toFixed(1)),
        rpm: 1440,
        current: 13.5,
        voltage: 228,
        acousticLevel: 73
      });
      predictions.push({
        machineId: 'CNC-003',
        timestamp,
        anomalyScore: 0.42,
        isAnomaly: false,
        failureProbability: 0.44,
        riskLevel: 'MEDIUM',
        rulHours: 72,
        healthScore: 68,
        predictionStatus: 'WARNING',
        contributingFactors: [
          { feature: 'temperature', importance: 0.42, value: 74.0, unit: '°C' },
          { feature: 'vibration', importance: 0.34, value: 4.6, unit: 'mm/s' }
        ],
        explanation: 'Early thermal drift and hydraulic pressure instability detected. Preemptive lubrication suggested.'
      });

      // CNC-004 (Critical degradation sequence)
      // Earlier was okay, recent hours skyrocketed!
      const degFactor = (24 - i) / 24.0; // 0.0 -> 1.0
      const c4Temp = parseFloat((54.0 + degFactor * 34.0).toFixed(1)); // 54 -> 88°C
      const c4Vib = parseFloat((2.4 + degFactor * 6.2).toFixed(2));   // 2.4 -> 8.6 mm/s
      const c4Press = parseFloat((85.0 - degFactor * 22.0).toFixed(1)); // 85 -> 63 PSI
      const c4Rpm = Math.round(1480 - degFactor * 130);
      const c4Current = parseFloat((10.5 + degFactor * 6.5).toFixed(2));
      const c4Acoustic = parseFloat((60 + degFactor * 26).toFixed(1));

      readings.push({
        machineId: 'CNC-004',
        timestamp,
        temperature: c4Temp,
        vibration: c4Vib,
        pressure: c4Press,
        rpm: c4Rpm,
        current: c4Current,
        voltage: 226,
        acousticLevel: c4Acoustic
      });

      const failProb = parseFloat(Math.min(0.94, 0.10 + degFactor * 0.82).toFixed(2));
      const anomScore = parseFloat(Math.min(0.96, 0.12 + degFactor * 0.80).toFixed(2));
      const rul = Math.max(16, Math.round(300 - degFactor * 282));
      const health = Math.max(24, Math.round(92 - degFactor * 66));

      predictions.push({
        machineId: 'CNC-004',
        timestamp,
        anomalyScore: anomScore,
        isAnomaly: anomScore > 0.55,
        failureProbability: failProb,
        riskLevel: failProb > 0.70 ? 'HIGH' : (failProb > 0.30 ? 'MEDIUM' : 'LOW'),
        rulHours: rul,
        healthScore: health,
        predictionStatus: failProb > 0.70 ? 'CRITICAL' : (failProb > 0.30 ? 'WARNING' : 'NORMAL'),
        contributingFactors: [
          { feature: 'vibration', importance: 0.46, value: c4Vib, unit: 'mm/s' },
          { feature: 'temperature', importance: 0.32, value: c4Temp, unit: '°C' },
          { feature: 'current', importance: 0.14, value: c4Current, unit: 'A' }
        ],
        explanation: 'Critical machine degradation detected. Main contributing factors: vibration (46%) and temperature (32%). Patterns strongly indicate bearing race fatigue and spindle rotor imbalance.'
      });
    }

    await SensorReading.insertMany(readings);
    await Prediction.insertMany(predictions);

    // 4. Seed Alerts
    console.log('[Seed] Creating demo alerts...');
    await Alert.create([
      {
        machineId: 'CNC-004',
        type: 'HIGH_FAILURE_RISK',
        severity: 'CRITICAL',
        title: 'Critical Failure Risk: CNC-004',
        message: 'Imminent spindle bearing failure risk (91%) with estimated RUL of only 18 hours.',
        anomalyScore: 0.91,
        failureProbability: 0.91,
        rulHours: 18,
        explanation: 'Vibration is significantly above normal operating range (8.6 mm/s) and temperature is continuously increasing (88°C). Consistent with severe bearing degradation.',
        recommendedAction: 'Inspect bearing and lubrication system immediately. Take spindle offline before catastrophic seizure.',
        status: 'ACTIVE',
        createdAt: new Date(now - 45 * 60 * 1000)
      },
      {
        machineId: 'CNC-003',
        type: 'SENSOR_THRESHOLD_EXCEEDED',
        severity: 'WARNING',
        title: 'Hydraulic Thermal Warning: CNC-003',
        message: 'Hydraulic oil temperature exceeds 74°C with pressure fluctuation down to 72 PSI.',
        anomalyScore: 0.44,
        failureProbability: 0.42,
        rulHours: 72,
        explanation: 'Thermal load is elevated above warning threshold. Check hydraulic heat exchanger and filter condition.',
        recommendedAction: 'Clean hydraulic cooler fins and check hydraulic fluid viscosity during next shift.',
        status: 'ACKNOWLEDGED',
        acknowledgedBy: 'Sarah Connor (Lead Engineer)',
        acknowledgedAt: new Date(now - 2 * 3600 * 1000),
        createdAt: new Date(now - 3 * 3600 * 1000)
      },
      {
        machineId: 'CNC-002',
        type: 'MAINTENANCE_DUE',
        severity: 'INFO',
        title: 'Routine Spindle Calibration Due: CNC-002',
        message: 'Scheduled 500-hour preventive lubrication and tool holder inspection.',
        recommendedAction: 'Apply lithium-based spindle grease and inspect collet runout.',
        status: 'RESOLVED',
        resolvedBy: 'David Chen',
        resolvedAt: new Date(now - 12 * 3600 * 1000),
        createdAt: new Date(now - 24 * 3600 * 1000)
      }
    ]);

    // 5. Seed Maintenance Records
    console.log('[Seed] Creating maintenance records...');
    await MaintenanceRecord.create([
      {
        machineId: 'CNC-004',
        technician: 'Sarah Connor',
        maintenanceType: 'Predictive Overhaul',
        priority: 'CRITICAL',
        description: 'Urgent spindle bearing replacement and dynamic vibration balancing following AI failure alert.',
        scheduledDate: new Date(),
        status: 'Scheduled',
        cost: 1450,
        notes: 'Replacement ceramic hybrid spindle bearing kit staged in Bay B tool crib.'
      },
      {
        machineId: 'CNC-003',
        technician: 'Marcus Wright',
        maintenanceType: 'Preventive',
        priority: 'MEDIUM',
        description: 'Hydraulic manifold seal inspection and oil filter cartridge replacement.',
        scheduledDate: new Date(now + 48 * 3600 * 1000),
        status: 'Scheduled',
        cost: 320,
        notes: 'Awaiting shift changeover window.'
      },
      {
        machineId: 'CNC-001',
        technician: 'Sarah Connor',
        maintenanceType: 'Lubrication',
        priority: 'LOW',
        description: 'Automated central lubrication pump reservoir refill and guideway wiper wipe-down.',
        scheduledDate: new Date(now - 14 * 24 * 3600 * 1000),
        completedDate: new Date(now - 14 * 24 * 3600 * 1000),
        status: 'Completed',
        cost: 85,
        notes: 'Completed in 45 minutes. Machine returned to full production.'
      }
    ]);

    console.log('--- DATABASE SEED COMPLETED SUCCESSFULLY ---');
    console.log('Demo Credentials:');
    console.log('  Admin:      admin@factory.com    / password123');
    console.log('  Engineer:   engineer@factory.com / password123');
    console.log('  Operator:   operator@factory.com / password123');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDatabase();
