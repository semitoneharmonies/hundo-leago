import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Surface } from "../../components/HundoUi.jsx";
import {
  freeAgentDraftKeys,
  publishedCandidateCardQuery,
} from "./freeAgentDraftQueries.js";
import { classifyReleaseQaT132Offers } from "./releaseQaT132Diagnostic.js";
import styles from "./FreeAgentDraftPage.module.css";

const UUID_V4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function exactQueryKey(actual, expected) {
  return (
    Array.isArray(actual) &&
    actual.length === expected.length &&
    expected.every((part, index) => actual[index] === part)
  );
}

function ReleaseQaT132Probe({ fadId, httpClient, leagueId, teamId }) {
  const queryClient = useQueryClient();
  const query = useQuery(
    publishedCandidateCardQuery(httpClient, leagueId, fadId, teamId)
  );
  const evictionGeneration = useRef(0);
  const completedGeneration = useRef(0);
  const removedQuery = useRef(null);
  const [evidence, setEvidence] = useState({
    evictions: 0,
    successfulLoads: 0,
    successfulRefetches: 0,
    completedGeneration: 0,
  });

  useEffect(() => {
    const queryCache = queryClient.getQueryCache();
    const targetKey = freeAgentDraftKeys.historyCard(leagueId, fadId, teamId);
    return queryCache.subscribe((event) => {
      if (!exactQueryKey(event.query?.queryKey, targetKey)) return;

      if (event.type === "removed") {
        removedQuery.current = event.query;
        evictionGeneration.current += 1;
        setEvidence((current) => ({
          ...current,
          evictions: evictionGeneration.current,
        }));
        return;
      }

      if (event.type !== "updated" || event.action?.type !== "success") {
        return;
      }
      if (queryCache.find({ queryKey: targetKey, exact: true }) !== event.query) {
        return;
      }

      const generation = evictionGeneration.current;
      const completedRefetch = generation > completedGeneration.current;
      if (completedRefetch && event.query === removedQuery.current) return;
      completedGeneration.current = generation;
      setEvidence((current) => ({
        ...current,
        successfulLoads: current.successfulLoads + 1,
        successfulRefetches:
          current.successfulRefetches + (completedRefetch ? 1 : 0),
        completedGeneration: generation,
      }));
    });
  }, [fadId, leagueId, queryClient, teamId]);

  const hasFreshProjection =
    query.isSuccess && evidence.completedGeneration === evidence.evictions;
  const state = query.isError
    ? "error"
    : !hasFreshProjection && evidence.evictions > evidence.completedGeneration
      ? "refetching"
      : query.isPending
        ? "loading"
        : "loaded";
  const offerClassification = hasFreshProjection
    ? classifyReleaseQaT132Offers(query.data)
    : "pending";

  return (
    <Surface
      as="aside"
      className={styles.panel}
      aria-label="Release QA T132 cache diagnostic"
    >
      <h2>Release QA T132 cache diagnostic</h2>
      <dl>
        <div><dt>Selected team ID</dt><dd>{teamId}</dd></div>
        <div><dt>State</dt><dd>{state}</dd></div>
        <div><dt>Offer projection</dt><dd>{offerClassification}</dd></div>
        <div><dt>Fetch status</dt><dd>{query.fetchStatus}</dd></div>
        <div><dt>Observed successful loads</dt><dd>{evidence.successfulLoads}</dd></div>
        <div><dt>Physical evictions</dt><dd>{evidence.evictions}</dd></div>
        <div><dt>Successful refetches</dt><dd>{evidence.successfulRefetches}</dd></div>
      </dl>
    </Surface>
  );
}

export function ReleaseQaT132Diagnostic({
  active,
  appEnv,
  fadId,
  httpClient,
  leagueId,
  requested,
  selectedTeamId,
}) {
  if (
    active !== true ||
    appEnv !== "staging" ||
    requested !== true ||
    !UUID_V4.test(leagueId || "") ||
    !UUID_V4.test(fadId || "") ||
    !UUID_V4.test(selectedTeamId || "")
  ) {
    return null;
  }

  return (
    <ReleaseQaT132Probe
      key={`${leagueId}:${fadId}:${selectedTeamId}`}
      fadId={fadId}
      httpClient={httpClient}
      leagueId={leagueId}
      teamId={selectedTeamId}
    />
  );
}
