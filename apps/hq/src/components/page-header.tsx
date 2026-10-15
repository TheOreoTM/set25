import { Search } from "lucide-react";
import { AccountMenu } from "./account-menu";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <p className="breadcrumb">{eyebrow}</p>
        <h1>{title}</h1>
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
