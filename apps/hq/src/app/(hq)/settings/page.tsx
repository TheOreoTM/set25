import Link from "next/link";
import { ArrowRight, Store, Users } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { requireOperationalPageAccess } from "@/lib/auth/session";

export const instant = false;

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const staff = await requireOperationalPageAccess("/?forbidden=staff-role");
  const areas = [
    {
      href: "/settings/store",
      icon: Store,
      title: "Store settings",
      description:
        "Online ordering, customer contact, and delivery pricing for the public SET25 Store.",
    },
    ...(staff.role === "OWNER"
      ? [
          {
            href: "/settings/staff",
            icon: Users,
            title: "Staff access",
            description:
              "Create accounts and control who can operate SET25 HQ.",
          },
        ]
      : []),
  ];
  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="System / Settings"
        title="Settings"
        description="Configuration for the SET25 Store and HQ access."
      />
      <section className="resource-panel" aria-labelledby="settings-title">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">System</p>
            <h2 id="settings-title">Configuration</h2>
          </div>
        </div>
        <ul className="settings-index">
          {areas.map(({ href, icon: Icon, title, description }) => (
            <li key={href}>
              <Link href={href}>
                <Icon aria-hidden="true" />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
                <ArrowRight aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
