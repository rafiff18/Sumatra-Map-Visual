"use client";

import React, { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { OverviewData, HotspotItem, SpatialPoint } from "./types";
import FilterControls from "./components/FilterControls";
import AnalyticsPanel from "./components/AnalyticsPanel";
import AnomalySimulator from "./components/AnomalySimulator";
import { 
  Globe, 
  Cpu, 
  Flame, 
  Satellite, 
  RefreshCw, 
  ShieldCheck, 
  Menu, 
  X,
  Play,
  RotateCcw,
  Download,
  Printer,
  Radio
} from "lucide-react";

// Load DeckMap secara dynamic (tanpa SSR)
const DeckMap = dynamic(() => import("./components/DeckMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-500 gap-3 font-mono-telemetry text-xs">
      <RefreshCw className="w-6 h-6 text-emerald-600 animate-spin" />
      <span>INITIALIZING DECK.GL 9.4 + MAPLIBRE WGS84 VIEWPORT (LIGHT MODE)...</span>
    </div>
  ),
});

export default function Home() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [hotspots, setHotspots] = useState<HotspotItem[]>([]);
  const [spatialPoints, setSpatialPoints] = useState<SpatialPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // States Kontrol Peta
  const [selectedCluster, setSelectedCluster] = useState<number | null>(null);
  const [colorMode, setColorMode] = useState<"cluster" | "anomaly">("cluster");
  const [showHotspotsLayer, setShowHotspotsLayer] = useState<boolean>(true);
  const [onlyAnomalies, setOnlyAnomalies] = useState<boolean>(false);
  const [is3DMode, setIs3DMode] = useState<boolean>(false);
  const [elevationScale, setElevationScale] = useState<number>(50);
  const [targetLocation, setTargetLocation] = useState<{ lon: number; lat: number; zoom?: number } | null>(null);

  // Modal Simulator & Sidebar Toggle
  const [simulatorOpen, setSimulatorOpen] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Temporal Replay state
  const [isPlayingTimeline, setIsPlayingTimeline] = useState<boolean>(false);
  const [timelineMonth, setTimelineMonth] = useState<number>(8); // Agustus

  const MONTH_NAMES = [
    "JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI",
    "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"
  ];

  // Fetch initial data
  const loadData = useCallback(async () => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      // 1. Overview Stats
      let overviewData: OverviewData | null = null;
      try {
        const res = await fetch(`${apiBase}/api/overview`);
        if (res.ok) overviewData = await res.json();
      } catch (e) {}
      if (!overviewData) {
        const res = await fetch("/zone_summary.json");
        overviewData = await res.json();
      }
      setOverview(overviewData);

      // 2. Hotspots
      let hotspotsData: HotspotItem[] = [];
      try {
        const res = await fetch(`${apiBase}/api/hotspots?limit=80`);
        if (res.ok) {
          const json = await res.json();
          hotspotsData = json.hotspots || [];
        }
      } catch (e) {}
      if (hotspotsData.length === 0) {
        const res = await fetch("/hotspots.json");
        hotspotsData = await res.json();
      }
      setHotspots(hotspotsData);

      // 3. Spatial Points
      let pointsData: SpatialPoint[] = [];
      try {
        const queryParams = new URLSearchParams();
        queryParams.set("limit", "25000");
        if (onlyAnomalies) queryParams.set("only_anomalies", "true");
        if (selectedCluster !== null) queryParams.set("cluster", String(selectedCluster));

        const res = await fetch(`${apiBase}/api/spatial?${queryParams.toString()}`);
        if (res.ok) {
          const json = await res.json();
          pointsData = json.data || [];
        }
      } catch (e) {}
      if (pointsData.length === 0) {
        const res = await fetch("/spatial_sample.json");
        pointsData = await res.json();
      }
      setSpatialPoints(pointsData);

    } catch (err) {
      console.error("Gagal memuat data SMEST:", err);
    } finally {
      setLoading(false);
    }
  }, [onlyAnomalies, selectedCluster]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handler saat user mengklik hotspot di panel analitik
  const handleSelectHotspot = (h: HotspotItem) => {
    setTargetLocation({
      lon: h.longitude,
      lat: h.latitude,
      zoom: 9.8,
    });
  };

  // Export GeoJSON helper
  const handleExportGeoJSON = () => {
    const features = hotspots.map((h) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [h.longitude, h.latitude],
      },
      properties: {
        kategori: h.kategori,
        risk_level: h.risk_level,
        lst_suhu: h.lst,
        evi_vegetasi: h.evi,
        hujan: h.precipitation,
        skor_anomali: h.anomaly_score,
      },
    }));
    const geojson = {
      type: "FeatureCollection",
      name: "SMEST_Hotspots_Sumatra",
      features,
    };
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "SMEST_Hotspots_Sumatra.geojson";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#f8fafc] text-[#0f172a] font-sans">
      {/* TOP HEADER BAR (Stitch Light Mode: SMEST COMMAND CENTER) */}
      <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 flex items-center justify-between z-30 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 lg:hidden"
          >
            {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 p-1 flex items-center justify-center shadow-xs">
              <Satellite className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-headline font-bold text-sm tracking-wider uppercase text-emerald-800">
                  SMEST GEOSPATIAL VISUALIZATION
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-slate-100 border border-slate-200 text-sky-700 font-mono-telemetry text-[9px] uppercase font-bold tracking-wider">
                  GEOSPATIAL
                </span>
              </div>
              <span className="font-mono-telemetry text-[10px] text-slate-500 uppercase tracking-wider hidden sm:block">
                VISUALISASI DATA GEOSPASIAL EKOSISTEM SUMATRA
              </span>
            </div>
          </div>
        </div>

        {/* Telemetry Pills Strip */}
        <div className="hidden xl:flex items-center gap-2 font-mono-telemetry text-[10px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-600" />
            <span className="text-slate-500">DATA POINTS:</span>
            <span className="text-sky-700 font-bold">8,796,097 TITIK WGS84</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span className="text-slate-500">FASTAPI:</span>
            <span className="text-emerald-700 font-bold">ACTIVE :8000</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-slate-500">ENGINE:</span>
            <span className="text-sky-700 font-bold">DECK.GL 9.4 + MAPLIBRE</span>
          </div>
        </div>

        {/* Header Action CTAs */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSimulatorOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-headline font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs active:scale-95 transition-all"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Scenario Sandbox</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE BODY */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT TACTICAL SIDEBAR */}
        <div
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 absolute lg:relative z-20 w-80 sm:w-96 h-full flex flex-col gap-3 p-3 overflow-y-auto bg-white/95 lg:bg-white/80 backdrop-blur-xl border-r border-slate-200 transition-transform duration-300 ease-in-out shrink-0 shadow-sm`}
        >
          <FilterControls
            selectedCluster={selectedCluster}
            onSelectCluster={setSelectedCluster}
            colorMode={colorMode}
            onChangeColorMode={setColorMode}
            showHotspotsLayer={showHotspotsLayer}
            onToggleHotspots={() => setShowHotspotsLayer(!showHotspotsLayer)}
            onlyAnomalies={onlyAnomalies}
            onToggleOnlyAnomalies={() => setOnlyAnomalies(!onlyAnomalies)}
            is3DMode={is3DMode}
            onToggle3DMode={() => setIs3DMode(!is3DMode)}
            elevationScale={elevationScale}
            onChangeElevationScale={setElevationScale}
            pointCount={spatialPoints.length}
            totalAvailable={overview?.total_points || 8796097}
          />

          <AnalyticsPanel
            overview={overview}
            hotspots={hotspots}
            selectedCluster={selectedCluster}
            onSelectCluster={setSelectedCluster}
            onSelectHotspot={handleSelectHotspot}
          />
        </div>

        {/* CENTER / RIGHT MAP WORKSPACE */}
        <main className="flex-1 h-full relative overflow-hidden bg-slate-100">
          <DeckMap
            points={spatialPoints}
            hotspots={hotspots}
            colorMode={colorMode}
            showHotspotsLayer={showHotspotsLayer}
            selectedCluster={selectedCluster}
            targetLocation={targetLocation}
            is3DMode={is3DMode}
            elevationScale={elevationScale}
            isLightMode={true}
          />

          {/* HUD Top Coordinates Extent Pill */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 hidden sm:flex items-center gap-2 bg-white/95 border border-slate-200 px-3 py-1 rounded-lg text-[11px] font-mono-telemetry shadow-md text-slate-700">
            <Globe className="w-3.5 h-3.5 text-sky-600" />
            <span>WGS84 SUMATRA EXTENT: [95.00°E → 106.00°E] × [-5.97°S → 5.91°N]</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-700 font-bold">FPS: 60.0</span>
          </div>
        </main>
      </div>

      {/* BOTTOM TEMPORAL PLAYBACK & EXPORT BAR (Stitch Light Mode Feature) */}
      <footer className="h-12 bg-white/95 border-t border-slate-200 px-4 flex items-center justify-between z-30 shrink-0 font-mono-telemetry text-xs shadow-xs">
        {/* Playback Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
            className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-xs"
            title="Play / Pause Replay Temporal"
          >
            <Play className="w-3.5 h-3.5 fill-white" />
          </button>
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-400 font-bold tracking-widest uppercase">TEMPORAL REPLAY</span>
            <div className="flex items-center gap-1.5 text-[10px]">
              <span className="text-sky-700 font-bold">{MONTH_NAMES[timelineMonth - 1]} 2024</span>
              <span className="text-slate-400">|</span>
              <span className="text-rose-600 font-semibold">{timelineMonth >= 6 && timelineMonth <= 9 ? "PEAK DRY SEASON" : "MONSOON RAIN"}</span>
            </div>
          </div>
        </div>

        {/* Month Slider */}
        <div className="hidden md:flex items-center gap-2 flex-1 max-w-lg mx-6">
          <input
            type="range"
            min="1"
            max="12"
            value={timelineMonth}
            onChange={(e) => setTimelineMonth(parseInt(e.target.value))}
            className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded cursor-pointer"
          />
        </div>

        {/* Export CTAs */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportGeoJSON}
            className="px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sky-700 text-[10px] font-bold uppercase flex items-center gap-1 transition-all"
          >
            <Download className="w-3 h-3" />
            <span>Export GeoJSON</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase flex items-center gap-1 transition-all shadow-xs"
          >
            <Printer className="w-3 h-3" />
            <span>Cetak Ringkasan</span>
          </button>
        </div>
      </footer>

      {/* Simulator Modal Drawer */}
      <AnomalySimulator
        isOpen={simulatorOpen}
        onClose={() => setSimulatorOpen(false)}
      />
    </div>
  );
}
