import { PageHeader } from "@/components/page-header";

export default function Loading() {
  return (
    <main
      className="page-wrap waitlist-page"
      aria-busy="true"
      aria-label="Loading"
    >
      <PageHeader
        eyebrow="Pre-launch / Waitlist"
        title="Waitlist"
        description="People waiting for the first drop. Contact stays in Instagram and TikTok DMs."
      />
      <div aria-hidden="true">
        <div className="resource-toolbar resource-toolbar--loading">
          <div className="filter-bar filter-bar--search-only">
            <div className="skeleton skeleton--filter skeleton--search" />
            <div className="skeleton skeleton--filter skeleton--apply" />
          </div>
        </div>
        <div className="sk-tabs">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="skeleton sk-tab" key={index} />
          ))}
        </div>
        {/* Quick add is write-only; read-only staff never see it. */}
        <div className="skeleton sk-quick-add sk-write-only" />
        <section className="resource-panel">
          <div className="resource-panel-head">
            <div>
              <div className="skeleton skeleton--kicker" />
              <div className="skeleton skeleton--section-title" />
            </div>
          </div>
          <div className="sk-rows">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="sk-row" key={index}>
                <div>
                  <div className="skeleton skeleton--row-title" />
                  <div className="skeleton skeleton--row-copy" />
                </div>
                <div className="skeleton sk-pill" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
