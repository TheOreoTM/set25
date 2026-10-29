import { PageHeader } from "@/components/page-header";

export default function Loading() {
  return (
    <main className="page-wrap" aria-busy="true" aria-label="Loading">
      <PageHeader
        eyebrow="HQ / Account"
        title="Account"
        description="Your current SET25 staff identity and access level."
      />
      <section className="resource-panel" aria-hidden="true">
        <div className="resource-panel-head">
          <div>
            <div className="skeleton skeleton--kicker" />
            <div className="skeleton skeleton--section-title" />
          </div>
        </div>
        <div className="account-facts">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index}>
              <div className="skeleton skeleton--kicker" />
              <div className="skeleton skeleton--row-title" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
