import Link from "next/link";
import { formatMVR, type PublicAvailability } from "@set25/shared";
import type { PublicProduct } from "@/lib/catalog";
import { AvailabilityLabel } from "./availability";
import { ProductMedia } from "./product-media";

export function ProductCard({
  product,
  availability,
  priority = false,
}: {
  product: PublicProduct;
  availability: PublicAvailability;
  priority?: boolean;
}) {
  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-card__link">
        <ProductMedia
          image={product.images[0]}
          name={product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
        />
        <div className="product-card__body">
          <p className="product-card__line">
            {product.brandLine
              ? `${product.categoryLabel} · ${product.brandLine}`
              : product.categoryLabel}
          </p>
          <h3 className="product-card__name">{product.name}</h3>
          <p className="product-card__price">
            {product.priceVaries ? "From " : ""}
            {formatMVR(product.priceFrom)}
          </p>
          <AvailabilityLabel value={availability} />
        </div>
      </Link>
    </article>
  );
}

export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="product-grid" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="product-card product-card--skeleton" key={index}>
          <div className="product-media skeleton" />
          <div className="product-card__body">
            <div className="skeleton skeleton--line" />
            <div className="skeleton skeleton--title" />
          </div>
        </div>
      ))}
    </div>
  );
}
