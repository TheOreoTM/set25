import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page page--narrow">
      <section className="empty-cart">
        <p className="eyebrow eyebrow--slash">404</p>
        <h1 className="page-title">Out of bounds.</h1>
        <p>This page does not exist or is no longer available.</p>
        <Link className="button button--dark" href="/shop">
          Back to the shop
        </Link>
      </section>
    </main>
  );
}
