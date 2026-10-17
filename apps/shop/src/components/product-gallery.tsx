"use client";

import Image from "next/image";
import { useState } from "react";
import type { PublicImage } from "@/lib/catalog";
import { ProductMediaPlaceholder } from "./product-media-placeholder";

export function ProductGallery({
  images,
  name,
}: {
  images: PublicImage[];
  name: string;
}) {
  const [active, setActive] = useState(0);
  const current = images[active];
  return (
    <div className="gallery">
      <div className="product-media product-media--detail">
        {current ? (
          <Image
            key={current.url}
            src={current.url}
            alt={current.alt}
            fill
            sizes="(max-width: 900px) 100vw, 55vw"
            priority={active === 0}
          />
        ) : (
          <ProductMediaPlaceholder name={name} />
        )}
      </div>
      {images.length > 1 ? (
        <div className="gallery__thumbs" role="group" aria-label="Product images">
          {images.map((image, index) => (
            <button
              key={image.url}
              type="button"
              className="gallery__thumb"
              aria-label={`Show image ${index + 1} of ${images.length}`}
              aria-pressed={index === active}
              onClick={() => setActive(index)}
            >
              <Image src={image.url} alt="" fill sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
