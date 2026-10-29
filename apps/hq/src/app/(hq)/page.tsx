import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleDollarSign,
  PackageSearch,
  Plus,
  Rocket,
  Sparkles,
} from "lucide-react";
import {
  contentPlatformLabels,
  contentStatusLabels,
  contentTypeLabels,
  formatMVR,
  formatSampleNumber,
  sampleStatusLabels,
  taskPriorityLabels,
  taskStatusLabels,
  waitlistStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { getContentThisWeek } from "@/lib/content/data";
import { publishTile } from "@/lib/content/presentation";
import { getMoneySpentSummary } from "@/lib/money/data";
import { getTodayRange } from "@/lib/planning/date-range";
import { getSamplesAwaitingDecision } from "@/lib/supply/data";
import { getDashboardTasks, getOpenTaskCounts } from "@/lib/tasks/data";
import { getWaitlistSummary } from "@/lib/waitlist/data";

// The four pipeline steps that are still in play, in order.
const pipeline = ["NEW", "CONTACTED", "CONFIRMED", "ORDERED"] as const;

export default async function TodayPage({
  searchParams,
}: {
  searchParams: Promise<{ forbidden?: string }>;
}) {
  const staff = await requireStaff();
  const canWrite = staff.role !== "STAFF";
  const [query, waitlist, samples, content, taskCounts, tasks, money] =
    await Promise.all([
      searchParams,
      getWaitlistSummary(),
      getSamplesAwaitingDecision(),
      getContentThisWeek(),
      getOpenTaskCounts(),
      getDashboardTasks(),
      getMoneySpentSummary(),
    ]);
  const { start: today, end: tomorrow } = getTodayRange();
  const growth = waitlist.thisWeek - waitlist.lastWeek;
  const weeklyMax = Math.max(...waitlist.weekly, 1);
  const planned = content.items.length - content.posted;

  return (
    <main className="page-wrap today-page">
      <PageHeader
        eyebrow="Pre-launch / Today"
        title="Today"
        description={todayLabel()}
      />
      {query.forbidden === "staff-role" ? (
        <div
          className="form-message form-message--error staff-page-message"
          role="alert"
        >
          Your Staff role has read-only access to most of HQ.
        </div>
      ) : null}

      <section className="panel waitlist-hero" aria-labelledby="waitlist-hero">
        <div className="section-heading">
          <div>
            <p className="kicker">Waitlist</p>
            <h2 id="waitlist-hero">People waiting for launch</h2>
          </div>
          {canWrite ? (
            <Link
              className="button button--dark"
              href="/waitlist#quick-add-title"
            >
              <Plus aria-hidden="true" /> Add
            </Link>
          ) : null}
        </div>
        <div className="waitlist-hero-body">
          <div className="waitlist-hero-number">
            <strong>{waitlist.active}</strong>
            <span>
              {waitlist.thisWeek} joined this week
              {" · "}
              {growth === 0
                ? "same as last week"
                : `${Math.abs(growth)} ${growth > 0 ? "more" : "fewer"} than last week`}
            </span>
            <span>
              {waitlist.earlyBird} Early Bird
              {waitlist.byStatus.DROPPED
                ? ` · ${waitlist.byStatus.DROPPED} dropped`
                : ""}
            </span>
          </div>
          <figure className="growth-chart">
            <figcaption>Sign-ups per week, last 8 weeks</figcaption>
            <div className="growth-bars" aria-hidden="true">
              {waitlist.weekly.map((count, index) => {
                const label = weekLabel(waitlist.weekly.length - 1 - index);
                return (
                  <div
                    className="growth-bar"
                    key={index}
                    title={`${label}: ${count} ${count === 1 ? "sign-up" : "sign-ups"}`}
                  >
                    <span className="growth-bar-value">
                      {index === waitlist.weekly.length - 1 ? count : ""}
                    </span>
                    <span
                      className={
                        index === waitlist.weekly.length - 1
                          ? "growth-bar-fill is-current"
                          : "growth-bar-fill"
                      }
                      style={{ height: `${(count / weeklyMax) * 100}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="growth-axis" aria-hidden="true">
              <span>8 wks ago</span>
              <span>This week</span>
            </div>
            <table className="sr-only">
              <caption>Waitlist sign-ups per week</caption>
              <tbody>
                {waitlist.weekly.map((count, index) => (
                  <tr key={index}>
                    <th scope="row">
                      {weekLabel(waitlist.weekly.length - 1 - index)}
                    </th>
                    <td>{count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </figure>
        </div>
        <div className="pipeline-strip">
          {pipeline.map((status) => (
            <Link href={`/waitlist?status=${status}`} key={status}>
              <span>{waitlistStatusLabels[status]}</span>
              <strong>{waitlist.byStatus[status]}</strong>
            </Link>
          ))}
        </div>
      </section>

      <section aria-label="Pre-launch summary">
        <div className="metric-grid today-metrics">
          <Link className="metric" href="/samples">
            <p>
              <PackageSearch aria-hidden="true" /> Samples to decide
            </p>
            <strong>{samples.count}</strong>
            <span>Pending or retest</span>
          </Link>
          <Link className="metric" href="/content">
            <p>
              <Sparkles aria-hidden="true" /> Content this week
            </p>
            <strong>{content.items.length}</strong>
            <span className="metric-breakdown">
              <span className="nowrap">{content.posted} posted</span> ·{" "}
              <span className="nowrap">{planned} to go</span>
              {content.overdue ? (
                <>
                  {" · "}
                  <span className="nowrap">{content.overdue} overdue</span>
                </>
              ) : null}
            </span>
          </Link>
          <Link className="metric" href="/tasks">
            <p>
              <CalendarDays aria-hidden="true" /> Open tasks
            </p>
            <strong>{taskCounts.open}</strong>
            <span>
              {taskCounts.overdue
                ? `${taskCounts.overdue} overdue`
                : "Nothing overdue"}
            </span>
          </Link>
          <Link className="metric" href="/money">
            <p>
              <CircleDollarSign aria-hidden="true" /> Spent so far
            </p>
            <strong className="metric-money">{formatMVR(money.total)}</strong>
            <span>{formatMVR(money.thisMonth)} this month</span>
          </Link>
        </div>
      </section>

      <div className="dashboard-grid today-grid">
        <section className="panel" aria-labelledby="samples-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Supply</p>
              <h2 id="samples-title">Samples to decide</h2>
            </div>
            <Link className="text-link" href="/samples">
              All samples <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {samples.samples.length ? (
            <div className="task-list">
              {samples.samples.map((sample) => (
                <Link
                  className="task-item"
                  href={`/samples/${sample.id}`}
                  key={sample.id}
                >
                  <span className="task-date">
                    <strong>{sample._count.evaluations}</strong>
                    <small>
                      {sample._count.evaluations === 1 ? "TEST" : "TESTS"}
                    </small>
                  </span>
                  <span>
                    <strong>
                      {formatSampleNumber(sample.sampleNumber)} · {sample.name}
                    </strong>
                    <small>
                      {sample.supplier.name} ·{" "}
                      {sampleStatusLabels[sample.status]}
                      {sample.receivedAt ? "" : " · Not received yet"}
                    </small>
                  </span>
                  <ArrowRight aria-hidden="true" />
                </Link>
              ))}
            </div>
          ) : (
            <div className="inline-empty inline-empty--panel">
              <p>No samples are waiting for a decision.</p>
              {canWrite ? (
                <Link href="/samples/new">
                  Log a sample <ArrowRight aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="content-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Content</p>
              <h2 id="content-title">This week</h2>
            </div>
            <Link className="text-link" href="/content">
              Planner <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {content.items.length ? (
            <div className="task-list">
              {content.items.slice(0, 6).map((item) => {
                const tile = publishTile(item.publishAt ?? item.postedAt);
                return (
                  <Link
                    className="task-item"
                    href={`/content/${item.id}`}
                    key={item.id}
                  >
                    <span className="task-date">
                      <strong>{tile.day}</strong>
                      <small>{tile.month}</small>
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <small>
                        {contentPlatformLabels[item.platform]} ·{" "}
                        {contentTypeLabels[item.type]} ·{" "}
                        {item.overdue
                          ? "Overdue"
                          : contentStatusLabels[item.status]}
                        {item.owner ? ` · ${item.owner}` : ""}
                      </small>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="inline-empty inline-empty--panel">
              <p>Nothing is planned for this week.</p>
              {canWrite ? (
                <Link href="/content/new">
                  Plan a post <ArrowRight aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="tasks-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Planning</p>
              <h2 id="tasks-title">Open tasks</h2>
            </div>
            <Link className="text-link" href="/tasks">
              All tasks <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {tasks.length ? (
            <div className="task-list">
              {tasks.map((task) => {
                const tile = publishTile(task.dueAt);
                return (
                  <Link className="task-item" href="/tasks" key={task.id}>
                    <span className="task-date">
                      <strong>{tile.day}</strong>
                      <small>{tile.month}</small>
                    </span>
                    <span>
                      <strong>{task.title}</strong>
                      <small>
                        {taskDueState(task.dueAt, today, tomorrow)} ·{" "}
                        {taskPriorityLabels[task.priority]} ·{" "}
                        {taskStatusLabels[task.status]}
                        {task.assignedTo
                          ? ` · ${task.assignedTo.name}`
                          : " · Unassigned"}
                      </small>
                    </span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="inline-empty inline-empty--panel">
              <p>No open tasks right now.</p>
              {canWrite ? (
                <Link href="/tasks/new">
                  Add a task <ArrowRight aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          )}
        </section>

        <section className="panel" aria-labelledby="money-title">
          <div className="section-heading">
            <div>
              <p className="kicker">Money</p>
              <h2 id="money-title">Where it went</h2>
            </div>
            <Link className="text-link" href="/money">
              Money <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          {money.topCategories.length ? (
            <dl className="money-breakdown">
              {money.topCategories.map((row) => (
                <div key={row.category}>
                  <dt>{row.label}</dt>
                  <dd>{formatMVR(row.amount)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="inline-empty inline-empty--panel">
              <p>No Money Out has been recorded yet.</p>
              {canWrite ? (
                <Link href="/money/new?direction=OUT">
                  Record Money Out <ArrowRight aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          )}
          <p className="money-note">
            Recorded Money Out entries in MVR, all time.
          </p>
        </section>
      </div>

      <p className="today-launch-note">
        <Rocket aria-hidden="true" /> Orders, Preorders, Stock, and Store live
        under Launch in the menu.
      </p>
    </main>
  );
}

function todayLabel() {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Indian/Maldives",
  }).format(new Date());
}

function weekLabel(weeksAgo: number) {
  if (weeksAgo === 0) return "This week";
  if (weeksAgo === 1) return "Last week";
  return `${weeksAgo} weeks ago`;
}

function taskDueState(value: string | null, today: Date, tomorrow: Date) {
  if (!value) return "No due date";
  const due = new Date(value);
  if (due < today) return "Overdue";
  if (due < tomorrow) return "Due today";
  return "Upcoming";
}
