export function ProductListSkeleton() {
  return (
    <div className="catalog-loading" aria-busy="true" aria-label="Loading products">
      <div className="resource-toolbar resource-toolbar--loading" aria-hidden="true">
        <div className="filter-bar">
          <div className="skeleton skeleton--filter skeleton--search" />
          <div className="skeleton skeleton--filter" />
          <div className="skeleton skeleton--filter" />
          <div className="skeleton skeleton--filter skeleton--apply" />
        </div>
        <div className="skeleton skeleton--new-product" />
      </div>

      <section className="resource-panel" aria-hidden="true">
        <div className="resource-panel-head catalog-loading__head">
          <div>
            <div className="skeleton skeleton--kicker" />
            <div className="skeleton skeleton--section-title" />
          </div>
        </div>
        <div className="catalog-loading__rows">
          {Array.from({ length: 4 }, (_, index) => (
            <div className="catalog-loading__row" key={index}>
              <div>
                <div className="skeleton skeleton--row-title" />
                <div className="skeleton skeleton--row-copy" />
              </div>
              <div className="skeleton skeleton--row-value" />
              <div className="skeleton skeleton--row-value" />
              <div className="skeleton skeleton--row-value" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
