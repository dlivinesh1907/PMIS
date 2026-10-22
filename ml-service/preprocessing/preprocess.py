"""
Preprocessing pipeline for predictive maintenance sensor features.
"""

import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split

FEATURE_COLUMNS = [
    "temperature",
    "vibration",
    "pressure",
    "rpm",
    "current",
    "voltage",
    "acoustic_level",
    "operating_hours"
]

def load_and_preprocess_data(csv_path):
    df = pd.read_csv(csv_path)
    
    # Ensure all feature columns exist and are numeric
    X = df[FEATURE_COLUMNS].copy()
    y_failure = df["failure"].values
    y_rul = df["rul_hours"].values
    
    # Check for missing values and impute with median if any
    if X.isnull().sum().sum() > 0:
        X = X.fillna(X.median())
        
    return df, X, y_failure, y_rul

def get_train_test_splits(X, y_failure, y_rul, test_size=0.2, random_state=42):
    X_train, X_test, y_fail_train, y_fail_test, y_rul_train, y_rul_test = train_test_split(
        X, y_failure, y_rul, test_size=test_size, random_state=random_state, stratify=y_failure
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    return {
        "scaler": scaler,
        "X_train": X_train_scaled,
        "X_test": X_test_scaled,
        "X_train_raw": X_train,
        "X_test_raw": X_test,
        "y_fail_train": y_fail_train,
        "y_fail_test": y_fail_test,
        "y_rul_train": y_rul_train,
        "y_rul_test": y_rul_test
    }
