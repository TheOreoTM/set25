import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  EvaluationEditor,
  SampleDecisionActions,
} from "@/components/supply/sample-forms";
import { requireStaff } from "@/lib/auth/session";
import {
  addSampleEvaluationAction,
  changeSampleStatusAction,
} from "@/lib/supply/actions";
import { getSample } from "@/lib/supply/data";
import { formatDate, formatDateTime } from "@/lib/supply/presentation";
import { formatSampleNumber, sampleStatusLabels } from "@set25/shared";
import { FileAttachmentsPanel } from "@/components/files/file-attachments-panel";

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
  const evaluationAction = addSampleEvaluationAction.bind(null, id);

  return (
    <main className="page-wrap supply-detail-page sample-detail-page">
      <PageHeader
        eyebrow="Supply / Samples"
        title={`${formatSampleNumber(sample.sampleNumber)} · ${sample.name}`}
        titleMeta={
          <span className={`status status--${sample.status.toLowerCase()}`}>
            {sampleStatusLabels[sample.status]}
          </span>
        }
        description={sample.supplier.name}
      />
      <div className="detail-actions sample-page-actions">
        <Link className="text-link back-link" href="/samples">
          <ArrowLeft aria-hidden="true" /> All samples
        </Link>
        {canWrite ? (
          <div>
            <EvaluationEditor action={evaluationAction} />
            <SampleDecisionActions
              action={changeSampleStatusAction.bind(null, id)}
              current={sample.status}
            />
          </div>
        ) : null}
      </div>

      <section className="supply-summary-strip" aria-label="Sample summary">
        <SummaryFact
          label="Product"
          value={sample.product?.name ?? "Not linked"}
        />
        <SummaryFact
          label="Variant"
          value={
            sample.variant
              ? [sample.variant.color, sample.variant.size]
                  .filter(Boolean)
                  .join(" / ") || sample.variant.sku
              : "Not linked"
          }
        />
        <SummaryFact label="Supplier" value={sample.supplier.name} />
        <SummaryFact
          label="Sample Cost"
          value={
            sample.sampleCost
              ? `${sample.currency} ${sample.sampleCost.toFixed(2)}`
              : "Not recorded"
          }
        />
        <SummaryFact label="Received" value={formatDate(sample.receivedAt)} />
      </section>

      <section className="detail-section sample-results-panel">
        <div className="detail-section-head">
          <div>
            <p className="kicker">Test Results</p>
            <h2>Evaluation averages</h2>
          </div>
          {sample.evaluations.length ? (
            <div className="sample-overall-block">
              <span>Overall Score</span>
              <strong>{overall.toFixed(2)} / 5</strong>
            </div>
          ) : null}
        </div>
        {sample.evaluations.length ? (
          <div className="sample-average-grid">
            {criteria.map((criterion) => (
              <div key={criterion}>
                <span>{criterion[0].toUpperCase() + criterion.slice(1)}</span>
                <strong>{averages[criterion].toFixed(1)}</strong>
                <small>/ 5</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="compact-empty">
            <div>
              <strong>No evaluations yet.</strong>
              <p>Add the first tester result to start the sample score.</p>
            </div>
          </div>
        )}
      </section>

      <div className="supply-detail-grid sample-content-grid">
        <section className="detail-section supply-main-panel compact-detail-section">
          <div className="detail-section-head">
            <div>
              <p className="kicker">Tester Evaluations</p>
              <h2>Individual results</h2>
            </div>
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
                  <p className="evaluation-score-line">
                    {criteria
                      .map(
                        (criterion) =>
                          `${criterion[0].toUpperCase() + criterion.slice(1)} ${evaluation[criterion]}`,
                      )
                      .join(" · ")}
                  </p>
                  {evaluation.notes ? <p>{evaluation.notes}</p> : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="compact-empty">
              <p>Tester evaluations will appear here.</p>
            </div>
          )}
        </section>

        <aside className="supply-side-rail">
          <section className="detail-section supply-summary-card">
            <div className="detail-section-head">
              <div>
                <p className="kicker">Sample Context</p>
                <h2>Testing record</h2>
              </div>
            </div>
            <dl className="rail-stat-list rail-stat-list--text">
              <TextRailStat
                label="Ordered"
                value={formatDate(sample.orderedAt)}
              />
              <TextRailStat
                label="Received"
                value={formatDate(sample.receivedAt)}
              />
              <TextRailStat
                label="Evaluations"
                value={String(sample.evaluations.length)}
              />
              <TextRailStat label="Recorded By" value={sample.createdBy.name} />
            </dl>
            {sample.notes ? (
              <div className="supply-notes">
                <span>Sample notes</span>
                <p>{sample.notes}</p>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
      <FileAttachmentsPanel
        staff={staff}
        target={{ type: "SAMPLE", id: id }}
        targetLabel={`${formatSampleNumber(sample.sampleNumber)} · ${sample.name}`}
      />
    </main>
  );
}

function SummaryFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function TextRailStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
