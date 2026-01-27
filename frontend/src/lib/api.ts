import { DEMO_MODE, API_BASE_URL } from "./config";
import { fetchJson } from "./utils";
import type { IncidentsResponse, Metrics } from "./types";

export async function getMetrics(days = 7): Promise<Metrics> {
  if (DEMO_MODE) return fetchJson<Metrics>("/demo/metrics.json");
  // backend expects trailing slash for /metrics
  return fetchJson<Metrics>(`${API_BASE_URL}/metrics/?days=${days}`);
}

export async function getIncidents(params: {
  status?: string;
  severity?: string;
  limit?: number;
  lastKey?: string | null;
}): Promise<IncidentsResponse> {
  if (DEMO_MODE) return fetchJson<IncidentsResponse>("/demo/incidents.json");

  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  if (params.severity) qs.set("severity", params.severity);
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.lastKey !== undefined && params.lastKey !== null)
    qs.set("lastKey", params.lastKey);

  return fetchJson<IncidentsResponse>(`${API_BASE_URL}/incidents?${qs.toString()}`);
}