import { PageHeader } from "./page-header";

type PageSkeletonProps = {
  kind: "list" | "detail" | "form";
  eyebrow: string;
  /** Static titles render for real; record titles show a placeholder. */
  title?: string;
  description?: string;
  rows?: number;
};

/**
 * Route-level loading UI. It mirrors the page's hierarchy (header, toolbar,
 * then the list, record, or form) so a prefetched navigation paints the
 * destination's frame immediately and data streams into the same places.
 */
export function PageSkeleton({
  kind,
  eyebrow,
  title,
  description,
  rows = 6,
}: PageSkeletonProps) {
  return (
    <main className="page-wrap" aria-busy="true" aria-label="Loading">
      {title ? (
        <PageHeader eyebrow={eyebrow} title={title} description={description} />
      ) : (
        <header className="page-header">
          <div>
            <p className="breadcrumb">{eyebrow}</p>
            <div className="skeleton skeleton--title" />
            <div className="skeleton skeleton--copy" />
          </div>
        </header>
      )}
      <div aria-hidden="true">
        {kind === "list" ? <ListBody rows={rows} /> : null}
        {kind === "detail" ? <DetailBody /> : null}
        {kind === "form" ? <FormBody /> : null}
      </div>
    </main>
  );
}

function ListBody({ rows }: { rows: number }) {
  return (
    <>
      <div className="sk-toolbar">
        <div className="skeleton sk-search" />
        <div className="skeleton sk-control" />
        <div className="skeleton sk-action" />
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <div className="skeleton skeleton--kicker" />
            <div className="skeleton skeleton--section-title" />
          </div>
        </div>
        <div className="sk-rows">
          {Array.from({ length: rows }, (_, index) => (
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
    </>
  );
}

function DetailBody() {
  return (
    <>
      <div className="skeleton sk-identity" />
      <div className="sk-panels">
        <div className="skeleton sk-panel" />
        <div className="skeleton sk-panel" />
      </div>
    </>
  );
}

function FormBody() {
  return (
    <div className="sk-form">
      {Array.from({ length: 2 }, (_, section) => (
        <section className="sk-form-section" key={section}>
          <div>
            <div className="skeleton skeleton--kicker" />
            <div className="skeleton skeleton--section-title" />
          </div>
          <div className="sk-fields">
            {Array.from({ length: 4 }, (_, index) => (
              <div className="sk-field" key={index}>
                <div className="skeleton sk-label" />
                <div className="skeleton sk-input" />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
