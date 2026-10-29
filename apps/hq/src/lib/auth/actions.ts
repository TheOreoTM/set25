"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

// `email` comes back on failure so the form can refill it: React resets the
// form once the action settles, and only the password should clear.
export type SignInState = { message: string; email?: string };

export async function signInAction(
  _previous: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get("email");
  const password = formData.get("password");
  const returnTo = formData.get("returnTo");
  const redirectTo =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//")
      ? returnTo
      : "/";

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        message:
          "Sign-in failed. Check your details or ask an Owner to confirm your access.",
        email: typeof email === "string" ? email : "",
      };
    }
    throw error;
  }
  return { message: "" };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}
