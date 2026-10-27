import { LockKeyhole, ShieldAlert } from "lucide-react";
import { Select } from "@/components/ui/select";
import { db } from "@set25/database";
import { PageHeader } from "@/components/page-header";
import { CreateStaffForm } from "@/components/staff/create-staff-form";
import { requireStaff } from "@/lib/auth/session";
import {
  changeStaffRoleAction,
  changeStaffUsernameAction,
  toggleStaffStatusAction,
} from "@/lib/staff/actions";

export const instant = false;

export const metadata = { title: "Staff access" };

const errorMessages: Record<string, string> = {
  "last-owner": "SET25 must always have at least one active Owner.",
  missing: "That staff account no longer exists.",
  role: "Choose a valid staff role.",
  username:
    "Usernames use 3–32 letters, digits, dots, underscores, or hyphens, starting with a letter or digit.",
  "username-taken": "Another staff account already uses that username.",
  save: "SET25 HQ could not save that access change. Please try again.",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [currentStaff, query] = await Promise.all([
    requireStaff(),
    searchParams,
  ]);

  if (currentStaff.role !== "OWNER") {
    return (
      <main className="page-wrap">
        <PageHeader
          eyebrow="System / Staff"
          title="Staff access"
          description="Owner access is required to manage SET25 staff."
        />
        <section className="access-denied">
          <ShieldAlert aria-hidden="true" />
          <p className="kicker">Restricted</p>
          <h2>Owner access required.</h2>
          <p>Your account does not have permission to manage staff access.</p>
        </section>
      </main>
    );
  }

  const staff = await db.staffUser.findMany({
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      active: true,
      lastLoginAt: true,
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  const error = typeof query.error === "string" ? query.error : "";
  const activeOwnerCount = staff.filter(
    (member) => member.active && member.role === "OWNER",
  ).length;

  return (
    <main className="page-wrap">
      <PageHeader
        eyebrow="System / Staff"
        title="Staff access"
        description="Create accounts and control who can operate SET25 HQ."
      />
      {query.created === "1" ? (
        <div className="success-banner" role="status">
          Staff account created.
        </div>
      ) : null}
      {query.updated ? (
        <div className="success-banner" role="status">
          {query.updated === "username"
            ? "Username updated. It applies from the next sign-in."
            : "Staff access updated."}
        </div>
      ) : null}
      {error ? (
        <div
          className="form-message form-message--error staff-page-message"
          role="alert"
        >
          {errorMessages[error] || errorMessages.save}
        </div>
      ) : null}

      <div className="staff-layout">
        <section
          className="resource-panel staff-list"
          aria-labelledby="staff-list-title"
        >
          <div className="resource-panel-head">
            <div>
              <p className="kicker">Access register</p>
              <h2 id="staff-list-title">
                {staff.length} {staff.length === 1 ? "account" : "accounts"}
              </h2>
            </div>
            <p>Roles are enforced on the server</p>
          </div>
          <div className="staff-row staff-row--head">
            <span>Staff member</span>
            <span>Role</span>
            <span>Status</span>
            <span>Last login</span>
            <span>Access</span>
          </div>
          {staff.map((member) => (
            <div className="staff-row" key={member.id}>
              <span className="catalog-product">
                <strong>{member.name}</strong>
                <details className="staff-username">
                  <summary>
                    <small>@{member.username}</small>
                    <span>Change</span>
                  </summary>
                  <form
                    action={changeStaffUsernameAction}
                    className="inline-role-form"
                  >
                    <input type="hidden" name="staffId" value={member.id} />
                    <input
                      name="username"
                      defaultValue={member.username}
                      aria-label={`New username for ${member.name}`}
                      autoCapitalize="none"
                      autoCorrect="off"
                      spellCheck={false}
                      minLength={3}
                      maxLength={32}
                      pattern="[A-Za-z0-9][A-Za-z0-9._\-]{2,31}"
                      required
                    />
                    <button type="submit">Save</button>
                  </form>
                </details>
              </span>
              <span data-label="Role">
                <form
                  action={changeStaffRoleAction}
                  className="inline-role-form"
                >
                  <input type="hidden" name="staffId" value={member.id} />
                  <Select
                    name="role"
                    defaultValue={member.role}
                    aria-label={`Role for ${member.name}`}
                  >
                    <option value="OWNER">Owner</option>
                    <option value="MANAGER">Manager</option>
                    <option value="STAFF">Staff</option>
                  </Select>
                  <button type="submit">Save</button>
                </form>
              </span>
              <span data-label="Status">
                <span
                  className={
                    member.active
                      ? "status status--active"
                      : "status status--archived"
                  }
                >
                  {member.active ? "Active" : "Inactive"}
                </span>
              </span>
              <span data-label="Last login">
                {member.lastLoginAt
                  ? new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Indian/Maldives",
                    }).format(member.lastLoginAt)
                  : "Never"}
              </span>
              <span data-label="Access">
                <form action={toggleStaffStatusAction}>
                  <input type="hidden" name="staffId" value={member.id} />
                  <button
                    className="staff-status-action"
                    type="submit"
                    disabled={
                      member.active &&
                      member.role === "OWNER" &&
                      activeOwnerCount <= 1
                    }
                  >
                    {member.active ? "Deactivate" : "Reactivate"}
                  </button>
                </form>
              </span>
            </div>
          ))}
        </section>

        <section
          className="staff-create-panel"
          aria-labelledby="create-staff-title"
        >
          <div className="staff-create-heading">
            <LockKeyhole aria-hidden="true" />
            <div>
              <p className="kicker">Owner action</p>
              <h2 id="create-staff-title">Create staff account</h2>
            </div>
          </div>
          <p>
            Create a Manager or Staff account with an initial password. There is
            no public registration.
          </p>
          <CreateStaffForm />
        </section>
      </div>
    </main>
  );
}
