const GROUPS = Object.freeze({
  even: "Even splits",
  hockey: "Hockey stripes",
  pattern: "Patterns",
});

export const DEFAULT_TWO_TEAM_PATTERN = "even-two";
export const DEFAULT_THREE_TEAM_PATTERN = "even-three";

function bands(...entries) {
  return `linear-gradient(180deg, ${entries
    .map(([colour, start, end]) => `${colour} ${start}% ${end}%`)
    .join(", ")})`;
}

function svgUrl(content) {
  return `url("data:image/svg+xml,${encodeURIComponent(content)}")`;
}

function svgPattern(background, body, viewBox = "0 0 480 180") {
  return svgUrl(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" preserveAspectRatio="none">` +
      `<rect width="100%" height="100%" fill="${background}"/>${body}</svg>`
  );
}

function template(
  id,
  name,
  group,
  colourCount,
  paint,
  { size = "cover", repeat = "no-repeat" } = {}
) {
  return Object.freeze({
    id,
    name,
    group,
    colourCount,
    paint,
    size,
    repeat,
  });
}

function tiger({ one, two }) {
  return svgPattern(
    one,
    `<g fill="${two}">` +
      `<path d="M-18-8H30C32 20 44 50 70 76C48 63 18 39-18 10Z"/>` +
      `<path d="M62-8H110C112 20 124 51 150 78C128 64 98 40 62 10Z"/>` +
      `<path d="M142-8H190C192 20 204 49 230 74C208 62 178 38 142 9Z"/>` +
      `<path d="M222-8H270C272 20 284 51 310 78C288 64 258 40 222 10Z"/>` +
      `<path d="M302-8H350C352 20 364 49 390 74C368 62 338 38 302 9Z"/>` +
      `<path d="M382-8H430C432 20 444 51 470 78C448 64 418 40 382 10Z"/>` +
      `<path d="M42 188H90C92 160 104 129 130 102C108 116 78 140 42 170Z"/>` +
      `<path d="M122 188H170C172 160 184 131 210 106C188 118 158 142 122 171Z"/>` +
      `<path d="M202 188H250C252 160 264 129 290 102C268 116 238 140 202 170Z"/>` +
      `<path d="M282 188H330C332 160 344 131 370 106C348 118 318 142 282 171Z"/>` +
      `<path d="M362 188H410C412 160 424 129 450 102C428 116 398 140 362 170Z"/>` +
      `<path d="M442 188H490C492 160 504 131 530 106C508 118 478 142 442 171Z"/>` +
    `</g>`
  );
}

function leopard({ one, two, three }) {
  const rosettes = [
    [42, 36, 18, 11, -8],
    [118, 28, 22, 13, 10],
    [205, 45, 19, 12, -14],
    [300, 30, 24, 14, 6],
    [408, 46, 20, 12, -10],
    [76, 112, 23, 14, 12],
    [174, 126, 18, 11, -6],
    [266, 104, 25, 14, 8],
    [368, 124, 21, 13, -12],
    [458, 106, 17, 10, 5],
  ]
    .map(
      ([cx, cy, rx, ry, rotate]) =>
        `<g transform="rotate(${rotate} ${cx} ${cy})">` +
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${two}" stroke-width="8" stroke-dasharray="30 8 18 10"/>` +
        `<ellipse cx="${cx}" cy="${cy}" rx="${Math.max(5, rx - 11)}" ry="${Math.max(4, ry - 7)}" fill="${three}"/>` +
        `</g>`
    )
    .join("");
  return svgPattern(one, rosettes);
}

function cowhide({ one, two }) {
  return svgPattern(
    one,
    `<g fill="${two}">` +
      `<path d="M-15 18C17-8 72-5 88 25C103 52 72 71 39 64C7 58-20 48-15 18Z"/>` +
      `<path d="M128-12C166-18 202 3 197 34C192 62 157 73 126 54C101 39 101 3 128-12Z"/>` +
      `<path d="M260 12C294-7 344 4 354 35C362 62 329 82 296 70C260 57 239 32 260 12Z"/>` +
      `<path d="M407-10C449-17 493 5 497 40C499 65 459 76 427 59C399 45 385 6 407-10Z"/>` +
      `<path d="M42 111C75 86 122 97 130 129C137 158 106 183 69 177C31 171 18 130 42 111Z"/>` +
      `<path d="M194 103C224 82 267 94 272 126C277 155 246 176 216 166C184 155 169 121 194 103Z"/>` +
      `<path d="M344 111C374 88 424 97 434 130C444 160 407 183 371 173C337 164 320 130 344 111Z"/>` +
    `</g>`
  );
}

function camouflage({ one, two, three }) {
  return svgPattern(
    one,
    `<g fill="${two}">` +
      `<path d="M-20 30C29-7 85 4 112 35C132 58 105 81 71 76C34 70 7 87-20 70Z"/>` +
      `<path d="M196-10C240-18 281 9 282 36C284 62 250 73 218 62C187 51 166 11 196-10Z"/>` +
      `<path d="M348 90C390 61 448 79 493 118V180H374C345 157 324 111 348 90Z"/>` +
    `</g>` +
    `<g fill="${three}">` +
      `<path d="M84 109C120 78 179 83 197 117C214 149 177 177 136 170C98 163 58 132 84 109Z"/>` +
      `<path d="M298 16C334-9 388-2 405 31C422 63 386 88 349 80C311 72 272 35 298 16Z"/>` +
      `<path d="M-18 143C13 119 52 128 65 154C72 168 66 178 57 188H-18Z"/>` +
    `</g>`
  );
}

function snakeScales({ one, two, three }) {
  const cells = [];
  for (let row = -1; row < 7; row += 1) {
    for (let column = -1; column < 12; column += 1) {
      const x = column * 44 + (row % 2 === 0 ? 0 : 22);
      const y = row * 31;
      const fill = (row + column) % 4 === 0 ? three : one;
      cells.push(
        `<path d="M${x} ${y}Q${x + 22} ${y + 31} ${x + 44} ${y}Q${x + 22} ${y + 18} ${x} ${y}Z" fill="${fill}" stroke="${two}" stroke-width="3"/>`
      );
    }
  }
  return svgPattern(one, cells.join(""));
}

function honeycomb({ one, two }) {
  const missing = new Set([
    "0:2",
    "0:10",
    "1:6",
    "2:3",
    "2:11",
    "3:8",
    "4:4",
    "5:1",
    "5:9",
  ]);
  const cells = [];
  for (let row = 0; row < 7; row += 1) {
    const y = row * 29;
    const offset = row % 2 === 0 ? 0 : 17;
    for (let column = -1; column < 16; column += 1) {
      if (missing.has(`${row}:${column}`)) continue;
      const x = offset + column * 34;
      cells.push(
        `<polygon points="${x},${y - 18} ${x + 16},${y - 9} ${x + 16},${y + 9} ${x},${y + 18} ${x - 16},${y + 9} ${x - 16},${y - 9}" fill="${two}"/>`
      );
    }
  }
  return svgPattern(one, cells.join(""));
}

function argyle({ one, two, three }) {
  return svgPattern(
    one,
    `<defs><pattern id="argyle" width="112" height="80" patternUnits="userSpaceOnUse">` +
      `<rect width="112" height="80" fill="${one}"/>` +
      `<path d="M56 2L108 40L56 78L4 40Z" fill="${two}"/>` +
      `<path d="M-2 0L114 80M114 0L-2 80" fill="none" stroke="${three}" stroke-width="4"/>` +
      `</pattern></defs><rect width="100%" height="100%" fill="url(#argyle)"/>`
  );
}

function chevrons({ one, two, three }) {
  return svgPattern(
    one,
    `<path d="M-20 12L120 70L260 12L400 70L520 20V54L400 104L260 46L120 104L-20 46Z" fill="${two}"/>` +
      `<path d="M-20 82L120 140L260 82L400 140L520 90V124L400 174L260 116L120 174L-20 116Z" fill="${three}"/>`
  );
}

function oceanWaves({ one, two, three }) {
  return svgPattern(
    one,
    `<path d="M-30 74C25 26 80 26 135 74S245 122 300 74S410 26 510 74V126C455 78 400 78 345 126S235 174 180 126S70 78-30 126Z" fill="${two}"/>` +
      `<path d="M-30 116C25 76 80 76 135 116S245 156 300 116S410 76 510 116V180H-30Z" fill="${three}"/>`
  );
}

function angularPeak({ one, two }) {
  return svgPattern(
    one,
    `<path d="M-20 122L120 42L240 122L360 42L500 122V160L360 80L240 160L120 80L-20 160Z" fill="${two}"/>`
  );
}

export const TEAM_PATTERN_TEMPLATES = Object.freeze([
  template("even-two", "Two stripes — even split", GROUPS.even, 2, ({ one, two }) =>
    bands([one, 0, 50], [two, 50, 100])
  ),
  template("even-three", "Three stripes — even split", GROUPS.even, 3, ({ one, two, three }) =>
    bands([one, 0, 34], [two, 34, 66], [three, 66, 100])
  ),

  template("wide-centre-stripe", "Wide centre stripe", GROUPS.hockey, 2, ({ one, two }) =>
    bands([one, 0, 24], [two, 24, 76], [one, 76, 100])
  ),
  template("thin-centre-stripe", "Thin centre stripe", GROUPS.hockey, 2, ({ one, two }) =>
    bands([one, 0, 44], [two, 44, 56], [one, 56, 100])
  ),
  template("triple-pinstripe", "Triple pinstripe", GROUPS.hockey, 2, ({ one, two }) =>
    bands([one, 0, 18], [two, 18, 23], [one, 23, 35], [two, 35, 65], [one, 65, 77], [two, 77, 82], [one, 82, 100])
  ),
  template("double-accent-bands", "Double accent bands", GROUPS.hockey, 2, ({ one, two }) =>
    bands([one, 0, 27], [two, 27, 34], [one, 34, 66], [two, 66, 73], [one, 73, 100])
  ),
  template("angular-peak", "Angular peak", GROUPS.hockey, 2, angularPeak),
  template("mirrored-centre-band", "Mirrored centre band", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 26], [two, 26, 32], [three, 32, 68], [two, 68, 74], [one, 74, 100])
  ),
  template("offset-outlined-stack", "Offset outlined stack", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 18], [two, 18, 24], [three, 24, 46], [two, 46, 52], [three, 52, 76], [one, 76, 100])
  ),
  template("layered-six-band", "Layered six-band", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 15], [two, 15, 28], [one, 28, 34], [three, 34, 66], [one, 66, 72], [two, 72, 85], [one, 85, 100])
  ),
  template("alternating-ladder", "Alternating ladder", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 16], [three, 16, 22], [two, 22, 39], [three, 39, 61], [two, 61, 78], [three, 78, 84], [one, 84, 100])
  ),
  template("double-hairline", "Double hairline", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 28], [two, 28, 31], [one, 31, 49], [three, 49, 52], [one, 52, 100])
  ),
  template("double-light-top-accent", "Double light with top accent", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 19], [two, 19, 25], [one, 25, 39], [three, 39, 54], [one, 54, 68], [three, 68, 83], [one, 83, 100])
  ),
  template("layered-monochrome", "Layered monochrome", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 18], [two, 18, 48], [one, 48, 65], [three, 65, 72], [one, 72, 100])
  ),
  template("split-colour-block", "Split colour block", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 18], [two, 18, 52], [one, 52, 59], [three, 59, 83], [one, 83, 100])
  ),
  template("two-tone-stack", "Two-tone stack", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 17], [three, 17, 28], [two, 28, 56], [three, 56, 83], [one, 83, 100])
  ),
  template("outlined-block", "Outlined block", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 16], [three, 16, 35], [one, 35, 45], [two, 45, 75], [one, 75, 100])
  ),
  template("layered-contrast", "Layered contrast", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 15], [three, 15, 21], [one, 21, 34], [two, 34, 66], [one, 66, 79], [three, 79, 86], [one, 86, 100])
  ),
  template("mirrored-seven-band", "Mirrored seven-band", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 14], [three, 14, 20], [two, 20, 36], [three, 36, 64], [two, 64, 80], [three, 80, 86], [one, 86, 100])
  ),
  template("accent-line-band", "Accent line and band", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 25], [three, 25, 29], [one, 29, 43], [two, 43, 74], [one, 74, 100])
  ),
  template("outlined-centre", "Outlined centre", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 22], [two, 22, 36], [one, 36, 43], [three, 43, 68], [one, 68, 100])
  ),
  template("two-stage-contrast", "Two-stage contrast", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 24], [two, 24, 31], [three, 31, 69], [one, 69, 100])
  ),
  template("layered-double-light", "Layered double-light", GROUPS.hockey, 3, ({ one, two, three }) =>
    bands([one, 0, 17], [three, 17, 23], [one, 23, 37], [two, 37, 66], [three, 66, 73], [one, 73, 100])
  ),

  template("tiger", "Tiger", GROUPS.pattern, 2, tiger),
  template("leopard", "Leopard", GROUPS.pattern, 3, leopard),
  template("cowhide", "Cowhide", GROUPS.pattern, 2, cowhide),
  template("camouflage", "Camouflage", GROUPS.pattern, 3, camouflage),
  template("snake-scales", "Snake scales", GROUPS.pattern, 3, snakeScales),
  template("honeycomb", "Honeycomb", GROUPS.pattern, 2, honeycomb),
  template(
    "checkerboard",
    "Checkerboard",
    GROUPS.pattern,
    2,
    ({ one, two }) =>
      `conic-gradient(from 90deg, ${one} 0 25%, ${two} 0 50%, ${one} 0 75%, ${two} 0)`,
    { size: "32px 32px", repeat: "repeat" }
  ),
  template("argyle", "Argyle", GROUPS.pattern, 3, argyle, {
    size: "112px 80px",
    repeat: "repeat",
  }),
  template("chevrons", "Chevrons", GROUPS.pattern, 3, chevrons),
  template("ocean-waves", "Ocean waves", GROUPS.pattern, 3, oceanWaves),
  template("two-colour-gradient", "Two-colour gradient", GROUPS.pattern, 2, ({ one, two }) =>
    `linear-gradient(135deg, ${one} 0%, ${two} 100%)`
  ),
  template("three-colour-gradient", "Three-colour gradient", GROUPS.pattern, 3, ({ one, two, three }) =>
    `linear-gradient(135deg, ${one} 0%, ${two} 50%, ${three} 100%)`
  ),
]);

const TEMPLATE_BY_ID = new Map(
  TEAM_PATTERN_TEMPLATES.map((entry) => [entry.id, entry])
);

export const TEAM_PATTERN_GROUPS = Object.freeze(
  Object.values(GROUPS).map((label) =>
    Object.freeze({
      label,
      templates: Object.freeze(
        TEAM_PATTERN_TEMPLATES.filter((entry) => entry.group === label)
      ),
    })
  )
);

export function teamPatternTemplate(value, tertiaryColour = null) {
  return (
    TEMPLATE_BY_ID.get(value) ||
    TEMPLATE_BY_ID.get(
      tertiaryColour
        ? DEFAULT_THREE_TEAM_PATTERN
        : DEFAULT_TWO_TEAM_PATTERN
    )
  );
}

export function isTeamPatternTemplate(value) {
  return TEMPLATE_BY_ID.has(value);
}

export function teamPatternPaint(
  patternTemplate,
  { primaryColour, secondaryColour, tertiaryColour }
) {
  const entry = teamPatternTemplate(patternTemplate, tertiaryColour);
  return Object.freeze({
    entry,
    image: entry.paint({
      one: primaryColour,
      two: secondaryColour,
      three: tertiaryColour || primaryColour,
    }),
  });
}
