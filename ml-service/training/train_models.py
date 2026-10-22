"""
Machine Learning Training Pipeline for Predictive Maintenance.
Trains:
1. Isolation Forest for Anomaly Detection
2. Random Forest Classifier for Failure Probability
3. Random Forest Regressor for Remaining Useful Life (RUL)
Saves artifacts using Joblib and outputs scientific validation metrics.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import IsolationForest, RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
    mean_absolute_error, root_mean_squared_error, r2_score
)

# Add parent directory to path to enable relative imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from preprocessing.preprocess import load_and_preprocess_data, get_train_test_splits, FEATURE_COLUMNS
from data.generate_dataset.py import generate_telemetry_data if False else None

def train_all_models():
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    data_dir = os.path.join(base_dir, "data")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)
    
    csv_path = os.path.join(data_dir, "synthetic_maintenance_data.csv")
    if not os.path.exists(csv_path):
        print("Dataset not found. Generating synthetic dataset...")
        from data.generate_dataset import generate_telemetry_data
        df = generate_telemetry_data()
        df.to_csv(csv_path, index=False)
        print(f"Dataset generated at {csv_path}")

    print("Loading and preprocessing dataset...")
    df, X, y_failure, y_rul = load_and_preprocess_data(csv_path)
    splits = get_train_test_splits(X, y_failure, y_rul)
    
    scaler = splits["scaler"]
    X_train = splits["X_train"]
    X_test = splits["X_test"]
    y_fail_train = splits["y_fail_train"]
    y_fail_test = splits["y_fail_test"]
    y_rul_train = splits["y_rul_train"]
    y_rul_test = splits["y_rul_test"]
    
    # -------------------------------------------------------------
    # 1. Anomaly Detection: Isolation Forest
    # -------------------------------------------------------------
    print("\n--- Training Isolation Forest Anomaly Detection Model ---")
    # Train primarily on healthy operational points
    normal_indices = np.where(y_fail_train == 0)[0]
    X_train_normal = X_train[normal_indices]
    
    anomaly_model = IsolationForest(
        n_estimators=120,
        contamination=0.08,
        random_state=42,
        n_jobs=-1
    )
    anomaly_model.fit(X_train_normal)
    
    # Isolation forest outputs: -1 for anomaly, 1 for normal
    raw_anomaly_preds = anomaly_model.predict(X_test)
    anomaly_pred_labels = np.where(raw_anomaly_preds == -1, 1, 0)
    
    # Anomaly evaluation against test failure states
    anom_acc = accuracy_score(y_fail_test, anomaly_pred_labels)
    anom_prec = precision_score(y_fail_test, anomaly_pred_labels, zero_division=0)
    anom_rec = recall_score(y_fail_test, anomaly_pred_labels, zero_division=0)
    anom_f1 = f1_score(y_fail_test, anomaly_pred_labels, zero_division=0)
    print(f"Anomaly Detection Metrics - Precision: {anom_prec:.3f}, Recall: {anom_rec:.3f}, F1: {anom_f1:.3f}")
    
    # -------------------------------------------------------------
    # 2. Failure Probability Prediction: Random Forest Classifier
    # -------------------------------------------------------------
    print("\n--- Training Random Forest Failure Prediction Classifier ---")
    failure_model = RandomForestClassifier(
        n_estimators=150,
        max_depth=10,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    failure_model.fit(X_train, y_fail_train)
    
    y_fail_pred = failure_model.predict(X_test)
    y_fail_prob = failure_model.predict_proba(X_test)[:, 1]
    
    fail_acc = accuracy_score(y_fail_test, y_fail_pred)
    fail_prec = precision_score(y_fail_test, y_fail_pred, zero_division=0)
    fail_rec = recall_score(y_fail_test, y_fail_pred, zero_division=0)
    fail_f1 = f1_score(y_fail_test, y_fail_pred, zero_division=0)
    fail_roc = roc_auc_score(y_fail_test, y_fail_prob)
    print(f"Failure Prediction Metrics - Accuracy: {fail_acc:.3f}, F1: {fail_f1:.3f}, ROC-AUC: {fail_roc:.3f}")

    # -------------------------------------------------------------
    # 3. Remaining Useful Life (RUL): Random Forest Regressor
    # -------------------------------------------------------------
    print("\n--- Training Random Forest RUL Regressor ---")
    rul_model = RandomForestRegressor(
        n_estimators=150,
        max_depth=12,
        random_state=42,
        n_jobs=-1
    )
    rul_model.fit(X_train, y_rul_train)
    
    y_rul_pred = rul_model.predict(X_test)
    
    rul_mae = mean_absolute_error(y_rul_test, y_rul_pred)
    rul_rmse = root_mean_squared_error(y_rul_test, y_rul_pred)
    rul_r2 = r2_score(y_rul_test, y_rul_pred)
    print(f"RUL Regression Metrics - MAE: {rul_mae:.2f} hrs, RMSE: {rul_rmse:.2f} hrs, R²: {rul_r2:.3f}")

    # -------------------------------------------------------------
    # 4. Save Trained Models & Metrics
    # -------------------------------------------------------------
    scaler_path = os.path.join(models_dir, "scaler.joblib")
    anomaly_path = os.path.join(models_dir, "anomaly_model.joblib")
    failure_path = os.path.join(models_dir, "failure_model.joblib")
    rul_path = os.path.join(models_dir, "rul_model.joblib")
    metrics_path = os.path.join(models_dir, "metrics.json")
    
    joblib.dump(scaler, scaler_path)
    joblib.dump(anomaly_model, anomaly_path)
    joblib.dump(failure_model, failure_path)
    joblib.dump(rul_model, rul_path)
    
    metrics = {
        "dataset_info": {
            "total_samples": len(df),
            "features": FEATURE_COLUMNS,
            "synthetic": True,
            "note": "Trained on synthetic industrial degradation data mimicking CNC milling centers."
        },
        "anomaly_detection": {
            "model": "IsolationForest",
            "precision": round(float(anom_prec), 4),
            "recall": round(float(anom_rec), 4),
            "f1": round(float(anom_f1), 4),
            "accuracy": round(float(anom_acc), 4)
        },
        "failure_prediction": {
            "model": "RandomForestClassifier",
            "accuracy": round(float(fail_acc), 4),
            "precision": round(float(fail_prec), 4),
            "recall": round(float(fail_rec), 4),
            "f1": round(float(fail_f1), 4),
            "roc_auc": round(float(fail_roc), 4)
        },
        "rul_prediction": {
            "model": "RandomForestRegressor",
            "mae": round(float(rul_mae), 2),
            "rmse": round(float(rul_rmse), 2),
            "r2_score": round(float(rul_r2), 4)
        }
    }
    
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
        
    print(f"\nAll models successfully trained and serialized to: {models_dir}")
    print(f"Scientific evaluation metrics saved to: {metrics_path}")

if __name__ == "__main__":
    train_all_models()
