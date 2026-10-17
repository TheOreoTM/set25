import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  EvaluationForm,
  SampleStatusForm,
} from "@/components/supply/sample-forms";
import { requireStaff } from "@/lib/auth/session";
import {
  addSampleEvaluationAction,
  changeSampleStatusAction,
} from "@/lib/supply/actions";
import { getSample } from "@/lib/supply/data";
import { formatDate, formatDateTime } from "@/lib/supply/presentation";
import { formatSampleNumber, sampleStatusLabels } from "@set25/shared";

const criteria = [
  "quality",
  "comfort",
  "fit",
  "protection",
  "durability",
  "branding",
  "value",
] as const;
export default async function SamplePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [staff, sample] = await Promise.all([requireStaff(), getSample(id)]);
  if (!sample) notFound();
  const averages = Object.fromEntries(
    criteria.map((criterion) => [
      criterion,
      sample.evaluations.length
        ? sample.evaluations.reduce(
            (sum, evaluation) => sum + evaluation[criterion],
            0,
          ) / sample.evaluations.length
        : 0,
    ]),
  );
  const overall = sample.evaluations.length
    ? Object.values(averages).reduce((sum, value) => sum + value, 0) /
      criteria.length
    : 0;
  const canWrite = staff.role !== "STAFF";
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Supply / Samples"
        title={`${formatSampleNumber(sample.sampleNumber)} · ${sample.name}`}
        description={`${sample.supplier.name} · recorded by ${sample.createdBy.name}`}
      />
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Sample</p>
            <h2>Product test</h2>
          </div>
          <span className={`status status--${sample.status.toLowerCase()}`}>
            {sampleStatusLabels[sample.status]}
          </span>
        </div>
        <dl className="detail-definition-grid">
          <div>
            <dt>Supplier</dt>
            <dd>{sample.supplier.name}</dd>
          </div>
          <div>
            <dt>Product</dt>
            <dd>{sample.product?.name ?? "Not linked"}</dd>
          </div>
          <div>
            <dt>Variant</dt>
            <dd>
              {sample.variant
                ? [sample.variant.color, sample.variant.size]
                    .filter(Boolean)
                    .join(" / ") || sample.variant.sku
                : "Not linked"}
            </dd>
          </div>
          <div>
            <dt>Cost</dt>
            <dd>
              {sample.sampleCost
                ? `${sample.currency} ${sample.sampleCost.toFixed(2)}`
                : "Not recorded"}
            </dd>
          </div>
          <div>
            <dt>Ordered</dt>
            <dd>{formatDate(sample.orderedAt)}</dd>
          </div>
          <div>
            <dt>Received</dt>
            <dd>{formatDate(sample.receivedAt)}</dd>
          </div>
        </dl>
        {sample.notes ? <p className="detail-copy">{sample.notes}</p> : null}
        {canWrite ? (
          <div className="embedded-editor">
            <SampleStatusForm
              action={changeSampleStatusAction.bind(null, id)}
              current={sample.status}
            />
          </div>
        ) : null}
      </section>
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Test Results</p>
            <h2>Evaluation averages</h2>
          </div>
          <strong className="sample-overall">{overall.toFixed(2)} / 5</strong>
        </div>
        {sample.evaluations.length ? (
          <div className="sample-average-grid">
            {criteria.map((criterion) => (
              <div key={criterion}>
                <span>{criterion[0].toUpperCase() + criterion.slice(1)}</span>
                <strong>{averages[criterion].toFixed(1)}</strong>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-empty">
            <p>No evaluations recorded yet.</p>
          </div>
        )}
      </section>
      <section className="detail-section">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Testers</p>
            <h2>Individual evaluations</h2>
          </div>
          <span>{sample.evaluations.length} recorded</span>
        </div>
        {sample.evaluations.length ? (
          <div className="evaluation-list">
            {sample.evaluations.map((evaluation) => (
              <article key={evaluation.id}>
                <header>
                  <div>
                    <strong>{evaluation.testerName}</strong>
                    <small>
                      {formatDateTime(evaluation.createdAt)} · entered by{" "}
                      {evaluation.recordedBy?.name ?? "Former staff"}
                    </small>
                  </div>
                  <strong>
                    {(
                      criteria.reduce(
                        (sum, criterion) => sum + evaluation[criterion],
                        0,
                      ) / criteria.length
                    ).toFixed(2)}
                  </strong>
                </header>
                <dl>
                  {criteria.map((criterion) => (
                    <div key={criterion}>
                      <dt>{criterion}</dt>
                      <dd>{evaluation[criterion]}</dd>
                    </div>
                  ))}
                </dl>
                {evaluation.notes ? <p>{evaluation.notes}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
        {canWrite ? (
          <div className="embedded-editor">
            <h3>Add evaluation</h3>
            <EvaluationForm action={addSampleEvaluationAction.bind(null, id)} />
          </div>
        ) : null}
      </section>
    </main>
  );
}
