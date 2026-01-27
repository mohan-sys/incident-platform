import type { Incident } from "../lib/types";

export function IncidentsTable({
  items,
  demoMode,
  onAck,
  onResolve,
  busyId,
}: {
  items: Incident[];
  demoMode: boolean;
  onAck: (id: string) => void;
  onResolve: (id: string) => void;
  busyId: string | null;
}) {
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
            <Th className="actionsCol">Actions</Th>
          </tr>
        </thead>

        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={8} className="emptyCell">
                No incidents
              </td>
            </tr>
          ) : (
            items.map((it) => {
              const canAck = !it.acknowledgedAt;
              const canResolve = it.status === "OPEN";
              const busy = busyId === it.incidentId;

              return (
                <tr key={it.incidentId}>
                  <Td>{new Date(it.createdAt).toLocaleString()}</Td>
                  <Td>{it.service}</Td>
                  <Td>{it.severity}</Td>
                  <Td>{it.status}</Td>
                  <Td>{it.summary}</Td>
                  <Td>{it.acknowledgedAt ? "✅" : "—"}</Td>
                  <Td>{it.resolvedAt ? "✅" : "—"}</Td>

                  <Td className="actionsCol">
                    <div className="rowActions">
                      <button
                        className="rowActionBtn"
                        disabled={demoMode || busy || !canAck}
                        title={
                          demoMode
                            ? "Demo mode: backend paused"
                            : !canAck
                            ? "Already acknowledged"
                            : ""
                        }
                        onClick={() => onAck(it.incidentId)}
                      >
                        ACK
                      </button>

                      <button
                        className="rowActionBtn"
                        disabled={demoMode || busy || !canResolve}
                        title={
                          demoMode
                            ? "Demo mode: backend paused"
                            : !canResolve
                            ? "Already resolved"
                            : ""
                        }
                        onClick={() => onResolve(it.incidentId)}
                      >
                        RESOLVE
                      </button>
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children, className }: { children: any; className?: string }) {
  const classes = ["incidentsTh", className].filter(Boolean).join(" ");
  return (
    <th
      className={classes}
      style={{
        textAlign: "left",
      }}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: any; className?: string }) {
  const classes = ["incidentsTd", className].filter(Boolean).join(" ");
  return (
    <td className={classes}>
      {children}
    </td>
  );
}
