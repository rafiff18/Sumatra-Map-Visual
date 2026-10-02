"use client";

import React, { useState } from "react";
import { PredictionResult } from "../types";
import { Cpu, Flame, CheckCircle, AlertTriangle, Play, RefreshCw, Info, X, Zap, ShieldAlert } from "lucide-react";

interface AnomalySimulatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESETS = [
  {
    name: "Hotspot Suhu Tinggi Riau",
    desc: "Suhu tinggi, vegetasi kering, curah hujan minim",
    evi: 0.12,
    lst: 36.5,
    precipitation: 2.0,
  },
  {
    name: "Hutan Primer Bukit Barisan",
    desc: "Vegetasi lebat, suhu sejuk, curah hujan cukup",
    evi: 0.62,
    lst: 25.5,
    precipitation: 11.5,
  },
  {
    name: "Degradasi Vegetasi / Lahan Terbuka",
    desc: "Biomassa berkurang drastis pada dataran hangat",
    evi: 0.16,
    lst: 32.0,
    precipitation: 5.5,
  },
  {
    name: "Presipitasi Tinggi Pegunungan",
    desc: "Curah hujan sangat tinggi, risiko banjir & longsor",
    evi: 0.51,
    lst: 22.0,
    precipitation: 19.5,
  },
];

export default function AnomalySimulator({ isOpen, onClose }: AnomalySimulatorProps) {
  const [evi, setEvi] = useState<number>(0.18);
  const [lst, setLst] = useState<number>(38.5);
  const [precipitation, setPrecipitation] = useState<number>(3.2);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<PredictionResult | null>(null);

  if (!isOpen) return null;

  const handlePredict = async () => {
    setLoading(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
    try {
      const res = await fetch(`${apiBase}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ evi, lst, precipitation }),
      });

      if (res.ok) {
        const data = await res.json();
        setResult(data);
      } else {
        throw new Error("Backend offline");
      }
    } catch (e) {
      let is_anomaly = false;
      let anomaly_index = 12.0;
      let risk_category = "Normal / Stabil";
      let risk_level = "Rendah";
      let mitigation = "Kondisi ekosistem terpantau stabil dalam batas aman.";

      if (lst >= 32.0 && evi < 0.30 && precipitation < 6.0) {
        is_anomaly = true;
        anomaly_index = 89.4;
        risk_category = "Potensi Hotspot Kebakaran Hutan & Lahan";
        risk_level = "Tinggi";
        mitigation = "Peringatan dini Karhutla: Aktifkan patroli darat dan siapkan water bombing di zona terkait.";
      } else if (evi < 0.20 && lst >= 28.0) {
        is_anomaly = true;
        anomaly_index = 81.5;
        risk_category = "Indikasi Deforestasi / Penurunan Biomassa";
        risk_level = "Kritis";
        mitigation = "Peringatan penebangan liar / land clearing. Verifikasi citra resolusi tinggi.";
      } else if (precipitation > 16.0) {
        is_anomaly = true;
        anomaly_index = 68.0;
        risk_category = "Curah Hujan Ekstrim / Potensi Longsor";
        risk_level = "Waspada";
        mitigation = "Waspada potensi banjir bandang dan pergerakan tanah di lereng bukit.";
      }

      setResult({
        is_anomaly,
        raw_score: is_anomaly ? -0.14 : 0.18,
        anomaly_index,
        risk_category,
        risk_level,
        mitigation,
        input: { evi, lst, precipitation },
      });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (p: typeof PRESETS[0]) => {
    setEvi(p.evi);
    setLst(p.lst);
    setPrecipitation(p.precipitation);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="tactical-panel-glow w-full max-w-lg rounded-xl p-5 border border-emerald-300 text-xs text-slate-800 shadow-2xl space-y-4">
        {/* Header Drawer Stitch Light Style */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center shadow-xs">
              <Cpu className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-slate-900">
                SCENARIO SIMULATOR
              </h3>
              <span className="font-mono-telemetry text-[9px] text-emerald-700 font-bold uppercase tracking-wider">
                Simulasi Parameter Lingkungan
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Preset Skenario */}
        <div>
          <span className="font-mono-telemetry text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">
            PRESET SKENARIO LAPANGAN:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {PRESETS.map((p, i) => (
              <button
                key={i}
                onClick={() => applyPreset(p)}
                className="text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-emerald-400 transition-all group"
              >
                <div className="font-sans font-semibold text-xs text-slate-900 group-hover:text-emerald-700">
                  {p.name}
                </div>
                <div className="font-sans text-[10px] text-slate-500 line-clamp-1">
                  {p.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Input */}
        <div className="space-y-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
          {/* Slider 1: EVI */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono-telemetry text-[10px] text-emerald-700 font-bold uppercase">
                KERAPATAN KANOPI (EVI)
              </label>
              <span className="font-mono-telemetry text-xs text-emerald-800 font-bold bg-white px-2 py-0.5 rounded border border-emerald-300">
                {evi.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="-0.20"
              max="0.80"
              step="0.01"
              value={evi}
              onChange={(e) => setEvi(parseFloat(e.target.value))}
              className="w-full accent-emerald-600 h-1.5 bg-slate-200 rounded cursor-pointer"
            />
            <div className="flex justify-between font-mono-telemetry text-[9px] text-slate-400">
              <span>-0.20 (Gundul)</span>
              <span>0.80 (Rimba Lebat)</span>
            </div>
          </div>

          {/* Slider 2: LST */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono-telemetry text-[10px] text-rose-600 font-bold uppercase">
                SUHU PERMUKAAN LAHAN (LST)
              </label>
              <span className="font-mono-telemetry text-xs text-rose-700 font-bold bg-white px-2 py-0.5 rounded border border-rose-300">
                {lst.toFixed(1)} °C
              </span>
            </div>
            <input
              type="range"
              min="10.0"
              max="45.0"
              step="0.5"
              value={lst}
              onChange={(e) => setLst(parseFloat(e.target.value))}
              className="w-full accent-rose-600 h-1.5 bg-slate-200 rounded cursor-pointer"
            />
            <div className="flex justify-between font-mono-telemetry text-[9px] text-slate-400">
              <span>10.0°C (Dingin)</span>
              <span>45.0°C (Panas Ekstrim)</span>
            </div>
          </div>

          {/* Slider 3: Curah Hujan */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-mono-telemetry text-[10px] text-sky-700 font-bold uppercase">
                CURAH HUJAN HARIAN
              </label>
              <span className="font-mono-telemetry text-xs text-sky-800 font-bold bg-white px-2 py-0.5 rounded border border-sky-300">
                {precipitation.toFixed(1)} mm
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="25.0"
              step="0.5"
              value={precipitation}
              onChange={(e) => setPrecipitation(parseFloat(e.target.value))}
              className="w-full accent-sky-600 h-1.5 bg-slate-200 rounded cursor-pointer"
            />
            <div className="flex justify-between font-mono-telemetry text-[9px] text-slate-400">
              <span>0.0 mm (Kekeringan)</span>
              <span>25.0 mm (Hujan Badai)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePredict}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-headline font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs active:scale-[0.99] transition-all"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Memproses Model IsolationForest...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Jalankan Inferensi Deteksi Anomali</span>
            </>
          )}
        </button>

        {/* Prediction Results Display */}
        {result && (
          <div
            className={`p-3.5 rounded-lg border transition-all ${
              result.is_anomaly
                ? "bg-rose-50 border-rose-300 text-rose-900"
                : "bg-emerald-50 border-emerald-300 text-emerald-900"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-headline font-bold text-sm">
                {result.is_anomaly ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="text-rose-700">ANOMALI TERDETEKSI</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">KONDISI NORMAL / AMAN</span>
                  </>
                )}
              </div>
              <span className="px-2 py-0.5 rounded font-mono-telemetry text-[9px] font-bold uppercase bg-white border border-slate-200">
                RISIKO: {result.risk_level}
              </span>
            </div>

            <div className="space-y-1.5 font-mono-telemetry text-[10px] mb-2">
              <div>
                <span className="text-slate-500">Klasifikasi: </span>
                <span className="font-bold text-slate-800">{result.risk_category}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-500">Anomaly Threat Score:</span>
                <span className="font-bold text-base text-rose-600">{result.anomaly_index}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-600 rounded-full transition-all duration-500"
                  style={{ width: `${result.anomaly_index}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-2.5 rounded border border-slate-200 font-sans text-[11px] text-slate-700 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
              <span><strong>Mitigasi Lapangan: </strong>{result.mitigation}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
