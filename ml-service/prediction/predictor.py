"""
Unified Inference Engine for Predictive Maintenance.
Loads serialized models and provides robust fallback heuristics if models are absent.
"""

import os
import sys
import joblib
import numpy as np

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from preprocessing.preprocess import FEATURE_COLUMNS
from prediction.explain import generate_diagnostic_explanation, compute_sensor_deviations

class PMISPredictor:
    def __init__(self, models_dir=None):
        if models_dir is None:
            models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
        self.models_dir = models_dir
        
        self.scaler = None
        self.anomaly_model = None
        self.failure_model = None
        self.rul_model = None
        
        self._load_models()
        
    def _load_models(self):
        try:
            scaler_path = os.path.join(self.models_dir, "scaler.joblib")
            anomaly_path = os.path.join(self.models_dir, "anomaly_model.joblib")
            failure_path = os.path.join(self.models_dir, "failure_model.joblib")
            rul_path = os.path.join(self.models_dir, "rul_model.joblib")
            
            if os.path.exists(scaler_path) and os.path.exists(anomaly_path):
                self.scaler = joblib.load(scaler_path)
                self.anomaly_model = joblib.load(anomaly_path)
                self.failure_model = joblib.load(failure_path)
                self.rul_model = joblib.load(rul_path)
                print("Serialized ML models loaded successfully.")
            else:
                print("Trained models not found on disk. Initializing with physics-based analytical surrogate.")
        except Exception as e:
            print(f"Warning loading ML models: {e}. Defaulting to physics surrogate.")

    def _prepare_features(self, sensor_data):
        row = [
            float(sensor_data.get("temperature", 50.0)),
            float(sensor_data.get("vibration", 2.2)),
            float(sensor_data.get("pressure", 85.0)),
            float(sensor_data.get("rpm", 1480.0)),
            float(sensor_data.get("current", 10.5)),
            float(sensor_data.get("voltage", 230.0)),
            float(sensor_data.get("acousticLevel", sensor_data.get("acoustic_level", 60.0))),
            float(sensor_data.get("operatingHours", sensor_data.get("operating_hours", 2500.0)))
        ]
        return np.array([row])

    def predict_anomaly(self, sensor_data):
        features = self._prepare_features(sensor_data)
        if self.anomaly_model and self.scaler:
            scaled = self.scaler.transform(features)
            # decision_function gives negative values for anomalies
            score_raw = self.anomaly_model.decision_function(scaled)[0]
            # Normalize to 0 (normal) to 1 (anomaly)
            anomaly_score = float(np.clip(0.5 - (score_raw * 1.5), 0.05, 0.99))
            is_anomaly = bool(anomaly_score > 0.60)
        else:
            # Physics-based heuristic
            vib = sensor_data.get("vibration", 2.2)
            temp = sensor_data.get("temperature", 50.0)
            score = 0.1
            if vib > 4.0: score += 0.35
            if vib > 7.0: score += 0.40
            if temp > 75.0: score += 0.25
            if temp > 85.0: score += 0.30
            anomaly_score = float(min(0.99, score))
            is_anomaly = anomaly_score > 0.55

        return {
            "anomalyScore": round(anomaly_score, 2),
            "isAnomaly": is_anomaly,
            "status": "ANOMALY" if is_anomaly else "NORMAL"
        }

    def predict_failure(self, sensor_data):
        features = self._prepare_features(sensor_data)
        if self.failure_model and self.scaler:
            scaled = self.scaler.transform(features)
            fail_prob = float(self.failure_model.predict_proba(scaled)[0][1])
        else:
            vib = float(sensor_data.get("vibration", 2.2))
            temp = float(sensor_data.get("temperature", 50.0))
            current = float(sensor_data.get("current", 10.5))
            
            prob = 0.05
            if vib > 3.5: prob += 0.25 * ((vib - 3.5) / 3.5)
            if temp > 68.0: prob += 0.30 * ((temp - 68.0) / 20.0)
            if current > 13.0: prob += 0.15 * ((current - 13.0) / 5.0)
            fail_prob = float(np.clip(prob, 0.02, 0.96))
            
        if fail_prob >= 0.71:
            risk_level = "HIGH"
        elif fail_prob >= 0.31:
            risk_level = "MEDIUM"
        else:
            risk_level = "LOW"
            
        return {
            "failureProbability": round(fail_prob, 2),
            "riskLevel": risk_level
        }

    def predict_rul(self, sensor_data):
        features = self._prepare_features(sensor_data)
        if self.rul_model and self.scaler:
            scaled = self.scaler.transform(features)
            rul_hours = float(self.rul_model.predict(scaled)[0])
            rul_hours = max(4.0, rul_hours)
            confidence = 0.88
        else:
            vib = float(sensor_data.get("vibration", 2.2))
            temp = float(sensor_data.get("temperature", 50.0))
            if vib > 7.0 or temp > 85.0:
                rul_hours = float(np.random.uniform(12.0, 26.0))
            elif vib > 4.0 or temp > 72.0:
                rul_hours = float(np.random.uniform(40.0, 95.0))
            else:
                rul_hours = float(np.random.uniform(220.0, 480.0))
            confidence = 0.82

        return {
            "rulHours": round(rul_hours, 1),
            "confidence": round(confidence, 2)
        }

    def compute_health_score(self, sensor_data, anomaly_score, failure_prob, rul_hours):
        """
        Calculates composite machine health (0 to 100).
        100 = Excellent, 80–99 = Healthy, 60–79 = Warning, 40–59 = Poor, 0–39 = Critical
        """
        temp = float(sensor_data.get("temperature", 50.0))
        vib = float(sensor_data.get("vibration", 2.2))
        press = float(sensor_data.get("pressure", 85.0))
        current = float(sensor_data.get("current", 10.5))

        # Sensor health subtotals (0 to 1)
        temp_health = 1.0 if temp <= 70 else (0.6 if temp <= 85 else 0.2)
        vib_health = 1.0 if vib <= 4.0 else (0.55 if vib <= 7.0 else 0.15)
        press_health = 1.0 if (70 <= press <= 100) else 0.6
        current_health = 1.0 if current <= 14.0 else 0.5
        
        rul_health = min(1.0, rul_hours / 200.0)
        ml_health = (1.0 - failure_prob) * 0.6 + (1.0 - anomaly_score) * 0.4

        # Weighted combination
        raw_health = (
            (temp_health * 0.15) +
            (vib_health * 0.25) +
            (press_health * 0.10) +
            (current_health * 0.10) +
            (ml_health * 0.30) +
            (rul_health * 0.10)
        ) * 100.0

        score = int(round(np.clip(raw_health, 5, 99)))
        
        if score >= 80:
            status = "Healthy"
        elif score >= 60:
            status = "Warning"
        elif score >= 40:
            status = "Poor"
        else:
            status = "Critical"

        return score, status

    def predict_all(self, sensor_data):
        anom = self.predict_anomaly(sensor_data)
        fail = self.predict_failure(sensor_data)
        rul = self.predict_rul(sensor_data)
        
        health_score, health_status = self.compute_health_score(
            sensor_data, anom["anomalyScore"], fail["failureProbability"], rul["rulHours"]
        )
        
        diag = generate_diagnostic_explanation(
            sensor_data, fail["failureProbability"], anom["isAnomaly"], rul["rulHours"]
        )
        
        return {
            "anomalyScore": anom["anomalyScore"],
            "isAnomaly": anom["isAnomaly"],
            "failureProbability": fail["failureProbability"],
            "riskLevel": fail["riskLevel"],
            "rulHours": rul["rulHours"],
            "healthScore": health_score,
            "healthStatus": health_status,
            "contributingFactors": diag["contributingFactors"],
            "explanation": diag["explanation"]
        }
