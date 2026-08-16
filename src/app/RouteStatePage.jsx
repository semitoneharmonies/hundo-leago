import { Link, useLocation } from "react-router-dom";

function RouteStatePage({
  title,
  message,
  actionLabel = "Return home",
  reloadCurrentPage = false,
}) {
  const location = useLocation();
  const currentPath = `${location.pathname}${location.search}${location.hash}`;
  return (
    <main
      className="hl-page hl-page--narrow"
      aria-labelledby="route-state-title"
    >
      <section className="hl-surface hl-route-state">
        <p className="hl-eyebrow">Navigation</p>
        <h1 id="route-state-title">{title}</h1>
        <p>{message}</p>
        {reloadCurrentPage ? (
          <a className="hl-button hl-button--primary" href={currentPath}>
            {actionLabel}
          </a>
        ) : (
          <Link className="hl-button hl-button--primary" to="/">
            {actionLabel}
          </Link>
        )}
      </section>
    </main>
  );
}

export function NotFoundPage() {
  return (
    <RouteStatePage
      title="Page not found"
      message="That Hundo Leago page does not exist."
    />
  );
}

export function RouteErrorPage() {
  return (
    <RouteStatePage
      title="This page needs to reload"
      message="Hundo Leago could not finish loading this page. Reload to use the current application version. No league data was changed."
      actionLabel="Reload page"
      reloadCurrentPage
    />
  );
}
