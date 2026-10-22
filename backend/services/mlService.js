const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Intelligent analytical surrogate in case Python FastAPI service is unreachable.
 * Ensures the system remains 100% operational in all environments.
 */
const computeAnalyticalPrediction = (sensorData) => {
  const temp = Number(sensorData.temperature) || 50;
  const vib = Number(sensorData.vibration) || 2.2;
  const press = Number(sensorData.pressure) || 85;
  const rpm = Number(sensorData.rpm) || 1480;
  const current = Number(sensorData.current) || 10.5;
  const acoustic = Number(sensorData.acousticLevel) || 60;
  const opHours = Number(sensorData.operatingHours) || 2500;

  // 1. Anomaly Score
  let anom = 0.08;
  if (vib > 4.0) anom += 0.35 * Math.min(1.5, (vib - 4.0) / 3.0);
  if (temp > 72.0) anom += 0.30 * Math.min(1.5, (temp - 72.0) / 15.0);
  if (current > 14.0) anom += 0.15 * Math.min(1.2, (current - 14.0) / 4.0);
  const anomalyScore = Math.min(0.98, Math.max(0.05, Number(anom.toFixed(2))));
  const isAnomaly = anomalyScore > 0.55;

  // 2. Failure Probability
  let fail = 0.05;
  if (vib > 3.8) fail += 0.40 * Math.min(1.8, (vib - 3.8) / 3.2);
  if (temp > 70.0) fail += 0.35 * Math.min(1.8, (temp - 70.0) / 16.0);
  if (current > 13.5) fail += 0.15 * Math.min(1.3, (current - 13.5) / 4.0);
  const failureProbability = Math.min(0.98, Math.max(0.04, Number(fail.toFixed(2))));

  let riskLevel = 'LOW';
  if (failureProbability >= 0.71) riskLevel = 'HIGH';
  else if (failureProbability >= 0.31) riskLevel = 'MEDIUM';

  // 3. RUL Hours
  let rulHours;
  if (failureProbability > 0.70 || vib > 7.0 || temp > 85.0) {
    rulHours = Math.round(14 + Math.random() * 12);
  } else if (failureProbability > 0.30 || vib > 4.0 || temp > 72.0) {
    rulHours = Math.round(45 + Math.random() * 40);
  } else {
    rulHours = Math.round(280 + Math.random() * 180);
  }

  // 4. Health Score
  const tempHealth = temp <= 70 ? 1 : (temp <= 85 ? 0.6 : 0.2);
  const vibHealth = vib <= 4.0 ? 1 : (vib <= 7.0 ? 0.5 : 0.15);
  const pressHealth = (press >= 70 && press <= 100) ? 1 : 0.6;
  const currentHealth = current <= 14 ? 1 : 0.5;
  const mlHealth = (1 - failureProbability) * 0.6 + (1 - anomalyScore) * 0.4;
  const rulHealth = Math.min(1, rulHours / 200);

  const rawScore = (
    tempHealth * 0.15 +
    vibHealth * 0.25 +
    pressHealth * 0.10 +
    currentHealth * 0.10 +
    mlHealth * 0.30 +
    rulHealth * 0.10
  ) * 100;

  const healthScore = Math.min(99, Math.max(8, Math.round(rawScore)));
  let healthStatus = 'Healthy';
  if (healthScore < 40) healthStatus = 'Critical';
  else if (healthScore < 60) healthStatus = 'Poor';
  else if (healthScore < 80) healthStatus = 'Warning';

  // 5. Contributing Factors & Explainable AI
  const factors = [
    { feature: 'vibration', valDiff: Math.abs(vib - 2.2) * 2.5, value: vib, unit: 'mm/s' },
    { feature: 'temperature', valDiff: Math.abs(temp - 52.0) * 0.5, value: temp, unit: '°C' },
    { feature: 'current', valDiff: Math.abs(current - 10.5) * 1.5, value: current, unit: 'A' },
    { feature: 'pressure', valDiff: Math.abs(press - 85.0) * 0.2, value: press, unit: 'PSI' },
    { feature: 'rpm', valDiff: Math.abs(rpm - 1480) * 0.05, value: rpm, unit: 'RPM' }
  ];

  const totalDiff = factors.reduce((sum, f) => sum + f.valDiff, 0) || 1;
  const contributingFactors = factors.map(f => ({
    feature: f.feature,
    importance: Number((f.valDiff / totalDiff).toFixed(3)),
    value: f.value,
    unit: f.unit
  })).sort((a, b) => b.importance - a.importance);

  let explanation;
  if (riskLevel === 'HIGH' || isAnomaly) {
    explanation = `Critical machine degradation detected. Main contributing factors: ${contributingFactors[0].feature} (${Math.round(contributingFactors[0].importance * 100)}%) and ${contributingFactors[1].feature} (${Math.round(contributingFactors[1].importance * 100)}%). Excessive vibration and elevated thermal load strongly indicate bearing fatigue or rotor imbalance.`;
  } else if (riskLevel === 'MEDIUM') {
    explanation = `Moderate deviation detected. ${contributingFactors[0].feature} is operating above nominal baseline. Preemptive mechanical inspection and lubrication check advised.`;
  } else {
    explanation = 'All machine sensor telemetry is within nominal operating boundaries. Normal operation maintained.';
  }

  return {
    anomalyScore,
    isAnomaly,
    failureProbability,
    riskLevel,
    rulHours,
    healthScore,
    healthStatus,
    contributingFactors,
    explanation,
    isFallback: true
  };
};

/**
 * Calls FastAPI ML service with automatic fallback.
 */
const getPredictions = async (sensorData) => {
  try {
    const payload = {
      temperature: Number(sensorData.temperature),
      vibration: Number(sensorData.vibration),
      pressure: Number(sensorData.pressure || 85),
      rpm: Number(sensorData.rpm || 1480),
      current: Number(sensorData.current || 10.5),
      voltage: Number(sensorData.voltage || 230),
      acousticLevel: Number(sensorData.acousticLevel || 60),
      operatingHours: Number(sensorData.operatingHours || 2500)
    };

    const response = await axios.post(`${ML_SERVICE_URL}/predict/all`, payload, {
      timeout: 2500
    });

    return {
      ...response.data,
      isFallback: false
    };
  } catch (error) {
    // Graceful fallback to analytical physics engine
    return computeAnalyticalPrediction(sensorData);
  }
};

module.exports = { getPredictions, computeAnalyticalPrediction };
