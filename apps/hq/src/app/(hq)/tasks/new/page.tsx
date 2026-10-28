import { PageHeader } from "@/components/page-header";
import { TaskForm } from "@/components/tasks/task-form";
import { requireOperationalPageAccess } from "@/lib/auth/session";
import { createTaskAction } from "@/lib/tasks/actions";
import { getTaskFormOptions } from "@/lib/tasks/data";

export const metadata = { title: "New task" };

export default async function NewTaskPage() {
  await requireOperationalPageAccess("/tasks?forbidden=write");
  const options = await getTaskFormOptions();
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="Company / Tasks / New"
        title="New task"
        description="Plan one clear piece of operational work and connect it to the relevant SET25 record."
      />
      <TaskForm
        action={createTaskAction}
        staff={options.staff}
        relatedOptions={options.related}
        submitLabel="Create task"
      />
    </main>
  );
}
