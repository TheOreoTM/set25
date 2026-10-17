import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";

const sections = {
  money: [
    "Money",
    "Money In, Money Out, and profitability will be implemented after commerce foundations.",
  ],
  tasks: [
    "Tasks",
    "Operational tasks will later connect directly to orders, stock, shipments, and company work.",
  ],
  ambassadors: [
    "Ambassadors",
    "Ambassador relationships and activity will be introduced in a later milestone.",
  ],
  content: [
    "Content",
    "Content planning will be introduced after core operations are stable.",
  ],
  files: [
    "Files",
    "Secure attachments and retention rules will be designed before file storage is enabled.",
  ],
  settings: [
    "Settings",
    "Staff access, business preferences, and system configuration will live here.",
  ],
} as const;

type Section = keyof typeof sections;

export function generateStaticParams() {
  return Object.keys(sections).map((section) => ({ section }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ section: string }>;
}): Promise<Metadata> {
  const { section } = await params;
  const config = sections[section as Section];
  return config ? { title: config[0] } : {};
}

export default async function SectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const config = sections[section as Section];
  if (!config) notFound();
  const staff = await requireStaff();
  if (staff.role === "STAFF") redirect("/?forbidden=staff-role");
  return (
    <main className="page-wrap page-wrap--placeholder">
      <PageHeader
        eyebrow={`HQ / ${config[0]}`}
        title={config[0]}
        description="This destination is reserved in the HQ foundation."
      />
      <EmptyState title={config[0]} description={config[1]} />
    </main>
  );
}
