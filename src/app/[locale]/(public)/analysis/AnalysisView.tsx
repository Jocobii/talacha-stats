"use client";

import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/shared/i18n/navigation";
import { BarChart3, ArrowLeft } from "lucide-react";
import CityFilter from "@/shared/ui/CityFilter";
import { LeagueSelect } from "@/features/league-selection";
import {
	useNarratorMatchup,
	useNarratorAnalysisQuery,
	NarratorReport,
	MatchupForm,
	NarratorReportActions,
	MATCHUP_SELECT_CLASS,
	type MatchupErrorCode,
} from "@/features/narrator-analysis";

export default function AnalysisView() {
	const t = useTranslations("analysis");
	const tCommon = useTranslations("common");

	return (
		<div className="text-ink flex flex-col flex-1">
			<header className="bg-pitch px-5 pt-8 pb-6 max-w-2xl mx-auto w-full">
				<Link
					href="/"
					className="inline-flex items-center gap-1.5 text-ink-3 hover:text-ink text-sm transition mb-5"
				>
					<ArrowLeft size={16} strokeWidth={2} />
					{tCommon("backHome")}
				</Link>
				<div className="flex items-center gap-2 mb-1">
					<BarChart3 size={24} className="text-brand-ink" strokeWidth={2} />
					<h1 className="font-display font-black text-4xl uppercase tracking-wide leading-none">
						{t("title")}
					</h1>
				</div>
				<div className="flex items-center justify-between mt-2">
					<p className="text-ink-2 text-sm">{t("subtitle")}</p>
					<div className="shrink-0">
						<CityFilter />
					</div>
				</div>
			</header>

			<div className="bg-surface flex-1 rounded-t-3xl px-4 pt-6 pb-16">
				<div className="max-w-2xl mx-auto">
					<Suspense
						fallback={<p className="text-sm text-ink-3 py-8 text-center">{t("loading")}</p>}
					>
						<AnalysisContent />
					</Suspense>
				</div>
			</div>
		</div>
	);
}

function matchupErrorMessage(
	t: ReturnType<typeof useTranslations>,
	code: MatchupErrorCode,
): string | null {
	if (!code) return null;
	if (code.code === "bothTeams") return t("errorBothTeams");
	if (code.code === "bothLinkTeams") return t("errorBothLinkTeams");
	return t("errorOneLinkTeam", { team: code.team });
}

function AnalysisContent() {
	const t = useTranslations("analysis");
	const searchParams = useSearchParams();
	const city = searchParams.get("city") ?? "Tijuana";

	const matchup = useNarratorMatchup(city);
	const analysisQuery = useNarratorAnalysisQuery(matchup.confirmed);

	const errorMessage =
		matchupErrorMessage(t, matchup.errorCode) ??
		(analysisQuery.isError ? analysisQuery.error.message : null);

	return (
		<div className="space-y-4">
			<MatchupForm
				leagueSelect={
					<LeagueSelect
						value={matchup.leagueId}
						onChange={matchup.setLeagueId}
						city={city}
						selectClassName={MATCHUP_SELECT_CLASS}
					/>
				}
				teams={matchup.teams}
				teamA={matchup.teamA}
				onTeamAChange={matchup.setTeamA}
				teamB={matchup.teamB}
				onTeamBChange={matchup.setTeamB}
				errorMessage={errorMessage}
				isSubmitting={analysisQuery.isFetching}
				onSubmit={matchup.handleAnalyze}
				labels={{
					league: t("league"),
					teamA: t("teamA"),
					teamB: t("teamB"),
					selectPlaceholder: t("selectPlaceholder"),
					generate: t("generate"),
					analyzing: t("analyzing"),
				}}
			/>

			{analysisQuery.data && matchup.confirmed && (
				<NarratorReport
					analysis={analysisQuery.data}
					actions={
						<NarratorReportActions
							matchup={matchup.confirmed}
							labels={{
								share: t("actions.share"),
								copied: t("actions.copied"),
								pdf: t("actions.pdf"),
								png: t("actions.png"),
							}}
						/>
					}
				/>
			)}
		</div>
	);
}
