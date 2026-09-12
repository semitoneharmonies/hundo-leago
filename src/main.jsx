import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppProviders } from "./app/AppProviders.jsx";
import { consumeActionTokenFragment } from "./features/accounts/actionToken.js";

const initialActionToken = consumeActionTokenFragment();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders initialActionToken={initialActionToken}>
      <App />
    </AppProviders>
  </StrictMode>
);
