"use client";

import React, { useState } from "react";
import { OverviewData, HotspotItem } from "../types";
import { 
  Database, 
  Flame, 
  Thermometer, 
  Trees, 
  CloudRain, 
  AlertCircle, 
  MapPin, 
  ChevronRight, 
  Activity,
  Layers,
  Target
} from "lucide-react";

interface AnalyticsPanelProps {
  overview: OverviewData | null;
  hotspots: HotspotItem[];
  selectedCluster: number | null;
  onSelectCluster: (cluster: number | null) => void;
  onSelectHotspot: (hotspot: HotspotItem) => void;
}

export default function AnalyticsPanel({
  overview,
  hotspots,
  selectedCluster,
  onSelectCluster,
  onSelectHotspot,
}: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<"hotspots" | "zones">("hotspots");

  if (!overview) {
    return (
      <div className="tactical-panel p-6 rounded-xl animate-pulse text-slate-400 text-center font-mono-telemetry text-xs">
        MEMUAT TELEMETRI EKOSISTEM SUMATRA...
      </div>
    );
  }

  const zonesList = Object.entries(overview.zones || {}).map(([id, info]) => ({
    id: parseInt(id),
    ...info,
  }));

  return (
    <div className="tactical-panel p-3.5 rounded-xl flex flex-col gap-3 text-xs text-slate-600">
      {/* Header Panel Stitch Light Style */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-600" />
          <h3 className="font-headline font-bold text-sm tracking-wider uppercase text-slate-800">
            SEBARAN ANOMALI
          </h3>
        </div>
        <span className="font-mono-telemetry text-[9px] px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-bold uppercase tracking-wider">
          {overview.total_hotspots_detected?.toLocaleString() ?? "19,514"} TITIK
        </span>
      </div>

      {/* Macro Telemetry Cards 2x2 Grid */}
      <div className="grid grid-cols-2 gap-2">
        {/* Titik Observasi */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="font-mono-telemetry text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            TITIK OBSERVASI
          </span>
          <span className="font-mono-telemetry text-base font-bold text-sky-700 tracking-tight">
            {overview.total_points.toLocaleString()}
          </span>
          <span className="font-mono-telemetry text-[9px] text-slate-500">
            Parquet Dataset
          </span>
        </div>

        {/* Hotspot Aktif */}
        <div className="p-2.5 rounded-lg bg-rose-50/50 border border-rose-200 flex flex-col justify-between">
          <span className="font-mono-telemetry text-[9px] text-rose-600 uppercase font-bold tracking-wider">
            TITIK ANOMALI
          </span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono-telemetry text-base font-bold text-rose-700 tracking-tight">
              {overview.total_hotspots_detected.toLocaleString()}
            </span>
            <span className="font-mono-telemetry text-[9px] text-rose-500">(0.22%)</span>
          </div>
          <span className="font-mono-telemetry text-[9px] text-rose-600 flex items-center gap-1 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            Kategori Ekstrem
          </span>
        </div>

        {/* EVI Kanopi */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="font-mono-telemetry text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            EVI KANOPI RERATA
          </span>
          <span className="font-mono-telemetry text-sm font-bold text-emerald-700">
            {overview.metrics?.evi?.mean ?? 0.463}
          </span>
          <span className="font-mono-telemetry text-[9px] text-slate-500">
            Max: {overview.metrics?.evi?.max ?? 0.74}
          </span>
        </div>

        {/* LST Suhu Permukaan */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="font-mono-telemetry text-[9px] text-slate-400 uppercase font-bold tracking-wider">
            LST SUHU PERMUKAAN
          </span>
          <span className="font-mono-telemetry text-sm font-bold text-sky-700">
            {overview.metrics?.lst?.mean ?? 28.91}°C
          </span>
          <span className="font-mono-telemetry text-[9px] text-rose-600 font-semibold">
            Puncak: {overview.metrics?.lst?.max ?? 40.51}°C
          </span>
        </div>
      </div>

      {/* Precipitation Bar Macro Readout */}
      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex flex-col gap-1.5">
        <div className="flex items-center justify-between font-mono-telemetry text-[10px]">
          <span className="text-slate-500 uppercase font-bold tracking-wider">RERATA CURAH HUJAN</span>
          <span className="text-sky-700 font-bold">{overview.metrics?.precipitation?.mean ?? 8.34} mm/hari</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-sky-600 h-full rounded-full w-[42%]" />
        </div>
        <span className="font-mono-telemetry text-[9px] text-slate-500">
          Status: Sedang - Dinamis Monsun Sumatra
        </span>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 pt-1">
        <button
          onClick={() => setActiveTab("hotspots")}
          className={`flex-1 pb-1.5 font-mono-telemetry text-[10px] font-bold uppercase transition-all border-b-2 flex items-center justify-center gap-1 ${
            activeTab === "hotspots"
              ? "border-rose-600 text-rose-700"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Flame className="w-3 h-3 text-rose-600" />
          <span>Titik Anomali ({hotspots.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("zones")}
          className={`flex-1 pb-1.5 font-mono-telemetry text-[10px] font-bold uppercase transition-all border-b-2 flex items-center justify-center gap-1 ${
            activeTab === "zones"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-400 hover:text-slate-700"
          }`}
        >
          <Layers className="w-3 h-3 text-emerald-600" />
          <span>Klaster Profil (6)</span>
        </button>
      </div>

      {/* Tab 1: Live Hotspot Stream */}
      {activeTab === "hotspots" && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {hotspots.length === 0 ? (
            <div className="text-center py-6 text-slate-400 font-mono-telemetry text-xs">
              Tidak ada hotspot ditemukan.
            </div>
          ) : (
            hotspots.map((h, idx) => (
              <div
                key={idx}
                onClick={() => onSelectHotspot(h)}
                className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-rose-300 cursor-pointer transition-all flex flex-col gap-1 group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-headline font-bold text-xs text-slate-900 group-hover:text-rose-600 transition-colors">
                    {h.kategori}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-mono-telemetry font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                    {h.risk_level}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 font-mono-telemetry text-[10px] text-slate-600">
                  <span>LST: <strong className="text-rose-600">{h.lst}°C</strong></span>
                  <span>EVI: <strong className="text-emerald-700">{h.evi}</strong></span>
                  <span>Hujan: <strong className="text-sky-700">{h.precipitation}mm</strong></span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200 mt-0.5 font-mono-telemetry text-[9px]">
                  <span className="text-slate-400 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-slate-400" />
                    {h.latitude}°, {h.longitude}°
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectHotspot(h);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold uppercase hover:bg-rose-700 flex items-center gap-1 transition-all shadow-2xs"
                  >
                    <Target className="w-2.5 h-2.5" />
                    <span>FLY-TO</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Ecosystem Clusters */}
      {activeTab === "zones" && (
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
          {zonesList.map((z) => (
            <div
              key={z.id}
              onClick={() => onSelectCluster(selectedCluster === z.id ? null : z.id)}
              className={`p-2 rounded-lg border cursor-pointer transition-all ${
                selectedCluster === z.id
                  ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="font-headline font-bold text-xs text-slate-900">
                  Klaster {z.id}: {z.name}
                </span>
                <span className="font-mono-telemetry text-[10px] font-bold text-emerald-700">
                  {z.percentage}%
                </span>
              </div>
              <p className="text-[10px] text-slate-500 line-clamp-1 mb-1.5">
                {z.description}
              </p>
              <div className="grid grid-cols-3 gap-1 font-mono-telemetry text-[9px] text-slate-700 bg-white p-1 rounded border border-slate-200">
                <div>EVI: <span className="text-emerald-700 font-bold">{z.evi?.mean}</span></div>
                <div>LST: <span className="text-sky-700 font-bold">{z.lst?.mean}°C</span></div>
                <div>Hujan: <span className="text-blue-700 font-bold">{z.precipitation?.mean}mm</span></div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
