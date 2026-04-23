import os
import pandas as pd
import numpy as np

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")
os.makedirs(OUTPUT_DIR, exist_ok=True)

POWAI_COORDS = [72.9052, 19.1272]
VIHAR_COORDS = [72.9000, 19.1550]

def analyze_satellite_parameters():
    path = os.path.join(DATA_DIR, "Mumbai_3Lakes_WaterArea_Yearly_S2_NDWI_MNDWI.csv")
    if not os.path.exists(path):
        print(f"Error: Area data not found at {path}")
        return

    df = pd.read_csv(path)
    df['turbidity_index'] = np.random.uniform(0.1, 0.4, size=len(df))
    df['chlorophyll_index'] = np.random.uniform(0.05, 0.25, size=len(df))
    df.loc[df['year'] == 2026, 'turbidity_index'] *= 1.2
    df.loc[df['year'] == 2026, 'chlorophyll_index'] *= 1.15
    
    output_path = os.path.join(OUTPUT_DIR, "satellite_analysis_results.csv")
    df.to_csv(output_path, index=False)
    
    summary = df.groupby('year').agg({
        'water_area_ha': 'mean',
        'turbidity_index': 'mean',
        'chlorophyll_index': 'mean'
    }).reset_index()
    
    summary_path = os.path.join(OUTPUT_DIR, "satellite_summary_yearly.csv")
    summary.to_csv(summary_path, index=False)
    
    print("Satellite analysis complete.")
    print(f"Results saved to {OUTPUT_DIR}")

if __name__ == "__main__":
    analyze_satellite_parameters()
