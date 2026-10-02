export interface ZoneMetrics {
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface ZoneInfo {
  name: string;
  description: string;
  count: number;
  percentage: number;
  evi: ZoneMetrics;
  lst: ZoneMetrics;
  precipitation: ZoneMetrics;
}

export interface OverviewData {
  total_points: number;
  total_hotspots_detected: number;
  metrics: {
    evi: ZoneMetrics;
    lst: ZoneMetrics;
    precipitation: ZoneMetrics;
  };
  zones: Record<string, ZoneInfo>;
  system_status?: string;
  island?: string;
}

export interface HotspotItem {
  longitude: number;
  latitude: number;
  evi: number;
  lst: number;
  precipitation: number;
  cluster: number;
  anomaly_score: number;
  kategori: string;
  risk_level: string;
}

// Compact spatial tuple: [lon, lat, evi, lst, precip, cluster, is_anomaly, anomaly_score]
export type SpatialPoint = [number, number, number, number, number, number, number, number];

export interface PredictionResult {
  is_anomaly: boolean;
  raw_score: number;
  anomaly_index: number;
  risk_category: string;
  risk_level: string;
  mitigation: string;
  input: {
    evi: number;
    lst: number;
    precipitation: number;
  };
}
