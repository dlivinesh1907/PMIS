const SensorReading = require('../models/SensorReading');
const Machine = require('../models/Machine');
const Prediction = require('../models/Prediction');
const { getPredictions } = require('./mlService');
const { evaluateAndGenerateAlert } = require('./alertEngine');

class SensorSimulator {
  constructor() {
    this.isRunning = false;
    this.intervalHandle = null;
    this.io = null;
    this.tickIntervalMs = 3000; // 3 seconds per cycle

    // Machine simulation state tracking
    this.machineStates = {
      'CNC-001': { mode: 'HEALTHY', step: 0 },
      'CNC-002': { mode: 'HEALTHY', step: 0 },
      'CNC-003': { mode: 'WARNING', step: 0 },
      'CNC-004': { mode: 'DEGRADING', step: 0, maxSteps: 18 },
      'CNC-005': { mode: 'HEALTHY', step: 0 }
    };
  }

  setIO(ioInstance) {
    this.io = ioInstance;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[PMIS Simulator] Sensor simulation started.');

    this.intervalHandle = setInterval(() => {
      this.generateTick();
    }, this.tickIntervalMs);

    if (this.io) {
      this.io.emit('simulation_status', { isRunning: true });
    }
  }

  stop() {
    if (!this.isRunning) return;
    this.isRunning = false;
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    console.log('[PMIS Simulator] Sensor simulation stopped.');
    if (this.io) {
      this.io.emit('simulation_status', { isRunning: false });
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      tickIntervalMs: this.tickIntervalMs,
      machines: this.machineStates
    };
  }

  resetMachine(machineId) {
    const id = machineId.toUpperCase();
    if (this.machineStates[id]) {
      this.machineStates[id] = { mode: 'HEALTHY', step: 0 };
    }
    console.log(`[PMIS Simulator] Reset machine state: ${id}`);
  }

  triggerDegrade(machineId) {
    const id = machineId.toUpperCase();
    this.machineStates[id] = { mode: 'DEGRADING', step: 8, maxSteps: 18 };
    console.log(`[PMIS Simulator] Accelerated degradation triggered for: ${id}`);
  }

  async generateTick() {
    try {
      const machines = await Machine.find({});
      if (!machines || machines.length === 0) return;

      for (const machine of machines) {
        const id = machine.machineId;
        const state = this.machineStates[id] || { mode: 'HEALTHY', step: 0 };
        state.step += 1;

        let telemetry = {};

        if (state.mode === 'DEGRADING') {
          // Dynamic degradation curve for demo presentation
          const progress = Math.min(1.0, state.step / 16.0); // 0.0 to 1.0
          
          const temp = 50.0 + (progress * 38.0) + (Math.random() * 2.5 - 1.2);
          const vib = 2.2 + (progress * 6.5) + (progress > 0.6 ? Math.random() * 1.5 : Math.random() * 0.4);
          const press = 86.0 - (progress * 22.0) + (Math.random() * 3.0 - 1.5);
          const rpm = 1485.0 - (progress * 130.0) + (Math.random() * 20.0 - 10.0);
          const current = 10.4 + (progress * 6.2) + (Math.random() * 0.8 - 0.4);
          const acoustic = 58.0 + (progress * 26.0) + (Math.random() * 3.0);

          telemetry = {
            temperature: parseFloat(temp.toFixed(1)),
            vibration: parseFloat(vib.toFixed(2)),
            pressure: parseFloat(press.toFixed(1)),
            rpm: parseFloat(rpm.toFixed(0)),
            current: parseFloat(current.toFixed(2)),
            voltage: parseFloat((230 + Math.random() * 4 - 2).toFixed(1)),
            acousticLevel: parseFloat(acoustic.toFixed(1))
          };
        } else if (state.mode === 'WARNING') {
          // Constant elevated warning profile
          telemetry = {
            temperature: parseFloat((73.0 + Math.random() * 4.0).toFixed(1)),
            vibration: parseFloat((4.8 + Math.random() * 0.8).toFixed(2)),
            pressure: parseFloat((74.0 + Math.random() * 5.0).toFixed(1)),
            rpm: parseFloat((1440.0 + Math.random() * 15.0).toFixed(0)),
            current: parseFloat((13.2 + Math.random() * 0.6).toFixed(2)),
            voltage: parseFloat((228 + Math.random() * 3).toFixed(1)),
            acousticLevel: parseFloat((72.0 + Math.random() * 3.0).toFixed(1))
          };
        } else {
          // Clean healthy operating profile
          telemetry = {
            temperature: parseFloat((49.0 + Math.random() * 5.0).toFixed(1)),
            vibration: parseFloat((1.9 + Math.random() * 0.7).toFixed(2)),
            pressure: parseFloat((84.0 + Math.random() * 4.0).toFixed(1)),
            rpm: parseFloat((1485.0 + Math.random() * 10.0).toFixed(0)),
            current: parseFloat((10.2 + Math.random() * 0.6).toFixed(2)),
            voltage: parseFloat((230.0 + Math.random() * 2.5).toFixed(1)),
            acousticLevel: parseFloat((59.0 + Math.random() * 3.0).toFixed(1))
          };
        }

        // 1. Save Sensor Reading
        const reading = await SensorReading.create({
          machineId: id,
          timestamp: new Date(),
          ...telemetry
        });

        // 2. Call ML Service (or fallback)
        const predictionData = await getPredictions({
          ...telemetry,
          operatingHours: machine.operatingHours
        });

        // 3. Save Prediction Record
        const prediction = await Prediction.create({
          machineId: id,
          timestamp: new Date(),
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
          machine.status = 'Running'; // Warning state
        } else if (machine.status !== 'Maintenance') {
          machine.status = 'Running';
        }
        await machine.save();

        // 5. Check & Fire Alerts
        await evaluateAndGenerateAlert(machine, reading, predictionData, this.io);

        // 6. Broadcast Real-time Live Packet to Frontend
        if (this.io) {
          this.io.emit('sensor_reading', {
            machineId: id,
            reading,
            prediction: predictionData,
            healthScore: machine.healthScore,
            status: machine.status
          });
        }
      }
    } catch (err) {
      console.error('[PMIS Simulator Error]', err.message);
    }
  }
}

const simulator = new SensorSimulator();
module.exports = simulator;
