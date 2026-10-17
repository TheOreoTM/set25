import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { maldivesDateKey } from "@/lib/planning/date-range";
import { updateTaskAction } from "@/lib/tasks/actions";
import { getTask, getTaskFormOptions } from "@/lib/tasks/data";

export const metadata = { title: "Edit Task" };

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [, task, options] = await Promise.all([
    requireOperationalPageAccess("/tasks?forbidden=write"),
    getTask(id),
    getTaskFormOptions(),
  ]);
  if (!task) notFound();
  const related = task.orderId
    ? `ORDER:${task.orderId}`
    : task.purchaseOrderId
      ? `PURCHASE_ORDER:${task.purchaseOrderId}`
      : task.importShipmentId
        ? `IMPORT:${task.importShipmentId}`
        : task.supplierId
          ? `SUPPLIER:${task.supplierId}`
          : task.sampleId
            ? `SAMPLE:${task.sampleId}`
            : task.customerId
              ? `CUSTOMER:${task.customerId}`
              : task.teamId
                ? `TEAM:${task.teamId}`
                : null;
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Company / Tasks / Edit"
        title="Edit task"
        description={task.title}
      />
      <TaskForm
        action={updateTaskAction.bind(null, id)}
        staff={options.staff}
        relatedOptions={options.related}
        submitLabel="Save task"
        defaults={{
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueAt: task.dueAt ? maldivesDateKey(task.dueAt) : "",
          assignedToId: task.assignedToId,
          related,
        }}
      />
    </main>
  );
}
