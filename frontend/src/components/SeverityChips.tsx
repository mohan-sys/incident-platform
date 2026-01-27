export function SeverityChips({
  bySeverity,
}: {
  bySeverity: Record<string, number> | undefined;
}) {
  const entries = Object.entries(bySeverity ?? {}).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ marginTop: 12, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
      <strong>By Severity</strong>
      <div style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
        {entries.length === 0 ? (
          <span>—</span>
        ) : (
          entries.map(([sev, count]) => (
            <span
              key={sev}
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #ddd",
                fontSize: 13,
              }}
            >
              {sev}: {count}
            </span>
          ))
        )}
      </div>
    </div>
  );
}