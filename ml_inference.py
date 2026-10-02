"""
ml_inference.py
Modul inferensi real-time deteksi anomali ekosistem Sumatra
"""

import os
import joblib
import numpy as np

class SumatraAnomalyDetector:
    def __init__(self, model_path="anomaly_model.joblib"):
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model {model_path} tidak ditemukan!")
        self.model = joblib.load(model_path)

    def predict(self, evi: float, lst: float, precipitation: float) -> dict:
        """
        Mengevaluasi parameter lingkungan:
        - evi: Enhanced Vegetation Index (-0.2 sampai 1.0)
        - lst: Land Surface Temperature (°C, kisaran 10 - 45)
        - precipitation: Curah hujan harian (mm, kisaran 0 - 30)
        """
        features = np.array([[evi, lst, precipitation]])
        
        # Decision function: negatif menandakan anomali pada IsolationForest
        score = float(self.model.decision_function(features)[0])
        pred = int(self.model.predict(features)[0]) # 1 = normal, -1 = anomali
        is_anomaly = bool(pred == -1)

        # Normalisasi skor anomali ke skala 0 - 100
        # Di mana score < 0 berarti anomali (semakin negatif semakin ekstrim)
        anomaly_index = max(0.0, min(100.0, float((-score + 0.15) / 0.35 * 100)))

        # Analisis bahaya spesifik
        risk_category = "Normal / Stabil"
        risk_level = "Rendah"
        mitigation = "Kondisi ekosistem terpantau stabil dalam batas fluktuasi alami."

        if lst >= 32.0 and evi < 0.30 and precipitation < 6.0:
            risk_category = "Potensi Hotspot Kebakaran Hutan & Lahan"
            risk_level = "Tinggi"
            mitigation = "Peringatan dini Karhutla: Aktifkan patroli darat dan siapkan water bombing di zona terkait."
        elif evi < 0.20 and lst >= 28.0:
            risk_category = "Indikasi Deforestasi / Penurunan Biomassa"
            risk_level = "Kritis"
            mitigation = "Indikasi pembukaan lahan masif/illegal logging. Rekomendasikan verifikasi citra satelit resolusi tinggi dan inspeksi lapangan."
        elif precipitation > 16.0:
            risk_category = "Curah Hujan Ekstrim / Potensi Banjir-Longsor"
            risk_level = "Waspada"
            mitigation = "Waspada potensi tanah longsor di area lereng Bukit Barisan."
        elif is_anomaly:
            risk_category = "Anomali Fluktuasi Ekologis"
            risk_level = "Sedang"
            mitigation = "Kombinasi parameter menyimpang dari pola umum klaster. Pantau tren 7 hari ke depan."

        return {
            "is_anomaly": is_anomaly,
            "raw_score": round(score, 4),
            "anomaly_index": round(anomaly_index, 1),
            "risk_category": risk_category,
            "risk_level": risk_level,
            "mitigation": mitigation,
            "input": {
                "evi": evi,
                "lst": lst,
                "precipitation": precipitation
            }
        }

# Pengujian singkat
if __name__ == "__main__":
    detector = SumatraAnomalyDetector()
    print("Test Normal:", detector.predict(0.48, 29.5, 8.5))
    print("Test Kebakaran:", detector.predict(0.12, 36.0, 2.5))
