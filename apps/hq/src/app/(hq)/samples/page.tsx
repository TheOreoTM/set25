import Link from "next/link";
import { Select } from "@/components/ui/select";
import { ArrowRight, Plus, Search, SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getSamples } from "@/lib/supply/data";
import {
  SAMPLE_STATUSES,
  formatSampleNumber,
  sampleStatusLabels,
} from "@set25/shared";
import { formatDate } from "@/lib/supply/presentation";

export const instant = false;

export const metadata = { title: "Samples" };
export default async function SamplesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const filters = {
    search: typeof query.search === "string" ? query.search : "",
    status: typeof query.status === "string" ? query.status : "",
  };
  const [staff, samples] = await Promise.all([
    requireStaff(),
    getSamples(filters),
  ]);
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Samples"
        title="Samples"
        description="Supplier samples, tester feedback, and product decisions."
      />
      <div className="resource-toolbar">
        <form className="filter-bar" action="/samples">
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search samples</span>
            <input
              name="search"
              defaultValue={filters.search}
              placeholder="Sample, supplier, or product"
            />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <Select name="status" defaultValue={filters.status}>
              <option value="">All statuses</option>
              {SAMPLE_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {sampleStatusLabels[status]}
                </option>
              ))}
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
          <Link className="button button--dark" href="/samples/new">
            <Plus aria-hidden="true" /> New sample
          </Link>
        ) : null}
      </div>
      <section className="resource-panel">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Product testing</p>
            <h2>
              {samples.length} {samples.length === 1 ? "sample" : "samples"}
            </h2>
          </div>
        </div>
        {samples.length ? (
          <div className="supply-list">
            <div className="supply-row supply-row--sample supply-row--head">
              <span>Sample</span>
              <span>Supplier</span>
              <span>Product</span>
              <span>Status</span>
              <span>Evaluations</span>
              <span>Received</span>
              <span />
            </div>
            {samples.map((sample) => (
              <Link
                className="supply-row supply-row--sample"
                href={`/samples/${sample.id}`}
                key={sample.id}
              >
                <span className="commerce-primary">
                  <strong>{formatSampleNumber(sample.sampleNumber)}</strong>
                  <small>{sample.name}</small>
                </span>
                <span data-label="Supplier">{sample.supplier.name}</span>
                <span data-label="Product">
                  {sample.product?.name ?? "Not linked"}
                </span>
                <span data-label="Status">
                  <span
                    className={`status status--${sample.status.toLowerCase()}`}
                  >
                    {sampleStatusLabels[sample.status]}
                  </span>
                </span>
                <span data-label="Evaluations">
                  {sample._count.evaluations}
                </span>
                <span data-label="Received">
                  {formatDate(sample.receivedAt)}
                </span>
                <span className="catalog-arrow">
                  <ArrowRight aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No samples match these filters.</p>
          </div>
        )}
      </section>
    </main>
  );
}
