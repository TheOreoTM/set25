import Link from "next/link";
import { Select } from "@/components/ui/select";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getSuppliers } from "@/lib/supply/data";

export const metadata = { title: "Suppliers" };

export default async function SuppliersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters = {
    search: typeof query.search === "string" ? query.search : "",
    active: typeof query.active === "string" ? query.active : "",
  };
  const [staff, suppliers] = await Promise.all([
    requireStaff(),
    getSuppliers(filters),
  ]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Suppliers"
        title="Suppliers"
        description="Contacts, product links, and practical buying terms."
      />
      <div className="resource-toolbar">
        <form className="filter-bar" action="/suppliers">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search suppliers</span>
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Search supplier or contact"
            />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <Select name="active" defaultValue={filters.active}>
              <option value="">All suppliers</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </label>
          <button
            className="button button--secondary filter-submit"
            type="submit"
          >
            <SlidersHorizontal aria-hidden="true" /> Apply
          </button>
        </form>
        {staff.role !== "STAFF" ? (
          <Link className="button button--dark" href="/suppliers/new">
            <Plus aria-hidden="true" /> New supplier
          </Link>
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Supply network</p>
            <h2>
              {suppliers.length}{" "}
              {suppliers.length === 1 ? "supplier" : "suppliers"}
            </h2>
          </div>
          <p>Active first</p>
        </div>
        {suppliers.length ? (
          <div className="supply-list">
            <div className="supply-row supply-row--supplier supply-row--head">
              <span>Supplier</span>
              <span>Contact</span>
              <span>Country</span>
              <span>Products</span>
              <span>POs</span>
              <span>Samples</span>
              <span>Status</span>
              <span />
            </div>
            {suppliers.map((supplier) => (
              <Link
                className="supply-row supply-row--supplier"
                href={`/suppliers/${supplier.id}`}
                key={supplier.id}
              >
                <span className="commerce-primary">
                  <strong>{supplier.name}</strong>
                  <small>
                    {supplier.email ?? supplier.phone ?? "No contact recorded"}
                  </small>
                </span>
                <span data-label="Contact">{supplier.contactName ?? "—"}</span>
                <span data-label="Country">{supplier.country ?? "—"}</span>
                <span data-label="Products">{supplier._count.products}</span>
                <span data-label="POs">{supplier._count.purchaseOrders}</span>
                <span data-label="Samples">{supplier._count.samples}</span>
                <span data-label="Status">
                  <span
                    className={`status status--${supplier.active ? "active" : "archived"}`}
                  >
                    {supplier.active ? "Active" : "Inactive"}
                  </span>
                </span>
                <span className="catalog-arrow">
                  <ArrowRight aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No suppliers match these filters.</p>
            {staff.role !== "STAFF" ? (
              <Link href="/suppliers/new">
                Add the first supplier <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}
