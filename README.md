# SMEST (Sumatra Ecosystem Geospatial Visualization Platform)

An interactive geospatial visualization and analytics platform for regional ecosystem exploration across Sumatra, Indonesia. The platform visualizes multivariate environmental observations, ecological zoning classifications, and anomaly risk distributions (wildfire hotspots and vegetation loss) through a high-performance WebGL dashboard (Next.js and Deck.gl) supported by a FastAPI backend service.

## System Features

- Geospatial Visualization: Hardware-accelerated map rendering supporting high-density spatial point clouds using Deck.gl and MapLibre GL.
- 2D Point Cloud and 3D Column Layers: Switch between 2D scatterplots and 3D volumetric columns parameterized by surface temperature and vegetation density.
- Ecological Zoning Exploration: Automated clustering and visual profiling across 6 environmental vegetation zones.
- Environmental Anomaly Mapping: Spatial mapping of environmental outliers such as acute vegetation degradation and elevated surface temperatures.
- Scenario Simulation Tool: Interactive interface allowing users to adjust environmental indicators (vegetation index, temperature, rainfall) to evaluate risk patterns.
- FastAPI Backend Service: RESTful API service providing spatial queries, zone statistics, and on-demand model inference.

## Technology Stack

### Frontend & Geospatial Visualization
- Web Framework: Next.js 16 (App Router, Turbopack compiler)
- Core Library: React 19
- Language: TypeScript 5
- Geospatial WebGL Engine: Deck.gl 9.4 (@deck.gl/core, @deck.gl/react, @deck.gl/layers, @deck.gl/aggregation-layers)
- Map Engine: MapLibre GL 6.9
- Basemap Layers: Esri ArcGIS Online (World Topo, World Imagery, World Street) and OpenStreetMap (OSM)
- Styling: Tailwind CSS v4 (@tailwindcss/postcss)
- Icons: Lucide React
- Typography: Inter, JetBrains Mono, Space Grotesk (Google Fonts)

### Backend & API Services
- Framework: FastAPI 0.110+ (Asynchronous ASGI framework)
- Web Server: Uvicorn 0.28+ (Standard with uvloop and httptools)
- Data Validation: Pydantic v2
- Testing: Starlette TestClient / HTTPX
- Middleware: Starlette CORSMiddleware

### Data Science & Machine Learning
- Machine Learning: Scikit-Learn 1.4+ (Isolation Forest, Decision Tree, Random Forest)
- Data Processing: Pandas 2.2+, NumPy 1.26+
- Storage & Columnar Format: Apache Arrow / PyArrow 15.0+ (Apache Parquet format with Snappy compression)
- Model Serialization: Joblib 1.3+

### Architecture & Spatial Protocols
- Spatial Format: Columnar Parquet, GeoJSON (RFC 7946)
- Coordinate Reference System (CRS): WGS84 (EPSG:4326)
- API Serialization: RESTful JSON with zero-overhead coordinate array serialization


## How to Run

### Prerequisites

- Python 3.10 or higher
- Node.js 18.18 or higher, and npm
- Git

### 1. Repository Setup

Clone the repository and install dependencies:

```bash
git clone https://github.com/rafiff18/MONITORING-EKOSISTEM-SUMATRA.git
cd MONITORING-EKOSISTEM-SUMATRA

# Install backend dependencies
pip install -r requirements.txt
```

### 2. Backend Service (FastAPI)

To run the backend server:

```bash
# Optional: run model training and data preprocessing
python train_model.py

# Start the FastAPI server
python backend/run_server.py
```

The backend server runs at `http://127.0.0.1:8000`.  
Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

To verify API endpoints and functionality:

```bash
python backend/test_api.py
```

### 3. Frontend Dashboard (Next.js)

In a separate terminal, navigate to the dashboard directory:

```bash
cd smest-dashboard

# Install dependencies
npm install

# Start development server
npm run dev
```

The web dashboard is accessible at `http://localhost:3000`.

To create an optimized production build:

```bash
npm run build
npm start
```

Optional environment configuration: create `.env.local` inside `smest-dashboard/` to set the API endpoint:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

## Model Evaluation Metrics

### 1. Ecological Plant Zoning Classification (6-Class Model)

Evaluated on a stratified test set of 20,000 observations using features EVI (Enhanced Vegetation Index), LST (Land Surface Temperature), and Precipitation:

| Class ID | Zone Description | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Zone 0 | Cool Highlands | 0.9921 | 0.9937 | 0.9929 | 2,386 |
| Zone 1 | Warm Tropical Lowlands | 0.9910 | 0.9919 | 0.9915 | 7,198 |
| Zone 2 | Dense Lowland Rainforest | 0.9920 | 0.9903 | 0.9911 | 6,501 |
| Zone 3 | Wet Mountainous Rainforest | 0.9951 | 0.9984 | 0.9967 | 607 |
| Zone 4 | Open Land / Degraded Area | 0.9909 | 0.9864 | 0.9887 | 1,105 |
| Zone 5 | Moderate Mountainous | 0.9914 | 0.9927 | 0.9921 | 2,203 |
| **Accuracy** | | | | **0.9916** | **20,000** |
| **Macro Average** | | **0.9921** | **0.9922** | **0.9922** | **20,000** |
| **Weighted Average** | | **0.9916** | **0.9916** | **0.9916** | **20,000** |

Baseline comparison:
- Decision Tree Classifier: Accuracy 0.9817, Macro F1 0.9834
- Random Forest Classifier: Accuracy 0.9916, Macro F1 0.9922

### 2. Environmental Hazard and Anomaly Detection

Evaluated across a 120,000 spatial observation sample against domain hazard criteria:

| Class | Description | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | Normal Condition | 0.9979 | 0.9655 | 0.9814 | 117,816 |
| 1 | Anomaly / Hazard | 0.3235 | 0.8901 | 0.4745 | 2,184 |
| **Accuracy** | | | | **0.9641** | **120,000** |
| **Macro Average** | | **0.6607** | **0.9278** | **0.7280** | **120,000** |
| **Weighted Average** | | **0.9856** | **0.9641** | **0.9722** | **120,000** |

The high recall of 0.8901 (89.01%) for anomaly detection indicates that the model identifies the vast majority of environmental outlier events.

## Conclusion

1. **Classification Performance:** The ecological zoning model achieves an accuracy of 99.16% and a macro F1-score of 0.9922 across all 6 vegetation zones, demonstrating effective separability based on vegetation index, temperature, and precipitation parameters.
2. **Anomaly Detection Sensitivity:** The anomaly detection model achieves an 89.01% recall for critical environmental outliers, minimizing false negatives and ensuring that severe temperature spikes and rapid canopy losses are captured.
3. **System Integration:** The integration between the data processing pipeline, FastAPI backend, and WebGL frontend provides a responsive platform for large-scale spatial data visualization and exploratory environmental analytics.
