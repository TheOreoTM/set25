export default function Loading() {
  return (
    <main className="page-wrap today-page" aria-busy="true" aria-label="Loading">
      {/* PageHeader's markup, with a placeholder where the date streams in. */}
      <header className="page-header">
        <div>
          <p className="breadcrumb">Pre-launch / Today</p>
          <div className="page-title-row">
            <h1>Today</h1>
          </div>
          <div className="skeleton skeleton--copy" aria-hidden="true" />
        </div>
      </header>
      <div aria-hidden="true">
        <div className="skeleton sk-waitlist-hero" />
        <div className="skeleton-metrics">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="skeleton skeleton--metric" key={index} />
          ))}
        </div>
        <div className="skeleton-panels">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="skeleton skeleton--panel" key={index} />
          ))}
        </div>
      </div>
    </main>
  );
}
