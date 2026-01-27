import { useEffect, useState } from "react";
import "./App.css";

import { DEMO_MODE } from "./lib/config";
import { getIncidents, getMetrics } from "./lib/api";
import { fmtSeconds } from "./lib/utils";
import type { Incident, Metrics } from "./lib/types";

import { Banner } from "./components/Banner";
import { KpiCard } from "./components/KpiCard";
import { SeverityChips } from "./components/SeverityChips";
import { IncidentsTable } from "./components/IncidentsTable";

export default function App() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [metricsErr, setMetricsErr] = useState<string | null>(null);
  const [days, setDays] = useState(7);

  const [items, setItems] = useState<Incident[]>([]);
  const [lastKey, setLastKey] = useState<string | null>(null);
  const [incErr, setIncErr] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [severityFilter, setSeverityFilter] = useState<string>("");

  async function loadMetrics() {
    try {
      setMetricsErr(null);
      setMetrics(await getMetrics(days));
    } catch (e: any) {
      setMetricsErr(e?.message || "Failed to load metrics");
    }
  }

  async function loadIncidents(reset = true) {
    try {
      setIncErr(null);
      const res = await getIncidents({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        limit: 10,
        lastKey: reset ? null : lastKey,
      });

      setItems(reset ? res.items : [...items, ...res.items]);
      setLastKey(res.lastKey);
    } catch (e: any) {
      setIncErr(e?.message || "Failed to load incidents");
    }
  }

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  useEffect(() => {
    loadIncidents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, severityFilter]);

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: 24 }}>
      <header style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Incident Platform</h2>
        <span style={{ fontSize: 12, padding: "4px 10px", borderRadius: 999, border: "1px solid #ddd" }}>
          {DEMO_MODE ? "DEMO MODE (backend paused)" : "LIVE MODE"}
        </span>
      </header>

      <Banner demoMode={DEMO_MODE} />

      <section style={{ marginTop: 18 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Metrics</h3>

          <label style={{ fontSize: 14 }}>
            Window:
            <select value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ marginLeft: 8 }}>
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
            </select>
          </label>

          <button onClick={loadMetrics} style={{ marginLeft: "auto" }}>
            Refresh
          </button>
        </div>

        {metricsErr && <p style={{ color: "crimson" }}>Metrics error: {metricsErr}</p>}

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 10 }}>
          <KpiCard label="Total" value={metrics?.totalIncidents ?? "—"} />
          <KpiCard label="Open" value={metrics?.openIncidents ?? "—"} />
          <KpiCard label="Resolved" value={metrics?.resolvedIncidents ?? "—"} />
          <KpiCard label="Avg MTTA" value={fmtSeconds(metrics?.avgMTTASeconds ?? null)} />
          <KpiCard label="Avg MTTR" value={fmtSeconds(metrics?.avgMTTRSeconds ?? null)} />
        </div>

        <SeverityChips bySeverity={metrics?.bySeverity} />
      </section>

      <section style={{ marginTop: 22 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Incidents</h3>

          <label style={{ fontSize: 14 }}>
            Status:
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="">All</option>
              <option value="OPEN">OPEN</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </label>

          <label style={{ fontSize: 14 }}>
            Severity:
            <select value={severityFilter} onChange={(e) => setSeverityFilter(e.target.value)} style={{ marginLeft: 8 }}>
              <option value="">All</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </label>

          <button onClick={() => loadIncidents(true)} style={{ marginLeft: "auto" }}>
            Refresh
          </button>
        </div>

        {incErr && <p style={{ color: "crimson" }}>Incidents error: {incErr}</p>}

        <IncidentsTable items={items} />

        <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
          <button
            disabled={DEMO_MODE || !lastKey}
            title={DEMO_MODE ? "Demo mode uses sample data" : !lastKey ? "No more results" : ""}
            onClick={() => loadIncidents(false)}
          >
            Load more
          </button>
        </div>
      </section>
    </div>
  );
}