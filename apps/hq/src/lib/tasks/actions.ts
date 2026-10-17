"use server";

import { db } from "@set25/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireOperationalAccess, requireStaff } from "@/lib/auth/session";
import {
  validateTask,
  validateTaskStatus,
  type TaskFormState,
} from "./validation";

function failure(
  message: string,
  errors?: Record<string, string[]>,
): TaskFormState {
  return { status: "error", message, errors };
}

export async function createTaskAction(
  _state: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  const staff = await requireOperationalAccess();
  const result = validateTask(formData);
  if (!result.success)
    return failure("Check the highlighted fields.", result.errors);
  const relation = await validatedTaskRelation(
    result.data.relatedType,
    result.data.relatedId,
  );
  if (!relation.valid)
    return failure("The related record no longer exists.", {
      related: ["Choose an available related record."],
    });
  if (
    result.data.assignedToId &&
    !(await activeStaff(result.data.assignedToId))
  )
    return failure("The selected assignee is no longer active.", {
      assignedToId: ["Choose an active staff member."],
    });
  let id: string;
  try {
    ({ id } = await db.task.create({
      data: {
        title: result.data.title,
        description: result.data.description,
        status: result.data.status,
        priority: result.data.priority,
        dueAt: result.data.dueAt,
        assignedToId: result.data.assignedToId,
        createdById: staff.id,
        completedAt: result.data.status === "DONE" ? new Date() : null,
        ...relation.data,
      },
      select: { id: true },
    }));
  } catch (error) {
    console.error(error);
    return failure("SET25 HQ could not create this task. Try again.");
  }
  revalidateTaskPaths();
  redirect(`/tasks?created=${id}`);
}

export async function updateTaskAction(
  id: string,
  _state: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  await requireOperationalAccess();
  const result = validateTask(formData);
  if (!result.success)
    return failure("Check the highlighted fields.", result.errors);
  const [existing, relation] = await Promise.all([
    db.task.findUnique({ where: { id }, select: { completedAt: true } }),
    validatedTaskRelation(result.data.relatedType, result.data.relatedId),
  ]);
  if (!existing) return failure("This task no longer exists.");
  if (!relation.valid)
    return failure("The related record no longer exists.", {
      related: ["Choose an available related record."],
    });
  if (
    result.data.assignedToId &&
    !(await activeStaff(result.data.assignedToId))
  )
    return failure("The selected assignee is no longer active.", {
      assignedToId: ["Choose an active staff member."],
    });
  try {
    await db.task.update({
      where: { id },
      data: {
        title: result.data.title,
        description: result.data.description,
        status: result.data.status,
        priority: result.data.priority,
        dueAt: result.data.dueAt,
        assignedToId: result.data.assignedToId,
        completedAt:
          result.data.status === "DONE"
            ? (existing.completedAt ?? new Date())
            : null,
        orderId: null,
        purchaseOrderId: null,
        importShipmentId: null,
        supplierId: null,
        sampleId: null,
        customerId: null,
        teamId: null,
        ...relation.data,
      },
    });
  } catch (error) {
    console.error(error);
    return failure("SET25 HQ could not update this task. Try again.");
  }
  revalidateTaskPaths();
  redirect("/tasks?saved=1");
}

export async function updateTaskStatusAction(
  id: string,
  _state: TaskFormState,
  formData: FormData,
): Promise<TaskFormState> {
  // Staff may move only tasks assigned to themselves; Owner/Manager may move any.
  const staff = await requireStaff();
  const status = validateTaskStatus(formData);
  if (!status) return failure("Choose a valid task status.");
  try {
    const task = await db.task.findUnique({
      where: { id },
      select: { completedAt: true, assignedToId: true },
    });
    if (!task) return failure("This task no longer exists.");
    if (staff.role === "STAFF" && task.assignedToId !== staff.id)
      return failure("Staff can only update tasks assigned to them.");
    await db.task.update({
      where: { id },
      data: {
        status,
        completedAt:
          status === "DONE" ? (task.completedAt ?? new Date()) : null,
      },
    });
  } catch (error) {
    console.error(error);
    return failure("SET25 HQ could not update this task. Try again.");
  }
  revalidateTaskPaths();
  return { status: "idle", message: "" };
}

function revalidateTaskPaths() {
  revalidatePath("/");
  revalidatePath("/tasks");
}

function activeStaff(id: string) {
  return db.staffUser.findFirst({
    where: { id, active: true },
    select: { id: true },
  });
}

async function validatedTaskRelation(type: string | null, id: string | null) {
  if (!type || !id) return { valid: true as const, data: {} };
  if (type === "ORDER")
    return relationResult(
      await db.order.findUnique({ where: { id }, select: { id: true } }),
      { orderId: id },
    );
  if (type === "PURCHASE_ORDER")
    return relationResult(
      await db.purchaseOrder.findUnique({
        where: { id },
        select: { id: true },
      }),
      { purchaseOrderId: id },
    );
  if (type === "IMPORT")
    return relationResult(
      await db.importShipment.findUnique({
        where: { id },
        select: { id: true },
      }),
      { importShipmentId: id },
    );
  if (type === "SUPPLIER")
    return relationResult(
      await db.supplier.findUnique({ where: { id }, select: { id: true } }),
      { supplierId: id },
    );
  if (type === "SAMPLE")
    return relationResult(
      await db.sample.findUnique({ where: { id }, select: { id: true } }),
      { sampleId: id },
    );
  if (type === "CUSTOMER")
    return relationResult(
      await db.customer.findUnique({ where: { id }, select: { id: true } }),
      { customerId: id },
    );
  if (type === "TEAM")
    return relationResult(
      await db.team.findUnique({ where: { id }, select: { id: true } }),
      { teamId: id },
    );
  return { valid: false as const, data: {} };
}

function relationResult<T extends Record<string, string>>(
  record: { id: string } | null,
  data: T,
) {
  return record
    ? { valid: true as const, data }
    : { valid: false as const, data: {} };
}
