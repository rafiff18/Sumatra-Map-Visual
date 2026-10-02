"""
train_model.py
Pengembangan Deteksi Anomali & Profiling Ekosistem Sumatra (SMEST)
Menggunakan Scikit-Learn (IsolationForest & Environmental Anomaly Profiler)
"""

import os
import json
import time
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

def main():
    start_time = time.time()
    print("=" * 60)
    print("SMEST: Memulai Training Deteksi Anomali & Ekstraksi Data")
    print("=" * 60)

    parquet_file = "sumatra_data.parquet"
    if not os.path.exists(parquet_file):
        raise FileNotFoundError(f"File {parquet_file} tidak ditemukan!")

    print(f"1. Membaca dataset dari {parquet_file}...")
    df = pd.read_parquet(parquet_file)
    total_rows = len(df)
    print(f"   Total data: {total_rows:,} baris.")

    # Profil nama zona berdasarkan karakteristik empiris
    zone_names = {
        0: {"name": "Dataran Tinggi Sejuk", "desc": "Suhu sejuk (24.3°C), vegetasi sedang-tinggi, curah hujan sedang."},
        1: {"name": "Dataran Rendah Tropis Hangat", "desc": "Suhu hangat (30.5°C), vegetasi sedang, curah hujan rendah (rentan kering)."},
        2: {"name": "Hutan Hujan Dataran Rendah Lebat", "desc": "Indeks vegetasi EVI tinggi (0.50), suhu hangat, curah hujan cukup."},
        3: {"name": "Pegunungan Basah (Hujan Tinggi)", "desc": "Curah hujan sangat tinggi (14.1mm), vegetasi sangat lebat, suhu sejuk."},
        4: {"name": "Lahan Terbuka / Area Kritis", "desc": "EVI sangat rendah (0.23), suhu permukaan tinggi, area terbuka/degradasi."},
        5: {"name": "Pegunungan Sedang", "desc": "Suhu sejuk (24.0°C), vegetasi stabil, curah hujan relatif rendah."}
    }

    # 2. Ringkasan Statistik per Zona
    print("2. Menghitung ringkasan statistik per Zona Klaster...")
    zone_summary = {}
    for cluster_id, meta in zone_names.items():
        sub = df[df["Zona_Cluster"] == cluster_id]
        zone_summary[str(cluster_id)] = {
            "name": meta["name"],
            "description": meta["desc"],
            "count": int(len(sub)),
            "percentage": round(float(len(sub) / total_rows * 100), 2),
            "evi": {
                "mean": round(float(sub["EVI"].mean()), 4),
                "std": round(float(sub["EVI"].std()), 4),
                "min": round(float(sub["EVI"].min()), 4),
                "max": round(float(sub["EVI"].max()), 4)
            },
            "lst": {
                "mean": round(float(sub["LST"].mean()), 2),
                "std": round(float(sub["LST"].std()), 2),
                "min": round(float(sub["LST"].min()), 2),
                "max": round(float(sub["LST"].max()), 2)
            },
            "precipitation": {
                "mean": round(float(sub["precipitation"].mean()), 2),
                "std": round(float(sub["precipitation"].std()), 2),
                "min": round(float(sub["precipitation"].min()), 2),
                "max": round(float(sub["precipitation"].max()), 2)
            }
        }

    overall_stats = {
        "total_points": total_rows,
        "evi": {
            "mean": round(float(df["EVI"].mean()), 4),
            "std": round(float(df["EVI"].std()), 4),
            "min": round(float(df["EVI"].min()), 4),
            "max": round(float(df["EVI"].max()), 4)
        },
        "lst": {
            "mean": round(float(df["LST"].mean()), 2),
            "std": round(float(df["LST"].std()), 2),
            "min": round(float(df["LST"].min()), 2),
            "max": round(float(df["LST"].max()), 2)
        },
        "precipitation": {
            "mean": round(float(df["precipitation"].mean()), 2),
            "std": round(float(df["precipitation"].std()), 2),
            "min": round(float(df["precipitation"].min()), 2),
            "max": round(float(df["precipitation"].max()), 2)
        },
        "zones": zone_summary
    }

    with open("zone_summary.json", "w", encoding="utf-8") as f:
        json.dump(overall_stats, f, indent=2, ensure_ascii=False)
    print("   Ringkasan zona tersimpan ke zone_summary.json.")

    # 3. Training Isolation Forest pada Sample Representatif
    print("3. Menyiapkan sampel 300,000 titik untuk pelatihan Isolation Forest...")
    sample_df = df.sample(n=300000, random_state=42)
    features = ["EVI", "LST", "precipitation"]
    X_train = sample_df[features].values

    print("   Melatih IsolationForest (n_estimators=100, contamination=0.05)...")
    iso_forest = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        max_samples=256,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_train)
    joblib.dump(iso_forest, "anomaly_model.joblib")
    print("   Model IsolationForest tersimpan di anomaly_model.joblib.")

    # 4. Evaluasi Anomali & Hotspot Risk pada Dataset Sampel Terfokus
    print("4. Mengekstrak Titik Hotspot & Anomali Kritis untuk Visualisasi Spasial Cepat...")
    # Ambil sample spasial representatif 120,000 titik untuk Deck.gl layer umum
    sample_spatial = df.sample(n=120000, random_state=42).copy()
    
    # Hitung decision_function pada sample_spatial
    scores = iso_forest.decision_function(sample_spatial[features].values)
    preds = iso_forest.predict(sample_spatial[features].values)
    sample_spatial["anomaly_score"] = np.round(-scores, 4) # Nilai lebih tinggi = lebih anomali
    sample_spatial["is_anomaly"] = (preds == -1).astype(int)

    # Simpan spatial sample untuk dashboard
    sample_spatial.to_parquet("spatial_sample.parquet", index=False)
    print(f"   Sample spasial tersimpan di spatial_sample.parquet ({len(sample_spatial):,} titik).")

    # 5. Cari hotspot paling kritis dari populasi anomali
    print("5. Mengidentifikasi titik kritis Karhutla & Deforestasi...")
    critical_fire = df[
        (df["LST"] >= 31.5) & 
        (df["EVI"] <= 0.32) & 
        (df["precipitation"] <= 7.0)
    ].copy()
    
    critical_deforest = df[
        (df["EVI"] < 0.20) & 
        (df["Zona_Cluster"].isin([1, 2, 4]))
    ].sample(n=min(15000, len(df[df["EVI"] < 0.20])), random_state=42).copy()

    critical_fire["kategori"] = "Potensi Hotspot Kebakaran"
    critical_fire["risk_level"] = "Tinggi"
    
    critical_deforest["kategori"] = "Indikasi Deforestasi / Lahan Terdegradasi"
    critical_deforest["risk_level"] = "Kritis"

    hotspots = pd.concat([critical_fire, critical_deforest]).drop_duplicates(subset=["Longitude", "Latitude"])
    # Batasi ke 25,000 titik hotspot paling representatif
    if len(hotspots) > 25000:
        hotspots = hotspots.sample(n=25000, random_state=42)

    # Hitung skor anomali untuk hotspot
    h_scores = iso_forest.decision_function(hotspots[features].values)
    hotspots["anomaly_score"] = np.round(-h_scores, 4)
    hotspots["is_anomaly"] = 1

    hotspots.to_parquet("hotspots_anomalies.parquet", index=False)
    print(f"   Hotspots & Anomali kritis tersimpan di hotspots_anomalies.parquet ({len(hotspots):,} titik).")

    elapsed = round(time.time() - start_time, 2)
    print("=" * 60)
    print(f"PROSES SELESAI dalam {elapsed} detik!")
    print("=" * 60)

if __name__ == "__main__":
    main()
