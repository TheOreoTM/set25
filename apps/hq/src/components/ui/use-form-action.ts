"use client";

import { startTransition, useActionState, useEffect, useRef } from "react";

type FormStateLike = {
  status: string;
  message: string;
  errors?: Record<string, string[] | undefined>;
};

/**
 * Runs a server action from the form's submit event instead of its `action`
 * prop. React resets uncontrolled fields once a form action settles, which
 * would wipe what was typed whenever validation fails; dispatching through a
 * transition keeps the values (custom Select and DatePicker included). The
 * clicked submit button still sends its name and value.
 */
export function useFormAction<State extends FormStateLike>(
  action: (state: Awaited<State>, formData: FormData) => Promise<State>,
  initialState: Awaited<State>,
  { resetOnSuccess = false }: { resetOnSuccess?: boolean } = {},
) {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch, pending] = useActionState<State, FormData>(
    async (previous, formData) => {
      // A redirect rejects here and Next's redirect boundary remounts the
      // page, so a saved form always comes back empty.
      const next = await action(previous, formData);
      if (resetOnSuccess && next.status === "success") {
        formRef.current?.reset();
        formRef.current
          ?.querySelector<HTMLInputElement>("input:not([type=hidden])")
          ?.focus();
      }
      return next;
    },
    initialState,
  );
  // A rejected submit leaves the page at the submit button, so bring the
  // first highlighted field into view. `.field` carries scroll margins that
  // clear the fixed mobile top bar and tab bar.
  useEffect(() => {
    if (state.status !== "error") return;
    if (!state.errors || Object.keys(state.errors).length === 0) return;
    const invalid = formRef.current?.querySelector<HTMLElement>(
      '[aria-invalid="true"], [data-invalid="true"]',
    );
    if (!invalid) return;
    invalid.focus({ preventScroll: true });
    (invalid.closest(".field") ?? invalid).scrollIntoView({
      block: "center",
      behavior: "smooth",
    });
  }, [state]);
  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const formData = new FormData(event.currentTarget, submitter);
    startTransition(() => dispatch(formData));
  };
  const error = (name: string) => state.errors?.[name]?.[0];
  return { formRef, state, pending, onSubmit, error };
}
