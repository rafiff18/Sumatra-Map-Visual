"""
backend/main.py
FastAPI Server untuk Sistem Monitoring Ekosistem Sumatra Terpadu (SMEST)
"""

import os
import sys
import json
from typing import Optional, List
import numpy as np
import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Tambahkan root path agar ml_inference dapat diimport
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from ml_inference import SumatraAnomalyDetector

app = FastAPI(
    title="SMEST API - Sistem Monitoring Ekosistem Sumatra Terpadu",
    description="API Big Data geospasial dan deteksi anomali ekosistem Sumatra (8.8 Juta Titik)",
    version="1.0.0"
)

# Aktifkan CORS untuk akses frontend Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inisialisasi detector dan data cache di memori
detector: Optional[SumatraAnomalyDetector] = None
zone_summary_cache = {}
spatial_cache: Optional[pd.DataFrame] = None
hotspots_cache: Optional[pd.DataFrame] = None

@app.on_event("startup")
def load_resources():
    global detector, zone_summary_cache, spatial_cache, hotspots_cache
    print("Memuat resource SMEST ke memori server...")
    
    # 1. Load ML Detector
    model_path = os.path.join(parent_dir, "anomaly_model.joblib")
    if os.path.exists(model_path):
        detector = SumatraAnomalyDetector(model_path=model_path)
        print("ML Anomaly Detector loaded.")
    else:
        print("PERINGATAN: anomaly_model.joblib belum ada.")

    # 2. Load Zone Summary JSON
    summary_path = os.path.join(parent_dir, "zone_summary.json")
    if os.path.exists(summary_path):
        with open(summary_path, "r", encoding="utf-8") as f:
            zone_summary_cache = json.load(f)
        print("Zone summary loaded.")

    # 3. Load Spatial Sample (~120,000 titik)
    sample_path = os.path.join(parent_dir, "spatial_sample.parquet")
    if os.path.exists(sample_path):
        spatial_cache = pd.read_parquet(sample_path)
        print(f"Spatial sample loaded: {len(spatial_cache):,} titik.")

    # 4. Load Hotspots Anomalies (~19,500 titik)
    hotspots_path = os.path.join(parent_dir, "hotspots_anomalies.parquet")
    if os.path.exists(hotspots_path):
        hotspots_cache = pd.read_parquet(hotspots_path)
        print(f"Hotspots loaded: {len(hotspots_cache):,} titik kritis.")

@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SMEST API - Sumatra Ecosystem Monitoring",
        "endpoints": [
            "/api/overview",
            "/api/zones",
            "/api/spatial",
            "/api/hotspots",
            "/api/predict"
        ]
    }

@app.get("/api/overview")
def get_overview():
    """Mengembalikan statistik ringkasan ekosistem pulau Sumatra"""
    if not zone_summary_cache:
        raise HTTPException(status_code=500, detail="Data ringkasan belum dimuat")
    
    hotspots_count = len(hotspots_cache) if hotspots_cache is not None else 0
    
    return {
        "total_points": zone_summary_cache.get("total_points", 8796097),
        "total_hotspots_detected": hotspots_count,
        "metrics": {
            "evi": zone_summary_cache.get("evi", {}),
            "lst": zone_summary_cache.get("lst", {}),
            "precipitation": zone_summary_cache.get("precipitation", {})
        },
        "system_status": "Active & Monitoring",
        "island": "Sumatra, Indonesia"
    }

@app.get("/api/zones")
def get_zones():
    """Mengembalikan karakteristik 6 klaster zona ekosistem Sumatra"""
    if not zone_summary_cache or "zones" not in zone_summary_cache:
        raise HTTPException(status_code=500, detail="Data zona belum dimuat")
    return zone_summary_cache["zones"]

@app.get("/api/spatial")
def get_spatial_data(
    cluster: Optional[int] = Query(None, description="Filter zona klaster (0-5)"),
    only_anomalies: bool = Query(False, description="Hanya tampilkan titik anomali"),
    limit: int = Query(35000, ge=100, le=100000, description="Maksimum titik yang dikembalikan"),
    min_lat: Optional[float] = None,
    max_lat: Optional[float] = None,
    min_lon: Optional[float] = None,
    max_lon: Optional[float] = None,
):
    """
    Mengembalikan data spasial teroptimasi untuk visualisasi Deck.gl
    Format ringkas: [longitude, latitude, EVI, LST, precipitation, cluster, is_anomaly, anomaly_score]
    """
    df = hotspots_cache if only_anomalies else spatial_cache
    if df is None or len(df) == 0:
        return {"count": 0, "data": []}

    sub = df
    if cluster is not None:
        sub = sub[sub["Zona_Cluster"] == cluster]
    if only_anomalies and "is_anomaly" in sub.columns:
        sub = sub[sub["is_anomaly"] == 1]

    # Bounding box filter jika diberikan
    if min_lat is not None and max_lat is not None:
        sub = sub[(sub["Latitude"] >= min_lat) & (sub["Latitude"] <= max_lat)]
    if min_lon is not None and max_lon is not None:
        sub = sub[(sub["Longitude"] >= min_lon) & (sub["Longitude"] <= max_lon)]

    total_matched = len(sub)
    if total_matched > limit:
        sub = sub.sample(n=limit, random_state=42)

    # Format compact: [lon, lat, evi, lst, precip, cluster, is_anomaly, score]
    columns_to_extract = ["Longitude", "Latitude", "EVI", "LST", "precipitation", "Zona_Cluster"]
    if "is_anomaly" in sub.columns:
        columns_to_extract.append("is_anomaly")
    else:
        sub["is_anomaly"] = 0
        columns_to_extract.append("is_anomaly")

    if "anomaly_score" in sub.columns:
        columns_to_extract.append("anomaly_score")
    else:
        sub["anomaly_score"] = 0.0
        columns_to_extract.append("anomaly_score")

    records = sub[columns_to_extract].round({
        "Longitude": 4,
        "Latitude": 4,
        "EVI": 3,
        "LST": 1,
        "precipitation": 1,
        "anomaly_score": 3
    }).values.tolist()

    return {
        "count": len(records),
        "total_matched": total_matched,
        "schema": ["lon", "lat", "evi", "lst", "precip", "cluster", "is_anomaly", "anomaly_score"],
        "data": records
    }

@app.get("/api/hotspots")
def get_hotspots(
    limit: int = Query(50, ge=5, le=500, description="Jumlah hotspot kritis"),
    kategori: Optional[str] = Query(None, description="Filter kategori hotspot")
):
    """Mengembalikan daftar top titik anomali kritis dengan keterangan lengkap"""
    if hotspots_cache is None or len(hotspots_cache) == 0:
        return {"count": 0, "hotspots": []}

    sub = hotspots_cache
    if kategori:
        sub = sub[sub["kategori"].str.contains(kategori, case=False, na=False)]

    sorted_hotspots = sub.sort_values(by="anomaly_score", ascending=False).head(limit)
    
    items = []
    for _, row in sorted_hotspots.iterrows():
        items.append({
            "longitude": round(float(row["Longitude"]), 4),
            "latitude": round(float(row["Latitude"]), 4),
            "evi": round(float(row["EVI"]), 3),
            "lst": round(float(row["LST"]), 1),
            "precipitation": round(float(row["precipitation"]), 1),
            "cluster": int(row["Zona_Cluster"]),
            "anomaly_score": round(float(row["anomaly_score"]), 3),
            "kategori": str(row.get("kategori", "Anomali Ekologis")),
            "risk_level": str(row.get("risk_level", "Tinggi"))
        })

    return {
        "count": len(items),
        "hotspots": items
    }

class PredictionRequest(BaseModel):
    evi: float = Field(..., ge=-0.5, le=1.0, description="Enhanced Vegetation Index", example=0.15)
    lst: float = Field(..., ge=5.0, le=50.0, description="Land Surface Temperature (°C)", example=34.5)
    precipitation: float = Field(..., ge=0.0, le=40.0, description="Curah Hujan (mm)", example=3.2)

@app.post("/api/predict")
def predict_anomaly(req: PredictionRequest):
    """Endpoint simulasi inferensi interaktif menggunakan model IsolationForest"""
    if detector is None:
        raise HTTPException(status_code=503, detail="Model inferensi belum siap")
    
    result = detector.predict(
        evi=req.evi,
        lst=req.lst,
        precipitation=req.precipitation
    )
    return result
