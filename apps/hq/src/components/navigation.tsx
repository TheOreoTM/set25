"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Boxes,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ClipboardList,
  FileArchive,
  FileText,
  Handshake,
  House,
  Import,
  LayoutGrid,
  ListChecks,
  LogOut,
  PackageSearch,
  Settings,
  Shirt,
  ShoppingBag,
  Sparkles,
  Store,
  Truck,
  UserRound,
  Users,
  X,
} from "lucide-react";
import wordmark from "@set25/brand/assets/SET25_Primary_Wordmark_White.svg";
import monogram from "@set25/brand/assets/S25_Monogram.svg";
import { signOutAction } from "@/lib/auth/actions";
import { staffRoleLabels, type StaffIdentity } from "@/lib/auth/types";

type NavItem = {
  label: string;
  href: string;
  icon: typeof House;
  ownerOnly?: boolean;
};

// Pre-launch work comes first. Launch-only areas stay reachable but grouped
// together so they do not crowd the daily routine.
const groups: { label: string; items: NavItem[] }[] = [
  {
    label: "Pre-launch",
    items: [
      { label: "Today", href: "/", icon: House },
      { label: "Waitlist", href: "/waitlist", icon: ListChecks },
      { label: "Samples", href: "/samples", icon: PackageSearch },
      { label: "Content", href: "/content", icon: Sparkles },
      { label: "Tasks", href: "/tasks", icon: CalendarDays },
    ],
  },
  {
    label: "Supply",
    items: [
      { label: "Products", href: "/products", icon: Shirt },
      { label: "Suppliers", href: "/suppliers", icon: Truck },
      { label: "Purchase Orders", href: "/purchase-orders", icon: FileText },
      { label: "Imports", href: "/imports", icon: Import },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Ambassadors", href: "/ambassadors", icon: Handshake },
      { label: "Customers", href: "/customers", icon: Users },
      { label: "Teams", href: "/teams", icon: Building2 },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "Money", href: "/money", icon: CircleDollarSign },
      { label: "Files", href: "/files", icon: FileArchive },
    ],
  },
  {
    label: "Launch",
    items: [
      { label: "Orders", href: "/orders", icon: ShoppingBag },
      { label: "Preorders", href: "/preorders", icon: ClipboardList },
      { label: "Stock", href: "/stock", icon: Boxes },
      { label: "Store", href: "/settings/store", icon: Store },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Settings", href: "/settings", icon: Settings },
      {
        label: "Staff access",
        href: "/settings/staff",
        icon: Users,
        ownerOnly: true,
      },
    ],
  },
];

/** The bottom tab bar on mobile. Everything else lives in the More sheet. */
const tabs: NavItem[] = [
  { label: "Today", href: "/", icon: House },
  { label: "Waitlist", href: "/waitlist", icon: ListChecks },
  { label: "Samples", href: "/samples", icon: PackageSearch },
  { label: "Content", href: "/content", icon: Sparkles },
];
const tabHrefs = new Set(tabs.map((tab) => tab.href));

const staffRoutes = new Set([
  "/",
  "/waitlist",
  "/orders",
  "/products",
  "/stock",
  "/preorders",
  "/customers",
  "/teams",
  "/suppliers",
  "/purchase-orders",
  "/imports",
  "/samples",
  "/money",
  "/tasks",
  "/ambassadors",
  "/content",
  "/files",
]);

function visibleGroups(staff: StaffIdentity) {
  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) =>
          (!item.ownerOnly || staff.role === "OWNER") &&
          (staff.role !== "STAFF" || staffRoutes.has(item.href)),
      ),
    }))
    .filter((group) => group.items.length);
}

// Highlight only the most specific match, so /settings/store does not light
// up both Settings and Store.
function activeHrefFor(pathname: string) {
  return groups
    .flatMap((group) => group.items.map((item) => item.href))
    .filter(
      (href) =>
        pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)),
    )
    .sort((a, b) => b.length - a.length)[0];
}

function NavigationLinks({
  staff,
  exclude,
  onNavigate,
}: {
  staff: StaffIdentity;
  exclude?: Set<string>;
  onNavigate?: () => void;
}) {
  const activeHref = activeHrefFor(usePathname());
  return (
    <nav className="nav-groups" aria-label="HQ navigation">
      {visibleGroups(staff).map((group) => {
        const items = group.items.filter((item) => !exclude?.has(item.href));
        if (!items.length) return null;
        return (
          <div className="nav-group" key={group.label}>
            <p>{group.label}</p>
            {items.map((item) => {
              const Icon = item.icon;
              const active = item.href === activeHref;
              return (
                <Link
                  className={active ? "nav-link is-active" : "nav-link"}
                  href={item.href}
                  key={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                >
                  <Icon aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <Link className="sidebar-brand" href="/" aria-label="SET25 HQ today">
      <Image src={wordmark} alt="SET25" width={132} height={44} priority />
      <span>HQ / OPERATIONS</span>
    </Link>
  );
}

function MobileBar() {
  return (
    <header className="mobile-bar">
      <Link href="/" aria-label="SET25 HQ today">
        <Image src={wordmark} alt="SET25" width={102} height={34} priority />
      </Link>
    </header>
  );
}

function TabLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      className={active ? "tab-link is-active" : "tab-link"}
      href={item.href}
      aria-current={active ? "page" : undefined}
    >
      <Icon aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}

export function Navigation({ staff }: { staff: StaffIdentity }) {
  const pathname = usePathname();
  const activeHref = activeHrefFor(pathname);
  // The sheet remembers the path it was opened on, so any navigation closes
  // it without an effect resetting state.
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const moreOpen = openedOn === pathname;
  const close = () => setOpenedOn(null);
  const sheet = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = sheet.current;
    if (!dialog) return;
    if (moreOpen && !dialog.open) dialog.showModal();
    if (!moreOpen && dialog.open) dialog.close();
  }, [moreOpen]);

  return (
    <>
      <aside className="sidebar">
        <SidebarBrand />
        <NavigationLinks staff={staff} />
        <div className="sidebar-footer">
          <span className="monogram-frame">
            <Image src={monogram} alt="" width={38} height={38} />
          </span>
          <Link className="sidebar-account" href="/account">
            <strong>{staff.name}</strong>
            <span>{staffRoleLabels[staff.role]}</span>
          </Link>
          <form action={signOutAction}>
            <button className="sidebar-sign-out" type="submit">
              <LogOut aria-hidden="true" />
              <span className="sr-only">Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      <MobileBar />

      <nav className="tab-bar" aria-label="Primary">
        {tabs.map((item) => (
          <TabLink
            item={item}
            active={!moreOpen && item.href === activeHref}
            key={item.href}
          />
        ))}
        <button
          className={
            moreOpen || (activeHref && !tabHrefs.has(activeHref)) ||
            pathname === "/account"
              ? "tab-link is-active"
              : "tab-link"
          }
          type="button"
          aria-haspopup="dialog"
          aria-expanded={moreOpen}
          onClick={() => setOpenedOn(moreOpen ? null : pathname)}
        >
          <LayoutGrid aria-hidden="true" />
          <span>More</span>
        </button>
      </nav>

      <dialog
        className="more-sheet"
        ref={sheet}
        aria-label="More"
        onClose={close}
        onClick={(event) => {
          // A click on the backdrop lands on the dialog element itself.
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="more-sheet-panel">
          <div className="more-sheet-head">
            <span>HQ / MORE</span>
            <button type="button" onClick={close}>
              <X aria-hidden="true" />
              <span className="sr-only">Close</span>
            </button>
          </div>
          <NavigationLinks staff={staff} exclude={tabHrefs} onNavigate={close} />
          <div className="more-account">
            <div>
              <strong>{staff.name}</strong>
              <span>{staffRoleLabels[staff.role]}</span>
            </div>
            <div className="more-account-actions">
              <Link href="/account" onClick={close}>
                <UserRound aria-hidden="true" /> Account
              </Link>
              <form action={signOutAction}>
                <button type="submit">
                  <LogOut aria-hidden="true" /> Sign out
                </button>
              </form>
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}

/**
 * Static stand-in rendered while the staff session streams in. It keeps the
 * shell (and the tab bar's main links) in the prerendered page, so a cold
 * load paints immediately.
 */
export function NavigationFallback() {
  return (
    <>
      <aside className="sidebar" aria-busy="true">
        <SidebarBrand />
        <div className="nav-groups nav-groups--loading" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <span className="nav-skeleton" key={index} />
          ))}
        </div>
      </aside>
      <MobileBar />
      <nav className="tab-bar" aria-label="Primary">
        {tabs.map((item) => (
          <TabLink item={item} active={false} key={item.href} />
        ))}
        <span className="tab-link" aria-disabled="true">
          <LayoutGrid aria-hidden="true" />
          <span>More</span>
        </span>
      </nav>
    </>
  );
}
