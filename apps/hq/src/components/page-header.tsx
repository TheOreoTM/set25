import { Search } from "lucide-react";

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
        <button
          className="account-trigger"
          type="button"
          aria-label="Staff account menu (coming soon)"
        >
          <span className="avatar">AM</span>
          <span className="account-copy">
            <strong>Aishath</strong>
            <small>HQ staff</small>
          </span>
        </button>
      </div>
    </header>
  );
}
