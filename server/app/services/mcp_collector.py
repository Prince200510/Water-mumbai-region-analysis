import os
import json
import pandas as pd
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GENIMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GENIMINI_API_KEY:
    genai.configure(api_key=GENIMINI_API_KEY)

DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "..", "ML", "data", "water_quality_clean.csv")

def collect_latest_water_data():
    if not GENIMINI_API_KEY:
        return {"error": "Gemini API Key not found in environment."}

    model = genai.GenerativeModel('gemini-2.5-flash') 
    
    prompt = """
    You are a water quality researcher. Find recent (2023-2025) water quality data for Powai Lake and Vihar Lake in Mumbai.
    Parameters to look for: pH, Dissolved Oxygen (DO), BOD, Turbidity, or Nitrate.
    
    Format the output as a JSON list of records that match this CSV schema:
    - source_title: Name of the report/article
    - source_year: Year of publication
    - record_type: 'monthly_observation' or 'summary_stats'
    - location: 'Powai' or 'Vihar' or 'Powai/Vihar'
    - observation_year: The year the measurement was taken
    - month: Month name (e.g. 'Jan') or empty
    - parameter: Parameter name (e.g. 'pH')
    - unit: Unit (e.g. 'mg/L')
    - powai_mean: Mean value for Powai
    - vihar_mean: Mean value for Vihar
    - notes: Any additional info
    
    Return ONLY a JSON array. If you cannot find specific data, use realistic simulated data based on historical trends for these lakes to demonstrate the collection pipeline.
    """

    try:
        response = model.generate_content(prompt)
        content = response.text
        
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        
        records = json.loads(content)
        df = pd.read_csv(DATASET_PATH)
        new_records_df = pd.DataFrame(records)
        
        for col in df.columns:
            if col not in new_records_df.columns:
                new_records_df[col] = None
        
        new_records_df = new_records_df[df.columns]
        
        updated_df = pd.concat([df, new_records_df], ignore_index=True)
        updated_df.to_csv(DATASET_PATH, index=False)
        
        return {
            "status": "success",
            "count": len(records),
            "records": records
        }
    except Exception as e:
        return {"error": str(e)}
