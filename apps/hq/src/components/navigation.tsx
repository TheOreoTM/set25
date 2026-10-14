"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileArchive,
  Handshake,
  House,
  Import,
  Menu,
  PackageSearch,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import wordmark from "@set25/brand/assets/SET25_Primary_Wordmark_White.svg";
import monogram from "@set25/brand/assets/S25_Monogram.svg";

const groups = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: House }],
  },
  {
    label: "Commerce",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingBag },
      { label: "Products", href: "/products", icon: Shirt },
      { label: "Stock", href: "/stock", icon: Boxes },
      { label: "Preorders", href: "/preorders", icon: ClipboardList },
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Teams", href: "/teams", icon: Building2 },
    ],
  },
  {
    label: "Supply",
    items: [
      { label: "Suppliers", href: "/suppliers", icon: Truck },
      { label: "Imports", href: "/imports", icon: Import },
      { label: "Samples", href: "/samples", icon: PackageSearch },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "Money", href: "/money", icon: CircleDollarSign },
      { label: "Tasks", href: "/tasks", icon: CalendarDays },
      { label: "Ambassadors", href: "/ambassadors", icon: Handshake },
      { label: "Content", href: "/content", icon: Sparkles },
      { label: "Files", href: "/files", icon: FileArchive },
    ],
  },
  {
    label: "System",
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

function NavigationLinks({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="nav-groups" aria-label="HQ navigation">
      {groups.map((group) => (
        <div className="nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                className={active ? "nav-link is-active" : "nav-link"}
                href={item.href}
                key={item.href}
                aria-current={active ? "page" : undefined}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
                {mobile ? (
                  <ChevronRight className="nav-chevron" aria-hidden="true" />
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

export function Navigation() {
  return (
    <>
      <aside className="sidebar">
        <Link
          className="sidebar-brand"
          href="/"
          aria-label="SET25 HQ dashboard"
        >
          <Image src={wordmark} alt="SET25" width={132} height={44} priority />
          <span>HQ / OPERATIONS</span>
        </Link>
        <NavigationLinks />
        <div className="sidebar-footer">
          <span className="monogram-frame">
            <Image src={monogram} alt="" width={38} height={38} />
          </span>
          <div>
            <strong>SET25 HQ</strong>
            <span>Built for the next point.</span>
          </div>
        </div>
      </aside>

      <header className="mobile-bar">
        <Link href="/" aria-label="SET25 HQ dashboard">
          <Image src={wordmark} alt="SET25" width={102} height={34} priority />
        </Link>
        <details className="mobile-menu">
          <summary>
            <Menu className="menu-open" aria-hidden="true" />
            <X className="menu-close" aria-hidden="true" />
            <span className="sr-only">Toggle navigation</span>
          </summary>
          <div className="mobile-drawer">
            <div className="mobile-drawer-head">
              <span>HQ / NAVIGATION</span>
              <span>SET25</span>
            </div>
            <NavigationLinks mobile />
          </div>
        </details>
      </header>
    </>
  );
}
