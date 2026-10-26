import Link from "next/link";
import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  MONEY_CATEGORIES,
  formatMVR,
  formatMoney,
  moneyCategoryLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getMoneyReport } from "@/lib/money/data";
import { formatDate } from "@/lib/supply/presentation";

export const instant = false;

export const metadata = { title: "Money" };

type SearchParams = {
  preset?: string;
  from?: string;
  to?: string;
  direction?: string;
  category?: string;
  search?: string;
  recorded?: string;
  forbidden?: string;
};

export default async function MoneyPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [staff, query] = await Promise.all([requireStaff(), searchParams]);
  const report = await getMoneyReport(query);
  const canWrite = staff.role !== "STAFF";
  const { summary } = report;

  return (
    <main className="page-wrap money-page">
      <PageHeader
        eyebrow="Company / Money"
        title="Money"
        description="Recorded cash movement and operational profitability—not a bank balance or formal accounting statement."
      />
      <div className="detail-actions detail-actions--end money-page-actions">
        {canWrite ? (
          <div>
            <Link
              className="button button--secondary"
              href="/money/new?direction=IN"
            >
              <ArrowDownLeft aria-hidden="true" /> Record Money In
            </Link>
            <Link
              className="button button--dark"
              href="/money/new?direction=OUT"
            >
              <ArrowUpRight aria-hidden="true" /> Record Money Out
            </Link>
          </div>
        ) : null}
      </div>

      {query.recorded === "1" ? (
        <div className="form-message form-message--success" role="status">
          Money entry recorded. Historical entries are append-only.
        </div>
      ) : null}
      {query.forbidden === "write" ? (
        <div className="form-message form-message--error" role="alert">
          Staff access to Money is read-only.
        </div>
      ) : null}

      <DateRangeBar query={query} range={report.range} />

      <section className="money-summary-strip" aria-label="Money summary">
        <MoneyMetric
          label="Money In"
          value={formatMVR(summary.moneyIn)}
          note="Order payments less refunds, plus manual income"
        />
        <MoneyMetric
          label="Money Out"
          value={formatMVR(summary.moneyOut)}
          note="Recorded payments and expenses"
        />
        <MoneyMetric
          label="Sales Profit"
          value={
            summary.salesProfit ? formatMVR(summary.salesProfit) : "Incomplete"
          }
          note={
            summary.missingCostLines
              ? `${summary.missingCostLines} sold ${summary.missingCostLines === 1 ? "line is" : "lines are"} missing cost data`
              : "Completed sales less historical item cost"
          }
        />
        <MoneyMetric
          label="Net Cash Recorded"
          value={formatMVR(summary.netCashRecorded)}
          note="Money In less Money Out—not a bank balance"
        />
      </section>

      <section className="detail-section profitability-panel">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Profitability</p>
            <h2>Operational profit view</h2>
          </div>
          <span>
            {report.range.from} → {report.range.to}
          </span>
        </div>
        <div className="profitability-grid">
          <ProfitFact
            label="Sales Revenue"
            value={formatMVR(summary.salesRevenue)}
          />
          <ProfitFact
            label="Cost of Items Sold"
            value={formatMVR(summary.costOfItemsSold)}
            note={
              summary.missingCostUnits
                ? `${summary.missingCostUnits} sold ${summary.missingCostUnits === 1 ? "item" : "items"} missing historical cost`
                : "Historical OrderLine Cost Each"
            }
          />
          <ProfitFact
            label="Sales Profit"
            value={
              summary.salesProfit
                ? formatMVR(summary.salesProfit)
                : "Unavailable"
            }
            emphasized
          />
          <ProfitFact
            label="Operating Expenses"
            value={formatMVR(summary.operatingExpenses)}
            note="Packaging, marketing, delivery, software, and Other"
          />
          <ProfitFact
            label="Operating Profit"
            value={
              summary.operatingProfit
                ? formatMVR(summary.operatingProfit)
                : "Unavailable"
            }
            note="Excludes inventory acquisition and equipment payments"
            emphasized
          />
        </div>
        {summary.missingCostLines ? (
          <p className="profit-warning">
            Profit is unavailable because missing historical costs would
            overstate it. Sales Revenue remains complete.
          </p>
        ) : null}
      </section>

      <section className="detail-section money-activity-panel">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Money History</p>
            <h2>Recorded activity</h2>
          </div>
          <span>
            {report.activity.length}{" "}
            {report.activity.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        <MoneyFilters query={query} />
        {report.activity.length ? (
          <div className="money-activity-list">
            <div className="money-activity-row money-activity-head">
              <span>Date</span>
              <span>Type / Description</span>
              <span>Related</span>
              <span>Money In</span>
              <span>Money Out</span>
              <span>Recorded By</span>
            </div>
            {report.activity.map((item) => (
              <article className="money-activity-row" key={item.id}>
                <span data-label="Date">{formatDate(new Date(item.date))}</span>
                <span className="money-activity-copy">
                  <strong>{item.type}</strong>
                  <small>{item.description}</small>
                  {item.reference ? <small>Ref: {item.reference}</small> : null}
                </span>
                <span data-label="Related">
                  {item.relatedHref && item.related ? (
                    <Link className="text-link" href={item.relatedHref}>
                      {item.related}
                    </Link>
                  ) : (
                    (item.related ?? "—")
                  )}
                </span>
                <span data-label="Money In" className="money-in-value">
                  {item.inAmount ? (
                    <>
                      {formatSignedMVR(item.inAmount)}
                      <OriginalAmount original={item.original} />
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <span data-label="Money Out" className="money-out-value">
                  {item.outAmount ? (
                    <>
                      {formatMVR(item.outAmount)}
                      <OriginalAmount original={item.original} />
                    </>
                  ) : (
                    "—"
                  )}
                </span>
                <span data-label="Recorded By">{item.recordedBy}</span>
              </article>
            ))}
          </div>
        ) : (
          <div className="inline-empty inline-empty--panel">
            <p>No recorded activity in this view.</p>
            <span>
              Change the period or filters to review other cash movements.
            </span>
          </div>
        )}
      </section>
    </main>
  );
}

function DateRangeBar({
  query,
  range,
}: {
  query: SearchParams;
  range: { preset: string; from: string; to: string };
}) {
  const presets = [
    ["this-month", "This Month"],
    ["last-month", "Last Month"],
    ["this-year", "This Year"],
  ];
  return (
    <div className="money-range-bar">
      <nav aria-label="Money date range">
        {presets.map(([value, label]) => (
          <Link
            className={range.preset === value ? "is-active" : ""}
            href={`/money?preset=${value}`}
            key={value}
          >
            {label}
          </Link>
        ))}
      </nav>
      <form action="/money" className="money-custom-range">
        <input type="hidden" name="preset" value="custom" />
        <label>
          <span>From</span>
          <DatePicker
            key={`from-${range.from}-${range.to}`}
            name="from"
            defaultValue={query.from ?? range.from}
            required
            compact
          />
        </label>
        <label>
          <span>To</span>
          <DatePicker
            key={`to-${range.from}-${range.to}`}
            name="to"
            defaultValue={query.to ?? range.to}
            required
            compact
          />
        </label>
        <button className="button button--secondary" type="submit">
          Apply
        </button>
      </form>
    </div>
  );
}

function MoneyFilters({ query }: { query: SearchParams }) {
  return (
    <form action="/money" className="money-filter-bar">
      <input type="hidden" name="preset" value={query.preset ?? "this-month"} />
      {query.preset === "custom" ? (
        <>
          <input type="hidden" name="from" value={query.from} />
          <input type="hidden" name="to" value={query.to} />
        </>
      ) : null}
      <label className="search-field">
        <Search aria-hidden="true" />
        <span className="sr-only">Search money history</span>
        <input
          name="search"
          defaultValue={query.search ?? ""}
          placeholder="Search description or reference"
        />
      </label>
      <label className="field">
        <span className="sr-only">Direction</span>
        <Select name="direction" defaultValue={query.direction ?? ""}>
          <option value="">All directions</option>
          <option value="IN">Money In</option>
          <option value="OUT">Money Out</option>
        </Select>
      </label>
      <label className="field">
        <span className="sr-only">Category</span>
        <Select name="category" defaultValue={query.category ?? ""}>
          <option value="">All categories</option>
          <option value="ORDER_PAYMENT">Order Payments / Refunds</option>
          {MONEY_CATEGORIES.map((category) => (
            <option value={category} key={category}>
              {moneyCategoryLabels[category]}
            </option>
          ))}
        </Select>
      </label>
      <button className="button button--secondary" type="submit">
        <SlidersHorizontal aria-hidden="true" /> Apply
      </button>
    </form>
  );
}

function MoneyMetric({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <article>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </article>
  );
}

function ProfitFact({
  label,
  value,
  note,
  emphasized = false,
}: {
  label: string;
  value: string;
  note?: string;
  emphasized?: boolean;
}) {
  return (
    <div className={emphasized ? "is-emphasized" : ""}>
      <span>{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

// Foreign-currency entries show MVR (what totals use) with a small currency
// marker; hovering, focusing, or tapping it reveals the original amount.
function OriginalAmount({
  original,
}: {
  original: { currency: string; amount: string; rate: string } | null;
}) {
  if (!original) return null;
  return (
    <span className="money-original" tabIndex={0}>
      <span aria-hidden="true">{original.currency}</span>
      <span className="money-original-tip" role="tooltip">
        Paid {formatMoney(original.amount, original.currency)} at{" "}
        {original.rate} MVR per {original.currency}
      </span>
    </span>
  );
}

function formatSignedMVR(value: string) {
  return value.startsWith("-")
    ? `− ${formatMVR(value.slice(1))}`
    : formatMVR(value);
}
