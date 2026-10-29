import Link from "next/link";
import { ArrowLeft, ArrowRight, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import {
  formatMVR,
  formatOrderNumber,
  fulfilmentStatusLabels,
  paymentStatusLabels,
  teamTypeLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { getTeam } from "@/lib/commerce/data";
import { requireStaff } from "@/lib/auth/session";
import { paymentSummary } from "@/lib/commerce/money";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const [team, staff] = await Promise.all([getTeam(id), requireStaff()]);
  if (!team) notFound();
  const total = team.orders
    .filter((order) => order.fulfilmentStatus !== "CANCELLED")
    .reduce((sum, order) => sum + Number(order.total.toString()), 0);
  return (
    <main className="page-wrap supply-detail-page">
      <PageHeader
        eyebrow="People / Teams"
        title={team.name}
        description={[teamTypeLabels[team.type], team.contactName]
          .filter(Boolean)
          .join(" · ")}
      />
      <div className="detail-actions">
        <Link className="text-link back-link" href="/teams">
          <ArrowLeft aria-hidden="true" /> All teams
        </Link>
        {staff.role !== "STAFF" ? (
          <div>
            <Link
              className="button button--secondary"
              href={`/teams/${id}/edit`}
            >
              <Pencil aria-hidden="true" /> Edit team
            </Link>
          </div>
        ) : null}
      </div>
      {query.created || query.saved ? (
        <div className="form-message form-message--success" role="status">
          Team {query.created ? "created" : "saved"}.
        </div>
      ) : null}
      <section className="supply-summary-strip" aria-label="Team summary">
        <div>
          <span>Orders</span>
          <strong>{team.orders.length}</strong>
        </div>
        <div>
          <span>Value Ordered</span>
          <strong>{formatMVR(total)}</strong>
        </div>
        <div>
          <span>Contact</span>
          <strong>{team.contactName ?? "—"}</strong>
        </div>
        <div>
          <span>Phone</span>
          <strong>
            {team.phone ? (
              <a href={`tel:${team.phone.replace(/\s/g, "")}`}>{team.phone}</a>
            ) : (
              "—"
            )}
          </strong>
        </div>
        <div>
          <span>Email</span>
          <strong>
            {team.email ? (
              <a href={`mailto:${team.email}`}>{team.email}</a>
            ) : (
              "—"
            )}
          </strong>
        </div>
      </section>
      {team.notes ? (
        <section className="detail-section">
          <div className="detail-section-head">
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
            <div className="commerce-row commerce-row--head">
              <span>Order</span>
              <span>Total</span>
              <span>Payment</span>
              <span>Fulfilment</span>
              <span />
            </div>
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
                  <span data-label="Payment">
                    <span
                      className={`status status--${payment.status.toLowerCase()}`}
                    >
                      {paymentStatusLabels[payment.status]}
                    </span>
                  </span>
                  <span data-label="Fulfilment" className="row-status">
                    <span
                      className={`status status--${order.fulfilmentStatus.toLowerCase()}`}
                    >
                      {fulfilmentStatusLabels[order.fulfilmentStatus]}
                    </span>
                  </span>
                  <span className="catalog-arrow">
                    <ArrowRight aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty inline-empty--compact">
            <p>No orders recorded for this team.</p>
          </div>
        )}
      </section>
      <FileAttachmentsPanel
        staff={staff}
        target={{ type: "TEAM", id: id }}
        targetLabel={team.name}
      />
    </main>
  );
}
