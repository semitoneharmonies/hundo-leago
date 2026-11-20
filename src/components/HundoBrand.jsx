import { useLayoutEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { hundoScreenMounted, switchHundoScreen } from "./hundoScreenTransition.js";
import "./HundoBrand.css";

export function HundoBrand({ mode, homeTarget, switchTarget, homeTitle }) {
  const { state } = useLocation();
  const navigate = useNavigate();
  useLayoutEffect(() => { hundoScreenMounted(mode); }, [mode]);
  const other = mode === "daily" ? "leago" : "daily";
  const switching = state?.hundoBrandFrom === other && !state?.hundoScreenWave;
  const name = mode === "daily" ? "Hundo Daily" : "Hundo Leago";
  const switchLabel = `Switch to Hundo ${other === "daily" ? "Daily" : "Leago"}`;
  return <div className={`hl-brand hl-product-brand${switching ? " is-switching" : ""}`} data-mode={mode}>
    <Link className="hl-mode-toggle" to={switchTarget} state={{ hundoBrandFrom: mode }}
      onClick={event => { void switchHundoScreen(event, { mode, to: switchTarget, navigate }); }}
      aria-label={switchLabel} title={switchLabel}>
      <span className="hl-mode-badge hl-mode-badge--leago" aria-hidden="true">HL</span>
      <span className="hl-mode-badge hl-mode-badge--daily" aria-hidden="true">HD</span>
    </Link>
    <Link className="hl-brand__name hl-wordmark" to={homeTarget} aria-label={name} title={homeTitle || name}>
      <span className="hl-wordmark__label hl-wordmark__label--leago" aria-hidden="true">Hundo<b>·</b>Leago</span>
      <span className="hl-wordmark__label hl-wordmark__label--daily" aria-hidden="true">Hundo<b>·</b>Daily</span>
    </Link>
  </div>;
}
