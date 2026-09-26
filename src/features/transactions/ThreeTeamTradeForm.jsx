import { useEffect, useRef, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { createIdempotencyKey } from "../../shared/api/idempotency.js";
import { teamWorkspaceQuery } from "../rosters/teamWorkspaceQueries.js";
import { buildThreeTeamProposal } from "./threeTeamProposal.js";
import { counterTrade, createTrade, draftTradePreviewQuery, transactionKeys } from "./transactionQueries.js";

const emptyAsset = () => ({ type: "player", reference: "", destinationTeamId: "" });

export function ThreeTeamTradeForm({ context, leagueId, initialProposal, counterTradeId, AssetEditor, assetChoices, ImpactPreview, ReviewScreen, onReviewChange }) {
  const Editor = AssetEditor, Preview = ImpactPreview, Review = ReviewScreen;
  const navigate = useNavigate(), queryClient = useQueryClient(), submission = useRef(null), sending = useRef(false);
  const [reviewBody, setReviewBody] = useState(null);
  const [sides, setSides] = useState(() => initialProposal?.participants || [
    { teamId: context.managerControlledTeams[0]?.id || "", assets: [emptyAsset()] },
    { teamId: "", assets: [emptyAsset()] }, { teamId: "", assets: [emptyAsset()] },
  ]);
  const [error, setError] = useState(null);
  const workspaces = useQueries({ queries: sides.map(side => ({
    ...teamWorkspaceQuery(context.session.httpClient, leagueId, side.teamId || "invalid"),
    enabled: Boolean(side.teamId && context.league && context.session.status === "authenticated"),
  })) });
  let draft = null;
  try { draft = buildThreeTeamProposal(sides[0].teamId, sides); } catch { /* Incomplete draft: wait for valid selections. */ }
  const fingerprint = draft ? JSON.stringify(draft) : null;
  const [settledDraft, setSettledDraft] = useState(null);
  useEffect(() => {
    const timer = setTimeout(() => setSettledDraft(fingerprint), 250);
    return () => clearTimeout(timer);
  }, [fingerprint]);
  const preview = useQuery({
    ...draftTradePreviewQuery(context.session.httpClient, leagueId, context.session.user?.id, draft),
    enabled: Boolean(!reviewBody && fingerprint && fingerprint === settledDraft && context.league && context.session.status === "authenticated"),
  });
  const mutation = useMutation({ mutationFn: ({ body, idempotencyKey }) => counterTradeId
    ? counterTrade(context.session.httpClient, leagueId, counterTradeId, body, idempotencyKey)
    : createTrade(context.session.httpClient, leagueId, body, idempotencyKey),
  onSuccess: result => {
    void queryClient.invalidateQueries({ queryKey: transactionKeys.trades(leagueId) });
    if (counterTradeId) void queryClient.invalidateQueries({ queryKey: transactionKeys.trade(leagueId, counterTradeId) });
    void queryClient.invalidateQueries({ queryKey: ["league", leagueId, "activity"] });
    navigate(routePaths.trade(leagueId, result.proposal.id));
  }, onError: () => { sending.current = false; } });
  function updateSide(index, change) { setSides(current => current.map((side, i) => i === index ? { ...side, ...change } : side)); }
  function changeTeam(index, teamId) {
    setSides(current => current.map((side, i) => i === index ? { teamId, assets: [emptyAsset()] }
      : { ...side, assets: side.assets.map(asset => asset.destinationTeamId === current[index].teamId ? { ...asset, destinationTeamId: "" } : asset) }));
  }
  function submit(event) {
    event.preventDefault();
    if (mutation.isPending) return;
    try {
      sides.forEach((side, index) => {
        if (side.assets.some(asset => !(asset.type === "future_considerations" && asset.mode !== "existing") && !assetChoices(asset, workspaces[index].data).some(choice => choice.id === asset.reference))) throw new Error("An offered item is no longer available. Choose a replacement or remove it before sending.");
      });
      setError(null); setReviewBody(buildThreeTeamProposal(sides[0].teamId, sides)); onReviewChange(true);
    } catch (caught) { setError(caught); }
  }
  function send() {
    if (sending.current || mutation.isPending || !reviewBody) return;
    const fingerprint = JSON.stringify(reviewBody);
    if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, idempotencyKey: createIdempotencyKey("three-team", globalThis.crypto, "-") };
    sending.current = true;
    mutation.mutate({ body: reviewBody, idempotencyKey: submission.current.idempotencyKey });
  }
  if (!context.managerControlledTeams.length) return <p>You do not currently control a team that can propose a trade.</p>;
  const selectedTeams = sides.map(side => context.teams.data?.find(team => team.id === side.teamId)).filter(Boolean);
  const busy = mutation.isPending || workspaces.some(workspace => workspace.isFetching);
  const failure = error || mutation.error || workspaces.find(workspace => workspace.isError)?.error;
  if (reviewBody) return <Review context={context} leagueId={leagueId} body={reviewBody} teams={selectedTeams}
    workspaces={workspaces.map(w => w.data)} workspacesFetching={workspaces.some(w => w.isFetching)} counterTradeId={counterTradeId}
    pending={mutation.isPending} error={failure} onSubmit={send}
    onEdit={() => { setReviewBody(null); mutation.reset(); onReviewChange(false); }} />;
  return <form className="hl-surface hl-feature-form" onSubmit={submit}>
    <h2>{counterTradeId ? "Three-team counter proposal" : "New three-team trade"}</h2>
    <p>Both other teams must accept before anything moves. One decline rejects the whole trade.</p>
    {counterTradeId && <p>Edit the offer below. Sending closes the original offer and asks both other teams to agree again.</p>}
    <fieldset disabled={mutation.isPending} style={{ border: 0, padding: 0, minWidth: 0 }}>
      <div className="hl-button-row">
        {sides.map((side, index) => <label className="hl-field" key={index}>
          {index === 0 ? "Proposing team" : `Invited team ${index}`}
          <select aria-label={index === 0 ? "Proposing team" : `Invited team ${index}`} required value={side.teamId} disabled={Boolean(counterTradeId)} onChange={e => changeTeam(index, e.target.value)}>
            <option value="">Choose a team</option>
            {(index === 0 ? context.managerControlledTeams : context.teams.data || []).filter(team => team.id === side.teamId || !sides.some(other => other.teamId === team.id)).map(team => <option key={team.id} value={team.id}>{team.name}</option>)}
          </select>
        </label>)}
      </div>
      {sides.map((side, index) => side.teamId ? <Editor key={`${index}:${side.teamId}`}
        label={`${selectedTeams.find(team => team.id === side.teamId)?.name || "Team"} sends`}
        assets={side.assets} setAssets={assets => updateSide(index, { assets })}
        workspace={workspaces[index].data} pending={workspaces[index].isPending}
        destinations={selectedTeams.filter(team => team.id !== side.teamId)} /> : null)}
      {!fingerprint && <p>Choose three teams, an asset from each team, and where each asset goes to see the impact preview.</p>}
      {fingerprint && !preview.data && !preview.isError && <p role="status">Calculating cap and roster impact for all three teams…</p>}
      {fingerprint && preview.data && !preview.isError && <Preview preview={preview.data} teams={selectedTeams} />}
      {preview.isFetching && preview.data && <p role="status">Updating impact preview…</p>}
      {preview.isError && <div><p role="alert">Impact preview could not be loaded. {preview.error.message}</p><button type="button" className="hl-button hl-button--quiet" onClick={() => preview.refetch()}>Retry preview</button></div>}
      <button className="hl-button hl-button--primary" disabled={busy || !fingerprint || workspaces.some(workspace => workspace.isError)}>Preview trade</button>
    </fieldset>
    {counterTradeId && <Link className="hl-button hl-button--quiet" to={routePaths.trade(leagueId, counterTradeId)}>Back to original offer</Link>}
    {failure && <p role="alert">{failure.message || "The proposal could not be sent. Try again."}</p>}
  </form>;
}
