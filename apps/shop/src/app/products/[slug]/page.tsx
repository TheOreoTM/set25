import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ArrowLeft } from "lucide-react";
import { formatMVR } from "@set25/shared";
import {
  getPublicAvailabilityByVariant,
  getPublishedProduct,
} from "@/lib/catalog";
import { getStoreSettings } from "@/lib/settings";
import { ProductGallery } from "@/components/product-gallery";
import { ProductPurchase } from "@/components/product-purchase";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) return { title: "Product not found" };
  const description =
    product.shortDescription ??
    `${product.name} by SET25. ${product.categoryLabel}, ${formatMVR(product.priceFrom)}.`;
  const image = product.images[0];
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title: `${product.name} · SET25`,
      description,
      url: `/products/${product.slug}`,
      images: image ? [{ url: image.url, alt: image.alt }] : undefined,
    },
  };
}

export default function ProductPage({ params }: { params: Params }) {
  return (
    <main className="page page--product">
      <Suspense fallback={<ProductSkeleton />}>
        <ProductDetail params={params} />
      </Suspense>
    </main>
  );
}

async function ProductDetail({ params }: { params: Params }) {
  await connection();
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) notFound();
  const [availability, settings] = await Promise.all([
    getPublicAvailabilityByVariant(product.variants.map((variant) => variant.id)),
    getStoreSettings(),
  ]);
  return (
    <>
      <Link className="text-link back-link" href="/shop">
        <ArrowLeft aria-hidden="true" /> Shop
      </Link>
      <article className="product-detail">
        <ProductGallery images={product.images} name={product.name} />
        <div className="product-detail__info">
          <p className="eyebrow">
            {product.brandLine
              ? `${product.categoryLabel} · ${product.brandLine}`
              : product.categoryLabel}
          </p>
          <h1 className="product-detail__title">{product.name}</h1>
          {product.shortDescription ? (
            <p className="product-detail__lede">{product.shortDescription}</p>
          ) : null}
          <ProductPurchase
            slug={product.slug}
            name={product.name}
            variants={product.variants}
            availability={availability}
            image={product.images[0] ?? null}
            storeOpen={settings.storeOpen}
          />
          {product.description ? (
            <section className="product-detail__description" aria-labelledby="details-title">
              <h2 id="details-title" className="eyebrow">
                Details
              </h2>
              {product.description.split(/\n{2,}/).map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </section>
          ) : null}
        </div>
      </article>
    </>
  );
}

function ProductSkeleton() {
  return (
    <div className="product-detail" aria-hidden="true">
      <div className="product-media product-media--detail skeleton" />
      <div className="product-detail__info">
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--display" />
        <div className="skeleton skeleton--block" />
      </div>
    </div>
  );
}
