from __future__ import annotations
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.services import analytics, sync_data
from app.settings import DATA_ROOT

app = FastAPI(title="Mumbai Water Analytics API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/assets", StaticFiles(directory=DATA_ROOT), name="assets")

@app.on_event("startup")
def startup_event() -> None:
    pass

@app.get("/api/health")
def health() -> dict:
    return {"status": "ok"}

@app.post("/api/refresh")
def refresh_data(background_tasks: BackgroundTasks) -> dict:
    background_tasks.add_task(sync_data.sync_all)
    return {"status": "sync_started"}

@app.get("/api/overview")
def get_overview() -> dict:
    return analytics.overview()

@app.get("/api/csv-files")
def get_csv_files() -> dict:
    return {"items": analytics.list_csv_files()}

@app.get("/api/csv/{slug}/preview")
def get_csv_preview(slug: str, limit: int = 25) -> dict:
    try:
        return analytics.csv_preview(slug=slug, limit=limit)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="CSV not found")

@app.get("/api/csv/{slug}/insights")
def get_csv_insights(slug: str) -> dict:
    try:
        return analytics.csv_insights(slug=slug)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="CSV not found")

@app.get("/api/predictions")
def get_predictions(limit: int = 50) -> dict:
    return {"items": analytics.predictions(limit=limit)}

@app.get("/api/images")
def get_images() -> dict:
    return {"items": analytics.list_images()}

@app.get("/api/shapefiles")
def get_shapefiles() -> dict:
    return {"items": analytics.list_shapefiles()}

@app.get("/api/ml/forecast")
def get_ml_forecast() -> dict:
    return analytics.ml_forecast()

@app.get("/api/ml/satellite")
def get_ml_satellite() -> dict:
    return analytics.satellite_indices()
