from mcp.server.fastmcp import FastMCP
import pandas as pd
import os
import sys
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

GENIMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GENIMINI_API_KEY:
    genai.configure(api_key=GENIMINI_API_KEY)

mcp = FastMCP("Mumbai Water Data Manager")
DATASET_PATH = os.path.join(os.path.dirname(__file__), "ML", "data", "water_quality_clean.csv")

@mcp.resource("file://water-quality-dataset")
def get_water_dataset() -> str:
    if os.path.exists(DATASET_PATH):
        with open(DATASET_PATH, 'r') as f:
            return f.read()
    return "Dataset not found."

@mcp.tool()
def ai_research_and_collect() -> str:
    if not GENIMINI_API_KEY:
        return "Error: GEMINI_API_KEY not found in .env file."

    model = genai.GenerativeModel('gemini-2.5-flash')
    prompt = """
    Research recent (2023-2025) water quality data for Powai and Vihar lakes.
    Return ONLY a JSON array of records with these keys: source_title, source_year, record_type, location, observation_year, month, parameter, unit, powai_mean, vihar_mean, notes.
    """
    try:
        response = model.generate_content(prompt)
        content = response.text
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        records = json.loads(content)
        
        df = pd.read_csv(DATASET_PATH)
        new_df = pd.DataFrame(records)
        for col in df.columns:
            if col not in new_df.columns: new_df[col] = None
        
        final_df = pd.concat([df, new_df[df.columns]], ignore_index=True)
        final_df.to_csv(DATASET_PATH, index=False)
        
        return f"Successfully researched and added {len(records)} new records to the dataset!"
    except Exception as e:
        if "429" in str(e):
            return "Quota Exceeded. Please try again later or check your API key."
        return f"Error: {str(e)}"

@mcp.tool()
def read_dataset_info() -> str:
    try:
        if not os.path.exists(DATASET_PATH):
            return f"Dataset not found at {DATASET_PATH}"
        df = pd.read_csv(DATASET_PATH)
        info = {
            "columns": list(df.columns),
            "total_rows": len(df),
            "sample": df.head(3).to_dict(orient="records")
        }
        return str(info)
    except Exception as e:
        return f"Error reading dataset: {str(e)}"

@mcp.tool()
def add_water_quality_record(source_title: str, source_year: int, record_type: str, location: str, observation_year: float, month: str, parameter: str, unit: str, powai_mean: float = None, vihar_mean: float = None, notes: str = "") -> str:
    try:
        if not os.path.exists(DATASET_PATH):
            return "Dataset file missing."
        
        df = pd.read_csv(DATASET_PATH)
        new_row = {"source_title": source_title, "source_year": source_year, "record_type": record_type, "location": location, "observation_year": observation_year, "month": month, "parameter": parameter, "unit": unit, "powai_min": None, "powai_max": None, "powai_mean": powai_mean, "vihar_min": None, "vihar_max": None, "vihar_mean": vihar_mean, "notes": notes}
        df = pd.concat([df, pd.DataFrame([new_row])], ignore_index=True)
        df.to_csv(DATASET_PATH, index=False)
        
        return f"Successfully added record for {parameter} at {location} ({observation_year})"
    except Exception as e:
        return f"Failed to add record: {str(e)}"

if __name__ == "__main__":
    mcp.run()
