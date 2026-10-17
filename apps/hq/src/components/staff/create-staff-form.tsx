"use client";

import { Select } from "@/components/ui/select";
import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { createStaffAction } from "@/lib/staff/actions";
import { initialStaffFormState } from "@/lib/staff/validation";

export function CreateStaffForm() {
  const [state, action, pending] = useActionState(
    createStaffAction,
    initialStaffFormState,
  );

  return (
    <form className="staff-create-form" action={action}>
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input name="name" minLength={2} maxLength={80} required />
          {state.errors?.name ? (
            <small className="field-error">{state.errors.name[0]}</small>
          ) : null}
        </label>
        <label className="field">
          <span>Email</span>
          <input
            name="email"
            type="email"
            inputMode="email"
            autoComplete="off"
            maxLength={254}
            required
          />
          {state.errors?.email ? (
            <small className="field-error">{state.errors.email[0]}</small>
          ) : null}
        </label>
        <label className="field">
          <span>Initial password</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={12}
            maxLength={128}
            required
          />
          {state.errors?.password ? (
            <small className="field-error">{state.errors.password[0]}</small>
          ) : (
            <small>Share it securely. Password changes are coming later.</small>
          )}
        </label>
        <label className="field">
          <span>Role</span>
          <Select name="role" defaultValue="STAFF" required>
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
          </Select>
          {state.errors?.role ? (
            <small className="field-error">{state.errors.role[0]}</small>
          ) : null}
        </label>
      </div>
      {state.message ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
        </div>
      ) : null}
      <div className="form-actions">
        <button className="button button--dark" disabled={pending}>
          <UserPlus aria-hidden="true" />
          {pending ? "Creating…" : "Create staff account"}
        </button>
      </div>
    </form>
  );
}
