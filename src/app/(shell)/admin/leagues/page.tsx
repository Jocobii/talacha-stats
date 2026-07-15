import { getActiveCity } from "@/shared/lib/active-city";
import { serverFetch } from "@/shared/lib/server-fetch";
import { LeaguesView, type LeagueRow } from "./LeaguesView";

async function fetchLeagues(city: string, status: "active" | "finished"): Promise<LeagueRow[]> {
	const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
	const url = `${base}/api/leagues?city=${encodeURIComponent(city)}&status=${status}`;
	const res = await serverFetch(url, { cache: "no-store" });
	return res.ok ? ((await res.json()).data ?? []) : [];
}

export default async function LeaguesPage() {
	const city = await getActiveCity();
	const [active, finished] = await Promise.all([
		fetchLeagues(city, "active"),
		fetchLeagues(city, "finished"),
	]);

	return <LeaguesView city={city} active={active} finished={finished} />;
}
