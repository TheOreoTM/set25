import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import wordmark from "@set25/brand/assets/SET25_Primary_Wordmark_White.svg";
import { getStoreSettings, instagramUrl, whatsAppUrl } from "@/lib/settings";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <Image src={wordmark} alt="SET25" width={150} height={50} />
          <p className="site-footer__tagline">Built for the next point.</p>
          <p className="site-footer__line">Play. Practice. Compete. Repeat.</p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <p className="eyebrow">Store</p>
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
          <Link href="/cart">Cart</Link>
        </nav>
        <div className="site-footer__nav">
          <p className="eyebrow">Contact</p>
          <Suspense fallback={null}>
            <FooterContact />
          </Suspense>
        </div>
      </div>
      <p className="site-footer__legal">© SET25 · Maldives</p>
    </footer>
  );
}

async function FooterContact() {
  await connection();
  const settings = await getStoreSettings();
  const instagram = instagramUrl(settings.instagramHandle);
  const whatsapp = whatsAppUrl(settings.supportWhatsApp);
  if (!instagram && !whatsapp && !settings.supportPhone)
    return <p className="muted">Contact details coming soon.</p>;
  return (
    <>
      {instagram ? (
        <a href={instagram} target="_blank" rel="noreferrer">
          Instagram
        </a>
      ) : null}
      {whatsapp ? (
        <a href={whatsapp} target="_blank" rel="noreferrer">
          WhatsApp
        </a>
      ) : null}
      {settings.supportPhone ? (
        <a href={`tel:${settings.supportPhone.replace(/\s/g, "")}`}>
          {settings.supportPhone}
        </a>
      ) : null}
    </>
  );
}
