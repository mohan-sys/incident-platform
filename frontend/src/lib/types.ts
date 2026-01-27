export type Metrics = {
  windowDays: number | null;
  totalIncidents: number;
  openIncidents: number;
  resolvedIncidents: number;
  avgMTTASeconds: number | null;
  avgMTTRSeconds: number | null;
  bySeverity: Record<string, number>;
};

export type Incident = {
  incidentId: string;
  service: string;
  severity: string;
  summary: string;
  status: "OPEN" | "RESOLVED";
  source: string;
  createdAt: string;
  acknowledgedAt?: string | null;
  resolvedAt?: string | null;
};

export type IncidentsResponse = {
  items: Incident[];
  lastKey: string | null;
};