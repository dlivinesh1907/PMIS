const simulator = require('../services/sensorSimulator');

exports.getStatus = (req, res) => {
  res.status(200).json({
    success: true,
    data: simulator.getStatus()
  });
};

exports.startSimulation = (req, res) => {
  simulator.start();
  res.status(200).json({
    success: true,
    message: 'Industrial sensor telemetry simulation started.',
    data: simulator.getStatus()
  });
};

exports.stopSimulation = (req, res) => {
  simulator.stop();
  res.status(200).json({
    success: true,
    message: 'Simulation stopped.',
    data: simulator.getStatus()
  });
};

exports.triggerDegradation = (req, res) => {
  const machineId = req.params.machineId || 'CNC-004';
  simulator.triggerDegrade(machineId);
  res.status(200).json({
    success: true,
    message: `Accelerated degradation initiated for ${machineId}.`
  });
};

exports.resetMachine = (req, res) => {
  const machineId = req.params.machineId || 'CNC-004';
  simulator.resetMachine(machineId);
  res.status(200).json({
    success: true,
    message: `Simulation state reset to healthy for ${machineId}.`
  });
};
