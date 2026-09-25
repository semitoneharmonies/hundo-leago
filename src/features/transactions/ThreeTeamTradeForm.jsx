import { useEffect, useRef, useState } from "react";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { routePaths } from "../../app/routePaths.js";
import { teamWorkspaceQuery } from "../rosters/teamWorkspaceQueries.js";
import { buildThreeTeamProposal } from "./threeTeamProposal.js";
import { counterTrade, createTrade, previewDraftTrade, transactionKeys } from "./transactionQueries.js";

const emptyAsset = () => ({ type: "player", reference: "", destinationTeamId: "" });

export function ThreeTeamTradeForm({ context, leagueId, initialProposal, counterTradeId, AssetEditor, assetChoices, ImpactPreview }) {
  const Editor = AssetEditor, Preview = ImpactPreview;
  const navigate = useNavigate(), queryClient = useQueryClient(), submission = useRef(null);
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
    queryKey: ["league", leagueId, "trade-draft-preview", context.session.user?.id, fingerprint],
    queryFn: async ({ signal }) => {
      const result = await previewDraftTrade(context.session.httpClient, leagueId, draft, signal);
      const ids = new Set(result.teams.map(team => team.teamId));
      if (result.leagueId !== leagueId || result.teams.length !== 3 || ids.size !== 3 || sides.some(side => !ids.has(side.teamId))) throw new Error("The impact preview does not match the selected teams.");
      return result;
    },
    enabled: Boolean(fingerprint && fingerprint === settledDraft && context.league && context.session.status === "authenticated"),
    meta: { private: true, leagueId }, retry: false,
  });
  const mutation = useMutation({ mutationFn: ({ body, idempotencyKey }) => counterTradeId
    ? counterTrade(context.session.httpClient, leagueId, counterTradeId, body, idempotencyKey)
    : createTrade(context.session.httpClient, leagueId, body, idempotencyKey),
  onSuccess: result => {
    void queryClient.invalidateQueries({ queryKey: transactionKeys.trades(leagueId) });
    if (counterTradeId) void queryClient.invalidateQueries({ queryKey: transactionKeys.trade(leagueId, counterTradeId) });
    void queryClient.invalidateQueries({ queryKey: ["league", leagueId, "activity"] });
    navigate(routePaths.trade(leagueId, result.proposal.id));
  } });
  function updateSide(index, change) { setSides(current => current.map((side, i) => i === index ? { ...side, ...change } : side)); }
  function changeTeam(index, teamId) {
    setSides(current => current.map((side, i) => i === index ? { teamId, assets: [emptyAsset()] }
      : { ...side, assets: side.assets.map(asset => asset.destinationTeamId === current[index].teamId ? { ...asset, destinationTeamId: "" } : asset) }));
  }
  function submit(event) {
    event.preventDefault();
    if (mutation.isPending || !preview.data || preview.isFetching || preview.isError) return;
    try {
      sides.forEach((side, index) => {
        if (side.assets.some(asset => !(asset.type === "future_considerations" && asset.mode !== "existing") && !assetChoices(asset, workspaces[index].data).some(choice => choice.id === asset.reference))) throw new Error("An offered item is no longer available. Choose a replacement or remove it before sending.");
      });
      const body = buildThreeTeamProposal(sides[0].teamId, sides), fingerprint = JSON.stringify(body);
      if (submission.current?.fingerprint !== fingerprint) submission.current = { fingerprint, idempotencyKey: `three-team-${globalThis.crypto.randomUUID()}` };
      setError(null); mutation.mutate({ body, idempotencyKey: submission.current.idempotencyKey });
    } catch (caught) { setError(caught); }
  }
  if (!context.managerControlledTeams.length) return <p>You do not currently control a team that can propose a trade.</p>;
  const selectedTeams = sides.map(side => context.teams.data?.find(team => team.id === side.teamId)).filter(Boolean);
  const busy = mutation.isPending || workspaces.some(workspace => workspace.isFetching);
  const failure = error || mutation.error || workspaces.find(workspace => workspace.isError)?.error;
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
      <button className="hl-button hl-button--primary" disabled={busy || !preview.data || preview.isFetching || preview.isError || workspaces.some(workspace => workspace.isError)}>{counterTradeId ? "Send counter proposal" : "Send proposal"}</button>
    </fieldset>
    {counterTradeId && <Link className="hl-button hl-button--quiet" to={routePaths.trade(leagueId, counterTradeId)}>Back to original offer</Link>}
    {failure && <p role="alert">{failure.message || "The proposal could not be sent. Try again."}</p>}
  </form>;
}
