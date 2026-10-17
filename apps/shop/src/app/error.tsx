"use client";

export default function StoreError({ reset }: { reset: () => void }) {
  return (
    <main className="page page--narrow">
      <section className="empty-cart" role="alert">
        <p className="eyebrow eyebrow--slash">Error</p>
        <h1 className="page-title">Let’s replay that point.</h1>
        <p>Something went wrong loading this page. Please try again.</p>
        <button className="button button--dark" type="button" onClick={reset}>
          Try again
        </button>
      </section>
    </main>
  );
}
