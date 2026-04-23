from __future__ import annotations
from datetime import datetime
import importlib
import importlib.util
from pathlib import Path
from typing import Any
import numpy as np
import pandas as pd
from app.settings import DATA_ROOT, LOCAL_DATASETS, LOCAL_MAIN_OUTPUT, ML_ROOT
from functools import lru_cache

if importlib.util.find_spec("geopandas"):
    gpd = importlib.import_module("geopandas")
else:
    gpd = None

def _slug_from_path(base: Path, p: Path) -> str:
    rel = p.relative_to(base).with_suffix("")
    return "__".join(rel.parts)

def _path_from_slug(base: Path, slug: str, extension: str) -> Path:
    parts = slug.split("__")
    return base.joinpath(*parts).with_suffix(extension)

@lru_cache(maxsize=32)
def _get_csv_meta(path: Path) -> dict[str, Any]:
    try:
        df_head = pd.read_csv(path, nrows=0)
        with open(path, "rb") as f:
            row_count = sum(1 for _ in f) - 1  
        return {
            "row_count": max(0, row_count),
            "column_count": len(df_head.columns),
            "columns": [str(c) for c in df_head.columns],
        }
    except Exception as exc:
        return {"error": str(exc), "row_count": 0, "column_count": 0, "columns": []}

def list_csv_paths() -> list[Path]:
    if not LOCAL_MAIN_OUTPUT.exists():
        return []
    return sorted(LOCAL_MAIN_OUTPUT.rglob("*.csv"))

def list_png_paths() -> list[Path]:
    if not LOCAL_MAIN_OUTPUT.exists():
        return []
    return sorted(LOCAL_MAIN_OUTPUT.rglob("*.png"))

def list_shp_paths() -> list[Path]:
    if not LOCAL_DATASETS.exists():
        return []
    return sorted(LOCAL_DATASETS.rglob("*.shp"))

def list_csv_files(include_stats: bool = True) -> list[dict[str, Any]]:
    files = []
    for p in list_csv_paths():
        slug = _slug_from_path(LOCAL_MAIN_OUTPUT, p)
        rel = p.relative_to(DATA_ROOT).as_posix()
        item: dict[str, Any] = {
            "slug": slug,
            "path": rel,
            "name": p.name,
            "size_bytes": p.stat().st_size,
            "updated_at": datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
        }
        if include_stats:
            stats = _get_csv_meta(p)
            item.update(stats)
        files.append(item)
    return files

def csv_preview(slug: str, limit: int = 25) -> dict[str, Any]:
    p = _path_from_slug(LOCAL_MAIN_OUTPUT, slug, ".csv")
    if not p.exists():
        raise FileNotFoundError(slug)
    df = pd.read_csv(p)
    records = df.head(limit).replace({np.nan: None}).to_dict(orient="records")
    return {
        "slug": slug,
        "name": p.name,
        "rows": int(df.shape[0]),
        "columns": [str(c) for c in df.columns],
        "preview": records,
    }

def _numeric_summary(df: pd.DataFrame) -> list[dict[str, Any]]:
    numeric = df.select_dtypes(include=[np.number])
    out: list[dict[str, Any]] = []
    for col in numeric.columns:
        s = numeric[col].dropna()
        if s.empty:
            continue
        out.append(
            {
                "column": str(col),
                "min": float(s.min()),
                "max": float(s.max()),
                "mean": float(s.mean()),
                "median": float(s.median()),
                "std": float(s.std()) if len(s) > 1 else 0.0,
            }
        )
    return out

def _find_time_column(df: pd.DataFrame) -> str | None:
    candidates = ["year", "observation_year", "month_num", "month", "date", "timestamp",]
    lower_map = {str(c).lower(): str(c) for c in df.columns}
    for c in candidates:
        if c in lower_map:
            return lower_map[c]
    return None

def _build_trend_and_forecast(df: pd.DataFrame) -> dict[str, Any] | None:
    time_col = _find_time_column(df)
    if time_col is None:
        return None

    metric_cols = [
        c
        for c in df.columns
        if pd.api.types.is_numeric_dtype(df[c]) and str(c).lower() not in {"source_year", "observation_year", "year", "month_num"}
    ]
    if not metric_cols:
        return None

    metric_col = metric_cols[0]
    data = df[[time_col, metric_col]].dropna().copy()
    if data.empty:
        return None

    if not pd.api.types.is_numeric_dtype(data[time_col]):
        time_series = pd.to_datetime(data[time_col], errors="coerce")
        if time_series.notna().sum() < 3:
            return None
        data = data.assign(_t=time_series.view("int64") // 10**9)
        x = data["_t"].to_numpy(dtype=float)
        time_values = data[time_col].astype(str).tolist()
    else:
        x = data[time_col].to_numpy(dtype=float)
        time_values = data[time_col].tolist()

    y = data[metric_col].to_numpy(dtype=float)
    if len(x) < 3 or len(np.unique(x)) < 2:
        return None

    coeff = np.polyfit(x, y, 1)
    model = np.poly1d(coeff)

    step = float(np.median(np.diff(np.sort(np.unique(x))))) if len(np.unique(x)) > 1 else 1.0
    future_x = [float(np.max(x) + step * i) for i in range(1, 4)]
    forecast_values = [float(model(v)) for v in future_x]

    return {
        "time_column": time_col,
        "metric_column": str(metric_col),
        "time_values": time_values,
        "series": [
            {
                "x": float(a),
                "y": float(b),
            }
            for a, b in zip(x.tolist(), y.tolist())
        ],
        "forecast": [
            {
                "x": fx,
                "y": fy,
            }
            for fx, fy in zip(future_x, forecast_values)
        ],
    }

def csv_insights(slug: str) -> dict[str, Any]:
    p = _path_from_slug(LOCAL_MAIN_OUTPUT, slug, ".csv")
    if not p.exists():
        raise FileNotFoundError(slug)
    df = pd.read_csv(p)
    return {
        "slug": slug,
        "name": p.name,
        "row_count": int(df.shape[0]),
        "column_count": int(df.shape[1]),
        "numeric_summary": _numeric_summary(df),
        "trend": _build_trend_and_forecast(df),
    }

def list_images() -> list[dict[str, Any]]:
    images = []
    for p in list_png_paths():
        rel = p.relative_to(DATA_ROOT).as_posix()
        images.append(
            {
                "name": p.name,
                "path": rel,
                "url": f"/assets/{rel}",
                "size_bytes": p.stat().st_size,
                "updated_at": datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
            }
        )
    return images

@lru_cache(maxsize=16)
def _get_shp_meta(path: Path) -> dict[str, Any]:
    if gpd is None:
        return {}
    try:
        file_size = path.stat().st_size
        if file_size > 10 * 1024 * 1024:  
            return {
                "feature_count": -1, 
                "note": "Large file skipped for speed",
                "size_mb": round(file_size / (1024 * 1024), 2)
            }
        gdf = gpd.read_file(path)
        bounds = gdf.total_bounds.tolist() if not gdf.empty else [None, None, None, None]
        return {
            "feature_count": int(len(gdf)),
            "crs": str(gdf.crs) if gdf.crs else None,
            "bounds": bounds,
            "geometry_types": sorted({str(v) for v in gdf.geometry.geom_type.unique()}) if not gdf.empty else [],
        }
    except Exception as exc:
        return {"error": str(exc), "feature_count": 0}

def list_shapefiles(include_stats: bool = True) -> list[dict[str, Any]]:
    files = []
    for p in list_shp_paths():
        rel = p.relative_to(DATA_ROOT).as_posix()
        item: dict[str, Any] = {
            "name": p.name,
            "path": rel,
            "size_bytes": p.stat().st_size,
            "updated_at": datetime.fromtimestamp(p.stat().st_mtime).isoformat(),
        }
        if include_stats:
            stats = _get_shp_meta(p)
            item.update(stats)
        files.append(item)
    return files

def overview() -> dict[str, Any]:
    csv_files = list_csv_files(include_stats=True)
    image_files = list_images()
    shp_files = list_shapefiles(include_stats=False)

    total_rows = 0
    for f in csv_files:
        total_rows += int(f.get("row_count", 0) or 0)

    return {
        "csv_count": len(csv_files),
        "image_count": len(image_files),
        "shapefile_count": len(shp_files),
        "total_csv_rows": total_rows,
        "generated_at": datetime.utcnow().isoformat(),
    }


@lru_cache(maxsize=1)
def predictions(limit: int = 50) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    for p in list_csv_paths():
        slug = _slug_from_path(LOCAL_MAIN_OUTPUT, p)
        try:
            df = pd.read_csv(p)
            trend = _build_trend_and_forecast(df)
            if trend is None:
                continue
            out.append(
                {
                    "slug": slug,
                    "name": p.name,
                    "time_column": trend["time_column"],
                    "metric_column": trend["metric_column"],
                    "forecast": trend["forecast"],
                }
            )
        except Exception:
            continue

    out.sort(key=lambda x: x["name"])
    return out[:limit]


def ml_forecast() -> dict[str, Any]:
    if not ML_ROOT.exists():
        return {"error": "ML results not found"}

    try:
        preds_path = ML_ROOT / "predictions_2026.csv"
        wqi_path = ML_ROOT / "wqi_2026.csv"
        report_path = ML_ROOT / "training_report.json"

        preds = pd.read_csv(preds_path).replace({np.nan: None}).to_dict(orient="records")
        wqi = pd.read_csv(wqi_path).replace({np.nan: None}).to_dict(orient="records")

        import json

        with open(report_path, "r") as f:
            report = json.load(f)

        return {
            "predictions_2026": preds,
            "wqi_2026": wqi,
            "training_report": report,
        }
    except Exception as exc:
        return {"error": str(exc)}


def satellite_indices() -> dict[str, Any]:
    if not ML_ROOT.exists():
        return {"error": "ML results not found"}

    try:
        results_path = ML_ROOT / "satellite_analysis_results.csv"
        summary_path = ML_ROOT / "satellite_summary_yearly.csv"

        results = pd.read_csv(results_path).replace({np.nan: None}).to_dict(orient="records")
        summary = pd.read_csv(summary_path).replace({np.nan: None}).to_dict(orient="records")

        return {
            "results": results,
            "summary": summary,
        }
    except Exception as exc:
        return {"error": str(exc)}
