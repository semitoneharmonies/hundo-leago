import "./TipJarNavLabel.css";

export function TipJarNavLabel({ logoOnly = false }) {
  return <span className="hl-tipjar-nav-label">{!logoOnly && "Play "}<span className="hl-tipjar-wordmark" aria-hidden="true"><span>tip</span><span>jar</span><sup>✳</sup></span></span>;
}
