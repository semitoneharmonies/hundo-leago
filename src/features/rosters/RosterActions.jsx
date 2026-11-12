import { createElement } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeftRight, ArrowUp, CircleDollarSign, FileSignature, HeartPulse, Megaphone, Trash2, XCircle } from "lucide-react";
import { routePaths } from "../../app/routePaths.js";

const MOVE_TYPES = {
  Active: ["ir", "bench"],
  Bench: ["ir", "active"],
  "Injured Reserve": ["ir", "active"],
  Prospect: ["active", "bench", "ir"],
};
const MOVE_DETAILS = {
  active: { Icon: ArrowUp, label: "Move to active" },
  bench: { Icon: ArrowDown, label: "Move to bench" },
  ir: { Icon: HeartPulse, label: "Move to injured reserve" },
};

function RosterMoveButtons({ player, pending, onAction }) {
  const category = player.rosterCategory;
  const prospect = category === "Prospect";
  return MOVE_TYPES[category].map((type) => {
    const isIr = type === "ir";
    const irDisabled = isIr && (!player.injuredReserveEligible || (!prospect && category !== "Active"));
    const { Icon, label } = MOVE_DETAILS[type];
    const ariaLabel = isIr && !prospect ? `Move ${player.name} to injured reserve` : `${label} ${player.name}`;
    let title = ariaLabel;
    if (irDisabled) title = `${player.name} is not currently eligible for injured reserve`;
    if (type === "active" && player.rosterCategory === "Injured Reserve") {
      title = `Move ${player.name} to active before moving them to the bench`;
    }
    return (
      <button
        key={type}
        type="button"
        className={`hl-roster-action${isIr && player.injury?.status === "injured" ? " is-injury-action" : ""}`}
        disabled={pending || irDisabled}
        onClick={() => onAction(type, player)}
        aria-label={ariaLabel}
        title={title}
      >
        <Icon aria-hidden="true" />
        <span>{isIr && !prospect ? "Move to IR" : label}</span>
      </button>
    );
  });
}

export function RosterActions({
  leagueId,
  teamId,
  player,
  pending,
  onAction,
  prospectDecisionAllowed = false,
  movesOnly = false,
}) {
  const assetType =
    player.rosterCategory === "Prospect"
      ? "prospect_right"
      : "contract";
  const assetId =
    assetType === "prospect_right"
      ? player.playerId
      : player.contract?.id;
  const unsignedProspect =
    player.rosterCategory === "Prospect" &&
    player.ownershipKind === "Prospect Right" &&
    !player.contract;
  const signedProspect =
    player.rosterCategory === "Prospect" &&
    player.ownershipKind === "Prospect Right" &&
    player.contract?.type === "fantasy_elc";
  const moveButtons = <RosterMoveButtons player={player} pending={pending} onAction={onAction} />;
  if (movesOnly) {
    if (player.rosterCategory === "Prospect" && !signedProspect) return null;
    return <div className="hl-roster-actions">{moveButtons}</div>;
  }

  return (
    <div className="hl-roster-actions">
      {unsignedProspect && prospectDecisionAllowed && (
        <>
          {[
            [
              "prospect-sign-prospect",
              "Sign ELC and keep in prospects",
              FileSignature,
            ],
            ["prospect-sign-active", "Sign ELC and move to active", ArrowUp],
            ["prospect-sign-bench", "Sign ELC and move to bench", ArrowDown],
            [
              "prospect-sign-ir",
              "Sign ELC and move to injured reserve",
              HeartPulse,
            ],
          ].map(([type, label, Icon]) => (
            <button
              key={type}
              type="button"
              className={`hl-roster-action ${type.endsWith("ir") && player.injury?.status === "injured" ? "is-injury-action" : ""}`}
              disabled={
                pending ||
                (type === "prospect-sign-ir" &&
                  !player.injuredReserveEligible)
              }
              onClick={() => onAction(type, player)}
              aria-label={`${label} ${player.name}`}
              title={
                type === "prospect-sign-ir" &&
                !player.injuredReserveEligible
                  ? `${player.name} is not currently eligible for injured reserve`
                  : `${label} ${player.name}`
              }
            >
              {createElement(Icon, { "aria-hidden": true })}
              <span>{label}</span>
            </button>
          ))}
          <button
            type="button"
            className="hl-roster-action"
            disabled={pending}
            onClick={() => onAction("prospect-decline", player)}
            aria-label={`Decline ELC for ${player.name}`}
            title={`Decline ELC for ${player.name} and release their rights`}
          >
            <XCircle aria-hidden="true" />
            <span>Decline ELC</span>
          </button>
          <button
            type="button"
            className="hl-roster-action"
            disabled={pending}
            onClick={() => onAction("prospect-release", player)}
            aria-label={`Release unsigned prospect rights for ${player.name}`}
            title={`Release unsigned prospect rights for ${player.name}`}
          >
            <Trash2 aria-hidden="true" />
            <span>Release rights</span>
          </button>
        </>
      )}
      {signedProspect && (
        <>
          {moveButtons}
          <button
            type="button"
            className="hl-roster-action"
            disabled={pending}
            onClick={() => onAction("buyout", player)}
            aria-label={`Buy out ${player.name}`}
            title={`Buy out ${player.name}`}
          >
            <CircleDollarSign aria-hidden="true" />
            <span>Buyout</span>
          </button>
        </>
      )}
      {player.rosterCategory !== "Prospect" && (
        <>
          <button
            type="button"
            className="hl-roster-action"
            disabled={pending || !player.contract}
            onClick={() => onAction("buyout", player)}
            aria-label={`Buy out ${player.name}`}
            title={
              player.contract
                ? `Buy out ${player.name}`
                : "This player does not have an active contract."
            }
          >
            <CircleDollarSign aria-hidden="true" />
            <span>Buyout</span>
          </button>
          {moveButtons}
        </>
      )}
      <Link
        className="hl-roster-action"
        to={routePaths.leagueTradeForOfferedAsset(
          leagueId,
          teamId,
          assetType,
          assetId
        )}
        aria-label={`Add ${player.name} to a trade`}
        title={`Add ${player.name} to a trade`}
      >
        <ArrowLeftRight aria-hidden="true" />
        <span>Trade</span>
      </Link>
      <button
        type="button"
        className={`hl-roster-action${
          player.onTradeBlock ? " is-active" : ""
        }`}
        disabled={pending}
        aria-pressed={player.onTradeBlock}
        onClick={() => onAction("trade-block", player)}
        aria-label={`${player.onTradeBlock ? "Remove" : "Add"} ${
          player.name
        } ${player.onTradeBlock ? "from" : "to"} the trade block`}
        title={`${player.onTradeBlock ? "Remove from" : "Add to"} trade block`}
      >
        <Megaphone aria-hidden="true" />
        <span>
          {player.onTradeBlock
            ? "Remove from trade block"
            : "Add to trade block"}
        </span>
      </button>
    </div>
  );
}

