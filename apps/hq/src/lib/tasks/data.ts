import "server-only";

import { db, Prisma } from "@set25/database";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  formatImportNumber,
  formatOrderNumber,
  formatPurchaseOrderNumber,
  formatSampleNumber,
  type TaskPriorityValue,
  type TaskStatusValue,
} from "@set25/shared";
import { getTodayRange } from "@/lib/planning/date-range";

export type TaskFilters = {
  view?: string;
  search?: string;
  status?: string;
  priority?: string;
  assignee?: string;
};

const taskInclude = {
  assignedTo: { select: { id: true, name: true } },
  createdBy: { select: { name: true } },
  order: { select: { id: true, orderNumber: true, type: true } },
  purchaseOrder: { select: { id: true, purchaseOrderNumber: true } },
  importShipment: { select: { id: true, importNumber: true } },
  supplier: { select: { id: true, name: true } },
  sample: { select: { id: true, sampleNumber: true, name: true } },
  customer: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
} satisfies Prisma.TaskInclude;

export async function getTasks(filters: TaskFilters = {}) {
  const { start: today, end: tomorrow } = getTodayRange();
  const status = TASK_STATUSES.includes(filters.status as TaskStatusValue)
    ? (filters.status as TaskStatusValue)
    : undefined;
  const priority = TASK_PRIORITIES.includes(
    filters.priority as TaskPriorityValue,
  )
    ? (filters.priority as TaskPriorityValue)
    : undefined;
  // The default view is open work; an explicit status filter still wins below.
  const viewWhere: Prisma.TaskWhereInput =
    filters.view === "all"
      ? {}
      : filters.view === "overdue"
        ? { status: { not: "DONE" }, dueAt: { lt: today } }
        : filters.view === "today"
          ? { status: { not: "DONE" }, dueAt: { gte: today, lt: tomorrow } }
          : filters.view === "upcoming"
            ? { status: { not: "DONE" }, dueAt: { gte: tomorrow } }
            : filters.view === "waiting"
              ? { status: "WAITING" }
              : filters.view === "completed"
                ? { status: "DONE" }
                : filters.view === "attention"
                  ? {
                      status: { not: "DONE" },
                      OR: [{ dueAt: { lt: tomorrow } }, { priority: "HIGH" }],
                    }
                  : { status: { not: "DONE" } };
  const search = filters.search?.trim();
  const [tasks, summaryRecords, staff] = await Promise.all([
    db.task.findMany({
      where: {
        ...viewWhere,
        ...(status ? { status } : {}),
        priority,
        assignedToId: filters.assignee || undefined,
        ...(search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                {
                  supplier: { name: { contains: search, mode: "insensitive" } },
                },
                {
                  customer: { name: { contains: search, mode: "insensitive" } },
                },
                { team: { name: { contains: search, mode: "insensitive" } } },
              ],
            }
          : {}),
      },
      include: taskInclude,
      orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
      take: 300,
    }),
    db.task.findMany({ select: { status: true, dueAt: true } }),
    db.staffUser.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  tasks.sort((a, b) => {
    const overdueA = a.status !== "DONE" && a.dueAt && a.dueAt < today ? 0 : 1;
    const overdueB = b.status !== "DONE" && b.dueAt && b.dueAt < today ? 0 : 1;
    return (
      overdueA - overdueB ||
      priorityRank[a.priority] - priorityRank[b.priority] ||
      (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
        (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
    );
  });
  return {
    tasks: tasks.map(toTaskDto),
    staff,
    summary: {
      overdue: summaryRecords.filter(
        (task) => task.status !== "DONE" && task.dueAt && task.dueAt < today,
      ).length,
      today: summaryRecords.filter(
        (task) =>
          task.status !== "DONE" &&
          task.dueAt &&
          task.dueAt >= today &&
          task.dueAt < tomorrow,
      ).length,
      upcoming: summaryRecords.filter(
        (task) =>
          task.status !== "DONE" && task.dueAt && task.dueAt >= tomorrow,
      ).length,
      waiting: summaryRecords.filter((task) => task.status === "WAITING")
        .length,
    },
    today,
  };
}

export function getTask(id: string) {
  return db.task.findUnique({ where: { id }, include: taskInclude });
}

export async function getTaskFormOptions() {
  const [
    staff,
    orders,
    purchaseOrders,
    imports,
    suppliers,
    samples,
    customers,
    teams,
  ] = await Promise.all([
    db.staffUser.findMany({
      where: { active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    db.order.findMany({
      select: { id: true, orderNumber: true, type: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    db.purchaseOrder.findMany({
      select: { id: true, purchaseOrderNumber: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    db.importShipment.findMany({
      select: { id: true, importNumber: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    db.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 250,
    }),
    db.sample.findMany({
      select: { id: true, sampleNumber: true, name: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    }),
    db.customer.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 250,
    }),
    db.team.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 250,
    }),
  ]);
  return {
    staff,
    related: [
      ...orders.map((order) => ({
        value: `ORDER:${order.id}`,
        group: "Orders / Preorders",
        label: formatOrderNumber(order.orderNumber),
      })),
      ...purchaseOrders.map((po) => ({
        value: `PURCHASE_ORDER:${po.id}`,
        group: "Purchase Orders",
        label: formatPurchaseOrderNumber(po.purchaseOrderNumber),
      })),
      ...imports.map((shipment) => ({
        value: `IMPORT:${shipment.id}`,
        group: "Imports",
        label: formatImportNumber(shipment.importNumber),
      })),
      ...suppliers.map((supplier) => ({
        value: `SUPPLIER:${supplier.id}`,
        group: "Suppliers",
        label: supplier.name,
      })),
      ...samples.map((sample) => ({
        value: `SAMPLE:${sample.id}`,
        group: "Samples",
        label: `${formatSampleNumber(sample.sampleNumber)} · ${sample.name}`,
      })),
      ...customers.map((customer) => ({
        value: `CUSTOMER:${customer.id}`,
        group: "Customers",
        label: customer.name,
      })),
      ...teams.map((team) => ({
        value: `TEAM:${team.id}`,
        group: "Teams",
        label: team.name,
      })),
    ],
  };
}

export async function getDashboardTasks() {
  const { start: today } = getTodayRange();
  const tasks = await db.task.findMany({
    where: { status: { not: "DONE" } },
    include: taskInclude,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    take: 50,
  });
  const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 };
  return tasks
    .sort((a, b) => {
      const overdueA = a.dueAt && a.dueAt < today ? 0 : 1;
      const overdueB = b.dueAt && b.dueAt < today ? 0 : 1;
      return (
        overdueA - overdueB ||
        priorityRank[a.priority] - priorityRank[b.priority] ||
        (a.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER) -
          (b.dueAt?.getTime() ?? Number.MAX_SAFE_INTEGER)
      );
    })
    .slice(0, 5)
    .map(toTaskDto);
}

function toTaskDto(
  task: Prisma.TaskGetPayload<{ include: typeof taskInclude }>,
) {
  const related = taskRelated(task);
  return {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueAt: task.dueAt?.toISOString() ?? null,
    assignedTo: task.assignedTo,
    createdBy: task.createdBy.name,
    completedAt: task.completedAt?.toISOString() ?? null,
    related,
  };
}

function taskRelated(
  task: Prisma.TaskGetPayload<{ include: typeof taskInclude }>,
) {
  if (task.order)
    return {
      label: formatOrderNumber(task.order.orderNumber),
      href: `/${task.order.type === "PREORDER" ? "preorders" : "orders"}/${task.order.id}`,
      value: `ORDER:${task.order.id}`,
    };
  if (task.purchaseOrder)
    return {
      label: formatPurchaseOrderNumber(task.purchaseOrder.purchaseOrderNumber),
      href: `/purchase-orders/${task.purchaseOrder.id}`,
      value: `PURCHASE_ORDER:${task.purchaseOrder.id}`,
    };
  if (task.importShipment)
    return {
      label: formatImportNumber(task.importShipment.importNumber),
      href: `/imports/${task.importShipment.id}`,
      value: `IMPORT:${task.importShipment.id}`,
    };
  if (task.supplier)
    return {
      label: task.supplier.name,
      href: `/suppliers/${task.supplier.id}`,
      value: `SUPPLIER:${task.supplier.id}`,
    };
  if (task.sample)
    return {
      label: formatSampleNumber(task.sample.sampleNumber),
      href: `/samples/${task.sample.id}`,
      value: `SAMPLE:${task.sample.id}`,
    };
  if (task.customer)
    return {
      label: task.customer.name,
      href: `/customers/${task.customer.id}`,
      value: `CUSTOMER:${task.customer.id}`,
    };
  if (task.team)
    return {
      label: task.team.name,
      href: `/teams/${task.team.id}`,
      value: `TEAM:${task.team.id}`,
    };
  return null;
}
