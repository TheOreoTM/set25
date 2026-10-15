"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export type SignInState = { message: string };

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
      };
    }
    throw error;
  }
  return { message: "" };
}

export async function signOutAction() {
  await signOut({ redirectTo: "/sign-in" });
}
