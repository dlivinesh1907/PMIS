const Alert = require('../models/Alert');

exports.getAlerts = async (req, res, next) => {
  try {
    const { severity, status, machineId } = req.query;
    const filter = {};
    if (severity) filter.severity = severity;
    if (status) filter.status = status;
    if (machineId) filter.machineId = machineId.toUpperCase();

    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(100);

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
};

exports.getAlertsByMachine = async (req, res, next) => {
  try {
    const machineId = req.params.machineId.toUpperCase();
    const alerts = await Alert.find({ machineId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (err) {
    next(err);
  }
};

exports.acknowledgeAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = req.user ? req.user.name : 'Maintenance Engineer';
    alert.acknowledgedAt = new Date();
    await alert.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('alert_updated', alert);
    }

    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (err) {
    next(err);
  }
};

exports.resolveAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found.' });
    }

    alert.status = 'RESOLVED';
    alert.resolvedBy = req.user ? req.user.name : 'Maintenance Engineer';
    alert.resolvedAt = new Date();
    await alert.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('alert_updated', alert);
    }

    res.status(200).json({
      success: true,
      data: alert
    });
  } catch (err) {
    next(err);
  }
};
