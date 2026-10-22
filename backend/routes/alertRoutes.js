const express = require('express');
const {
  getAlerts,
  getAlertsByMachine,
  acknowledgeAlert,
  resolveAlert
} = require('../controllers/alertController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', getAlerts);
router.get('/:machineId', getAlertsByMachine);
router.put('/:id/acknowledge', protect, acknowledgeAlert);
router.put('/:id/resolve', protect, resolveAlert);

module.exports = router;
