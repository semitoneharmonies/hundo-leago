import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AppProviders } from "./app/AppProviders.jsx";
import {
  consumeActionTokenFragment,
  watchActionTokenFragments,
} from "./features/accounts/actionToken.js";

const initialActionToken = consumeActionTokenFragment();
const stopWatchingActionTokens = watchActionTokenFragments();
if (import.meta.hot) import.meta.hot.dispose(stopWatchingActionTokens);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppProviders initialActionToken={initialActionToken}>
      <App />
    </AppProviders>
  </StrictMode>
);
