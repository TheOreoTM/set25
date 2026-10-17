import "server-only";

import { db, Prisma } from "@set25/database";
import {
  formatImportNumber,
  formatOrderNumber,
  formatPurchaseOrderNumber,
  formatSampleNumber,
} from "@set25/shared";
import {
  ATTACHMENT_TARGETS,
  FILE_CATEGORIES,
  accessibleLevels,
  canManageFile,
  canPreviewInline,
  fileCategory,
  isRetentionExpired,
  type AttachmentTarget,
  type StaffRoleValue,
} from "./policy";

const fileInclude = {
  createdBy: { select: { name: true } },
  deletedBy: { select: { name: true } },
  product: { select: { id: true, name: true, code: true } },
  customer: { select: { id: true, name: true } },
  team: { select: { id: true, name: true } },
  order: { select: { id: true, orderNumber: true, type: true } },
  supplier: { select: { id: true, name: true } },
  purchaseOrder: { select: { id: true, purchaseOrderNumber: true } },
  importShipment: { select: { id: true, importNumber: true } },
  sample: { select: { id: true, sampleNumber: true, name: true } },
  ambassador: { select: { id: true, name: true } },
  contentItem: { select: { id: true, title: true } },
} satisfies Prisma.FileAssetInclude;

type FileRecord = Prisma.FileAssetGetPayload<{ include: typeof fileInclude }>;

export type FileDto = ReturnType<typeof toFileDto>;

export type FileFilters = {
  search?: string;
  access?: string;
  category?: string;
  retention?: string;
};

/** Metadata is only ever loaded for access levels the viewer may see. */
function visibleTo(role: StaffRoleValue): Prisma.FileAssetWhereInput {
  return { accessLevel: { in: accessibleLevels(role) } };
}

function categoryWhere(category: string): Prisma.FileAssetWhereInput | null {
  switch (category) {
    case "Image":
      return { mimeType: { startsWith: "image/" } };
    case "Video":
      return { mimeType: { startsWith: "video/" } };
    case "PDF":
      return { mimeType: "application/pdf" };
    case "Spreadsheet":
      return {
        OR: [
          { mimeType: { contains: "spreadsheetml" } },
          { mimeType: "text/csv" },
        ],
      };
    case "Presentation":
      return { mimeType: { contains: "presentationml" } };
    case "Document":
      return {
        OR: [
          { mimeType: { contains: "wordprocessingml" } },
          { mimeType: "text/plain" },
        ],
      };
    default:
      return null;
  }
}

export async function getFiles(
  role: StaffRoleValue,
  filters: FileFilters = {},
) {
  const now = new Date();
  const search = filters.search?.trim();
  const and: Prisma.FileAssetWhereInput[] = [
    visibleTo(role),
    { status: "AVAILABLE" },
  ];
  if (search)
    and.push({
      OR: [
        { originalName: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ],
    });
  if (
    filters.access &&
    accessibleLevels(role).includes(filters.access as never)
  )
    and.push({ accessLevel: filters.access as never });
  if (filters.category && FILE_CATEGORIES.includes(filters.category as never)) {
    const where = categoryWhere(filters.category);
    if (where) and.push(where);
  }
  if (filters.retention === "expired")
    and.push({ retentionUntil: { lte: now } });
  if (filters.retention === "active")
    and.push({
      OR: [{ retentionUntil: null }, { retentionUntil: { gt: now } }],
    });
  if (filters.retention === "dated")
    and.push({ retentionPolicy: "UNTIL_DATE", retentionUntil: { gt: now } });

  const files = await db.fileAsset.findMany({
    where: { AND: and },
    include: fileInclude,
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return files.map((file) => toFileDto(file, role));
}

export async function getFile(id: string, role: StaffRoleValue) {
  const file = await db.fileAsset.findFirst({
    where: { id, status: { not: "PENDING" }, ...visibleTo(role) },
    include: fileInclude,
  });
  return file ? toFileDto(file, role) : null;
}

export async function getRecordFiles(
  target: AttachmentTarget,
  role: StaffRoleValue,
) {
  const files = await db.fileAsset.findMany({
    where: {
      [ATTACHMENT_TARGETS[target.type].field]: target.id,
      status: "AVAILABLE",
      ...visibleTo(role),
    },
    include: fileInclude,
    orderBy: { createdAt: "desc" },
  });
  return files.map((file) => toFileDto(file, role));
}

export async function getExpiredFileCount(role: StaffRoleValue) {
  if (role !== "OWNER") return 0;
  return db.fileAsset.count({
    where: { status: "AVAILABLE", retentionUntil: { lte: new Date() } },
  });
}

export function toFileDto(file: FileRecord, role: StaffRoleValue) {
  const expired = isRetentionExpired(file.retentionUntil);
  return {
    id: file.id,
    originalName: file.originalName,
    description: file.description,
    mimeType: file.mimeType,
    category: fileCategory(file.mimeType),
    sizeBytes: file.sizeBytes,
    status: file.status,
    accessLevel: file.accessLevel,
    retentionPolicy: file.retentionPolicy,
    retentionUntil: file.retentionUntil?.toISOString() ?? null,
    expired,
    createdAt: file.createdAt.toISOString(),
    createdBy: file.createdBy.name,
    deletedAt: file.deletedAt?.toISOString() ?? null,
    deletedBy: file.deletedBy?.name ?? null,
    attachedTo: attachmentLabel(file),
    canDownload: file.status === "AVAILABLE" && !expired,
    canPreview: canPreviewInline(file.mimeType),
    canManage: file.status === "AVAILABLE" && canManageFile(role, file),
  };
}

function attachmentLabel(file: FileRecord) {
  if (file.product)
    return {
      type: "Product",
      label: `${file.product.code} · ${file.product.name}`,
      href: `/products/${file.product.id}`,
    };
  if (file.customer)
    return {
      type: "Customer",
      label: file.customer.name,
      href: `/customers/${file.customer.id}`,
    };
  if (file.team)
    return {
      type: "Team",
      label: file.team.name,
      href: `/teams/${file.team.id}`,
    };
  if (file.order)
    return {
      type: file.order.type === "PREORDER" ? "Preorder" : "Order",
      label: formatOrderNumber(file.order.orderNumber),
      href: `/${file.order.type === "PREORDER" ? "preorders" : "orders"}/${file.order.id}`,
    };
  if (file.supplier)
    return {
      type: "Supplier",
      label: file.supplier.name,
      href: `/suppliers/${file.supplier.id}`,
    };
  if (file.purchaseOrder)
    return {
      type: "Purchase Order",
      label: formatPurchaseOrderNumber(file.purchaseOrder.purchaseOrderNumber),
      href: `/purchase-orders/${file.purchaseOrder.id}`,
    };
  if (file.importShipment)
    return {
      type: "Import",
      label: formatImportNumber(file.importShipment.importNumber),
      href: `/imports/${file.importShipment.id}`,
    };
  if (file.sample)
    return {
      type: "Sample",
      label: `${formatSampleNumber(file.sample.sampleNumber)} · ${file.sample.name}`,
      href: `/samples/${file.sample.id}`,
    };
  if (file.ambassador)
    return {
      type: "Ambassador",
      label: file.ambassador.name,
      href: `/ambassadors/${file.ambassador.id}`,
    };
  if (file.contentItem)
    return {
      type: "Content",
      label: file.contentItem.title,
      href: `/content/${file.contentItem.id}`,
    };
  return null;
}

/** Options for choosing an attachment target when uploading from /files. */
export async function getAttachmentTargetOptions() {
  const take = 200;
  const [
    products,
    customers,
    teams,
    orders,
    suppliers,
    purchaseOrders,
    imports,
    samples,
    ambassadors,
    content,
  ] = await Promise.all([
    db.product.findMany({
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
      take,
    }),
    db.customer.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take,
    }),
    db.team.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take,
    }),
    db.order.findMany({
      select: { id: true, orderNumber: true, type: true },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.supplier.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take,
    }),
    db.purchaseOrder.findMany({
      select: { id: true, purchaseOrderNumber: true },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.importShipment.findMany({
      select: { id: true, importNumber: true },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.sample.findMany({
      select: { id: true, sampleNumber: true, name: true },
      orderBy: { createdAt: "desc" },
      take,
    }),
    db.ambassador.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take,
    }),
    db.contentItem.findMany({
      select: { id: true, title: true },
      orderBy: { createdAt: "desc" },
      take,
    }),
  ]);
  const option = (group: string, type: string, id: string, label: string) => ({
    group,
    value: `${type}:${id}`,
    label,
  });
  return [
    ...orders.map((o) =>
      option(
        "Orders / Preorders",
        "ORDER",
        o.id,
        formatOrderNumber(o.orderNumber),
      ),
    ),
    ...products.map((p) =>
      option("Products", "PRODUCT", p.id, `${p.code} · ${p.name}`),
    ),
    ...customers.map((c) => option("Customers", "CUSTOMER", c.id, c.name)),
    ...teams.map((t) => option("Teams", "TEAM", t.id, t.name)),
    ...suppliers.map((s) => option("Suppliers", "SUPPLIER", s.id, s.name)),
    ...purchaseOrders.map((po) =>
      option(
        "Purchase Orders",
        "PURCHASE_ORDER",
        po.id,
        formatPurchaseOrderNumber(po.purchaseOrderNumber),
      ),
    ),
    ...imports.map((i) =>
      option("Imports", "IMPORT", i.id, formatImportNumber(i.importNumber)),
    ),
    ...samples.map((s) =>
      option(
        "Samples",
        "SAMPLE",
        s.id,
        `${formatSampleNumber(s.sampleNumber)} · ${s.name}`,
      ),
    ),
    ...ambassadors.map((a) =>
      option("Ambassadors", "AMBASSADOR", a.id, a.name),
    ),
    ...content.map((c) => option("Content", "CONTENT", c.id, c.title)),
  ];
}

/** Server-side existence check for an attachment target. */
export async function attachmentTargetExists(target: AttachmentTarget) {
  const where = { where: { id: target.id }, select: { id: true } } as const;
  switch (target.type) {
    case "PRODUCT":
      return Boolean(await db.product.findUnique(where));
    case "CUSTOMER":
      return Boolean(await db.customer.findUnique(where));
    case "TEAM":
      return Boolean(await db.team.findUnique(where));
    case "ORDER":
      return Boolean(await db.order.findUnique(where));
    case "SUPPLIER":
      return Boolean(await db.supplier.findUnique(where));
    case "PURCHASE_ORDER":
      return Boolean(await db.purchaseOrder.findUnique(where));
    case "IMPORT":
      return Boolean(await db.importShipment.findUnique(where));
    case "SAMPLE":
      return Boolean(await db.sample.findUnique(where));
    case "AMBASSADOR":
      return Boolean(await db.ambassador.findUnique(where));
    case "CONTENT":
      return Boolean(await db.contentItem.findUnique(where));
  }
}
