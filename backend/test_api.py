"""
backend/test_api.py
Unit test untuk verifikasi endpoint FastAPI SMEST
"""
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from fastapi.testclient import TestClient
from backend.main import app, load_resources

def test_endpoints():
    print("Inisialisasi startup event...")
    load_resources()
    client = TestClient(app)

    print("1. Testing GET / ...")
    res = client.get("/")
    assert res.status_code == 200, f"Error {res.status_code}: {res.text}"
    print("   Status:", res.json()["status"])

    print("2. Testing GET /api/overview ...")
    res = client.get("/api/overview")
    assert res.status_code == 200, f"Error {res.status_code}: {res.text}"
    print("   Total Points:", res.json()["total_points"])

    print("3. Testing GET /api/zones ...")
    res = client.get("/api/zones")
    assert res.status_code == 200
    zones = res.json()
    print(f"   Ditemukan {len(zones)} zona.")

    print("4. Testing GET /api/spatial (limit=100) ...")
    res = client.get("/api/spatial?limit=100")
    assert res.status_code == 200
    spatial = res.json()
    print(f"   Spatial data count: {spatial['count']}")

    print("5. Testing GET /api/hotspots (limit=5) ...")
    res = client.get("/api/hotspots?limit=5")
    assert res.status_code == 200
    hotspots = res.json()
    print(f"   Hotspots count: {hotspots['count']}")
    if hotspots['count'] > 0:
        print("   Sample hotspot:", hotspots['hotspots'][0]['kategori'])

    print("6. Testing POST /api/predict ...")
    res = client.post("/api/predict", json={"evi": 0.12, "lst": 36.5, "precipitation": 2.1})
    assert res.status_code == 200
    pred = res.json()
    print("   Prediction Anomaly:", pred["is_anomaly"], "Risk:", pred["risk_category"])

    print("\nSEMUA UJI ENDPOINT API BERHASIL 100%!")

if __name__ == "__main__":
    test_endpoints()
