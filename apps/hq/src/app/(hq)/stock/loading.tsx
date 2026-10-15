export default function LoadingStock() {
  return (
    <main className="page-wrap" aria-busy="true">
      <div className="skeleton skeleton--eyebrow" />
      <div className="skeleton skeleton--title" />
      <div className="skeleton skeleton--copy" />
      <div className="skeleton skeleton--catalog" />
    </main>
  );
}
