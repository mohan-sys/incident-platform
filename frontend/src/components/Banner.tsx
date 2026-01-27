export function Banner({ demoMode }: { demoMode: boolean }) {
  if (!demoMode) return null;

  return (
    <div
      style={{
        marginTop: 12,
        padding: 12,
        borderRadius: 10,
        border: "1px solid #f0d8a8",
        background: "#fff7e6",
      }}
    >
      Live AWS backend is currently disabled to reduce costs. This dashboard is
      running with sample data. Contact me to enable a full live demo.
    </div>
  );
}