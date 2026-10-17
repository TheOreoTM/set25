import Image from "next/image";
import monogram from "@set25/brand/assets/S25_Monogram.svg";

export function ProductMediaPlaceholder({ name }: { name: string }) {
  return (
    <div
      className="product-media__placeholder"
      role="img"
      aria-label={`${name} — image coming soon`}
    >
      <Image src={monogram} alt="" width={72} height={72} />
    </div>
  );
}
