import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os
import json

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODEL_DIR = os.path.join(BASE_DIR, "models")
OUTPUT_DIR = os.path.join(BASE_DIR, "output")

os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

WHO_LIMITS = {
    "Lead": 0.01,
    "Chromium": 0.05,
    "Iron": 0.3,
    "Copper": 2.0,
    "Nickel": 0.07,
    "Nitrate-nitrogen": 50.0,
    "Ammonia-nitrogen": 1.5,
    "pH": 8.5,
    "Dissolved oxygen": 5.0,
    "Biochemical oxygen demand": 3.0,
    "Total alkalinity": 200.0,
    "Calcium": 75.0,
    "Magnesium": 30.0,
    "Sodium": 200.0,
    "Potassium": 12.0,
    "Transparency": 100.0,
    "Water temperature": 30.0,
    "Electrical conductivity": 0.4,
    "Reactive phosphorus": 0.1,
    "Total carbon": 100.0,
    "Total organic carbon": 50.0,
    "Conductivity": 500.0,
    "Total hardness": 300.0,
    "Phosphate": 5.0,
    "Sulphate": 250.0,
    "Nitrate": 50.0,
}

WQI_WEIGHTS = {
    "pH": 0.11,
    "Dissolved oxygen": 0.14,
    "Biochemical oxygen demand": 0.13,
    "Nitrate-nitrogen": 0.10,
    "Ammonia-nitrogen": 0.10,
    "Lead": 0.12,
    "Chromium": 0.10,
    "Iron": 0.06,
    "Copper": 0.05,
    "Nickel": 0.05,
    "Transparency": 0.04,
}

def load_summary_stats():
    path = os.path.join(DATA_DIR, "summary_stats_comparison.csv")
    df = pd.read_csv(path)
    records = []
    for _, row in df.iterrows():
        records.append({
            "year": 2015,
            "location": "Powai",
            "parameter": row["parameter"],
            "value": row["powai_mean"],
        })
        if pd.notna(row["vihar_mean"]):
            records.append({
                "year": 2015,
                "location": "Vihar",
                "parameter": row["parameter"],
                "value": row["vihar_mean"],
            })
    return pd.DataFrame(records)

def load_monthly_observations():
    path = os.path.join(DATA_DIR, "powai_monthly_observations_clean.csv")
    df = pd.read_csv(path)
    records = []
    for _, row in df.iterrows():
        records.append({
            "year": int(row["observation_year"]),
            "location": row["location"],
            "parameter": row["parameter"],
            "value": row["powai_mean"],
        })
    return pd.DataFrame(records)

def prepare_training_data():
    summary = load_summary_stats()
    monthly = load_monthly_observations()
    combined = pd.concat([summary, monthly], ignore_index=True)
    combined = combined.dropna(subset=["value"])
    combined = combined[combined["value"] != 0]
    return combined

def train_models(df):
    le_location = LabelEncoder()
    le_param = LabelEncoder()

    df["location_enc"] = le_location.fit_transform(df["location"])
    df["param_enc"] = le_param.fit_transform(df["parameter"])

    results = {}
    model_info = {}

    for param in df["parameter"].unique():
        param_df = df[df["parameter"] == param].copy()

        if len(param_df) < 2:
            lr = LinearRegression()
            X = param_df[["year"]].values
            y = param_df["value"].values
            lr.fit(X, y)
            results[param] = {"model": lr, "type": "linear", "features": ["year"]}
            model_info[param] = {
                "type": "linear",
                "samples": len(param_df),
                "r2": 1.0,
                "mae": 0.0,
            }
            continue

        X = param_df[["year", "location_enc"]].values
        y = param_df["value"].values

        if len(param_df) >= 5:
            X_train, X_test, y_train, y_test = train_test_split(
                X, y, test_size=0.2, random_state=42
            )
        else:
            X_train, X_test, y_train, y_test = X, X, y, y

        rf = RandomForestRegressor(
            n_estimators=100,
            max_depth=5,
            random_state=42,
            min_samples_split=2,
        )
        rf.fit(X_train, y_train)

        y_pred = rf.predict(X_test)
        r2 = r2_score(y_test, y_pred) if len(y_test) > 1 else 1.0
        mae = mean_absolute_error(y_test, y_pred)

        results[param] = {
            "model": rf,
            "type": "random_forest",
            "features": ["year", "location_enc"],
        }
        model_info[param] = {
            "type": "random_forest",
            "samples": len(param_df),
            "r2": round(r2, 4),
            "mae": round(mae, 6),
        }

    joblib.dump(results, os.path.join(MODEL_DIR, "pollutant_models.pkl"))
    joblib.dump(le_location, os.path.join(MODEL_DIR, "le_location.pkl"))
    joblib.dump(le_param, os.path.join(MODEL_DIR, "le_param.pkl"))

    with open(os.path.join(MODEL_DIR, "model_info.json"), "w") as f:
        json.dump(model_info, f, indent=2)

    return results, le_location, le_param, model_info


def predict_future(results, le_location, target_year=2026):
    predictions = []
    locations = le_location.classes_

    for param, model_data in results.items():
        model = model_data["model"]
        model_type = model_data["type"]

        for loc in locations:
            loc_enc = le_location.transform([loc])[0]

            if model_type == "linear":
                X_pred = np.array([[target_year]])
            else:
                X_pred = np.array([[target_year, loc_enc]])

            pred_value = model.predict(X_pred)[0]
            pred_value = max(0, pred_value)

            who_limit = WHO_LIMITS.get(param, None)
            status = "N/A"
            if who_limit:
                if param == "Dissolved oxygen":
                    status = "Safe" if pred_value >= who_limit else "Warning"
                elif param == "pH":
                    status = "Safe" if 6.5 <= pred_value <= who_limit else "Warning"
                else:
                    ratio = pred_value / who_limit
                    if ratio < 0.5:
                        status = "Safe"
                    elif ratio < 0.8:
                        status = "Moderate"
                    elif ratio < 1.0:
                        status = "Warning"
                    else:
                        status = "Dangerous"

            predictions.append({
                "parameter": param,
                "location": loc,
                "predicted_year": target_year,
                "predicted_value": round(pred_value, 6),
                "who_limit": who_limit,
                "status": status,
                "unit": "mg/L",
            })

    return predictions

def calculate_wqi(predictions, location):
    loc_preds = [p for p in predictions if p["location"] == location]
    numerator = 0
    denominator = 0

    for pred in loc_preds:
        param = pred["parameter"]
        if param not in WQI_WEIGHTS or param not in WHO_LIMITS:
            continue

        wi = WQI_WEIGHTS[param]
        who = WHO_LIMITS[param]
        val = pred["predicted_value"]

        if param == "Dissolved oxygen":
            qi = ((14.6 - val) / (14.6 - who)) * 100
        elif param == "pH":
            qi = ((val - 7.0) / (8.5 - 7.0)) * 100
        else:
            qi = (val / who) * 100

        qi = max(0, min(qi, 300))
        numerator += wi * qi
        denominator += wi

    if denominator == 0:
        return 0

    wqi = numerator / denominator
    return round(wqi, 2)

def get_wqi_rating(wqi):
    if wqi <= 25:
        return "Excellent"
    elif wqi <= 50:
        return "Good"
    elif wqi <= 75:
        return "Poor"
    elif wqi <= 100:
        return "Very Poor"
    else:
        return "Unfit for Drinking"

def main():
    df = prepare_training_data()
    print(f"{len(df)}")
    print(f"{df['parameter'].nunique()}")
    print(f"{df['location'].unique().tolist()}")
    print(f" {sorted(df['year'].unique().tolist())}")

    results, le_location, le_param, model_info = train_models(df)
    print(f"Models trained: {len(results)}")
    for param, info in model_info.items():
        print(f" - {param}: {info['type']} (R²={info['r2']}, MAE={info['mae']})")

    predictions = predict_future(results, le_location, target_year=2026)

    pred_df = pd.DataFrame(predictions)
    pred_df.to_csv(os.path.join(OUTPUT_DIR, "predictions_2026.csv"), index=False)
    print(f"     Predictions generated: {len(predictions)}")

    wqi_results = []
    for loc in le_location.classes_:
        wqi = calculate_wqi(predictions, loc)
        rating = get_wqi_rating(wqi)
        wqi_results.append({
            "location": loc,
            "year": 2026,
            "wqi_score": wqi,
            "rating": rating,
        })
        print(f"{loc} Lake WQI 2026: {wqi} ({rating})")

    wqi_df = pd.DataFrame(wqi_results)
    wqi_df.to_csv(os.path.join(OUTPUT_DIR, "wqi_2026.csv"), index=False)

    report = {
        "training_samples": len(df),
        "parameters_modeled": len(results),
        "prediction_year": 2026,
        "model_performance": model_info,
        "wqi_results": wqi_results,
        "hazardous_pollutants": [],
    }

    hazardous = ["Lead", "Chromium", "Iron", "Copper", "Nickel"]
    for pred in predictions:
        if pred["parameter"] in hazardous:
            report["hazardous_pollutants"].append(pred)

    with open(os.path.join(OUTPUT_DIR, "training_report.json"), "w") as f:
        json.dump(report, f, indent=2, default=str)

    for pred in predictions:
        if pred["parameter"] in hazardous:
            limit_str = f" (WHO: {pred['who_limit']})" if pred["who_limit"] else ""
            print(f"  {pred['location']:8s} | {pred['parameter']:12s} | "
                  f"{pred['predicted_value']:.6f} mg/L | "
                  f"{pred['status']:10s}{limit_str}")

if __name__ == "__main__":
    main()
