import Link from "next/link";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { getCustomers } from "@/lib/commerce/data";
import { requireStaff } from "@/lib/auth/session";

export const metadata = { title: "Customers" };

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const [customers, staff] = await Promise.all([
    getCustomers(search),
    requireStaff(),
  ]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="People / Customers"
        title="Customers"
        description="People behind direct, social, preorder, and team sales."
      />
      {params.forbidden === "write" ? (
        <div className="form-message form-message--error" role="alert">
          Staff access to Customers is read-only.
        </div>
      ) : null}
      <div className="resource-toolbar">
        <form className="filter-bar filter-bar--search-only">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search customers</span>
            <input
              name="search"
              defaultValue={search}
              placeholder="Search name, phone, or email"
            />
          </label>
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
        {staff.role !== "STAFF" ? (
          <Link className="button button--dark" href="/customers/new">
            <Plus aria-hidden="true" /> New customer
          </Link>
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Directory</p>
            <h2>
              {customers.length}{" "}
              {customers.length === 1 ? "customer" : "customers"}
            </h2>
          </div>
          <p>Searchable contact records</p>
        </div>
        {customers.length ? (
          <div className="commerce-list commerce-list--customers">
            <div className="commerce-row commerce-row--head">
              <span>Customer</span>
              <span>Phone</span>
              <span>Email</span>
              <span className="num">Orders</span>
              <span />
            </div>
            {customers.map((customer) => (
              <Link
                className="commerce-row"
                href={`/customers/${customer.id}`}
                key={customer.id}
              >
                <span className="commerce-primary">
                  <strong>{customer.name}</strong>
                  <small>
                    {customer.instagramHandle
                      ? `@${customer.instagramHandle}`
                      : "No Instagram handle"}
                  </small>
                </span>
                <span data-label="Phone">{customer.phone}</span>
                <span
                  data-label="Email"
                  className={customer.email ? undefined : "is-empty"}
                >
                  {customer.email ?? "—"}
                </span>
                <span data-label="Orders" className="num">
                  <strong>{customer._count.orders}</strong>
                </span>
                <span className="catalog-arrow">
                  <ArrowRight aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            {search ? (
              <>
                <p>
                  {search
                    ? `No customers match "${search}".`
                    : "No customers match these filters."}
                </p>
                <Link href="/customers">
                  Clear search <ArrowRight aria-hidden="true" />
                </Link>
              </>
            ) : (
              <>
                <p>No customers yet.</p>
                {staff.role !== "STAFF" ? (
                  <Link href="/customers/new">
                    Add the first customer <ArrowRight aria-hidden="true" />
                  </Link>
                ) : null}
              </>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
