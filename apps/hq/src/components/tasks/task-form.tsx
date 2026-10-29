"use client";

import { Select } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import Link from "next/link";
import { ArrowLeft, Check, Save } from "lucide-react";
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
import { useFormAction } from "@/components/ui/use-form-action";

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
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    action,
    initialTaskFormState,
  );
  const groups = relatedOptions.reduce(
    (map, option) =>
      map.set(option.group, [...(map.get(option.group) ?? []), option]),
    new Map<string, typeof relatedOptions>(),
  );
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="editor-form task-editor-form"
    >
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
            <Select
              name="status"
              defaultValue={defaults?.status ?? "TODO"}
              aria-invalid={Boolean(error("status"))}
            >
              {TASK_STATUSES.map((status) => (
                <option value={status} key={status}>
                  {taskStatusLabels[status]}
                </option>
              ))}
            </Select>
            {error("status") ? (
              <small className="field-error">{error("status")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Priority</span>
            <Select
              name="priority"
              defaultValue={defaults?.priority ?? "MEDIUM"}
              aria-invalid={Boolean(error("priority"))}
            >
              {TASK_PRIORITIES.map((priority) => (
                <option value={priority} key={priority}>
                  {taskPriorityLabels[priority]}
                </option>
              ))}
            </Select>
            {error("priority") ? (
              <small className="field-error">{error("priority")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Due date</span>
            <DatePicker
              name="dueAt"
              defaultValue={defaults?.dueAt ?? ""}
              invalid={Boolean(error("dueAt"))}
            />
            {error("dueAt") ? (
              <small className="field-error">{error("dueAt")}</small>
            ) : null}
          </label>
          <label className="field">
            <span>Assignee</span>
            <Select
              name="assignedToId"
              defaultValue={defaults?.assignedToId ?? ""}
              aria-invalid={Boolean(error("assignedToId"))}
            >
              <option value="">Unassigned</option>
              {staff.map((person) => (
                <option value={person.id} key={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
            {error("assignedToId") ? (
              <small className="field-error">{error("assignedToId")}</small>
            ) : null}
          </label>
          <label className="field field--wide">
            <span>Related record</span>
            <Select
              name="related"
              defaultValue={defaults?.related ?? ""}
              aria-invalid={Boolean(error("related"))}
            >
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
            </Select>
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
            aria-invalid={Boolean(error("description"))}
          />
          {error("description") ? (
            <small className="field-error">{error("description")}</small>
          ) : null}
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
  const { state, pending, onSubmit } = useFormAction(
    action,
    initialTaskFormState,
  );
  return (
    <div className="task-status-control">
      <form onSubmit={onSubmit} className="task-status-form">
        <label>
          <span className="sr-only">Change task status</span>
          <Select name="status" defaultValue={current} disabled={pending}>
            {TASK_STATUSES.map((status) => (
              <option value={status} key={status}>
                {taskStatusLabels[status]}
              </option>
            ))}
          </Select>
        </label>
        <button
          className="button button--secondary"
          type="submit"
          disabled={pending}
        >
          {pending ? "Saving…" : "Update"}
        </button>
      </form>
      {current !== "DONE" ? (
        <form onSubmit={onSubmit}>
          <input type="hidden" name="status" value="DONE" />
          <button
            className="button button--dark task-done-button"
            type="submit"
            disabled={pending}
            aria-label="Mark done"
            title="Mark done"
          >
            <Check aria-hidden="true" />
          </button>
        </form>
      ) : null}
      {state.message ? (
        <small className="field-error" role="alert">
          {state.message}
        </small>
      ) : null}
    </div>
  );
}
