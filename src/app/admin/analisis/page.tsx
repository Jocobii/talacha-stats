import { redirect } from "next/navigation";

export default function AdminAnalisisRedirect({
  searchParams,
}: {
  searchParams: Record<string, string | undefined>;
}) {
  const params = new URLSearchParams();
  if (searchParams.leagueId) params.set("leagueId", searchParams.leagueId);
  if (searchParams.teamA)    params.set("teamA",    searchParams.teamA);
  if (searchParams.teamB)    params.set("teamB",    searchParams.teamB);

  const qs = params.toString();
  redirect(`/analisis${qs ? `?${qs}` : ""}`);
}
