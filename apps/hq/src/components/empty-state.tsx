import Link from "next/link";
import { ArrowLeft, SearchX, type LucideIcon } from "lucide-react";

export function EmptyState({
  kicker,
  title,
  description,
  action,
  icon: Icon = SearchX,
}: {
  kicker: string;
  title: string;
  description: string;
  /** The single next step. Defaults to a link back to the dashboard. */
  action?: { href: string; label: string };
  icon?: LucideIcon;
}) {
  return (
    <section className="empty-state">
      <div className="empty-state-mark">
        <Icon aria-hidden="true" />
      </div>
      <p className="kicker">{kicker}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {action ? (
        <Link className="button button--dark" href={action.href}>
          {action.label}
        </Link>
      ) : (
        <Link className="button button--dark" href="/">
          <ArrowLeft aria-hidden="true" /> Back to dashboard
        </Link>
      )}
    </section>
  );
}
