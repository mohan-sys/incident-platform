import { useEffect, useState } from "react";
import "./App.css";

import { DEMO_MODE } from "./lib/config";
import { getIncidents, getMetrics, updateIncident } from "./lib/api";
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

  const [busyId, setBusyId] = useState<string | null>(null);

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

  async function handleAck(id: string) {
    try {
      setBusyId(id);
      await updateIncident(id, "ACK");
      await loadIncidents(true);
      await loadMetrics();
    } catch (e: any) {
      alert(e?.message || "Failed to ACK incident");
    } finally {
      setBusyId(null);
    }
  }

  async function handleResolve(id: string) {
    try {
      setBusyId(id);
      await updateIncident(id, "RESOLVE");
      await loadIncidents(true);
      await loadMetrics();
    } catch (e: any) {
      alert(e?.message || "Failed to RESOLVE incident");
    } finally {
      setBusyId(null);
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
    <div className="appContainer">
      <header className="appHeader">
        <h2 style={{ margin: 0 }}>Incident Platform</h2>
        <span
          style={{
            fontSize: 12,
            padding: "4px 10px",
            borderRadius: 999,
            border: "1px solid #666",
            background: DEMO_MODE ? "#fff7e6" : "#eaffea",
            color: "#111",
            fontWeight: 600,
          }}
        >
          {DEMO_MODE ? "DEMO MODE (backend paused)" : "LIVE MODE"}
        </span>
      </header>

      <Banner demoMode={DEMO_MODE} />

      {/* ---------- Metrics ---------- */}
      <section style={{ marginTop: 18 }}>
        <div className="sectionHeader">
          <h3 style={{ margin: 0 }}>Metrics</h3>

          <label className="fieldLabel">
            Window:
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
            </select>
          </label>

          <button onClick={loadMetrics} className="pushRight">
            Refresh
          </button>
        </div>

        {metricsErr && (
          <p style={{ color: "crimson" }}>Metrics error: {metricsErr}</p>
        )}

        <div className="metricsGrid">
          <KpiCard label="Total" value={metrics?.totalIncidents ?? "—"} />
          <KpiCard label="Open" value={metrics?.openIncidents ?? "—"} />
          <KpiCard
            label="Resolved"
            value={metrics?.resolvedIncidents ?? "—"}
          />
          <KpiCard
            label="Avg MTTA"
            value={fmtSeconds(metrics?.avgMTTASeconds ?? null)}
          />
          <KpiCard
            label="Avg MTTR"
            value={fmtSeconds(metrics?.avgMTTRSeconds ?? null)}
          />
        </div>

        <SeverityChips bySeverity={metrics?.bySeverity} />
      </section>

      {/* ---------- Incidents ---------- */}
      <section className="incidentsPanel" style={{ marginTop: 22 }}>
        <div className="incidentsHeader sectionHeader">
          <h3 style={{ margin: 0 }}>Incidents</h3>

          <label className="fieldLabel">
            Status:
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="OPEN">OPEN</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </label>

          <label className="fieldLabel">
            Severity:
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
            >
              <option value="">All</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </label>

          <button onClick={() => loadIncidents(true)} className="pushRight">
            Refresh
          </button>
        </div>

        {incErr && (
          <p style={{ color: "crimson", marginTop: 8 }}>Incidents error: {incErr}</p>
        )}

        <div className="incidentsTableArea">
          <IncidentsTable
            items={items}
            demoMode={DEMO_MODE}
            busyId={busyId}
            onAck={handleAck}
            onResolve={handleResolve}
          />
        </div>

        <div className="incidentsFooter">
          <button
            disabled={DEMO_MODE || !lastKey}
            title={
              DEMO_MODE
                ? "Demo mode uses sample data"
                : !lastKey
                ? "No more results"
                : ""
            }
            onClick={() => loadIncidents(false)}
          >
            Load more
          </button>
        </div>
      </section>
    </div>
  );
}
