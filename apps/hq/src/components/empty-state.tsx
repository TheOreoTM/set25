import Link from "next/link";
import { ArrowLeft, Construction } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="empty-state">
      <div className="empty-state-mark">
        <Construction aria-hidden="true" />
      </div>
      <p className="kicker">Milestone 1 / Foundation</p>
      <h2>{title} is planned.</h2>
      <p>{description}</p>
      <Link className="button button--dark" href="/">
        <ArrowLeft aria-hidden="true" /> Back to dashboard
      </Link>
    </section>
  );
}
