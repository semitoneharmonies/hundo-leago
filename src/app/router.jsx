import { Route, Routes } from "react-router-dom";

import { RouteErrorBoundary } from "./RouteErrorBoundary.jsx";
import { NotFoundPage } from "./RouteStatePage.jsx";

export function ApplicationRoutes({ children }) {
  return (
    <RouteErrorBoundary>
      <Routes>
        {children}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </RouteErrorBoundary>
  );
}
