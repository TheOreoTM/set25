import Link from "next/link";
import { ArrowRight, Edit3, Mail, Phone, User } from "lucide-react";
import { notFound } from "next/navigation";
import {
  formatMVR,
  formatOrderNumber,
  fulfilmentStatusLabels,
  teamTypeLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getTeam } from "@/lib/commerce/data";
import { requireStaff } from "@/lib/auth/session";
import { paymentSummary } from "@/lib/commerce/money";

export const instant = false;

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [team, staff] = await Promise.all([getTeam(id), requireStaff()]);
  if (!team) notFound();
  const total = team.orders
    .filter((order) => order.fulfilmentStatus !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.total.toString()), 0);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Commerce / Teams"
        title={team.name}
        description={`${teamTypeLabels[team.type]} account and connected orders.`}
      />
      <div className="detail-actions">
        {staff.role !== "STAFF" ? (
          <Link className="button button--dark" href={`/teams/${id}/edit`}>
            <Edit3 aria-hidden="true" /> Edit team
          </Link>
        ) : null}
      </div>
      <section className="identity-grid">
        <div className="identity-lead">
          <p className="kicker">{teamTypeLabels[team.type]}</p>
          <h2>{team.name}</h2>
          <div className="contact-links">
            {team.contactName ? (
              <span>
                <User aria-hidden="true" /> {team.contactName}
              </span>
            ) : null}
            {team.phone ? (
              <a href={`tel:${team.phone}`}>
                <Phone aria-hidden="true" /> {team.phone}
              </a>
            ) : null}
            {team.email ? (
              <a href={`mailto:${team.email}`}>
                <Mail aria-hidden="true" /> {team.email}
              </a>
            ) : null}
          </div>
        </div>
        <dl className="identity-stats">
          <div>
            <dt>Total orders</dt>
            <dd>{team.orders.length}</dd>
          </div>
          <div>
            <dt>Value ordered</dt>
            <dd>{formatMVR(total)}</dd>
          </div>
        </dl>
      </section>
      {team.notes ? (
        <section className="detail-section compact-section">
          <div className="section-heading">
            <div>
              <p className="kicker">Context</p>
              <h2>Notes</h2>
            </div>
          </div>
          <p className="detail-copy">{team.notes}</p>
        </section>
      ) : null}
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Commerce</p>
            <h2>Team orders</h2>
          </div>
          <p>{team.orders.length} total</p>
        </div>
        {team.orders.length ? (
          <div className="commerce-list commerce-list--orders-mini">
            {team.orders.map((order) => {
              const payment = paymentSummary(order.total, order.payments);
              return (
                <Link
                  className="commerce-row"
                  href={`/orders/${order.id}`}
                  key={order.id}
                >
                  <span className="commerce-primary">
                    <strong>{formatOrderNumber(order.orderNumber)}</strong>
                    <small>
                      {order.customer?.name ?? "No customer contact"}
                    </small>
                  </span>
                  <span data-label="Total">{formatMVR(order.total)}</span>
                  <span
                    data-label="Payment"
                    className={`status status--${payment.status.toLowerCase()}`}
                  >
                    {payment.status === "PART_PAID"
                      ? "Part Paid"
                      : payment.status === "UNPAID"
                        ? "Unpaid"
                        : payment.status === "REFUNDED"
                          ? "Refunded"
                          : "Paid"}
                  </span>
                  <span
                    data-label="Fulfilment"
                    className={`status status--${order.fulfilmentStatus.toLowerCase()}`}
                  >
                    {fulfilmentStatusLabels[order.fulfilmentStatus]}
                  </span>
                  <span className="catalog-arrow">
                    <ArrowRight aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No orders recorded for this team.</p>
          </div>
        )}
      </section>
    </main>
  );
}
