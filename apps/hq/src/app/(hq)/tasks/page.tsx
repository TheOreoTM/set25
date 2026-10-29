import Link from "next/link";
import { Select } from "@/components/ui/select";
import {
  ArrowRight,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  taskPriorityLabels,
  taskStatusLabels,
} from "@set25/shared";
import { PageHeader } from "@/components/page-header";
import { TaskStatusControl } from "@/components/tasks/task-form";
import { requireStaff } from "@/lib/auth/session";
import { updateTaskStatusAction } from "@/lib/tasks/actions";
import { getTasks } from "@/lib/tasks/data";
import { formatDate } from "@/lib/supply/presentation";

export const metadata = { title: "Tasks" };

type SearchParams = {
  view?: string;
  search?: string;
  status?: string;
  priority?: string;
  assignee?: string;
  created?: string;
  saved?: string;
  forbidden?: string;
};

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const [staff, query] = await Promise.all([requireStaff(), searchParams]);
  const result = await getTasks(query);
  const canWrite = staff.role !== "STAFF";
  const filterKeys = ["search", "status", "priority", "assignee"] as const;
  // Views and summary tiles keep the active search and filters.
  const viewHref = (view: string) => {
    const params = new URLSearchParams();
    if (view) params.set("view", view);
    for (const key of filterKeys) if (query[key]) params.set(key, query[key]!);
    const value = params.toString();
    return value ? `/tasks?${value}` : "/tasks";
  };
  // Clearing keeps the view; the tabs are views, not filters.
  const filtered = filterKeys.some((key) => query[key]);
  const clearHref = query.view
    ? `/tasks?view=${encodeURIComponent(query.view)}`
    : "/tasks";
  const count = result.tasks.length;

  return (
    <main className="page-wrap tasks-page">
      <PageHeader
        eyebrow="Pre-launch / Tasks"
        title="Tasks"
        description="Operational work that needs a clear owner, priority, and next state."
      />
      {query.created || query.saved ? (
        <div className="form-message form-message--success" role="status">
          Task {query.created ? "created" : "updated"}.
        </div>
      ) : null}
      {query.forbidden === "write" ? (
        <div className="form-message form-message--error" role="alert">
          Staff can update the status of tasks assigned to them. Creating and
          editing tasks needs an Owner or Manager.
        </div>
      ) : null}
      <div className="resource-toolbar">
        <form action="/tasks" className="filter-bar commerce-filter-bar">
          {query.view ? (
            <input type="hidden" name="view" value={query.view} />
          ) : null}
          <label className="search-field">
            <Search aria-hidden="true" />
            <span className="sr-only">Search tasks</span>
            <input
              name="search"
              defaultValue={query.search ?? ""}
              placeholder="Task or related name"
            />
          </label>
          <label>
            <span className="sr-only">Status</span>
            <Select name="status" defaultValue={query.status ?? ""}>
              <option value="">All statuses</option>
              {TASK_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {taskStatusLabels[status]}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Priority</span>
            <Select name="priority" defaultValue={query.priority ?? ""}>
              <option value="">All priorities</option>
              {TASK_PRIORITIES.map((priority) => (
                <option value={priority} key={priority}>
                  {taskPriorityLabels[priority]}
                </option>
              ))}
            </Select>
          </label>
          <label>
            <span className="sr-only">Assignee</span>
            <Select name="assignee" defaultValue={query.assignee ?? ""}>
              <option value="">All assignees</option>
              {result.staff.map((person) => (
                <option value={person.id} key={person.id}>
                  {person.name}
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
        {canWrite ? (
          <Link className="button button--dark" href="/tasks/new">
            <Plus aria-hidden="true" /> New task
          </Link>
        ) : null}
      </div>

      <section className="task-summary-strip" aria-label="Task summary">
        <TaskSummary
          href={viewHref("overdue")}
          label="Overdue"
          value={result.summary.overdue}
          urgent={result.summary.overdue > 0}
        />
        <TaskSummary
          href={viewHref("today")}
          label="Due Today"
          value={result.summary.today}
        />
        <TaskSummary
          href={viewHref("upcoming")}
          label="Upcoming"
          value={result.summary.upcoming}
        />
        <TaskSummary
          href={viewHref("waiting")}
          label="Waiting"
          value={result.summary.waiting}
        />
      </section>

      <section
        className="resource-panel queue-panel"
        aria-labelledby="tasks-title"
      >
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Planning queue</p>
            <h2 id="tasks-title">
              {viewTitle(query.view)} · {count}
            </h2>
          </div>
          {filtered ? (
            <Link className="text-link" href={clearHref}>
              Clear filters
            </Link>
          ) : null}
        </div>
        <nav className="task-view-tabs" aria-label="Task views">
          {taskViews.map(([value, label]) => (
            <Link
              className={(query.view ?? "") === value ? "is-active" : ""}
              aria-current={(query.view ?? "") === value ? "page" : undefined}
              href={viewHref(value)}
              key={value}
            >
              {label} <span>{result.viewCounts[value]}</span>
            </Link>
          ))}
        </nav>

        {result.tasks.length ? (
          <div className="task-queue">
            <div className="task-row task-row--head">
              <span>Priority</span>
              <span>Task</span>
              <span>Related</span>
              <span>Assignee</span>
              <span>Due</span>
              <span>Status</span>
              <span />
            </div>
            {result.tasks.map((task) => {
              const due = task.dueAt ? new Date(task.dueAt) : null;
              const overdue =
                task.status !== "DONE" && due && due < result.today;
              return (
                <article
                  className={`task-row${overdue ? " is-overdue" : ""}`}
                  key={task.id}
                >
                  <span className="task-row-priority">
                    <span
                      className={`task-priority task-priority--${task.priority.toLowerCase()}`}
                    >
                      {taskPriorityLabels[task.priority]}
                    </span>
                  </span>
                  <span className="task-row-copy">
                    <strong>{task.title}</strong>
                    {task.description ? (
                      <small>{task.description}</small>
                    ) : null}
                  </span>
                  {/* One column each on wide screens; a single meta line
                      (assignee · due · related) on compact rows. */}
                  <span className="task-row-meta">
                    <span
                      className={
                        task.related
                          ? "task-row-related"
                          : "task-row-related is-empty"
                      }
                    >
                      {task.related ? (
                        <Link className="text-link" href={task.related.href}>
                          {task.related.label}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </span>
                    <span>{task.assignedTo?.name ?? "Unassigned"}</span>
                    <span className={overdue ? "task-due-overdue" : ""}>
                      {due ? formatDate(due) : "No due date"}
                    </span>
                  </span>
                  <span className="task-row-status">
                    {canWrite || task.assignedTo?.id === staff.id ? (
                      <TaskStatusControl
                        action={updateTaskStatusAction.bind(null, task.id)}
                        current={task.status}
                      />
                    ) : (
                      <span
                        className={`status status--${task.status.toLowerCase()}`}
                      >
                        {taskStatusLabels[task.status]}
                      </span>
                    )}
                  </span>
                  <span className="task-row-edit">
                    {canWrite ? (
                      <Link
                        className="icon-button"
                        href={`/tasks/${task.id}/edit`}
                        aria-label={`Edit ${task.title}`}
                      >
                        <Pencil aria-hidden="true" />
                      </Link>
                    ) : null}
                  </span>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="inline-empty">
            <p>
              {filtered
                ? "No tasks match these filters."
                : "No tasks in this view."}
            </p>
            {filtered ? (
              <Link href={clearHref}>
                Clear filters <ArrowRight aria-hidden="true" />
              </Link>
            ) : canWrite ? (
              <Link href="/tasks/new">
                Create the next task <ArrowRight aria-hidden="true" />
              </Link>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

function TaskSummary({
  href,
  label,
  value,
  urgent = false,
}: {
  href: string;
  label: string;
  value: number;
  urgent?: boolean;
}) {
  return (
    <Link href={href} className={urgent ? "is-urgent" : ""}>
      <span>{label}</span>
      <strong>{value}</strong>
    </Link>
  );
}

const taskViews = [
  ["", "Open"],
  ["attention", "Needs attention"],
  ["overdue", "Overdue"],
  ["today", "Today"],
  ["upcoming", "Upcoming"],
  ["waiting", "Waiting"],
  ["completed", "Completed"],
  ["all", "All"],
] as const;

function viewTitle(view?: string) {
  return view === "attention"
    ? "Needs attention"
    : view === "overdue"
      ? "Overdue"
      : view === "today"
        ? "Due today"
        : view === "upcoming"
          ? "Upcoming"
          : view === "waiting"
            ? "Waiting"
            : view === "completed"
              ? "Completed"
              : view === "all"
                ? "All tasks"
                : "Open tasks";
}
