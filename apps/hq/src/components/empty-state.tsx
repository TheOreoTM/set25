import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export function EmptyState({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: string;
  description: string;
}) {
  return (
    <section className="empty-state">
      <div className="empty-state-mark">
        <SearchX aria-hidden="true" />
      </div>
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button button--dark" href="/">
        <ArrowLeft aria-hidden="true" /> Back to dashboard
      </Link>
    </section>
  );
}
