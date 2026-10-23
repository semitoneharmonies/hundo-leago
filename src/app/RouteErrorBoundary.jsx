import React from "react";
import { useLocation } from "react-router-dom";

import { RouteErrorPage } from "./RouteStatePage.jsx";

class SafeRouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    // React reports component errors in development; the UI remains non-sensitive.
  }

  render() {
    return this.state.failed ? <RouteErrorPage /> : this.props.children;
  }
}

export function RouteErrorBoundary({ children }) {
  const location = useLocation();
  return (
    <SafeRouteErrorBoundary key={location.key}>
      {children}
    </SafeRouteErrorBoundary>
  );
}
