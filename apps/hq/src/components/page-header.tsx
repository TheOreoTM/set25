import type { ReactNode } from "react";

type PageHeaderProps = {
  eyebrow: string;
  title: string;
  titleMeta?: ReactNode;
  description?: string;
};

// Static on purpose: loading skeletons render the same header, so a
// navigation shows the real page title before any data arrives.
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
    </header>
  );
}
