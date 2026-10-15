import type { Metadata } from "next";
import Image from "next/image";
import wordmark from "@set25/brand/assets/SET25_Primary_Wordmark_White.svg";
import monogram from "@set25/brand/assets/S25_Monogram.svg";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <main className="sign-in-page">
      <section className="sign-in-brand" aria-label="SET25 HQ">
        <Image src={wordmark} alt="SET25" width={184} height={62} priority />
        <div className="sign-in-brand-copy">
          <p>HQ / OPERATIONS</p>
          <h1>
            Built for the
            <br />
            next point.
          </h1>
          <span>Private staff access</span>
        </div>
      </section>
      <section className="sign-in-panel">
        <div className="sign-in-panel-inner">
          <div className="sign-in-mark" aria-hidden="true">
            <Image src={monogram} alt="" width={44} height={44} />
          </div>
          <p className="kicker">SET25 HQ</p>
          <h2>Sign in to continue.</h2>
          <p className="sign-in-intro">
            Use the staff access details provided by a SET25 Owner.
          </p>
          <SignInForm />
          <p className="sign-in-foot">Authorised SET25 staff only.</p>
        </div>
      </section>
    </main>
  );
}
