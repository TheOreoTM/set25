import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { ArrowRight } from "lucide-react";
import {
  getPublicAvailabilityByVariant,
  getPublishedProducts,
  productAvailability,
} from "@/lib/catalog";
import { getStoreSettings, instagramUrl } from "@/lib/settings";
import { ProductCard, ProductGridSkeleton } from "@/components/product-card";
import { EmptyDrop } from "@/components/empty-drop";
import { ProductMedia } from "@/components/product-media";

export default function HomePage() {
  return (
    <main>
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero__inner">
          <div className="hero__copy">
            <p className="eyebrow eyebrow--slash eyebrow--light">
              SET25 · Drop 001
            </p>
            <h1 id="hero-title" className="hero__title">
              Built for
              <br />
              the next
              <br />
              <span>point.</span>
            </h1>
            <p className="hero__lede">
              Volleyball performance gear designed for the next rally, the
              next session, the next point.
            </p>
            <div className="hero__actions">
              <Link className="button button--volt" href="/shop">
                Shop Drop 001 <ArrowRight aria-hidden="true" />
              </Link>
              <Link className="button button--ghost" href="/about">
                About SET25
              </Link>
            </div>
          </div>
          <div className="hero__visual">
            <div className="court" aria-hidden="true">
              <span className="court__net" />
              <span className="court__attack court__attack--top" />
              <span className="court__attack court__attack--bottom" />
            </div>
            <Suspense fallback={null}>
              <HeroProduct />
            </Suspense>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="drop-title">
        <div className="section__head">
          <div>
            <p className="eyebrow eyebrow--slash">Drop 001</p>
            <h2 id="drop-title" className="section__title">
              The first drop
            </h2>
          </div>
          <Link className="text-link" href="/shop">
            View all <ArrowRight aria-hidden="true" />
          </Link>
        </div>
        <Suspense fallback={<ProductGridSkeleton />}>
          <FeaturedProducts />
        </Suspense>
      </section>

      <section className="principles" aria-labelledby="principles-title">
        <div className="principles__inner">
          <p className="eyebrow eyebrow--slash eyebrow--light">
            Engineered for the court
          </p>
          <h2 id="principles-title" className="section__title section__title--light">
            Why SET25
          </h2>
          <ol className="principles__list">
            <li>
              <span className="principles__index">01</span>
              <h3>Performance first</h3>
              <p>
                Every product starts with what it does on court: support,
                grip, protection, and freedom to move.
              </p>
            </li>
            <li>
              <span className="principles__index">02</span>
              <h3>Built for volleyball</h3>
              <p>
                Made for the movements of the game — the dig, the dive, the
                block, the landing — not adapted from another sport.
              </p>
            </li>
            <li>
              <span className="principles__index">03</span>
              <h3>Tested before release</h3>
              <p>
                Samples are worn and rated by players before a product joins
                a drop.
              </p>
            </li>
          </ol>
        </div>
      </section>

      <section className="statement" aria-labelledby="statement-title">
        <p className="eyebrow eyebrow--slash">Next point</p>
        <h2 id="statement-title" className="statement__title">
          Play. Practice.
          <br />
          Compete. Repeat.
        </h2>
        <Link className="button button--dark" href="/shop">
          Shop the drop <ArrowRight aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}

async function HeroProduct() {
  await connection();
  const products = await getPublishedProducts();
  const featured = products.find((product) => product.images.length);
  if (!featured) return null;
  return (
    <Link
      className="hero__product"
      href={`/products/${featured.slug}`}
      aria-label={`${featured.name} — view product`}
    >
      <ProductMedia
        image={featured.images[0]}
        name={featured.name}
        sizes="(max-width: 900px) 80vw, 40vw"
        priority
      />
      <span className="hero__product-label">{featured.name}</span>
    </Link>
  );
}

async function FeaturedProducts() {
  await connection();
  const products = await getPublishedProducts();
  if (!products.length) {
    const settings = await getStoreSettings();
    return <EmptyDrop instagram={instagramUrl(settings.instagramHandle)} />;
  }
  const featured = products.slice(0, 4);
  const availability = await getPublicAvailabilityByVariant(
    featured.flatMap((product) => product.variants.map((variant) => variant.id)),
  );
  return (
    <div className="product-grid">
      {featured.map((product, index) => (
        <ProductCard
          key={product.slug}
          product={product}
          availability={productAvailability(product, availability)}
          priority={index < 2}
        />
      ))}
    </div>
  );
}
