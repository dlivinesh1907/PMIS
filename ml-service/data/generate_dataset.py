"""
Synthetic Industrial Sensor Telemetry & Degradation Dataset Generator.
Simulates realistic run-to-failure cycles and normal operations for rotating machinery (CNCs, turbines, pumps).
"""

import os
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

def generate_telemetry_data(num_machines=10, run_hours_per_machine=500, random_seed=42):
    np.random.seed(random_seed)
    records = []
    
    start_time = datetime.now() - timedelta(days=30)
    
    for m_idx in range(1, num_machines + 1):
        machine_id = f"CNC-{m_idx:03d}"
        
        # Determine machine degradation profile
        # Some machines remain healthy, some experience gradual wear, some suffer rapid wear
        has_failure_cycle = (m_idx % 2 == 0) or (m_idx == 4)
        failure_point = int(run_hours_per_machine * np.random.uniform(0.65, 0.95)) if has_failure_cycle else 99999
        
        operating_hours = np.random.uniform(1000, 5000)
        
        for hour in range(run_hours_per_machine):
            timestamp = start_time + timedelta(hours=hour)
            operating_hours += 1
            
            # Degradation factor between 0.0 (pristine) and 1.0 (failure)
            if hour >= failure_point:
                # Post-failure or critical state
                degradation = 1.0
                rul = 0.0
                failure = 1
            elif has_failure_cycle and hour > (failure_point - 120):
                # Progressive degradation within 120 hours of failure
                degradation = (hour - (failure_point - 120)) / 120.0
                # Non-linear exponential wear curve
                degradation = np.power(degradation, 1.6)
                rul = max(0.0, float(failure_point - hour))
                failure = 1 if rul < 24 else 0
            else:
                degradation = np.random.uniform(0.0, 0.15)
                rul = max(100.0, 500.0 - (hour * 0.5) + np.random.normal(0, 10))
                failure = 0
                
            # Base Sensor Physics
            # 1. Temperature: Normal 40-70°C, Warning 70-85°C, Critical >85°C
            base_temp = 50.0 + np.random.normal(0, 2.5)
            temperature = base_temp + (degradation * 42.0) + (np.random.normal(0, 1.2) if degradation > 0.5 else 0)
            
            # 2. Vibration: Normal 1-4 mm/s, Warning 4-7 mm/s, Critical >7 mm/s
            base_vib = 2.2 + np.random.normal(0, 0.4)
            vibration = base_vib + (degradation * 6.5) + (np.random.exponential(0.8) if degradation > 0.6 else 0)
            
            # 3. Pressure: Normal 70-100 PSI (drops or fluctuates wildly upon seal failure)
            base_pressure = 85.0 + np.random.normal(0, 3.0)
            pressure = base_pressure - (degradation * 25.0) + np.random.normal(0, 2.0)
            
            # 4. RPM: Nominal 1450-1500 (wobbles under drag)
            base_rpm = 1480.0 + np.random.normal(0, 10.0)
            rpm = base_rpm - (degradation * 120.0) + (np.random.normal(0, 35.0) if degradation > 0.5 else 0)
            
            # 5. Current: Nominal 10-12A (rises as motor works harder)
            base_current = 10.5 + np.random.normal(0, 0.6)
            current = base_current + (degradation * 6.2) + np.random.normal(0, 0.4)
            
            # 6. Voltage: Nominal 230V
            voltage = 230.0 + np.random.normal(0, 3.5)
            
            # 7. Acoustic Level: Normal 50-75 dB, elevated with friction
            base_acoustic = 60.0 + np.random.normal(0, 3.0)
            acoustic_level = base_acoustic + (degradation * 28.0)
            
            records.append({
                "machine_id": machine_id,
                "timestamp": timestamp.isoformat(),
                "temperature": round(float(temperature), 2),
                "vibration": round(float(vibration), 2),
                "pressure": round(float(pressure), 2),
                "rpm": round(float(rpm), 1),
                "current": round(float(current), 2),
                "voltage": round(float(voltage), 2),
                "acoustic_level": round(float(acoustic_level), 1),
                "operating_hours": round(float(operating_hours), 1),
                "degradation_factor": round(float(degradation), 3),
                "failure": int(failure),
                "rul_hours": round(float(rul), 1)
            })
            
    df = pd.DataFrame(records)
    return df

if __name__ == "__main__":
    output_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(output_dir, exist_ok=True)
    csv_path = os.path.join(output_dir, "synthetic_maintenance_data.csv")
    
    print("Generating industrial machine sensor telemetry...")
    df = generate_telemetry_data(num_machines=8, run_hours_per_machine=400)
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} telemetry samples successfully at: {csv_path}")
    print(f"Summary failure distribution: {df['failure'].value_counts().to_dict()}")
    print(f"Average RUL: {df['rul_hours'].mean():.1f} hours")
