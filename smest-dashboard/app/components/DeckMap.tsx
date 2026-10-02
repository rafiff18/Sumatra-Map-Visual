"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer, BitmapLayer } from "@deck.gl/layers";
import { HexagonLayer } from "@deck.gl/aggregation-layers";
import { TileLayer } from "@deck.gl/geo-layers";
import * as maplibregl from "maplibre-gl";
import { SpatialPoint, HotspotItem } from "../types";
import { Layers, ZoomIn, ZoomOut, RotateCcw, Flame, Compass, Box, Eye } from "lucide-react";

interface DeckMapProps {
  points: SpatialPoint[];
  hotspots: HotspotItem[];
  colorMode: "cluster" | "anomaly";
  showHotspotsLayer: boolean;
  selectedCluster: number | null;
  targetLocation: { lon: number; lat: number; zoom?: number } | null;
  is3DMode?: boolean;
  elevationScale?: number;
  isLightMode?: boolean;
}

const CLUSTER_COLORS: Record<number, [number, number, number, number]> = {
  0: [34, 211, 238, 190],   // Cyan (Dataran Tinggi Sejuk)
  1: [245, 158, 11, 190],   // Amber (Dataran Rendah Tropis)
  2: [16, 185, 129, 190],   // Emerald (Hutan Hujan Lebat)
  3: [59, 130, 246, 190],   // Biru (Pegunungan Basah)
  4: [244, 63, 94, 220],    // Rose (Lahan Terbuka / Kritis)
  5: [20, 184, 166, 190],   // Teal (Pegunungan Sedang)
};

const INITIAL_VIEW_STATE = {
  longitude: 101.5,
  latitude: -0.5,
  zoom: 5.7,
  pitch: 28,
  bearing: 0,
  maxZoom: 15,
  minZoom: 4,
};

export default function DeckMap({
  points,
  hotspots,
  colorMode,
  showHotspotsLayer,
  selectedCluster,
  targetLocation,
  is3DMode = false,
  elevationScale = 45,
  isLightMode = true,
}: DeckMapProps) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const [hoverInfo, setHoverInfo] = useState<any>(null);
  const [basemapType, setBasemapType] = useState<"topo" | "satellite" | "street" | "osm">("topo");

  const getTileUrl = (type: string) => {
    switch (type) {
      case "satellite":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      case "street":
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
      case "osm":
        return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
      case "topo":
      default:
        return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}";
    }
  };

  // Sinkronisasi kamera Deck.gl
  const handleViewStateChange = ({ viewState: newViewState }: any) => {
    setViewState(newViewState);
  };

  // Fly to target coordinate jika pengguna memilih hotspot dari panel
  useEffect(() => {
    if (targetLocation) {
      const targetZoom = targetLocation.zoom || 9.5;
      setViewState((prev) => ({
        ...prev,
        longitude: targetLocation.lon,
        latitude: targetLocation.lat,
        zoom: targetZoom,
        pitch: 45,
        transitionDuration: 1800,
      }));
    }
  }, [targetLocation]);

  // Filter data titik sesuai klaster terpilih
  const filteredPoints = useMemo(() => {
    if (selectedCluster === null) return points;
    return points.filter((p) => p[5] === selectedCluster);
  }, [points, selectedCluster]);

  // Bangun layer Deck.gl
  const layers = useMemo(() => {
    const list: any[] = [];

    // Layer 0: Basemap Ubin Geospasial Sumatra (Carto Voyager / Satellite / Positron)
    list.push(
      new TileLayer({
        id: `basemap-tiles-${basemapType}`,
        data: getTileUrl(basemapType),
        minZoom: 0,
        maxZoom: 19,
        tileSize: 256,
        getTileData: async (tile: any) => {
          const { signal } = tile;
          if (!tile.url) return null;
          try {
            const res = await fetch(tile.url, { signal });
            if (!res.ok) return null;
            const blob = await res.blob();
            if (typeof createImageBitmap === "function") {
              return await createImageBitmap(blob);
            }
            return new Promise((resolve) => {
              const img = new Image();
              img.crossOrigin = "anonymous";
              img.onload = () => resolve(img);
              img.onerror = () => resolve(null);
              img.src = URL.createObjectURL(blob);
            });
          } catch {
            return null;
          }
        },
        renderSubLayers: (props: any) => {
          const {
            bbox: { west, south, east, north },
          } = props.tile;
          if (!props.data) return null;
          return new BitmapLayer({
            id: props.id,
            data: null as any,
            image: props.data,
            bounds: [west, south, east, north],
          });
        },
      })
    );

    // Layer 1: Titik Observasi Ekosistem (2D Scatter / Mode Titik)
    if (!is3DMode && filteredPoints && filteredPoints.length > 0) {
      list.push(
        new ScatterplotLayer({
          id: "ecosystem-points-layer",
          data: filteredPoints,
          getPosition: (d: SpatialPoint) => [d[0], d[1]],
          getRadius: (d: SpatialPoint) => (d[6] === 1 ? 2200 : 1600),
          getFillColor: (d: SpatialPoint) => {
            if (colorMode === "anomaly") {
              return d[6] === 1 ? [239, 68, 68, 230] : [30, 41, 59, 130];
            }
            const clusterId = d[5];
            return CLUSTER_COLORS[clusterId] || [148, 163, 184, 180];
          },
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 120],
          radiusMinPixels: 2.2,
          radiusMaxPixels: 18,
          updateTriggers: {
            getFillColor: [colorMode],
          },
        })
      );
    }

    // Layer 1.5: 3D Volumetric Hexagon Columns (Mode 3D Wilayah Ekosistem)
    if (is3DMode && filteredPoints && filteredPoints.length > 0) {
      list.push(
        new HexagonLayer({
          id: "ecosystem-3d-hex-layer",
          data: filteredPoints,
          getPosition: (d: SpatialPoint) => [d[0], d[1]],
          radius: 8500, // 8.5 km radius per hexagonal prism
          elevationScale: elevationScale || 45,
          extruded: true,
          pickable: true,
          autoHighlight: true,
          getElevationValue: (points: SpatialPoint[]) => {
            // Tinggi pilar 3D merefleksikan suhu (LST) atau anomali
            const sumLst = points.reduce((acc, p) => acc + p[3], 0);
            return sumLst / points.length;
          },
          getColorValue: (points: SpatialPoint[]) => {
            // Rata-rata EVI atau tingkat anomali
            const sumEvi = points.reduce((acc, p) => acc + p[2], 0);
            return sumEvi / points.length;
          },
          colorRange: [
            [244, 63, 94, 210],   // EVI rendah / kritis (Rose-red)
            [251, 146, 60, 210],  // EVI sedang-rendah (Orange)
            [250, 204, 21, 210],  // Kuning
            [34, 211, 238, 220],  // Cyan
            [16, 185, 129, 230],  // Hijau
            [5, 150, 105, 240],   // Hijau sangat lebat (Deep Emerald)
          ],
          material: {
            ambient: 0.65,
            diffuse: 0.6,
            shininess: 32,
            specularColor: [51, 51, 51],
          },
          transitions: {
            elevationScale: 1000,
          },
        })
      );
    }

    // Layer 2: Hotspots Kritis & Potensi Karhutla / Deforestasi
    if (showHotspotsLayer && hotspots && hotspots.length > 0) {
      list.push(
        new ScatterplotLayer({
          id: "hotspots-critical-layer",
          data: hotspots,
          getPosition: (d: HotspotItem) => [d.longitude, d.latitude],
          getRadius: is3DMode ? 6500 : 4200,
          getFillColor: [239, 68, 68, 240],
          getLineColor: [255, 255, 255, 255],
          lineWidthMinPixels: 2,
          stroked: true,
          pickable: true,
          radiusMinPixels: 5,
          radiusMaxPixels: 28,
        })
      );
    }

    return list;
  }, [filteredPoints, hotspots, colorMode, showHotspotsLayer, is3DMode, elevationScale, isLightMode, basemapType]);

  const resetView = () => {
    handleViewStateChange({ viewState: INITIAL_VIEW_STATE });
  };

  const zoomIn = () => {
    handleViewStateChange({
      viewState: { ...viewState, zoom: Math.min(viewState.zoom + 1, 15) },
    });
  };

  const zoomOut = () => {
    handleViewStateChange({
      viewState: { ...viewState, zoom: Math.max(viewState.zoom - 1, 4) },
    });
  };

  const togglePitch = () => {
    const nextPitch = viewState.pitch > 20 ? 0 : 50;
    handleViewStateChange({
      viewState: { ...viewState, pitch: nextPitch },
    });
  };

  return (
    <div className="relative w-full h-full min-h-[500px] overflow-hidden bg-slate-200 select-none">
      {/* Deck.gl Canvas Overlay with Native Hardware-Accelerated Basemap */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={handleViewStateChange}
        controller={{ doubleClickZoom: true, dragRotate: true }}
        layers={layers}
        onHover={(info) => setHoverInfo(info)}
        getCursor={({ isHovering }) => (isHovering ? "pointer" : "grab")}
      />

      {/* Basemap Status Pill */}
      <div className="absolute top-3 right-3 z-20 hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/90 border border-slate-200 text-[10px] font-mono-telemetry shadow-xs">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-500">BASEMAP:</span>
        <span className="text-sky-700 font-bold uppercase">
          {basemapType === "topo" ? "Topografi Relief" : basemapType === "satellite" ? "Citra Satelit" : basemapType === "street" ? "Peta Jalan" : "OpenStreetMap"}
        </span>
      </div>

      {/* Floating Map Controls */}
      <div className="absolute right-4 bottom-6 flex flex-col gap-2 z-20">
        <button
          onClick={() => {
            const types: ("topo" | "satellite" | "street" | "osm")[] = ["topo", "satellite", "street", "osm"];
            const next = types[(types.indexOf(basemapType) + 1) % types.length];
            setBasemapType(next);
          }}
          title={`Ganti Tipe Peta: ${basemapType === "topo" ? "Topografi" : basemapType === "satellite" ? "Satelit" : basemapType === "street" ? "Jalan" : "OSM"}`}
          className="p-2.5 rounded-lg bg-white/90 hover:bg-white text-sky-700 border border-slate-300 shadow-md backdrop-blur-md transition-all active:scale-95 flex items-center justify-center font-bold text-xs"
        >
          <Layers className="w-4 h-4" />
        </button>
        <button
          onClick={zoomIn}
          title="Zoom In"
          className="p-2.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-300 shadow-md backdrop-blur-md transition-all active:scale-95"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={zoomOut}
          title="Zoom Out"
          className="p-2.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-300 shadow-md backdrop-blur-md transition-all active:scale-95"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={togglePitch}
          title="Toggle 2D/3D Pitch"
          className="p-2.5 rounded-lg bg-white/90 hover:bg-white text-emerald-600 border border-slate-300 shadow-md backdrop-blur-md transition-all active:scale-95"
        >
          <Compass className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          title="Reset View Sumatra"
          className="p-2.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-300 shadow-md backdrop-blur-md transition-all active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute left-4 bottom-6 z-20 bg-white/90 backdrop-blur-md rounded-xl p-3 border border-slate-200 shadow-lg max-w-xs text-xs text-slate-700">
        <div className="font-semibold text-slate-900 mb-2 flex items-center gap-1.5 font-headline">
          <Layers className="w-3.5 h-3.5 text-emerald-600" />
          Legenda Peta Spasial
        </div>
        {colorMode === "cluster" ? (
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-[11px] font-mono-telemetry">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
              <span>Z0: T. Tinggi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span>Z1: D. Rendah</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
              <span>Z2: Hutan Lebat</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span>Z3: Peg. Basah</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600" />
              <span>Z4: Lahan Terbuka</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600" />
              <span>Z5: Peg. Sedang</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 text-[11px] font-mono-telemetry">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-600 ring-2 ring-red-300" />
              <span className="text-red-700 font-bold">Anomali Terdeteksi (Kritis)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600">Kondisi Normal / Stabil</span>
            </div>
          </div>
        )}

        {showHotspotsLayer && (
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-1.5 text-red-600 text-[11px] font-medium font-mono-telemetry">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 ring-4 ring-red-200 animate-ping" />
            <Flame className="w-3.5 h-3.5 ml-1" />
            <span>Hotspot Karhutla / Deforestasi Aktif</span>
          </div>
        )}
      </div>

      {/* Tooltip Hover Overlay */}
      {hoverInfo && hoverInfo.object && (
        <div
          className="absolute z-30 pointer-events-none glass-panel-glow p-3 rounded-lg text-xs shadow-2xl max-w-xs transition-all border border-cyan-500/40"
          style={{ left: hoverInfo.x + 12, top: hoverInfo.y + 12 }}
        >
          {Array.isArray(hoverInfo.object) ? (
            // Format Compact SpatialPoint: [lon, lat, evi, lst, precip, cluster, is_anomaly, anomaly_score]
            <div className="space-y-1">
              <div className="flex items-center justify-between border-b border-slate-700/80 pb-1 mb-1">
                <span className="font-semibold text-slate-100">
                  Klaster Zona {hoverInfo.object[5]}
                </span>
                {hoverInfo.object[6] === 1 ? (
                  <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium text-[10px] border border-red-500/30">
                    ANOMALI
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium text-[10px]">
                    NORMAL
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-3 text-[11px] text-slate-300">
                <div>Lon: <span className="text-slate-100">{hoverInfo.object[0]}°</span></div>
                <div>Lat: <span className="text-slate-100">{hoverInfo.object[1]}°</span></div>
                <div>EVI (Veg): <span className="text-emerald-400 font-medium">{hoverInfo.object[2]}</span></div>
                <div>LST (Suhu): <span className="text-amber-400 font-medium">{hoverInfo.object[3]}°C</span></div>
                <div>Hujan: <span className="text-cyan-400 font-medium">{hoverInfo.object[4]} mm</span></div>
                <div>Skor: <span className="text-rose-400 font-medium">{hoverInfo.object[7]}</span></div>
              </div>
            </div>
          ) : hoverInfo.object.points ? (
            // Format Hexagon 3D Cluster Aggregation
            <div className="space-y-1.5">
              <div className="flex items-center justify-between border-b border-cyan-500/30 pb-1">
                <span className="font-bold text-cyan-300 flex items-center gap-1">
                  <Box className="w-3.5 h-3.5 text-cyan-400" />
                  Pilar Wilayah 3D
                </span>
                <span className="text-[10px] bg-cyan-950/80 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/40">
                  {hoverInfo.object.points.length} Titik Data
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-[11px] text-slate-300">
                <div>Rerata LST (Tinggi): <span className="text-amber-400 font-bold">{Math.round(hoverInfo.object.elevationValue * 10) / 10}°C</span></div>
                <div>Rerata EVI (Warna): <span className="text-emerald-400 font-bold">{Math.round(hoverInfo.object.colorValue * 100) / 100}</span></div>
              </div>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                Tinggi pilar merefleksikan temperatur permukaan lahan di area ini.
              </div>
            </div>
          ) : (
            // Format HotspotItem
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-red-400 font-bold text-xs border-b border-red-500/30 pb-1">
                <Flame className="w-3.5 h-3.5" />
                <span>{hoverInfo.object.kategori}</span>
              </div>
              <div className="text-[11px] text-slate-300 mt-1">
                <div>Koordinat: {hoverInfo.object.longitude}°, {hoverInfo.object.latitude}°</div>
                <div>Tingkat Risiko: <span className="text-red-400 font-semibold">{hoverInfo.object.risk_level}</span></div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-[10px] bg-slate-900/60 p-1.5 rounded">
                  <div>EVI: <span className="text-emerald-400">{hoverInfo.object.evi}</span></div>
                  <div>Suhu: <span className="text-amber-400">{hoverInfo.object.lst}°C</span></div>
                  <div>Hujan: <span className="text-cyan-400">{hoverInfo.object.precipitation}mm</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
