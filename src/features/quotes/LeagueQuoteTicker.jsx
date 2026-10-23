import { useQuery } from "@tanstack/react-query";
import QuoteTicker from "../../components/QuoteTicker.jsx";
import { quoteRotationQuery } from "./quoteQueries.js";

export function LeagueQuoteTicker({ leagueId, httpClient }) {
  const quotes = useQuery(quoteRotationQuery(httpClient, leagueId));
  return <QuoteTicker approvedQuotes={quotes.data} />;
}
