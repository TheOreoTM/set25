import Image from "next/image";
import type { PublicImage } from "@/lib/catalog";
import { ProductMediaPlaceholder } from "./product-media-placeholder";

/** Product image with a branded, non-photographic placeholder fallback. */
export function ProductMedia({
  image,
  name,
  sizes,
  priority = false,
}: {
  image: PublicImage | undefined;
  name: string;
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div className="product-media">
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
        />
      ) : (
        <ProductMediaPlaceholder name={name} />
      )}
    </div>
  );
}
