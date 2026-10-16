export default function OrdersLoading() {
  return (
    <main className="page-wrap">
      <div className="catalog-loading" aria-label="Loading orders">
        <div className="skeleton skeleton--short" />
        <div className="skeleton skeleton--title" />
        <div className="catalog-loading__head">
          <div className="skeleton" />
        </div>
        {Array.from({ length: 5 }, (_, index) => (
          <div className="catalog-loading__row" key={index}>
            <span />
            <span />
            <span />
            <span />
          </div>
        ))}
      </div>
    </main>
  );
}
