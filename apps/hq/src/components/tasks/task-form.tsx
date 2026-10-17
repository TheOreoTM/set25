"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  taskPriorityLabels,
  taskStatusLabels,
  type TaskPriorityValue,
  type TaskStatusValue,
} from "@set25/shared";
import {
  initialTaskFormState,
  type TaskFormState,
} from "@/lib/tasks/validation";

type Action = (
  state: TaskFormState,
  formData: FormData,
) => Promise<TaskFormState>;

type Defaults = {
  title: string;
  description: string | null;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  dueAt: string;
  assignedToId: string | null;
  related: string | null;
};

export function TaskForm({
  action,
  staff,
  relatedOptions,
  defaults,
  submitLabel,
}: {
  action: Action;
  staff: { id: string; name: string }[];
  relatedOptions: { value: string; group: string; label: string }[];
  defaults?: Defaults;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialTaskFormState,
  );
  const error = (field: string) => state.errors?.[field]?.[0];
  const groups = relatedOptions.reduce(
    (map, option) =>
      map.set(option.group, [...(map.get(option.group) ?? []), option]),
    new Map<string, typeof relatedOptions>(),
  );
  return (
    <form action={formAction} className="editor-form task-editor-form">
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Planning</p>
          <h2>Task details</h2>
          <p>
            Keep ownership, priority, timing, and operational context clear.
          </p>
        </div>
        <div className="form-grid">
          <label className="field field--wide">
            <span>Task</span>
            <input
              name="title"
              maxLength={160}
              required
              defaultValue={defaults?.title ?? ""}
              aria-invalid={Boolean(error("title"))}
            />
            {error("title") ? (
              <small className="field-error">{error("title")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" defaultValue={defaults?.status ?? "TODO"}>
              {TASK_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {taskStatusLabels[status]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Priority</span>
            <select
              name="priority"
              defaultValue={defaults?.priority ?? "MEDIUM"}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option value={priority} key={priority}>
                  {taskPriorityLabels[priority]}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Due date</span>
            <input
              name="dueAt"
              type="date"
              defaultValue={defaults?.dueAt ?? ""}
            />
            {error("dueAt") ? (
              <small className="field-error">{error("dueAt")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Assignee</span>
            <select
              name="assignedToId"
              defaultValue={defaults?.assignedToId ?? ""}
            >
              <option value="">Unassigned</option>
              {staff.map((person) => (
                <option value={person.id} key={person.id}>
                  {person.name}
                </option>
              ))}
            </select>
            {error("assignedToId") ? (
              <small className="field-error">{error("assignedToId")}</small>
            ) : null}
          </label>
          <label className="field field--wide">
            <span>Related record</span>
            <select name="related" defaultValue={defaults?.related ?? ""}>
              <option value="">No related record</option>
              {[...groups.entries()].map(([group, options]) => (
                <optgroup label={group} key={group}>
                  {options.map((option) => (
                    <option value={option.value} key={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            {error("related") ? (
              <small className="field-error">{error("related")}</small>
            ) : null}
          </label>
        </div>
      </section>
      <section className="form-section">
        <div className="form-section-title">
          <p className="kicker">Context</p>
          <h2>Description</h2>
        </div>
        <label className="field">
          <span>Task description</span>
          <textarea
            name="description"
            rows={5}
            maxLength={2000}
            defaultValue={defaults?.description ?? ""}
          />
        </label>
      </section>
      {state.message ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
        </div>
      ) : null}
      <div className="form-actions">
        <Link className="button button--secondary" href="/tasks">
          <ArrowLeft aria-hidden="true" /> Cancel
        </Link>
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          <Save aria-hidden="true" /> {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function TaskStatusControl({
  action,
  current,
}: {
  action: Action;
  current: TaskStatusValue;
}) {
  const [state, formAction, pending] = useActionState(
    action,
    initialTaskFormState,
  );
  return (
    <form action={formAction} className="task-status-control">
      <label>
        <span className="sr-only">Change task status</span>
        <select name="status" defaultValue={current} disabled={pending}>
          {TASK_STATUSES.map((status) => (
            <option value={status} key={status}>
              {taskStatusLabels[status]}
            </option>
          ))}
        </select>
      </label>
      <button
        className="button button--secondary"
        type="submit"
        disabled={pending}
      >
        {pending ? "Saving…" : "Update"}
      </button>
      {state.message ? (
        <small className="field-error" role="alert">
          {state.message}
        </small>
      ) : null}
    </form>
  );
}
