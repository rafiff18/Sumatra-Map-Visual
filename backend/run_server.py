"""
backend/run_server.py
Script untuk menjalankan server FastAPI SMEST
"""
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import uvicorn
from main import app

if __name__ == "__main__":
    print("Menjalankan SMEST FastAPI Server pada http://127.0.0.1:8000 ...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
