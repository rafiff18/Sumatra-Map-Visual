# SMEST Dashboard

The frontend web client for the SMEST Geospatial Visualization Platform. This application provides an interactive canvas for visualizing and exploring environmental observations across Sumatra, Indonesia, built with Next.js, React, Deck.gl, and MapLibre GL.

## Features

- Geospatial Visualization: WebGL hardware-accelerated rendering capable of displaying high-density spatial point layers smoothly.
- 2D Point Cloud and 3D Volumetric Columns: Dynamic switching between 2D scatterplots and 3D extruded hexagon columns where height reflects temperature and color reflects vegetation density.
- Multi-Basemap Support: Toggle between Esri Topographic, Esri World Imagery Satellite, Esri Street, and OpenStreetMap basemaps.
- Anomaly Highlighting: Feed of detected environmental anomalies with camera fly-to navigation.
- Scenario Simulation: Interactive drawer allowing operators to manipulate vegetation, temperature, and rainfall parameters to inspect live model predictions and recommendations.
- Resilient Data Architecture: Dual-mode architecture that connects to the FastAPI backend with static local JSON cache fallback.

## How to Run

### Prerequisites

- Node.js 18.18 or later
- npm (or pnpm / yarn)
- Running SMEST FastAPI backend (optional, uses static fallback if unavailable)

### 1. Installation

Install project dependencies from the `smest-dashboard` directory:

```bash
cd smest-dashboard
npm install
```

### 2. Environment Configuration

By default, the application connects to the local backend at `http://127.0.0.1:8000`. To customize the API endpoint, create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

If the backend is not running, the dashboard automatically loads data from `public/zone_summary.json` and `public/spatial_sample.json`.

### 3. Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build

To build and launch the production application:

```bash
npm run build
npm start
```

### 5. Linting

To execute static code checks:

```bash
npm run lint
```

## Model Evaluation Metrics

The dashboard presents telemetry derived from two machine learning evaluation workflows:

### 1. Ecological Plant Zoning Classification (6-Class Model)

Evaluated on 20,000 hold-out test points across 6 bioclimatic zones:

| Zone ID | Ecosystem Description | Precision | Recall | F1-Score | Support |
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

### 2. Environmental Hazard and Anomaly Detection

Evaluated on a 120,000 spatial observation sample:

| Class | Condition | Precision | Recall | F1-Score | Support |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0 | Normal Condition | 0.9979 | 0.9655 | 0.9814 | 117,816 |
| 1 | Anomaly / Hazard | 0.3235 | 0.8901 | 0.4745 | 2,184 |
| **Accuracy** | | | | **0.9641** | **120,000** |
| **Macro Average** | | **0.6607** | **0.9278** | **0.7280** | **120,000** |
| **Weighted Average** | | **0.9856** | **0.9641** | **0.9722** | **120,000** |

## Conclusion

1. **Rendering Performance:** The dashboard renders dense observation layers and 3D columns using WebGL, ensuring fluid interactivity and navigation across map regions.
2. **Metric Reliability:** High classification performance (99.16% accuracy, 0.9922 macro F1) and high anomaly recall (89.01%) provide consistent and reliable inputs for spatial reporting.
3. **Architecture Resilience:** Built-in static fallbacks ensure that the frontend remains operational even during standalone offline usage or backend downtime.
