import Image from "next/image";
import Link from "next/link";
import wordmark from "@set25/brand/assets/SET25_Primary_Wordmark_White.svg";
import { CartLink } from "./cart-link";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__logo" href="/" aria-label="SET25 home">
          <Image src={wordmark} alt="SET25" width={112} height={37} priority />
        </Link>
        <nav className="site-nav" aria-label="Main">
          <Link href="/shop">Shop</Link>
          <Link href="/about">About</Link>
        </nav>
        <CartLink />
      </div>
    </header>
  );
}
