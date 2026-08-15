import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./EligiblePlayerSearch.jsx", () => ({
  EligiblePlayerSearch: ({
    inputLabel,
    value,
    describedBy,
    invalid,
    onInputChange,
    onSelect,
  }) => (
    <div>
      <input
        aria-label={inputLabel}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        value={value}
        onChange={(event) => onInputChange(event.target.value)}
      />
      <button
        type="button"
        aria-label={`Choose player for ${inputLabel}`}
        onClick={() =>
          onSelect({
            player: {
              playerId: "11111111-1111-4111-8111-111111111111",
              fullName: "Connor McDavid",
            },
            effectivePositionGroup: "F",
          })
        }
      >
        Choose
      </button>
    </div>
  ),
}));

vi.mock("../../shared/api/idempotency.js", () => ({
  createIdempotencyKey: () => "candidate-card-save:test",
}));

import { CandidateCardBuilder } from "./CandidateCardBuilder.jsx";

const SLOT_KEYS = [
  ...Array.from({ length: 12 }, (_, index) =>
    `F${String(index + 1).padStart(2, "0")}`
  ),
  ...Array.from({ length: 6 }, (_, index) =>
    `D${String(index + 1).padStart(2, "0")}`
  ),
  ...Array.from({ length: 4 }, (_, index) =>
    `B${String(index + 1).padStart(2, "0")}`
  ),
];

function denied() {
  return { allowed: false, reasonCode: "PHASE_CLOSED" };
}

function emptySlot(slotKey) {
  return {
    slotKey,
    slotGroup: slotKey[0],
    required: slotKey[0] !== "B",
    occupantKind: "empty",
    locked: false,
    player: null,
    totalValueCents: null,
    termYears: null,
    aavCents: null,
    remainingYears: null,
    validation: { status: "valid", codes: [] },
    outcome: null,
    capabilities: {
      addCandidate: denied(),
      editCandidate: denied(),
      moveCandidate: denied(),
      moveCarryover: denied(),
      removeCandidate: denied(),
    },
  };
}

function candidateSlot(slotKey, overrides = {}) {
  return {
    ...emptySlot(slotKey),
    occupantKind: "candidate",
    player: {
      playerId: "99999999-9999-4999-8999-999999999999",
      fullName: "Remote Candidate",
    },
    totalValueCents: 1_200,
    termYears: 2,
    aavCents: 600,
    ...overrides,
  };
}

function card(overrides = {}) {
  return {
    leagueId: "22222222-2222-4222-8222-222222222222",
    seasonId: "33333333-3333-4333-8333-333333333333",
    fadId: "44444444-4444-4444-8444-444444444444",
    teamId: "55555555-5555-4555-8555-555555555555",
    cardId: "66666666-6666-4666-8666-666666666666",
    cardVersion: 1,
    visibilityMode: "private_editable",
    allocationEligibility: "eligible",
    capStatus: "compliant",
    completeness: { code: "incomplete", missingMandatoryCount: 18 },
    capProjection: {
      maximumPossibleCapCents: 0,
      capLimitCents: 10_000,
      carriedActivePlayerAmountCents: 0,
      carriedCapUsageCents: 0,
    },
    slots: SLOT_KEYS.map(emptySlot),
    capabilities: {
      editCard: { allowed: true, reasonCode: null },
      requestHelp: denied(),
    },
    helpContext: null,
    ...overrides,
  };
}

function renderBuilder(candidateCard, httpClient = { request: vi.fn() }) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  const onAuthoritativeCard = vi.fn();
  const onProtectedFailure = vi.fn();
  const buildEligibleQueryOptions = vi.fn();
  const view = (nextCard) => (
    <QueryClientProvider client={queryClient}>
      <CandidateCardBuilder
        card={nextCard}
        httpClient={httpClient}
        timeZone="America/Vancouver"
        buildEligibleQueryOptions={buildEligibleQueryOptions}
        onAuthoritativeCard={onAuthoritativeCard}
        onProtectedFailure={onProtectedFailure}
      />
    </QueryClientProvider>
  );
  const rendered = render(view(candidateCard));
  return {
    httpClient,
    onAuthoritativeCard,
    onProtectedFailure,
    rerenderCard: (nextCard) => rendered.rerender(view(nextCard)),
    unmount: rendered.unmount,
  };
}

beforeEach(() => vi.clearAllMocks());

describe("CandidateCardBuilder whole-card form", () => {
  it("renders exactly 12 F, 6 D, 4 Bench rows and one top Save", () => {
    renderBuilder(card());

    expect(document.querySelectorAll('[data-slot-key^="F"]')).toHaveLength(12);
    expect(document.querySelectorAll('[data-slot-key^="D"]')).toHaveLength(6);
    expect(document.querySelectorAll('[data-slot-key^="B"]')).toHaveLength(4);
    expect(screen.getAllByRole("button", { name: "Save Candidate Card" })).toHaveLength(1);
    expect(screen.queryByRole("button", { name: /preview|apply|edit|move|remove/i })).toBeNull();
  });

  it("saves a player-only partial row through one exact card-root PUT", async () => {
    const current = card();
    const saved = card({ cardVersion: 2 });
    const httpClient = {
      request: vi.fn().mockResolvedValue({
        data: {
          card: saved,
          revisionId: "77777777-7777-4777-8777-777777777777",
          changedEntryIds: ["88888888-8888-4888-8888-888888888888"],
        },
      }),
    };
    renderBuilder(current, httpClient);

    fireEvent.click(
      screen.getByRole("button", { name: "Choose player for F01 player name" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Candidate Card" }));

    await waitFor(() => expect(httpClient.request).toHaveBeenCalledTimes(1));
    const [path, options] = httpClient.request.mock.calls[0];
    expect(path).toBe(
      "/api/v1/leagues/22222222-2222-4222-8222-222222222222/free-agent-drafts/44444444-4444-4444-8444-444444444444/candidate-cards/55555555-5555-4555-8555-555555555555"
    );
    expect(options).toMatchObject({
      method: "PUT",
      version: 1,
      idempotencyKey: "candidate-card-save:test",
    });
    expect(options.body.slots).toHaveLength(22);
    expect(options.body.slots[0]).toEqual({
      slotKey: "F01",
      candidate: {
        playerId: "11111111-1111-4111-8111-111111111111",
        aavCents: null,
        termYears: null,
      },
    });
    expect(options.body.slots[1]).toEqual({ slotKey: "F02", candidate: null });
  });

  it("shows the live AAV and total while blocking illegal AAV, Bench, and cap saves", async () => {
    const httpClient = { request: vi.fn() };
    const { unmount } = renderBuilder(card(), httpClient);
    fireEvent.click(screen.getByRole("button", { name: "Choose player for F01 player name" }));
    fireEvent.change(screen.getByRole("textbox", { name: "F01 AAV" }), {
      target: { value: "10.25" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "F01 term" }), {
      target: { value: "3" },
    });
    expect(screen.getByRole("textbox", { name: "F01 total contract value" }))
      .toHaveValue("$30.75");

    fireEvent.change(screen.getByRole("textbox", { name: "F01 AAV" }), {
      target: { value: "1.10" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Candidate Card" }));
    expect(await screen.findByText(/25-cent increments/i)).toBeVisible();
    expect(httpClient.request).not.toHaveBeenCalled();
    unmount();

    const benchClient = { request: vi.fn() };
    const benchView = renderBuilder(card(), benchClient);
    fireEvent.click(screen.getByRole("button", { name: "Choose player for B01 player name" }));
    fireEvent.change(screen.getByRole("textbox", { name: "B01 AAV" }), {
      target: { value: "4.25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Candidate Card" }));
    expect(await screen.findByText(/Bench AAV cannot exceed \$4\.00/i)).toBeVisible();
    expect(benchClient.request).not.toHaveBeenCalled();
    benchView.unmount();

    const capClient = { request: vi.fn() };
    renderBuilder(card({
      capProjection: {
        maximumPossibleCapCents: 9_500,
        capLimitCents: 10_000,
        carriedActivePlayerAmountCents: 9_500,
        carriedCapUsageCents: 9_500,
      },
    }), capClient);
    fireEvent.click(screen.getByRole("button", { name: "Choose player for F01 player name" }));
    fireEvent.change(screen.getByRole("textbox", { name: "F01 AAV" }), {
      target: { value: "5.25" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save Candidate Card" }));
    expect(await screen.findByText(/above the \$100\.00 limit/i)).toBeVisible();
    expect(capClient.request).not.toHaveBeenCalled();
  });

  it("preserves a dirty draft after 412 and retries with the refreshed version", async () => {
    const staleError = Object.assign(new Error("The card changed."), {
      status: 412,
      code: "CANDIDATE_CARD_PRECONDITION_FAILED",
    });
    const httpClient = {
      request: vi
        .fn()
        .mockRejectedValueOnce(staleError)
        .mockResolvedValueOnce({
          data: {
            card: card({ cardVersion: 3 }),
            revisionId: "77777777-7777-4777-8777-777777777777",
            changedEntryIds: ["88888888-8888-4888-8888-888888888888"],
          },
        }),
    };
    const { rerenderCard } = renderBuilder(card(), httpClient);

    fireEvent.click(
      screen.getByRole("button", { name: "Choose player for F01 player name" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Candidate Card" }));

    await screen.findByText(/your entries are still here/i);
    expect(httpClient.request.mock.calls[0][1].version).toBe(1);

    const refreshedSlots = SLOT_KEYS.map((slotKey) =>
      slotKey === "F02" ? candidateSlot(slotKey) : emptySlot(slotKey)
    );
    rerenderCard(card({ cardVersion: 2, slots: refreshedSlots }));

    expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveValue(
      "Connor McDavid"
    );
    expect(screen.getByRole("textbox", { name: "F02 player name" })).toHaveValue(
      "Remote Candidate"
    );
    fireEvent.click(screen.getByRole("button", { name: "Save Candidate Card" }));

    await waitFor(() => expect(httpClient.request).toHaveBeenCalledTimes(2));
    expect(httpClient.request.mock.calls[1][1]).toMatchObject({
      version: 2,
      body: {
        slots: expect.arrayContaining([
          {
            slotKey: "F01",
            candidate: {
              playerId: "11111111-1111-4111-8111-111111111111",
              aavCents: null,
              termYears: null,
            },
          },
          {
            slotKey: "F02",
            candidate: {
              playerId: "99999999-9999-4999-8999-999999999999",
              aavCents: 600,
              termYears: 2,
            },
          },
        ]),
      },
    });
  });

  it("resets an unsaved draft when the authoritative card ID changes", () => {
    const { rerenderCard } = renderBuilder(card());

    fireEvent.click(
      screen.getByRole("button", { name: "Choose player for F01 player name" })
    );
    expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveValue(
      "Connor McDavid"
    );

    rerenderCard(
      card({
        cardId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        cardVersion: 1,
      })
    );

    expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveValue(
      ""
    );
    expect(screen.getByRole("button", { name: "Save Candidate Card" })).toBeDisabled();
  });

  it("associates an invalid player row and focuses it after a failed save", async () => {
    renderBuilder(card());
    const playerInput = screen.getByRole("textbox", {
      name: "F01 player name",
    });

    fireEvent.change(playerInput, { target: { value: "Connor" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Candidate Card" }));

    const rowError = await screen.findByText(/choose a player from the suggestions/i);
    expect(playerInput).toHaveAttribute("aria-describedby", rowError.id);
    expect(playerInput).toHaveAttribute("aria-invalid", "true");
    await waitFor(() => expect(playerInput).toHaveFocus());
  });

  it("drops an unsaved draft when the authoritative card becomes read only", () => {
    const { rerenderCard } = renderBuilder(card());

    fireEvent.click(
      screen.getByRole("button", { name: "Choose player for F01 player name" })
    );
    expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveValue(
      "Connor McDavid"
    );

    rerenderCard(
      card({
        cardVersion: 2,
        visibilityMode: "private_read_only",
      })
    );

    expect(screen.queryByRole("button", { name: "Save Candidate Card" })).toBeNull();
    expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveValue("");
    expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveAttribute(
      "readonly"
    );
  });

  it.each([
    ["private_read_only", true],
    ["private_editable", false],
  ])(
    "withholds all editing when visibility is %s and edit capability is %s",
    (visibilityMode, allowed) => {
      renderBuilder(
        card({
          visibilityMode,
          capabilities: {
            editCard: { allowed, reasonCode: allowed ? null : "PHASE_CLOSED" },
            requestHelp: denied(),
          },
        })
      );

      expect(screen.queryByRole("button", { name: "Save Candidate Card" })).toBeNull();
      expect(screen.getByRole("textbox", { name: "F01 player name" })).toHaveAttribute(
        "readonly"
      );
      expect(screen.getByText("This Candidate Card is read only.")).toBeVisible();
    }
  );
});
