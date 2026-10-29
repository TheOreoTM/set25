import { PageHeader } from "@/components/page-header";
import { requireStaff } from "@/lib/auth/session";
import { staffRoleLabels } from "@/lib/auth/types";

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
      <section className="resource-panel" aria-labelledby="account-title">
        <div className="resource-panel-head">
          <div>
            <p className="kicker">Signed in as</p>
            <h2 id="account-title">{staff.name}</h2>
          </div>
        </div>
        <dl className="account-facts">
          <div>
            <dt>Name</dt>
            <dd>{staff.name}</dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>{staff.email}</dd>
          </div>
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
