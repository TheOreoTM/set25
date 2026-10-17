import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "SET25 is a volleyball performance brand from the Maldives, built for the next point.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <main>
      <section className="hero hero--compact" aria-labelledby="about-title">
        <div className="hero__inner hero__inner--single">
          <p className="eyebrow eyebrow--slash eyebrow--light">About SET25</p>
          <h1 id="about-title" className="hero__title hero__title--compact">
            Built for the
            <br />
            <span>next point.</span>
          </h1>
        </div>
      </section>
      <section className="prose-section">
        <p className="prose-lead">
          SET25 is a volleyball performance brand from the Maldives. We make
          gear for players who keep coming back to the court — for the next
          rally, the next session, the next point.
        </p>
        <p>
          We start with the game. Every product is chosen for what it does on
          court, and samples are worn and rated by players before they become
          part of a drop.
        </p>
        <p>
          Drop 001 is our first collection. Orders are delivered across the
          Maldives, with payment by bank transfer or cash on delivery.
        </p>
        <p className="prose-line">Play. Practice. Compete. Repeat.</p>
        <Link className="button button--dark" href="/shop">
          Shop Drop 001 <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
