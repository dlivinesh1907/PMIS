"""
FastAPI Microservice for Predictive Maintenance ML Engine.
Provides high-performance REST APIs for anomaly detection, failure prediction, RUL, and explainable AI.
"""

import os
import json
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from prediction.predictor import PMISPredictor

app = FastAPI(
    title="Predictive Maintenance Intelligence Service (PMIS)",
    description="AI/ML Microservice for Industrial Anomaly Detection, Failure Prediction, RUL & Explainable AI",
    version="1.0.0"
)

# Enable CORS for local React and Node.js microservices
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

predictor = PMISPredictor()

class SensorPayload(BaseModel):
    temperature: float = Field(..., example=82.0, description="Temperature in °C")
    vibration: float = Field(..., example=7.8, description="Vibration velocity in mm/s")
    pressure: float = Field(85.0, example=91.0, description="Pressure in PSI")
    rpm: float = Field(1480.0, example=1450.0, description="Spindle RPM")
    current: float = Field(10.5, example=12.4, description="Motor current in Amperes")
    voltage: float = Field(230.0, example=230.0, description="Supply voltage in Volts")
    acousticLevel: Optional[float] = Field(60.0, example=82.0, description="Acoustic noise in dB")
    acoustic_level: Optional[float] = None
    operatingHours: Optional[float] = Field(2500.0, example=4500.0, description="Total running hours")
    operating_hours: Optional[float] = None

    def to_dict(self):
        d = self.model_dump()
        if d.get("acoustic_level") is not None:
            d["acousticLevel"] = d["acoustic_level"]
        if d.get("operating_hours") is not None:
            d["operatingHours"] = d["operating_hours"]
        return d

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "PMIS Python ML Microservice",
        "models_loaded": predictor.scaler is not None and predictor.anomaly_model is not None
    }

@app.get("/metrics")
def get_model_metrics():
    metrics_path = os.path.join(predictor.models_dir, "metrics.json")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r") as f:
            return json.load(f)
    return {
        "status": "Models ready with analytical baseline. Run train_models.py for custom metrics."
    }

@app.post("/predict/anomaly")
def predict_anomaly(payload: SensorPayload):
    try:
        return predictor.predict_anomaly(payload.to_dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/failure")
def predict_failure(payload: SensorPayload):
    try:
        return predictor.predict_failure(payload.to_dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/rul")
def predict_rul(payload: SensorPayload):
    try:
        return predictor.predict_rul(payload.to_dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/all")
def predict_all(payload: SensorPayload):
    try:
        return predictor.predict_all(payload.to_dict())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/explain")
def explain_machine(payload: SensorPayload):
    try:
        data = payload.to_dict()
        res = predictor.predict_all(data)
        return {
            "contributingFactors": res["contributingFactors"],
            "explanation": res["explanation"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
