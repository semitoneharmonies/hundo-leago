import { useEffect, useRef, useState } from "react";
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
import { AccountDeactivationPanel } from "./AccountDeactivationPanel.jsx";
import { accountPasswordError } from "./accountPasswordValidation.js";
import {
  accountKeys,
  accountProfileQuery,
  changePassword,
  updateAccountProfile,
  updateTeamProfile,
} from "./accountQueries.js";

function ErrorMessage({ error }) {
  if (!error) return null;
  if (error.code === "ACCOUNT_DISPLAY_NAME_UNAVAILABLE") {
    return <ErrorBlock error={error} fallback="That display name is unavailable."
      impact="Your entry is still here."
      recovery="Choose another display name and save again." />;
  }
  return <ErrorBlock error={error} fallback="The account request could not be completed." />;
}

function PasswordChangeError({ error }) {
  if (!error) return null;
  const rejection = {
    PASSWORD_CHANGE_DENIED: [
      "The current password was not accepted.",
      "Check your current password and try again.",
    ],
    PASSWORD_CHANGE_INVALID: [
      "The new password could not be used.",
      "Use a different password between 6 and 256 characters and enter it twice.",
    ],
    RATE_LIMITED: [
      "Password changes are temporarily limited.",
      "Wait and try again later.",
    ],
  }[error.code];
  return <ErrorBlock error={error}
    fallback={rejection?.[0] || "We could not confirm your password change."}
    impact={rejection ? "Your password was not changed." : "Your current sign-in may no longer work."}
    recovery={rejection?.[1] || "Try signing in with the new password. If you cannot sign in, use password recovery."} />;
}

function TeamProfileError({ error }) {
  if (!error || error.code === "PRECONDITION_FAILED") return null;
  const messages = {
    TEAM_NAME_UNAVAILABLE: ["That team name is unavailable in this league.", "Choose another team name and save again."],
    TEAM_PROFILE_INVALID: ["Some team details could not be saved.", "Check the team name, colours, and logo requirements, then try again."],
    TEAM_PROFILE_NO_CHANGES: ["These team details are already saved.", "Make a change before saving again."],
    TEAM_MANAGER_REQUIRED: ["You no longer have permission to edit this team.", "Ask your commissioner to check your team assignment."],
  }[error.code];
  return <ErrorBlock error={error}
    fallback={messages?.[0] || "We could not confirm the team profile update."}
    impact="Your entries are still here."
    recovery={messages?.[1] || "Check the saved team profile in another tab before trying again."} />;
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
  const logoInputRef = useRef(null);
  const [nameOverride, setNameOverride] = useState(null);
  const [primaryColourOverride, setPrimaryColourOverride] = useState(null);
  const [secondaryColourOverride, setSecondaryColourOverride] = useState(null);
  const [tertiaryColourOverride, setTertiaryColourOverride] = useState(null);
  const [patternTemplateOverride, setPatternTemplateOverride] =
    useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoError, setLogoError] = useState("");
  useEffect(() => {
    return () => { if (logoPreview) URL.revokeObjectURL(logoPreview); };
  }, [logoPreview]);
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
  const nameLength = Array.from(name.trim()).length;
  const nameInvalid = nameLength < 1 || nameLength > 35 ||
    /[\p{Cc}\u2028\u2029]/u.test(name);
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
    onSuccess: async (savedTeam) => {
      queryClient.setQueryData(leagueKeys.teams(leagueId), (teams) =>
        teams?.map((entry) => entry.id === savedTeam.id ? savedTeam : entry)
      );
      queryClient.setQueriesData({ queryKey: leagueKeys.team(leagueId, team.id), exact: true }, savedTeam);
      setNameOverride(null);
      setPrimaryColourOverride(null);
      setSecondaryColourOverride(null);
      setTertiaryColourOverride(null);
      setPatternTemplateOverride(null);
      setLogoFile(null);
      setLogoPreview(null);
      setLogoError("");
      if (logoInputRef.current) logoInputRef.current.value = "";
      setRemoveLogo(false);
      setMessage("Team profile saved.");
      await queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
    },
    onError: async (error) => {
      setMessage("");
      if (error?.code === "PRECONDITION_FAILED" && error.status === 412) {
        try {
          await queryClient.fetchQuery({ ...leagueTeamsQuery(httpClient, leagueId), staleTime: 0 });
          setMessage("The saved team profile was refreshed. Your entries are still here. Review them and save again.");
        } catch {
          setMessage("We could not refresh the saved team profile. Your entries are still here. Try saving again when the connection is restored.");
        }
      }
    },
  });

  return (
    <form
      className="hl-account-team-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (mutation.isPending || !isDirty || nameInvalid || logoError) return;
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
            aria-label="Team name"
            disabled={mutation.isPending}
            aria-invalid={nameInvalid}
            required
            onChange={(event) => setNameOverride(event.target.value)}
          />
          <small>Use 1 to 35 characters.</small>
        </label>
        <label className="hl-field">
          Team template
          <select
            disabled={mutation.isPending}
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
        <fieldset className="hl-account-colour-swatches" disabled={mutation.isPending}>
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
        <fieldset className="hl-team-logo-control" disabled={mutation.isPending}>
          <legend>Team logo</legend>
          <TeamMark team={previewTeam} className="hl-account-team-mark"
            logoUrl={removeLogo ? null : (logoFile && logoPreview) || (team.logoReference ? httpClient.resourceUrl(team.logoReference) : null)} />
          <label className="hl-field">
          <span>{team.logoReference || logoFile ? "Replace logo" : "Choose logo"}</span>
          <input
            ref={logoInputRef}
            aria-label="Team logo"
            key={removeLogo ? "removed" : "selected"}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0] || null;
              const invalid = file && (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 524288);
              setLogoFile(file);
              setLogoError(invalid ? "Choose a PNG, JPEG, or WebP image no larger than 512 KB." : "");
              setLogoPreview(file && !invalid && typeof URL.createObjectURL === "function" ? URL.createObjectURL(file) : null);
              setRemoveLogo(false);
            }}
          />
          <small>PNG, JPEG, or WebP; maximum 512 KB and 2048×2048.</small>
        </label>
      {(team.logoReference || logoFile) && (
        <label className="hl-check-field">
          <input
            type="checkbox"
            checked={removeLogo}
            onChange={(event) => {
              setRemoveLogo(event.target.checked && Boolean(team.logoReference));
              if (event.target.checked) {
                setLogoFile(null);
                setLogoPreview(null);
                setLogoError("");
                if (logoInputRef.current) logoInputRef.current.value = "";
              }
            }}
          />
          Remove the current logo
        </label>
      )}
        </fieldset>
      </div>
      <button
        type="submit"
        className="hl-button hl-button--primary"
        disabled={mutation.isPending || !isDirty || nameInvalid || Boolean(logoError)}
      >
        {mutation.isPending ? "Saving…" : "Save team profile"}
      </button>
      {message && <p className="hl-form-message" role="status">{message}</p>}
      {logoError && <p className="hl-form-message is-error" role="alert">{logoError}</p>}
      <TeamProfileError error={mutation.error} />
    </form>
  );
}

function LeagueTeamSettings({ league, session }) {
  const teams = useQuery({
    ...leagueTeamsQuery(session.httpClient, league.id),
    enabled: session.status === "authenticated",
  });
  if (teams.isPending) return <LoadingBlock>Loading {league.name} teams…</LoadingBlock>;
  if (teams.isError && !teams.data) return <ErrorMessage error={teams.error} />;
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
      {teams.isError && <ErrorMessage error={teams.error} />}
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
  const [passwordError, setPasswordError] = useState("");

  const displayName =
    displayNameOverride ?? profile.data?.displayName ?? "";
  const profileIsDirty =
    displayName.trim() !== profile.data?.displayName;
  const displayNameLength = Array.from(displayName.trim()).length;
  const displayNameInvalid = displayNameLength === 0 || displayNameLength > 50;

  const profileMutation = useMutation({
    mutationFn: () =>
      updateAccountProfile(
        session.httpClient,
        { displayName: displayName.trim() },
        profile.data.version
      ),
    onSuccess: async (savedProfile) => {
      queryClient.setQueryData(accountKeys.profile, savedProfile);
      setProfileMessage("Display name saved.");
      setDisplayNameOverride(null);
      await queryClient.invalidateQueries({ queryKey: accountKeys.profile });
      session.retryBootstrap();
    },
    onError: async (error) => {
      setProfileMessage("");
      if (error?.code === "ACCOUNT_PROFILE_PRECONDITION_FAILED") {
        await queryClient.invalidateQueries({ queryKey: accountKeys.profile });
        setProfileMessage("The saved profile was refreshed. Your entry is still here. Review it and save again.");
      }
    },
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
              if (profileMutation.isPending || displayNameInvalid || !profileIsDirty) return;
              setProfileMessage("");
              profileMutation.mutate();
            }}
          >
            <label className="hl-field">
              Display name
              <input
                value={displayName}
                maxLength={100}
                required
                disabled={profileMutation.isPending}
                aria-label="Display name"
                aria-invalid={displayNameInvalid || undefined}
                aria-describedby="display-name-hint"
                onChange={(event) =>
                  setDisplayNameOverride(event.target.value)
                }
              />
              <small id="display-name-hint">Use 1 to 50 characters.</small>
            </label>
            <label className="hl-field">
              Email
              <input value={profile.data.email} readOnly />
              <small>Email addresses cannot be changed.</small>
            </label>
            <button
              type="submit"
              className="hl-button hl-button--primary"
              disabled={profileMutation.isPending || !profileIsDirty || displayNameInvalid}
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
              if (passwordMutation.isPending) return;
              passwordMutation.reset();
              const validationError = accountPasswordError(newPassword, confirmation);
              setPasswordError(validationError);
              if (validationError) return;
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
                disabled={passwordMutation.isPending}
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
                maxLength={512}
                disabled={passwordMutation.isPending}
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
                maxLength={512}
                disabled={passwordMutation.isPending}
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
            {passwordError && <p className="hl-form-message is-error" role="alert">{passwordError}</p>}
            <PasswordChangeError error={passwordMutation.error} />
          </form>
        </Surface>
      </div>

      <AccountDeactivationPanel />

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
