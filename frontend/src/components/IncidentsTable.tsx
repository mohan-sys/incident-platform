import type { Incident } from "../lib/types";

export function IncidentsTable({ items }: { items: Incident[] }) {
  return (
    <div style={{ overflowX: "auto", marginTop: 10 }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <Th>Created</Th>
            <Th>Service</Th>
            <Th>Severity</Th>
            <Th>Status</Th>
            <Th>Summary</Th>
            <Th>Ack</Th>
            <Th>Resolved</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ padding: 12, borderTop: "1px solid #eee" }}>
                No incidents
              </td>
            </tr>
          ) : (
            items.map((it) => (
              <tr key={it.incidentId}>
                <Td>{new Date(it.createdAt).toLocaleString()}</Td>
                <Td>{it.service}</Td>
                <Td>{it.severity}</Td>
                <Td>{it.status}</Td>
                <Td>{it.summary}</Td>
                <Td>{it.acknowledgedAt ? "✅" : "—"}</Td>
                <Td>{it.resolvedAt ? "✅" : "—"}</Td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children: any }) {
  return (
    <th
      style={{
        textAlign: "left",
        padding: 10,
        borderBottom: "1px solid #eee",
        fontSize: 12,
        color: "#666",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children }: { children: any }) {
  return <td style={{ padding: 10, borderTop: "1px solid #eee" }}>{children}</td>;
}