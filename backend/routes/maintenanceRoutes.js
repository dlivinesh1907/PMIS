const express = require('express');
const {
  getAllMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance
} = require('../controllers/maintenanceController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getAllMaintenance)
  .post(protect, authorize('Admin', 'Maintenance Engineer'), createMaintenance);

router.route('/:id')
  .put(protect, authorize('Admin', 'Maintenance Engineer'), updateMaintenance)
  .delete(protect, authorize('Admin'), deleteMaintenance);

module.exports = router;
