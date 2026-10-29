"use client";

import { Select } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { createStaffAction } from "@/lib/staff/actions";
import { initialStaffFormState } from "@/lib/staff/validation";
import { useFormAction } from "@/components/ui/use-form-action";

export function CreateStaffForm() {
  const { formRef, state, pending, onSubmit, error } = useFormAction(
    createStaffAction,
    initialStaffFormState,
  );
  const fieldError = (key: string) =>
    error(key) ? <small className="field-error">{error(key)}</small> : null;

  return (
    <form className="staff-create-form" ref={formRef} onSubmit={onSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Name</span>
          <input
            name="name"
            minLength={2}
            maxLength={80}
            required
            aria-invalid={Boolean(error("name"))}
          />
          {fieldError("name")}
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
            aria-invalid={Boolean(error("email"))}
          />
          {fieldError("email")}
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
            aria-invalid={Boolean(error("password"))}
          />
          {error("password") ? (
            fieldError("password")
          ) : (
            <small>Share it securely. Password changes are coming later.</small>
          )}
        </label>
        <label className="field">
          <span>Role</span>
          <Select
            name="role"
            defaultValue="STAFF"
            required
            aria-invalid={Boolean(error("role"))}
          >
            <option value="MANAGER">Manager</option>
            <option value="STAFF">Staff</option>
          </Select>
          {fieldError("role")}
        </label>
      </div>
      {state.message ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
        </div>
      ) : null}
      <div className="form-actions">
        <button
          className="button button--dark"
          type="submit"
          disabled={pending}
        >
          <UserPlus aria-hidden="true" />
          {pending ? "Creating…" : "Create staff account"}
        </button>
      </div>
    </form>
  );
}
