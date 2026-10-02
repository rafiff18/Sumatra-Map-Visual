"use client";

import React from "react";
import { Filter, Sparkles, AlertTriangle, Flame, ShieldAlert, Box, Layers, RotateCcw } from "lucide-react";

interface FilterControlsProps {
  selectedCluster: number | null;
  onSelectCluster: (cluster: number | null) => void;
  colorMode: "cluster" | "anomaly";
  onChangeColorMode: (mode: "cluster" | "anomaly") => void;
  showHotspotsLayer: boolean;
  onToggleHotspots: () => void;
  onlyAnomalies: boolean;
  onToggleOnlyAnomalies: () => void;
  is3DMode: boolean;
  onToggle3DMode: () => void;
  elevationScale: number;
  onChangeElevationScale: (val: number) => void;
  pointCount: number;
  totalAvailable: number;
}

const CLUSTERS = [
  { id: 1, label: "Z1 Dataran Rendah", pct: "36.0%", dot: "bg-amber-500", border: "border-amber-200" },
  { id: 2, label: "Z2 Hutan Rimba", pct: "32.6%", dot: "bg-emerald-600", border: "border-emerald-200" },
  { id: 0, label: "Z0 Dataran Tinggi", pct: "11.9%", dot: "bg-cyan-500", border: "border-cyan-200" },
  { id: 5, label: "Z5 Pegunungan Sedang", pct: "10.8%", dot: "bg-teal-600", border: "border-teal-200" },
  { id: 4, label: "Z4 Lahan Terbuka", pct: "5.5%", dot: "bg-rose-600", border: "border-rose-200" },
  { id: 3, label: "Z3 Hujan Ekstrim", pct: "3.0%", dot: "bg-blue-600", border: "border-blue-200" },
];

export default function FilterControls({
  selectedCluster,
  onSelectCluster,
  colorMode,
  onChangeColorMode,
  showHotspotsLayer,
  onToggleHotspots,
  onlyAnomalies,
  onToggleOnlyAnomalies,
  is3DMode,
  onToggle3DMode,
  elevationScale,
  onChangeElevationScale,
  pointCount,
  totalAvailable,
}: FilterControlsProps) {
  return (
    <div className="tactical-panel p-3.5 rounded-xl flex flex-col gap-3.5 text-xs text-slate-600">
      {/* Header filter Stitch Light Style */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-600" />
          <h3 className="font-headline font-bold text-sm tracking-wider uppercase text-slate-800">
            FILTER KONTROL
          </h3>
        </div>
        <span className="font-mono-telemetry text-[9px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-sky-700 uppercase font-bold tracking-wider">
          VISUAL FILTER
        </span>
      </div>

      {/* Skema Visualisasi Mode */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono-telemetry text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          SKEMA PEWARNAAN VISUAL
        </span>
        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
          <button
            onClick={() => onChangeColorMode("cluster")}
            className={`px-2 py-1.5 rounded font-mono-telemetry text-[10px] font-bold uppercase transition-all ${
              colorMode === "cluster"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Zonasi Klaster
          </button>
          <button
            onClick={() => onChangeColorMode("anomaly")}
            className={`px-2 py-1.5 rounded font-mono-telemetry text-[10px] font-bold uppercase transition-all ${
              colorMode === "anomaly"
                ? "bg-rose-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Peta Anomali
          </button>
        </div>
      </div>

      {/* Pilihan Klaster Zona Ekosistem */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="font-mono-telemetry text-[9px] font-bold text-slate-400 uppercase tracking-wider">
            KLASTER EKOSISTEM AKTIF
          </span>
          {selectedCluster !== null && (
            <button
              onClick={() => onSelectCluster(null)}
              className="font-mono-telemetry text-[9px] text-emerald-600 font-bold hover:underline"
            >
              RESET SEMUA
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {CLUSTERS.map((c) => {
            const isSelected = selectedCluster === c.id;
            return (
              <button
                key={c.id}
                onClick={() => onSelectCluster(isSelected ? null : c.id)}
                className={`flex items-center justify-between p-2 rounded-lg text-left transition-all border ${
                  isSelected
                    ? "bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-xs"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                  <span className="font-sans text-[11px] font-medium text-slate-800">{c.label}</span>
                </div>
                <span className="font-mono-telemetry text-[10px] font-bold text-sky-700">{c.pct}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3D Hexagon Column Controls */}
      <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Box className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-mono-telemetry text-[9px] font-bold text-slate-800 uppercase tracking-wider">
              PILAR WILAYAH 3D (LST)
            </span>
          </div>
          <button
            onClick={onToggle3DMode}
            className={`px-2 py-0.5 rounded font-mono-telemetry text-[9px] font-bold uppercase transition-all ${
              is3DMode
                ? "bg-sky-600 text-white shadow-xs"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {is3DMode ? "3D AKTIF" : "AKTIFKAN"}
          </button>
        </div>

        {is3DMode && (
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between font-mono-telemetry text-[10px]">
              <span className="text-slate-500">Elevasi Suhu:</span>
              <span className="text-sky-700 font-bold">{elevationScale}×</span>
            </div>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={elevationScale}
              onChange={(e) => onChangeElevationScale(parseInt(e.target.value))}
              className="w-full accent-sky-600 h-1.5 rounded bg-slate-200 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* Layer Toggles */}
      <div className="flex flex-col gap-1.5">
        <span className="font-mono-telemetry text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          LAYER OBSERVASI
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onToggleHotspots}
            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border font-mono-telemetry text-[9px] font-bold uppercase transition-all ${
              showHotspotsLayer
                ? "bg-rose-50 border-rose-300 text-rose-700 shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            <Flame className="w-3 h-3 text-rose-600" />
            <span>Hotspot Karhutla</span>
          </button>
          <button
            onClick={onToggleOnlyAnomalies}
            className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg border font-mono-telemetry text-[9px] font-bold uppercase transition-all ${
              onlyAnomalies
                ? "bg-sky-50 border-sky-300 text-sky-700 shadow-xs"
                : "border-slate-200 bg-slate-50 text-slate-400"
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-sky-600" />
            <span>Hanya Anomali</span>
          </button>
        </div>
      </div>
    </div>
  );
}
