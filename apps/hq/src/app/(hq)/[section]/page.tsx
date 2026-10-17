import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";

export const instant = false;

const sections = {
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
