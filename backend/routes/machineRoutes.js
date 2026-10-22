const express = require('express');
const {
  getAllMachines,
  getMachineById,
  createMachine,
  updateMachine,
  deleteMachine
} = require('../controllers/machineController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(getAllMachines)
  .post(protect, authorize('Admin'), createMachine);

router.route('/:id')
  .get(getMachineById)
  .put(protect, authorize('Admin', 'Maintenance Engineer'), updateMachine)
  .delete(protect, authorize('Admin'), deleteMachine);

module.exports = router;
