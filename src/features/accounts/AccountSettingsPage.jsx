import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";

import { routePaths } from "../../app/routePaths.js";
import {
  EmptyBlock,
  ErrorBlock,
  LoadingBlock,
  PageHeading,
  Surface,
  TeamMark,
} from "../../components/HundoUi.jsx";
import { teamColourStyle } from "../../shared/teamIdentity.js";
import {
  TEAM_PATTERN_GROUPS,
  teamPatternTemplate,
} from "../../shared/teamPatternCatalog.js";
import {
  leagueTeamsQuery,
  leagueKeys,
  visibleLeaguesQuery,
} from "../leagues/leagueQueries.js";
import { useSession } from "../session/sessionContext.js";
import { createIntentKey } from "./accountApi.js";
import {
  accountKeys,
  accountProfileQuery,
  changePassword,
  updateAccountProfile,
  updateTeamProfile,
} from "./accountQueries.js";

function ErrorMessage({ error }) {
  if (!error) return null;
  return <ErrorBlock error={error} fallback="The account request could not be completed." />;
}

function fileBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The logo file could not be read."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const comma = result.indexOf(",");
      if (comma < 0) {
        reject(new Error("The logo file could not be encoded."));
        return;
      }
      resolve({
        contentBase64: result.slice(comma + 1),
        mediaType: file.type,
      });
    };
    reader.readAsDataURL(file);
  });
}

function TeamProfileForm({ leagueId, team, httpClient }) {
  const queryClient = useQueryClient();
  const [nameOverride, setNameOverride] = useState(null);
  const [primaryColourOverride, setPrimaryColourOverride] = useState(null);
  const [secondaryColourOverride, setSecondaryColourOverride] = useState(null);
  const [tertiaryColourOverride, setTertiaryColourOverride] = useState(null);
  const [patternTemplateOverride, setPatternTemplateOverride] =
    useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [removeLogo, setRemoveLogo] = useState(false);
  const [message, setMessage] = useState("");
  const savedPrimaryColour = team.primaryColour || "#16324f";
  const savedSecondaryColour = team.secondaryColour || "#f7f7f7";
  const savedTertiaryColour = team.tertiaryColour;
  const savedPatternTemplate = teamPatternTemplate(
    team.patternTemplate,
    savedTertiaryColour
  ).id;
  const name = nameOverride ?? team.name;
  const primaryColour = primaryColourOverride ?? savedPrimaryColour;
  const secondaryColour = secondaryColourOverride ?? savedSecondaryColour;
  const patternTemplate =
    patternTemplateOverride ?? savedPatternTemplate;
  const selectedPattern = teamPatternTemplate(
    patternTemplate,
    savedTertiaryColour
  );
  const tertiaryColour =
    tertiaryColourOverride ?? savedTertiaryColour ?? "#f97316";
  const previewTeam = {
    ...team,
    patternTemplate: selectedPattern.id,
    primaryColour,
    secondaryColour,
    tertiaryColour:
      selectedPattern.colourCount === 3 ? tertiaryColour : null,
  };
  const isDirty =
    name.trim() !== team.name ||
    primaryColour !== savedPrimaryColour ||
    secondaryColour !== savedSecondaryColour ||
    patternTemplate !== savedPatternTemplate ||
    (selectedPattern.colourCount === 3 &&
      tertiaryColour !== (savedTertiaryColour ?? "#f97316")) ||
    logoFile !== null ||
    removeLogo;

  const mutation = useMutation({
    mutationFn: async (draft) => {
      const input = {
        name: draft.name,
        patternTemplate: draft.patternTemplate,
        primaryColour: draft.primaryColour,
        secondaryColour: draft.secondaryColour,
        tertiaryColour:
          draft.colourCount === 3 ? draft.tertiaryColour : null,
      };
      if (draft.removeLogo) input.logo = null;
      else if (draft.logoFile) input.logo = await fileBase64(draft.logoFile);
      return updateTeamProfile(
        httpClient,
        leagueId,
        team.id,
        input,
        team.version,
        createIntentKey("team-profile")
      );
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: leagueKeys.detail(leagueId),
        }),
        queryClient.invalidateQueries({
          queryKey: leagueKeys.teams(leagueId),
        }),
      ]);
      setNameOverride(null);
      setPrimaryColourOverride(null);
      setSecondaryColourOverride(null);
      setTertiaryColourOverride(null);
      setPatternTemplateOverride(null);
      setLogoFile(null);
      setRemoveLogo(false);
      setMessage("Team profile saved.");
    },
    onError: () => setMessage(""),
  });

  return (
    <form
      className="hl-account-team-form"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");
        mutation.mutate({
          colourCount: selectedPattern.colourCount,
          logoFile,
          name: name.trim(),
          patternTemplate: selectedPattern.id,
          primaryColour,
          removeLogo,
          secondaryColour,
          tertiaryColour,
        });
      }}
    >
      <div className="hl-account-team-form__heading">
        <TeamMark
          team={previewTeam}
          logoUrl={
            !removeLogo && team.logoReference
              ? httpClient.resourceUrl(team.logoReference)
              : null
          }
          className="hl-account-team-mark"
        />
        <div>
          <h3>{team.name}</h3>
          <p>Team identity and colours</p>
        </div>
      </div>
      <div className="hl-account-form-grid">
        <label className="hl-field">
          Team name
          <input
            value={name}
            maxLength={35}
            required
            onChange={(event) => setNameOverride(event.target.value)}
          />
        </label>
        <label className="hl-field">
          Team template
          <select
            value={patternTemplate}
            onChange={(event) =>
              setPatternTemplateOverride(event.target.value)
            }
          >
            {TEAM_PATTERN_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.templates.map((pattern) => (
                  <option key={pattern.id} value={pattern.id}>
                    {pattern.name} · {pattern.colourCount} colours
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <fieldset className="hl-account-colour-swatches">
          <legend>
            Choose {selectedPattern.colourCount} template colours
          </legend>
          <label>
            <span>Colour 1</span>
            <input
              type="color"
              value={primaryColour}
              onInput={(event) =>
                setPrimaryColourOverride(event.target.value)
              }
            />
          </label>
          <label>
            <span>Colour 2</span>
            <input
              type="color"
              value={secondaryColour}
              onInput={(event) =>
                setSecondaryColourOverride(event.target.value)
              }
            />
          </label>
          {selectedPattern.colourCount === 3 && (
            <label>
              <span>Colour 3</span>
              <input
                type="color"
                value={tertiaryColour}
                onInput={(event) =>
                  setTertiaryColourOverride(event.target.value)
                }
              />
            </label>
          )}
        </fieldset>
        <div
          className="hl-account-pattern-preview"
          style={teamColourStyle(previewTeam)}
          role="img"
          aria-label={`${selectedPattern.name} preview using ${selectedPattern.colourCount} colours`}
        >
          <span>
            {selectedPattern.name}
            <small>{selectedPattern.colourCount} colours</small>
          </span>
        </div>
        <label className="hl-field">
          Team logo
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              setLogoFile(event.target.files?.[0] || null);
              setRemoveLogo(false);
            }}
          />
          <small>PNG, JPEG, or WebP; maximum 512 KB and 2048×2048.</small>
        </label>
      </div>
      {team.logoReference && (
        <label className="hl-check-field">
          <input
            type="checkbox"
            checked={removeLogo}
            onChange={(event) => {
              setRemoveLogo(event.target.checked);
              if (event.target.checked) setLogoFile(null);
            }}
          />
          Remove the current logo
        </label>
      )}
      <button
        type="submit"
        className="hl-button hl-button--primary"
        disabled={mutation.isPending || !isDirty}
      >
        {mutation.isPending ? "Saving…" : "Save team profile"}
      </button>
      {message && <p className="hl-form-message">{message}</p>}
      <ErrorMessage error={mutation.error} />
    </form>
  );
}

function LeagueTeamSettings({ league, session }) {
  const teams = useQuery({
    ...leagueTeamsQuery(session.httpClient, league.id),
    enabled: session.status === "authenticated",
  });
  if (teams.isPending) return <LoadingBlock>Loading {league.name} teams…</LoadingBlock>;
  if (teams.isError) return <ErrorMessage error={teams.error} />;
  const editable =
    league.membership.permissionCategory === "commissioner"
      ? teams.data
      : teams.data.filter(
          (team) => team.currentManager?.userId === session.user.id
        );
  if (editable.length === 0) return null;
  return (
    <section className="hl-account-league">
      <h2>{league.name}</h2>
      <div className="hl-account-team-list">
        {editable.map((team) => (
          <TeamProfileForm
            key={team.id}
            leagueId={league.id}
            team={team}
            httpClient={session.httpClient}
          />
        ))}
      </div>
    </section>
  );
}

export function AccountSettingsPage() {
  const session = useSession();
  const queryClient = useQueryClient();
  const profile = useQuery({
    ...accountProfileQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const leagues = useQuery({
    ...visibleLeaguesQuery(session.httpClient),
    enabled: session.status === "authenticated",
  });
  const [displayNameOverride, setDisplayNameOverride] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  const displayName =
    displayNameOverride ?? profile.data?.displayName ?? "";
  const profileIsDirty =
    displayName.trim() !== profile.data?.displayName;

  const profileMutation = useMutation({
    mutationFn: () =>
      updateAccountProfile(
        session.httpClient,
        { displayName: displayName.trim() },
        profile.data.version
      ),
    onSuccess: async () => {
      setProfileMessage("Display name saved.");
      setDisplayNameOverride(null);
      await queryClient.invalidateQueries({ queryKey: accountKeys.profile });
      session.retryBootstrap();
    },
    onError: () => setProfileMessage(""),
  });
  const passwordMutation = useMutation({
    mutationFn: () =>
      changePassword(session.httpClient, {
        currentPassword,
        newPassword,
        newPasswordConfirmation: confirmation,
      }),
    onSuccess: async () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      await session.clearAuthentication("password-changed");
    },
  });

  if (session.status === "unauthenticated") {
    return <Navigate to={routePaths.home} replace />;
  }
  if (
    session.status === "unknown" ||
    profile.isPending ||
    leagues.isPending
  ) {
    return (
      <main className="hl-page">
        <Surface>
          <LoadingBlock>Loading account settings…</LoadingBlock>
        </Surface>
      </main>
    );
  }
  if (profile.isError || leagues.isError) {
    return (
      <main className="hl-page">
        <ErrorMessage error={profile.error || leagues.error} />
      </main>
    );
  }

  return (
    <main className="hl-page hl-page--wide">
      <PageHeading
        eyebrow="Account"
        title="Account and team settings"
        description="Update your identity, security, and the teams you are authorized to manage."
      />
      <div className="hl-account-settings-grid">
        <Surface as="section">
          <h2>User profile</h2>
          <form
            className="hl-feature-form"
            onSubmit={(event) => {
              event.preventDefault();
              setProfileMessage("");
              profileMutation.mutate();
            }}
          >
            <label className="hl-field">
              Display name
              <input
                value={displayName}
                maxLength={50}
                required
                onChange={(event) =>
                  setDisplayNameOverride(event.target.value)
                }
              />
            </label>
            <label className="hl-field">
              Email
              <input value={profile.data.email} readOnly />
              <small>Email changes require administrator support.</small>
            </label>
            <button
              type="submit"
              className="hl-button hl-button--primary"
              disabled={profileMutation.isPending || !profileIsDirty}
            >
              Save display name
            </button>
            {profileMessage && <p className="hl-form-message">{profileMessage}</p>}
            <ErrorMessage error={profileMutation.error} />
          </form>
        </Surface>

        <Surface as="section">
          <h2>Change password</h2>
          <p>
            Changing your password signs out every session, including this one.
          </p>
          <form
            className="hl-feature-form"
            onSubmit={(event) => {
              event.preventDefault();
              passwordMutation.mutate();
            }}
          >
            <label className="hl-field">
              Current password
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                required
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
            <label className="hl-field">
              New password
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                required
                onChange={(event) => setNewPassword(event.target.value)}
              />
            </label>
            <label className="hl-field">
              Confirm new password
              <input
                type="password"
                autoComplete="new-password"
                value={confirmation}
                required
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
            <button
              type="submit"
              className="hl-button hl-button--primary"
              disabled={passwordMutation.isPending}
            >
              Change password
            </button>
            <ErrorMessage error={passwordMutation.error} />
          </form>
        </Surface>
      </div>

      <Surface as="section" className="hl-account-teams">
        <p className="hl-eyebrow">Manager settings</p>
        <h2>Your team profiles</h2>
        {leagues.data.length === 0 ? (
          <EmptyBlock title="No editable teams" />
        ) : (
          leagues.data.map((league) => (
            <LeagueTeamSettings
              key={league.id}
              league={league}
              session={session}
            />
          ))
        )}
      </Surface>
    </main>
  );
}
