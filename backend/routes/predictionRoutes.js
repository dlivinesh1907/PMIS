const express = require('express');
const {
  analyzeMachine,
  getLatestPrediction,
  getPredictionHistory
} = require('../controllers/predictionController');

const router = express.Router();

router.post('/analyze/:machineId', analyzeMachine);
router.get('/:machineId/latest', getLatestPrediction);
router.get('/:machineId/history', getPredictionHistory);

module.exports = router;
