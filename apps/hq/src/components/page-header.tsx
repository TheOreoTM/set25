import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { AccountMenu } from "./account-menu";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  titleMeta?: ReactNode;
  description?: string;
};

export function PageHeader({
  eyebrow,
  title,
  titleMeta,
  description,
}: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="breadcrumb">{eyebrow}</p>
        <div className="page-title-row">
          <h1>{title}</h1>
          {titleMeta}
        </div>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      <div className="header-actions">
        <button
          className="command-trigger"
          type="button"
          aria-label="Search HQ (coming soon)"
        >
          <Search aria-hidden="true" />
          <span>Search HQ</span>
          <kbd>⌘ K</kbd>
        </button>
        <AccountMenu />
      </div>
    </header>
  );
}
