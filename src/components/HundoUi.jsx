import React from "react";
import { AlertTriangle, ArrowRight, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

function classes(...values) {
  return values.filter(Boolean).join(" ");
}

export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  id,
}) {
  return (
    <header className="hl-page-heading">
      <div className="hl-page-heading__copy">
        {eyebrow && <p className="hl-eyebrow">{eyebrow}</p>}
        <h1 id={id}>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="hl-page-heading__actions">{actions}</div>}
    </header>
  );
}

export function Surface({ as = "section", className, children, ...props }) {
  return React.createElement(
    as,
    { className: classes("hl-surface", className), ...props },
    children
  );
}

export function PanelHeading({ eyebrow, title, description, action, id }) {
  return (
    <header className="hl-panel-heading">
      <div>
        {eyebrow && <p className="hl-eyebrow">{eyebrow}</p>}
        <h2 id={id}>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="hl-panel-heading__action">{action}</div>}
    </header>
  );
}

export function TextLink({ to, children, className }) {
  return (
    <Link className={classes("hl-text-link", className)} to={to}>
      <span>{children}</span>
      <ArrowRight aria-hidden="true" />
    </Link>
  );
}

export function StatusBadge({ tone = "neutral", children, className }) {
  return (
    <span className={classes("hl-status-badge", `is-${tone}`, className)}>
      {children}
    </span>
  );
}

export function LoadingBlock({ children = "Loading…" }) {
  return (
    <div className="hl-state-block" role="status">
      <LoaderCircle className="hl-state-block__spinner" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

export function EmptyBlock({ title, children }) {
  return (
    <div className="hl-state-block hl-state-block--empty">
      <h3>{title}</h3>
      {children && <span>{children}</span>}
    </div>
  );
}

export function ErrorBlock({ error, fallback }) {
  return (
    <div className="hl-state-block hl-state-block--error" role="alert">
      <AlertTriangle aria-hidden="true" />
      <div>
        <strong>
          {error?.message || fallback || "The request could not be completed."}
        </strong>
        {error?.requestId && <span>Request ID: {error.requestId}</span>}
      </div>
    </div>
  );
}
