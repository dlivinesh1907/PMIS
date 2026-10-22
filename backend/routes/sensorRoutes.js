const express = require('express');
const {
  ingestReading,
  getHistory,
  getLatest
} = require('../controllers/sensorController');

const router = express.Router();

router.post('/readings', ingestReading);
router.get('/:machineId', getHistory);
router.get('/:machineId/latest', getLatest);

module.exports = router;
