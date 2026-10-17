import {
  TASK_PRIORITIES,
  TASK_RELATED_TYPES,
  TASK_STATUSES,
  type TaskPriorityValue,
  type TaskRelatedTypeValue,
  type TaskStatusValue,
} from "@set25/shared";
import { parseMaldivesDate } from "@/lib/planning/date-range";

export type TaskFormState = {
  status: "idle" | "error";
  message: string;
  errors?: Record<string, string[]>;
};

export const initialTaskFormState: TaskFormState = {
  status: "idle",
  message: "",
};

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function addError(
  errors: Record<string, string[]>,
  field: string,
  message: string,
) {
  errors[field] = [...(errors[field] ?? []), message];
}

export function validateTask(formData: FormData) {
  const errors: Record<string, string[]> = {};
  const title = text(formData, "title");
  const description = text(formData, "description");
  const status = text(formData, "status") as TaskStatusValue;
  const priority = text(formData, "priority") as TaskPriorityValue;
  const dueAtRaw = text(formData, "dueAt");
  const dueAt = dueAtRaw ? parseMaldivesDate(dueAtRaw) : null;
  const assignedToId = text(formData, "assignedToId");
  const related = text(formData, "related");

  if (title.length < 2 || title.length > 160)
    addError(errors, "title", "Enter a title between 2 and 160 characters.");
  if (description.length > 2000)
    addError(
      errors,
      "description",
      "Keep the description under 2,000 characters.",
    );
  if (!TASK_STATUSES.includes(status))
    addError(errors, "status", "Choose a valid task status.");
  if (!TASK_PRIORITIES.includes(priority))
    addError(errors, "priority", "Choose a valid priority.");
  if (dueAtRaw && !dueAt) addError(errors, "dueAt", "Enter a valid due date.");
  if (related) {
    const [type, id, extra] = related.split(":");
    if (
      extra !== undefined ||
      !TASK_RELATED_TYPES.includes(type as TaskRelatedTypeValue) ||
      !id
    )
      addError(errors, "related", "Choose a valid related record.");
  }

  if (Object.keys(errors).length) return { success: false as const, errors };
  const [relatedType, relatedId] = related
    ? (related.split(":", 2) as [TaskRelatedTypeValue, string])
    : [null, null];
  return {
    success: true as const,
    data: {
      title,
      description: description || null,
      status,
      priority,
      dueAt,
      assignedToId: assignedToId || null,
      relatedType,
      relatedId,
    },
  };
}

export function validateTaskStatus(formData: FormData) {
  const status = text(formData, "status") as TaskStatusValue;
  return TASK_STATUSES.includes(status) ? status : null;
}
