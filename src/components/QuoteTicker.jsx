import { useMemo } from "react";

import { HOCKEY_QUOTES } from "../quotes.js";
import { shuffleQuoteSequence } from "./quoteTickerSequence.js";

function QuoteGroup({ quotes, duplicate = false }) {
  return (
    <span
      className={`hl-quote-ticker__group${
        duplicate ? " hl-quote-ticker__group--duplicate" : ""
      }`}
      aria-hidden="true"
    >
      {quotes.map((quote, index) => (
        <span
          className="hl-quote-ticker__item"
          key={`${quote.author}-${quote.text}-${index}`}
        >
          <span className="hl-quote-ticker__text">“{quote.text}”</span>
          <span className="hl-quote-ticker__author">— {quote.author}</span>
        </span>
      ))}
    </span>
  );
}

function QuoteTicker() {
  const quotes = useMemo(() => shuffleQuoteSequence(HOCKEY_QUOTES), []);
  const characterCount = quotes.reduce(
    (total, quote) => total + quote.text.length + quote.author.length,
    0
  );
  const durationSeconds = Math.max(300, Math.round(characterCount / 7));

  if (quotes.length === 0) return null;

  return (
    <div
      className="hl-quote-ticker"
      role="region"
      aria-label="Hockey quote ticker. Hover or focus to pause."
      tabIndex={0}
      title="Hockey quotes — hover or focus to pause"
      style={{ "--hl-quote-ticker-duration": `${durationSeconds}s` }}
    >
      <div className="hl-quote-ticker__viewport">
        <div className="hl-quote-ticker__track">
          <QuoteGroup quotes={quotes} />
          <QuoteGroup quotes={quotes} duplicate />
        </div>
      </div>
    </div>
  );
}

export default QuoteTicker;
