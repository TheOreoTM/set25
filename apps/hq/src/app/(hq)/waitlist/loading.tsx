import { PageHeader } from "@/components/page-header";

export default function Loading() {
  return (
    <main className="page-wrap waitlist-page" aria-busy="true" aria-label="Loading">
      <PageHeader
        eyebrow="Pre-launch / Waitlist"
        title="Waitlist"
        description="People waiting for the first drop. Contact stays on Instagram."
      />
      <div aria-hidden="true">
        <div className="skeleton sk-quick-add" />
        <div className="sk-toolbar">
          <div className="skeleton sk-search" />
          <div className="skeleton sk-action" />
        </div>
        <div className="sk-tabs">
          {Array.from({ length: 6 }, (_, index) => (
            <div className="skeleton sk-tab" key={index} />
          ))}
        </div>
        <section className="resource-panel">
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
