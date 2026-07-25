import { Link } from "react-router-dom";

function RouteStatePage({ title, message, actionLabel = "Return home" }) {
  return (
    <main
      className="hl-page hl-page--narrow"
      aria-labelledby="route-state-title"
    >
      <section className="hl-surface hl-route-state">
        <p className="hl-eyebrow">Navigation</p>
        <h1 id="route-state-title">{title}</h1>
        <p>{message}</p>
        <Link className="hl-button hl-button--primary" to="/">
          {actionLabel}
        </Link>
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
      title="This page could not be displayed"
      message="Please return home and try again. No league data was changed."
    />
  );
}
