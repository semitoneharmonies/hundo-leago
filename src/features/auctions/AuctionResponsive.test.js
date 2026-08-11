import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve("src/features/auctions/AuctionPages.module.css"),
  "utf8"
);
const narrowCss = stylesheet.slice(stylesheet.indexOf("@media (max-width: 42rem)"));

describe("auction commissioner narrow layout", () => {
  it("keeps administration cards, forms, and action controls inside one reachable column", () => {
    expect(stylesheet).toMatch(
      /\.adminBid\s*{[^}]*min-width:\s*0;/s
    );
    expect(stylesheet).toMatch(
      /\.adminEditor fieldset\s*{[^}]*min-width:\s*0;/s
    );
    expect(narrowCss).toMatch(
      /\.viewerTeamGrid,\s*\.adminBidGrid\s*{\s*grid-template-columns:\s*1fr;/
    );
    expect(narrowCss).toMatch(
      /\.actions\s*{\s*display:\s*grid;\s*grid-template-columns:\s*1fr;/
    );
    expect(narrowCss).toMatch(
      /\.actions > \*\s*{\s*width:\s*100%;/
    );
  });
});
