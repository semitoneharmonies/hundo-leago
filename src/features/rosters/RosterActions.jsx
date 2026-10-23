import { createElement } from "react";
import { Link } from "react-router-dom";
import { ArrowDown, ArrowLeftRight, ArrowUp, CircleDollarSign, FileSignature, HeartPulse, Megaphone, Trash2, XCircle } from "lucide-react";
import { routePaths } from "../../app/routePaths.js";

export function RosterActions({
  leagueId,
  teamId,
  player,
  pending,
  onAction,
  prospectDecisionAllowed = false,
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
  const irDisabled =
    player.rosterCategory !== "Active" || !player.injuredReserveEligible;
  const rosterMove =
    player.rosterCategory === "Active"
      ? { type: "bench", label: "Move to bench", Icon: ArrowDown }
      : player.rosterCategory === "Bench"
        ? { type: "active", label: "Move to active", Icon: ArrowUp }
        : player.rosterCategory === "Injured Reserve"
          ? {
              type: "active",
              label: "Move to active",
              Icon: ArrowUp,
              title: `Move ${player.name} to active before moving them to the bench`,
            }
        : null;

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
          {[
            ["active", "Move to active", ArrowUp],
            ["bench", "Move to bench", ArrowDown],
            ["ir", "Move to injured reserve", HeartPulse],
          ].map(([type, label, Icon]) => (
            <button
              key={type}
              type="button"
              className={`hl-roster-action ${type.endsWith("ir") && player.injury?.status === "injured" ? "is-injury-action" : ""}`}
              disabled={
                pending ||
                (type === "ir" && !player.injuredReserveEligible)
              }
              onClick={() => onAction(type, player)}
              aria-label={`${label} ${player.name}`}
              title={
                type === "ir" && !player.injuredReserveEligible
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
          <button
            type="button"
            className={`hl-roster-action ${player.injury?.status === "injured" ? "is-injury-action" : ""}`}
            disabled={pending || irDisabled}
            onClick={() => onAction("ir", player)}
            aria-label={`Move ${player.name} to injured reserve`}
            title={
              irDisabled
                ? `${player.name} is not currently eligible for injured reserve`
                : `Move ${player.name} to injured reserve`
            }
          >
            <HeartPulse aria-hidden="true" />
            <span>Move to IR</span>
          </button>
          {rosterMove && (
            <button
              type="button"
              className="hl-roster-action"
              disabled={pending}
              onClick={() => onAction(rosterMove.type, player)}
              aria-label={`${rosterMove.label} ${player.name}`}
              title={rosterMove.title || `${rosterMove.label} ${player.name}`}
            >
              <rosterMove.Icon aria-hidden="true" />
              <span>{rosterMove.label}</span>
            </button>
          )}
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

