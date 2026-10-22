"""
Explainable AI (XAI) Attribution & Root Cause Analysis Module.
Calculates transparent normalized sensor deviations against baseline operating bands,
combines with model feature weights, and generates industrial diagnostic explanations.
"""

import numpy as np

# Nominal and critical baseline operating limits for rotating industrial equipment
SENSOR_BASELINES = {
    "temperature": {
        "nominal_mean": 52.0,
        "nominal_std": 6.0,
        "warning_threshold": 70.0,
        "critical_threshold": 85.0,
        "unit": "°C",
        "description": "operating temperature"
    },
    "vibration": {
        "nominal_mean": 2.2,
        "nominal_std": 0.8,
        "warning_threshold": 4.0,
        "critical_threshold": 7.0,
        "unit": "mm/s",
        "description": "mechanical vibration"
    },
    "pressure": {
        "nominal_mean": 85.0,
        "nominal_std": 5.0,
        "warning_threshold": 70.0,  # low or high
        "critical_threshold": 55.0,
        "unit": "PSI",
        "description": "lubrication hydraulic pressure"
    },
    "rpm": {
        "nominal_mean": 1480.0,
        "nominal_std": 20.0,
        "warning_threshold": 1400.0,
        "critical_threshold": 1320.0,
        "unit": "RPM",
        "description": "spindle rotational speed"
    },
    "current": {
        "nominal_mean": 10.5,
        "nominal_std": 1.2,
        "warning_threshold": 14.0,
        "critical_threshold": 17.5,
        "unit": "A",
        "description": "motor current draw"
    },
    "voltage": {
        "nominal_mean": 230.0,
        "nominal_std": 4.0,
        "warning_threshold": 210.0,
        "critical_threshold": 200.0,
        "unit": "V",
        "description": "grid supply voltage"
    },
    "acoustic_level": {
        "nominal_mean": 60.0,
        "nominal_std": 4.5,
        "warning_threshold": 75.0,
        "critical_threshold": 88.0,
        "unit": "dB",
        "description": "acoustic noise level"
    },
    "operating_hours": {
        "nominal_mean": 2500.0,
        "nominal_std": 1000.0,
        "warning_threshold": 4000.0,
        "critical_threshold": 5000.0,
        "unit": "hrs",
        "description": "cumulative running hours"
    }
}

def compute_sensor_deviations(sensor_data):
    """
    Computes normalized deviation z-scores and relative importance contribution
    for each sensor feature relative to healthy machine baselines.
    """
    contributions = []
    raw_scores = {}
    
    for feature, baseline in SENSOR_BASELINES.items():
        val = sensor_data.get(feature)
        if val is None:
            continue
            
        mean = baseline["nominal_mean"]
        std = baseline["nominal_std"]
        
        # Z-score deviation from healthy mean
        z_score = abs(val - mean) / max(std, 0.001)
        
        # Additional penalty if passing threshold
        threshold_penalty = 1.0
        if "critical_threshold" in baseline:
            crit = baseline["critical_threshold"]
            warn = baseline["warning_threshold"]
            if crit > warn and val >= warn:
                threshold_penalty = 2.0 if val < crit else 3.5
            elif crit < warn and val <= warn:
                threshold_penalty = 2.0 if val > crit else 3.5
                
        raw_scores[feature] = z_score * threshold_penalty

    total_deviation = sum(raw_scores.values())
    if total_deviation == 0:
        total_deviation = 1.0

    for feature, score in raw_scores.items():
        importance = score / total_deviation
        contributions.append({
            "feature": feature,
            "importance": round(float(importance), 4),
            "value": sensor_data.get(feature),
            "unit": SENSOR_BASELINES.get(feature, {}).get("unit", "")
        })

    # Sort descending by contribution importance
    contributions.sort(key=lambda x: x["importance"], reverse=True)
    return contributions

def generate_diagnostic_explanation(sensor_data, failure_prob, is_anomaly, rul_hours):
    """
    Generates an industrial-grade engineering diagnosis combining contributing factors.
    """
    contributions = compute_sensor_deviations(sensor_data)
    top_factors = contributions[:3] if len(contributions) >= 3 else contributions
    
    temp = sensor_data.get("temperature", 50)
    vib = sensor_data.get("vibration", 2.0)
    press = sensor_data.get("pressure", 85)
    current = sensor_data.get("current", 10.5)
    acoustic = sensor_data.get("acoustic_level", 60)
    
    findings = []
    if vib > 7.0:
        findings.append("critical bearing vibration harmonics")
    elif vib > 4.0:
        findings.append("moderate mechanical oscillation")
        
    if temp > 85.0:
        findings.append("severe thermal overheating")
    elif temp > 70.0:
        findings.append("elevated operating temperature")
        
    if current > 15.0:
        findings.append("high motor torque load and current draw")
        
    if press < 60.0:
        findings.append("hydraulic lubrication pressure loss")
        
    if acoustic > 80.0:
        findings.append("acoustic high-frequency friction noise")

    # Construct synthesized explanation
    if failure_prob >= 0.70 or is_anomaly:
        top_str = " and ".join([f"{f['feature'].replace('_', ' ').title()} ({int(f['importance']*100)}%)" for f in top_factors[:2]])
        symptoms = ", ".join(findings) if findings else "unusual multi-sensor covariance"
        explanation = (
            f"High risk detected primarily driven by {top_str}. "
            f"Symptoms include {symptoms}. Patterns strongly indicate progressive mechanical wear or bearing race degradation. "
            f"Recommended Action: Schedule physical inspection within {int(max(4, min(rul_hours, 24)))} hours to prevent catastrophic breakdown."
        )
    elif failure_prob >= 0.35:
        top_feature = top_factors[0]['feature'].replace('_', ' ').title() if top_factors else "Sensors"
        explanation = (
            f"Early degradation warning observed with prominent contribution from {top_feature}. "
            f"Sensor metrics are drifting out of nominal operating envelope. "
            f"Recommended Action: Monitor telemetry trends closely and verify lubrication during next shift."
        )
    else:
        explanation = "All machine telemetry parameters are within nominal operational tolerances. Normal wear progression observed. No immediate maintenance intervention required."

    return {
        "contributingFactors": contributions,
        "explanation": explanation
    }
