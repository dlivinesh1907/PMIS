const express = require('express');
const {
  getStatus,
  startSimulation,
  stopSimulation,
  triggerDegradation,
  resetMachine
} = require('../controllers/simulationController');

const router = express.Router();

router.get('/status', getStatus);
router.post('/start', startSimulation);
router.post('/stop', stopSimulation);
router.post('/degrade/:machineId?', triggerDegradation);
router.post('/reset/:machineId?', resetMachine);

module.exports = router;
