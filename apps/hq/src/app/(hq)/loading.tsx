export default function Loading() {
  return (
    <main className="page-wrap" aria-busy="true" aria-label="Loading dashboard">
      <div className="skeleton skeleton--eyebrow" />
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--copy" />
      <div className="skeleton-metrics">
        {Array.from({ length: 4 }, (_, index) => (
          <div className="skeleton skeleton--metric" key={index} />
        ))}
      </div>
      <div className="skeleton-panels">
        <div className="skeleton skeleton--panel" />
        <div className="skeleton skeleton--panel" />
      </div>
    </main>
  );
}
