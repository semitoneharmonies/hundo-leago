import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  resolve("src/features/freeAgentDraft/FreeAgentDraftPage.module.css"),
  "utf8"
);
const compactCss = stylesheet.slice(
  stylesheet.indexOf("@media (max-width: 34rem)")
);
const tabletCss = stylesheet.slice(
  stylesheet.indexOf("@media (max-width: 56rem)"),
  stylesheet.indexOf("@media (max-width: 34rem)")
);

describe("compact Candidate Card responsive layout", () => {
  it("uses the five-column desktop row without action-button columns", () => {
    expect(stylesheet).toMatch(
      /\.compactColumnHeader,\s*\.compactSlot\s*{[^}]*grid-template-columns:[^}]*4\.2rem[^}]*11rem[^}]*6\.5rem[^}]*5\.8rem[^}]*8\.5rem/s
    );
    expect(stylesheet).toMatch(/\.compactRowError\s*{[^}]*grid-column:\s*2 \/ -1;/s);
  });

  it("keeps compact rows usable on tablet and phone widths", () => {
    expect(tabletCss).toMatch(
      /\.compactColumnHeader,\s*\.compactSlot\s*{[^}]*grid-template-columns:/s
    );
    expect(compactCss).toMatch(/\.candidateToolbar\s*{\s*grid-template-columns:\s*1fr;/);
    expect(compactCss).toMatch(/\.compactColumnHeader\s*{\s*display:\s*none;/);
    expect(compactCss).toMatch(
      /\.compactSlot\s*{[^}]*grid-template-columns:\s*3\.35rem minmax\(0, 1fr\) 5\.5rem;/s
    );
  });
});
