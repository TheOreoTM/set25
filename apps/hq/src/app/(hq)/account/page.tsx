import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { staffInitials, staffRoleLabels } from "@/lib/auth/types";

export const instant = false;

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const staff = await requireStaff();

  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="HQ / Account"
        title="Account"
        description="Your current SET25 staff identity and access level."
      />
      <section className="product-identity account-page-panel">
        <div className="identity-lead">
          <p className="kicker">Signed in as</p>
          <div className="product-code-mark">{staffInitials(staff.name)}</div>
          <h2>{staff.name}</h2>
          <p>@{staff.username}</p>
        </div>
        <dl className="identity-facts">
          <div>
            <dt>Role</dt>
            <dd>{staffRoleLabels[staff.role]}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>
              <span className="status status--active">Active</span>
            </dd>
          </div>
        </dl>
      </section>
      <p className="account-page-note">
        Password changes and profile editing are intentionally deferred. Ask an
        Owner if your access needs to change.
      </p>
    </main>
  );
}
