"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { signInAction } from "@/lib/auth/actions";

export function SignInForm() {
  const [state, action, pending] = useActionState(signInAction, {
    message: "",
  });

  return (
    <form className="sign-in-form" action={action}>
      <input type="hidden" name="returnTo" value="/" />
      <label className="field">
        <span>Username</span>
        <input
          type="text"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={32}
          required
          autoFocus
        />
      </label>
      <label className="field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          minLength={1}
          maxLength={128}
          required
        />
      </label>
      {state.message ? (
        <div className="form-message form-message--error" role="alert">
          {state.message}
        </div>
      ) : null}
      <button className="button button--dark sign-in-submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
        {!pending ? <ArrowRight aria-hidden="true" /> : null}
      </button>
    </form>
  );
}
