import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PanelHeading, Surface } from "../../components/HundoUi.jsx";
import { createIntentKey } from "../accounts/accountApi.js";
import { createLeagueTeam, leagueKeys } from "./leagueQueries.js";

const messages = {
  TEAM_NAME_UNAVAILABLE: "A team with this name already exists. Choose another name.",
  TEAM_INPUT_INVALID: "Enter a team name of up to 35 characters.",
  TEAM_LIMIT_REACHED: "This league has reached its team limit.",
  TEAM_CREATION_CONFLICT: "Teams can only be created while the league is in Setup.",
  TEAM_CREATION_NOT_ALLOWED: "Teams can only be created while the league is in Setup.",
  LEAGUE_COMMISSIONER_REQUIRED: "You no longer have permission to create teams in this league.",
};

export function TeamCreationPanel({ leagueId, httpClient }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [uncertain, setUncertain] = useState(false);
  const intent = useRef(null);
  const submitting = useRef(false);
  const canonicalName = name.trim();
  const validName = canonicalName.length > 0 && Array.from(canonicalName).length <= 35;
  const mutation = useMutation({
    retry: false,
    mutationFn: ({ submittedName, key }) => createLeagueTeam(httpClient, leagueId, submittedName, key),
    onSuccess: async ({ team }) => {
      setMessage(`${team.name} was created. Its manager is unassigned.`);
      setName("");
      setUncertain(false);
      intent.current = null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) }),
        queryClient.invalidateQueries({ queryKey: leagueKeys.all }),
      ]);
    },
    onError: (error) => {
      setMessage("");
      const rejected = error.category === "http" && error.status >= 400 && error.status < 500;
      setUncertain(!rejected);
    },
    onSettled: () => { submitting.current = false; },
  });

  function submit(event) {
    event.preventDefault();
    if (submitting.current || mutation.isPending || !validName) return;
    setMessage("");
    if (!intent.current || intent.current.name !== canonicalName) {
      try {
        intent.current = { name: canonicalName, key: createIntentKey("league-team-create") };
      } catch {
        setMessage("This browser could not prepare the request. Reload the page before trying again.");
        return;
      }
    }
    submitting.current = true;
    mutation.mutate({ submittedName: intent.current.name, key: intent.current.key });
  }

  return (
    <Surface aria-labelledby="create-team-title">
      <PanelHeading eyebrow="League setup" title="Create a team" id="create-team-title"
        description="Add an empty team now. Assign its manager separately when you are ready." />
      <form className="hl-feature-form" onSubmit={submit}>
        <label className="hl-field">
          Team name
          <input value={name} required maxLength={70}
            aria-describedby="team-name-hint"
            disabled={mutation.isPending || uncertain}
            onChange={(event) => { setName(event.target.value); setMessage(""); mutation.reset(); }} />
        </label>
        <small id="team-name-hint">Up to 35 characters.</small>
        <button className="hl-button hl-button--primary" type="submit"
          disabled={mutation.isPending || !validName}>
          {mutation.isPending ? "Creating…" : uncertain ? "Try again" : "Create team"}
        </button>
      </form>
      {message && <p className="hl-form-message" role="status">{message}</p>}
      {mutation.error && (
        <p className="hl-form-message is-error" role="alert">
          {uncertain
            ? "We couldn’t confirm whether the team was created. Check the team list; trying again will reuse the original request."
            : messages[mutation.error.code] || "The team could not be created. Check your access and league setup."}
        </p>
      )}
    </Surface>
  );
}
