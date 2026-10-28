import { PageHeader } from "@/components/page-header";

export default function Loading() {
  return (
    <main className="page-wrap today-page" aria-busy="true" aria-label="Loading">
      <PageHeader eyebrow="Pre-launch / Today" title="Today" />
      <div aria-hidden="true">
        <div className="skeleton sk-waitlist-hero" />
        <div className="skeleton-metrics">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="skeleton skeleton--metric" key={index} />
          ))}
        </div>
        <div className="skeleton-panels">
          <div className="skeleton skeleton--panel" />
          <div className="skeleton skeleton--panel" />
        </div>
      </div>
    </main>
  );
}
