import { test, expect } from "@playwright/test";

async function expectStackedScore(number, label, palette) {
  const style = (element) => {
    const css = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      color: css.color, size: parseFloat(css.fontSize), weight: Number(css.fontWeight),
      top: bounds.top, bottom: bounds.bottom, left: bounds.left, right: bounds.right,
    };
  };
  const value = await number.evaluate(style);
  const unit = await label.evaluate(style);
  expect(unit.size).toBeLessThan(value.size);
  expect(unit.weight).toBeLessThan(600);
  expect(value.weight).toBeGreaterThanOrEqual(700);
  expect(unit.color).toBe(palette.muted);
  expect(value.color).toBe(palette.orange);
  expect(unit.top).toBeGreaterThanOrEqual(value.bottom - 1);
  expect(unit.right).toBeGreaterThan(value.left);
  expect(unit.left).toBeLessThan(value.right);
}

function measureGameCard(card) {
  const [day, opponent, score] = card.children;
  const [venue, badge, time] = opponent.children;
  const bounds = card.getBoundingClientRect();
  const textBounds = (element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect();
  };
  const dateInk = textBounds(day);
  const venueBox = venue.getBoundingClientRect();
  const badgeBox = badge.getBoundingClientRect();
  const badgeInk = textBounds(badge);
  const timeInk = textBounds(time);
  const scoreInk = score && textBounds(score);

  // Measure this exact card with and without its score, outside the strip's
  // cross-axis stretch. Different dates and times then compare like for like.
  const probe = card.cloneNode(true);
  Object.assign(probe.style, { position: "absolute", visibility: "hidden", width: bounds.width + "px", boxSizing: "border-box" });
  card.parentElement.append(probe);
  const naturalHeight = probe.getBoundingClientRect().height;
  if (score) probe.lastElementChild.remove();
  const upcomingHeight = probe.getBoundingClientRect().height;
  probe.remove();

  return {
    opponent: badge.textContent,
    width: bounds.width,
    top: bounds.top,
    naturalHeight,
    upcomingHeight,
    fits: card.scrollWidth <= card.clientWidth + 1 &&
      venueBox.right <= badgeBox.left + 1 && badgeBox.right <= timeInk.left + 1 &&
      badgeInk.left >= badgeBox.left - 1 && badgeInk.right <= badgeBox.right + 1 &&
      timeInk.right <= bounds.right + 1 && dateInk.right <= bounds.right + 1 &&
      dateInk.bottom <= Math.max(venueBox.top, badgeBox.top, timeInk.top) + 1 &&
      timeInk.top < badgeBox.bottom && timeInk.bottom > badgeBox.top &&
      timeInk.height <= parseFloat(getComputedStyle(time).lineHeight) + 1 &&
      dateInk.height <= parseFloat(getComputedStyle(day).lineHeight) + 1,
    beside: !scoreInk || (
      scoreInk.left >= Math.max(dateInk.right, timeInk.right, badgeBox.right) - 1 &&
      scoreInk.right <= bounds.right + 1 &&
      scoreInk.top < timeInk.bottom && scoreInk.bottom > dateInk.top
    ),
  };
}

async function expectCompactCards(games, width) {
  const cards = games.getByRole("listitem");
  await expect(cards).toHaveCount(4);
  const top = (await cards.first().boundingBox()).y;
  for (const card of await cards.all()) {
    const result = await card.evaluate(measureGameCard);
    const description = width + "px viewport, " + result.width + "px card vs " + result.opponent;
    expect(Math.abs(result.top - top), description + " wraps the game strip").toBeLessThanOrEqual(1);
    expect(result.fits, description + " clips or overlaps game details").toBe(true);
    expect(result.beside, description + " does not place FP to the right of both detail lines").toBe(true);
    expect(Math.abs(result.naturalHeight - result.upcomingHeight), description + " adds height for FP").toBeLessThanOrEqual(1);
  }
}

test("schedule keeps the week and game cards readable and preserves table colours and move controls", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/e2e/fixtures/roster-schedule.html", { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => window.scheduleFixture.scheduleRequests.length)).toBe(0);
  const selector = page.getByRole("group", { name: "Roster view" });
  await expect(selector.getByRole("button")).toHaveText(["Table", "Cap outlook", "Schedule"]);
  const activeTable = page.getByRole("region", { name: "Active roster table" });
  const names = ["Connor McDavid", "Nazem Kadri", "Cale Makar"];
  const namePaint = (name) => name.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.color, style.backgroundImage];
  });
  const colours = await Promise.all(names.map((name) => namePaint(activeTable.getByText(name, { exact: true }))));
  const graphics = (control) => control.evaluate((button) => [
    button.className, button.querySelector("svg").innerHTML, getComputedStyle(button).transition,
  ]);
  const benchAction = { name: "Move to bench Connor McDavid" };
  const tableGraphics = await graphics(activeTable.getByRole("button", benchAction));
  await selector.getByRole("button", { name: "Schedule" }).click();
  const row = page.getByRole("article", { name: "Connor McDavid schedule" });
  await expect(row.getByLabel("4 games this week")).toBeVisible();
  await expect(row.getByText("VAN", { exact: true })).toBeVisible();
  const fpg = row.getByText("2.25", { exact: true });
  const fpgLabel = row.getByText("FPG", { exact: true });
  const finalGame = row.getByRole("listitem").filter({ hasText: "VAN" });
  const points = finalGame.getByText("3.50", { exact: true });
  const pointsLabel = finalGame.getByText("FP", { exact: true });
  const palette = {
    muted: await row.getByText("EDM", { exact: true }).evaluate((el) => getComputedStyle(el).color),
    orange: await row.getByLabel("4 games this week").evaluate((el) => getComputedStyle(el).backgroundColor),
  };
  await expect(row.getByLabel("Game in progress")).toHaveText("—");
  await expect(page.getByRole("article", { name: "Cale Makar schedule" }).getByLabel("Final game points unavailable")).toHaveText("—");
  for (const [index, name] of names.entries()) {
    expect(await namePaint(page.getByRole("article", { name: name + " schedule" }).getByText(name, { exact: true }))).toEqual(colours[index]);
  }
  expect(await graphics(row.getByRole("button", benchAction))).toEqual(tableGraphics);
  await expect(selector.getByRole("button", { name: "Schedule" })).toHaveAttribute("aria-pressed", "true");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  const games = row.getByRole("list", { name: "Connor McDavid games" });
  const originalViewport = page.viewportSize();
  for (const width of [originalViewport.width, 320, 375, 430, 768, 960, 1012, 1440]) {
    await page.setViewportSize({ width, height: originalViewport.height });
    const heading = await page.getByRole("heading", { name: "Schedule", exact: true }).boundingBox();
    const previous = await page.getByRole("button", { name: "Previous matchup week" }).boundingBox();
    const next = await page.getByRole("button", { name: "Next matchup week" }).boundingBox();
    const zone = await page.getByText("Times in Pacific", { exact: true }).boundingBox();
    expect(zone.x).toBeGreaterThanOrEqual(next.x + next.width - 1);
    expect(zone.y).toBeLessThan(next.y + next.height);
    expect(zone.y + zone.height).toBeGreaterThan(next.y);
    expect(zone.x + zone.width).toBeLessThanOrEqual(width + 1);
    expect(await page.getByRole("combobox", { name: "Matchup week" }).evaluate((select) => {
      const css = getComputedStyle(select);
      const canvas = document.createElement("canvas").getContext("2d");
      canvas.font = css.font;
      const widest = Math.max(...[...select.options].map((option) => canvas.measureText(option.label).width));
      const available = select.clientWidth - parseFloat(css.paddingLeft) - parseFloat(css.paddingRight);
      // Allow room for the native select arrow alongside the complete week label.
      return available - widest;
    })).toBeGreaterThanOrEqual(15);
    await expectStackedScore(fpg, fpgLabel, palette);
    await expectStackedScore(points, pointsLabel, palette);
    const group = await page.getByRole("region", { name: "Active roster schedule" }).boundingBox();
    expect(previous.y).toBeGreaterThanOrEqual(heading.y + heading.height - 1);
    expect(Math.abs(previous.x - heading.x)).toBeLessThanOrEqual(2);
    expect(previous.y + previous.height).toBeLessThanOrEqual(group.y);
    const count = await row.getByLabel("4 games this week").boundingBox();
    const button = await row.getByRole("button", benchAction).boundingBox();
    expect(button.x).toBeGreaterThanOrEqual(count.x + count.width - 1);
    expect(button.y + button.height).toBeGreaterThan(count.y);
    expect(button.y).toBeLessThan(count.y + count.height);
    await expectCompactCards(games, width);
    expect(await games.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await page.setViewportSize(originalViewport);
  await page.getByRole("region", { name: "Roster schedule", exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: `.hundo.local/design-mockups/roster-schedule/implemented-${test.info().project.name}.png`, fullPage: true });
  if (test.info().project.name === "desktop-chromium") {
    await selector.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      const top = document.querySelector('[aria-label="Roster view"]').getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - 20);
    });
    await page.screenshot({ path: ".hundo.local/design-mockups/roster-schedule/schedule-corrected-preview.png" });
  }
  await page.getByRole("button", { name: "Next matchup week" }).click();
  await expect(row.getByText("TOR", { exact: true })).toBeVisible();
  await expect(row.getByLabel("1 game this week")).toBeVisible();
  await selector.getByRole("button", { name: "Table", exact: true }).click();
  await expect(page.getByRole("region", { name: "Roster schedule", exact: true })).toHaveCount(0);
  await selector.getByRole("button", { name: "Cap outlook" }).click();
  await expect(page.getByRole("region", { name: "Cap outlook by season" })).toBeAttached();
  expect(await page.evaluate(() => window.scheduleFixture.requests.every((request) => !request.method))).toBe(true);
  expect(errors).toEqual([]);
});

test("four final scores including negative and double-digit FP keep the same height as the game details", async ({ page }) => {
  await page.goto("/e2e/fixtures/roster-schedule.html", { waitUntil: "domcontentloaded" });
  const selector = page.getByRole("button", { name: "Schedule", exact: true });
  await expect(selector).toBeVisible();
  await page.evaluate(() => {
    const fixture = window.scheduleFixture;
    fixture.games.slice(0, 4).forEach((game, index) => {
      game.status = "final";
      game.playerPoints = [{ playerId: fixture.players[0].playerId, fantasyPointsHundredths: [1200, 71, -387, 0][index] }];
    });
  });
  await selector.click();
  const games = page.getByRole("list", { name: "Connor McDavid games" });
  await expect(games.getByText("12.00", { exact: true })).toBeVisible();
  await expect(games.getByText("-3.87", { exact: true })).toBeVisible();
  for (const width of [320, 375, 1012]) {
    await page.setViewportSize({ width, height: 844 });
    await expectCompactCards(games, width);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  }
  await page.setViewportSize({ width: 320, height: 844 });
  await games.scrollIntoViewIfNeeded();
  await games.focus();
  await games.press("ArrowRight");
  await games.press("ArrowRight");
  await expect.poll(() => games.evaluate((strip) => strip.scrollWidth - strip.clientWidth - strip.scrollLeft)).toBeLessThanOrEqual(1);
});

test("a manager can use the schedule to move between active, bench and eligible IR", async ({ page }) => {
  await page.goto("/e2e/fixtures/roster-schedule.html");
  await page.getByRole("button", { name: "Schedule", exact: true }).click();
  const group = (category) => page.getByRole("region", { name: category + " schedule", exact: true });
  const player = { name: "Nazem Kadri schedule" };
  const active = group("Active roster").getByRole("article", player);
  await expect(group("Active roster").getByRole("button", { name: "Move Connor McDavid to injured reserve" })).toBeDisabled();
  await active.getByRole("button", { name: "Move to bench Nazem Kadri" }).click();
  await group("Bench").getByRole("article", player).getByRole("button", { name: "Move to active Nazem Kadri" }).click();
  await active.getByRole("button", { name: "Move Nazem Kadri to injured reserve" }).click();
  await group("Injured reserve").getByRole("article", player).getByRole("button", { name: "Move to active Nazem Kadri" }).click();
  await expect(active).toBeVisible();
  expect(await page.evaluate(() => window.scheduleFixture.requests.filter((request) => request.method === "POST").map((request) => [request.body.destinationCategory, request.body.expectedVersion]))).toEqual([
    ["Bench", 1], ["Active", 2], ["Injured Reserve", 3], ["Active", 4],
  ]);
});
