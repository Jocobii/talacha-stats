"use client";

/**
 * app/admin/leagues/[id]/setup/PathSelector.tsx
 *
 * Client Component — onboarding post-creación de liga.
 *
 * Estados:
 *   "choosing"  → LeagueChoicePage: hero card profesional + botón Excel secundario
 *   "wizard"    → OnboardingWizard: 3 pasos (Equipos → Jugadores → Listo)
 *
 * El paso de Equipos acumula nombres localmente; al avanzar hace un solo
 * POST /api/leagues/[id]/teams/bulk para crear todos de golpe.
 */

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	ShieldCheck,
	Sparkles,
	FileSpreadsheet,
	ArrowRight,
	ArrowLeft,
	Check,
	Plus,
	X,
	UserPlus,
	Upload,
} from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Input } from "@/shared/ui/Input";
import { Badge } from "@/shared/ui/Badge";
import { Avatar } from "@/shared/ui/Avatar";
import { KeyHint } from "@/shared/ui/KeyHint";
import { PageHeader } from "@/shared/ui/PageHeader";
import { SectionLabel } from "@/shared/ui/SectionLabel";
import { Stepper } from "@/shared/ui/Stepper";

// ── Tipos ─────────────────────────────────────────────────────────────────────

type League = {
	id: string;
	name: string;
	season: string;
	dayOfWeek: string;
};

type DraftTeam = { name: string; color: string };
type CreatedTeam = { id: string; name: string; color: string | null };

type Screen = "choosing" | "wizard";
type WizardStep = 0 | 1 | 2; // Equipos | Jugadores | Listo

const TEAM_COLORS = [
	"#00E676",
	"#3B82F6",
	"#F59E0B",
	"#EC4899",
	"#A855F7",
	"#EF4444",
	"#06B6D4",
	"#F97316",
];

const WIZARD_STEPS = ["Equipos", "Jugadores", "Listo"];

// ── Componente principal ──────────────────────────────────────────────────────

export function PathSelector({
	league,
	initialPath = "choosing",
}: {
	league: League;
	initialPath?: "choosing" | "v2";
}) {
	const [screen, setScreen] = useState<Screen>(initialPath === "v2" ? "wizard" : "choosing");
	const [wizardStep, setWizardStep] = useState<WizardStep>(0);
	const [createdTeams, setCreatedTeams] = useState<CreatedTeam[]>([]);
	const router = useRouter();

	if (screen === "choosing") {
		return (
			<LeagueChoicePage
				league={league}
				onPro={() => setScreen("wizard")}
				onExcel={() => router.push(`/admin/imports?leagueId=${league.id}&from=new-league`)}
			/>
		);
	}

	return (
		<OnboardingWizard
			league={league}
			step={wizardStep}
			createdTeams={createdTeams}
			onTeamsReady={(teams) => {
				setCreatedTeams(teams);
				setWizardStep(1);
			}}
			onPlayersReady={() => setWizardStep(2)}
			onBack={() => setScreen("choosing")}
		/>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// LeagueChoicePage
// ════════════════════════════════════════════════════════════════════════════

function LeagueChoicePage({
	league,
	onPro,
	onExcel,
}: {
	league: League;
	onPro: () => void;
	onExcel: () => void;
}) {
	return (
		<div className="flex flex-col gap-10 max-w-[920px] mx-auto">
			<PageHeader
				breadcrumb={[
					{ label: "Ligas", href: "/admin/leagues" },
					{ label: league.name },
					{ label: "Empezar" },
				]}
				title="¿Cómo quieres empezar?"
				subtitle={`Configura ${league.name} en uno de dos caminos. El registro profesional toma más tiempo pero te da más control y mejor presentación.`}
			/>

			{/* ── PRIMARY: Registro profesional ── */}
			<section className="relative">
				{/* "Recomendado" chip */}
				<span className="absolute -top-3 left-6 z-10 inline-flex items-center gap-1.5 h-6 px-2.5 rounded text-[10.5px] font-bold tracking-[0.16em] uppercase bg-brand text-pitch">
					<Sparkles size={11} strokeWidth={2.5} /> Recomendado
				</span>

				<div className="bg-surface border border-line rounded-xl overflow-hidden relative">
					{/* Subtle radial glow */}
					<div
						className="absolute inset-0 -z-10 pointer-events-none opacity-[0.06]"
						style={{
							background: "radial-gradient(800px 200px at 80% 0%, #00E676 0%, transparent 60%)",
						}}
					/>

					<div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr]">
						{/* Left — sell */}
						<div className="p-7 sm:p-9">
							<div className="flex items-center gap-2 mb-4">
								<span className="w-9 h-9 rounded-md bg-brand/15 text-brand grid place-items-center shrink-0">
									<ShieldCheck size={18} strokeWidth={1.75} />
								</span>
								<SectionLabel>Registro profesional</SectionLabel>
							</div>

							<h2 className="font-display text-[36px] sm:text-[44px] leading-[0.95] font-black tracking-tight text-ink">
								Cada jugador
								<br />
								con identidad real.
							</h2>

							<p className="mt-4 text-[15px] leading-relaxed text-ink-2 max-w-[460px]">
								Registra equipos y jugadores con CURP. Cada jugador se queda con su historial entre
								temporadas y obtiene una página pública con sus estadísticas — listo para presumir
								en redes.
							</p>

							<ul className="mt-6 flex flex-col gap-3">
								<Bullet>Crea equipos en menos de 30 segundos</Bullet>
								<Bullet>Ventanilla de registro con búsqueda nacional por CURP</Bullet>
								<Bullet>Perfil público compartible para cada jugador</Bullet>
								<Bullet>Estadísticas, rachas y logros automáticos</Bullet>
							</ul>

							<div className="mt-8 flex items-center gap-3 flex-wrap">
								<Button variant="primary" size="lg" iconRight={ArrowRight} onClick={onPro}>
									Empezar registro profesional
								</Button>
								<span className="text-[12px] text-ink-3">~10 min · 3 pasos</span>
							</div>
						</div>

						{/* Right — preview card */}
						<div className="hidden lg:flex items-start border-l border-line bg-pitch/40 p-6">
							<div className="w-full">
								<SectionLabel className="mb-3 !text-ink-3">Vista previa</SectionLabel>
								<PlayerPreviewCard />
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ── SECONDARY: Excel ── */}
			<section>
				<SectionLabel className="mb-3">Camino rápido</SectionLabel>
				<button
					onClick={onExcel}
					className="w-full text-left bg-surface/60 border border-line rounded-lg p-5 sm:p-6 hover:border-ink-3 transition group flex items-start gap-5"
				>
					<span className="w-10 h-10 shrink-0 rounded-md bg-surface-2 border border-line grid place-items-center text-ink-2 group-hover:text-ink transition">
						<FileSpreadsheet size={18} strokeWidth={1.75} />
					</span>
					<div className="flex-1 min-w-0">
						<div className="flex items-center gap-2 flex-wrap">
							<h3 className="text-[15px] font-semibold text-ink">Importar desde Excel</h3>
							<Badge tone="neutral">Limitado</Badge>
						</div>
						<p className="text-[13px] text-ink-2 mt-1.5 max-w-[560px]">
							Si ya tienes los datos en una hoja, súbela y generamos tabla de posiciones + goleo. No
							crea identidades de jugador ni historial entre temporadas.
						</p>
					</div>
					<span className="text-[13px] font-medium text-ink-3 group-hover:text-ink transition shrink-0 inline-flex items-center gap-1.5 pt-0.5">
						Subir Excel <ArrowRight size={14} strokeWidth={2} />
					</span>
				</button>
			</section>

			{/* Escape hatch */}
			<div className="text-center -mt-4">
				<Link
					href={`/admin/leagues/${league.id}`}
					className="text-[12px] text-ink-3 hover:text-ink-2 transition"
				>
					Hacer esto después — ir a la liga →
				</Link>
			</div>
		</div>
	);
}

function Bullet({ children }: { children: React.ReactNode }) {
	return (
		<li className="flex items-start gap-2.5 text-[14px] text-ink leading-snug">
			<span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-brand/15 grid place-items-center">
				<Check size={11} strokeWidth={3} className="text-brand" />
			</span>
			{children}
		</li>
	);
}

function PlayerPreviewCard() {
	return (
		<div className="bg-surface border border-line rounded-lg p-4 relative overflow-hidden">
			<div className="flex items-center justify-between mb-3">
				<span className="font-mono text-[9.5px] tracking-[0.18em] uppercase text-brand font-bold">
					TalachaStats
				</span>
				<span className="font-mono text-[9px] tracking-[0.14em] uppercase text-ink-3">PERFIL</span>
			</div>
			<div className="flex items-start gap-3">
				<Avatar initials="MG" size="lg" />
				<div className="min-w-0">
					<div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-brand">
						● Goleadora
					</div>
					<div className="font-display text-[22px] font-black leading-none tracking-tight mt-1">
						MARGARITA
					</div>
					<div className="font-display text-[22px] font-black leading-none tracking-tight text-brand">
						GUTIERREZ
					</div>
				</div>
			</div>
			<div className="mt-4 pt-4 border-t border-line grid grid-cols-3 gap-2">
				<StatMini value={46} label="Goles" brand />
				<StatMini value={2} label="Ligas" />
				<StatMini value={36} label="PJ" />
			</div>
		</div>
	);
}

function StatMini({ value, label, brand }: { value: number; label: string; brand?: boolean }) {
	return (
		<div>
			<div
				className={`font-display text-[28px] font-black leading-none ${brand ? "text-brand" : "text-ink"}`}
			>
				{value}
			</div>
			<div className="text-[8.5px] tracking-[0.14em] uppercase text-ink-3 mt-1">{label}</div>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// OnboardingWizard
// ════════════════════════════════════════════════════════════════════════════

function OnboardingWizard({
	league,
	step,
	createdTeams,
	onTeamsReady,
	onPlayersReady,
	onBack,
}: {
	league: League;
	step: WizardStep;
	createdTeams: CreatedTeam[];
	onTeamsReady: (teams: CreatedTeam[]) => void;
	onPlayersReady: () => void;
	onBack: () => void;
}) {
	return (
		<div className="flex flex-col gap-8 max-w-[920px] mx-auto">
			<PageHeader
				breadcrumb={[
					{ label: "Ligas", href: "/admin/leagues" },
					{ label: league.name, href: `/admin/leagues/${league.id}` },
					{ label: "Configurar" },
				]}
				title={`Configurar ${league.name}`}
				subtitle={`${league.season} · ${league.dayOfWeek}`}
				actions={
					<Button variant="ghost" size="sm" onClick={onBack}>
						← Volver
					</Button>
				}
			/>

			<Card className="p-6">
				<Stepper steps={WIZARD_STEPS} current={step} />
			</Card>

			{step === 0 && <StepTeams league={league} onNext={onTeamsReady} />}
			{step === 1 && (
				<StepPlayers
					league={league}
					teams={createdTeams}
					onBack={() => onBack()}
					onNext={onPlayersReady}
				/>
			)}
			{step === 2 && <StepDone league={league} teams={createdTeams} />}
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// Paso 0 — Equipos
// ════════════════════════════════════════════════════════════════════════════

function StepTeams({ league, onNext }: { league: League; onNext: (teams: CreatedTeam[]) => void }) {
	const [draft, setDraft] = useState("");
	const [drafts, setDrafts] = useState<DraftTeam[]>([]);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const inputRef = useRef<HTMLInputElement>(null);

	function addDraft() {
		const name = draft.trim();
		if (!name) return;
		if (drafts.some((d) => d.name.toLowerCase() === name.toLowerCase())) {
			setError("Ya tienes un equipo con ese nombre.");
			return;
		}
		setDrafts((prev) => [...prev, { name, color: TEAM_COLORS[prev.length % TEAM_COLORS.length] }]);
		setDraft("");
		setError("");
		inputRef.current?.focus();
	}

	function removeDraft(i: number) {
		setDrafts((prev) => prev.filter((_, j) => j !== i));
	}

	async function handleNext() {
		if (drafts.length === 0) return;
		setSaving(true);
		setError("");
		try {
			const res = await fetch(`/api/leagues/${league.id}/teams/bulk`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ teams: drafts.map((d) => ({ name: d.name, color: d.color })) }),
			});
			const data = await res.json();
			if (!data.ok) {
				setError(data.error ?? "Error al guardar equipos.");
				return;
			}
			onNext(data.data as CreatedTeam[]);
		} catch {
			setError("Error de conexión. Intenta de nuevo.");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
				{/* Main card */}
				<Card className="p-6">
					<div className="flex items-center justify-between mb-1">
						<h3 className="font-display text-[22px] font-bold tracking-tight">Crea los equipos</h3>
						<span className="text-[12px] text-ink-3">{drafts.length} equipos</span>
					</div>
					<p className="text-sm text-ink-2 mb-5">
						Puedes agregar más después. Sugerimos al menos 4 para arrancar.
					</p>

					{/* Add form */}
					<div className="flex items-center gap-2 mb-2">
						<div className="flex-1">
							<Input
								ref={inputRef}
								placeholder="Nombre del equipo — ej. Las Leonas"
								value={draft}
								onChange={(e) => {
									setDraft(e.target.value);
									setError("");
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addDraft();
									}
								}}
							/>
						</div>
						<Button variant="primary" size="md" icon={Plus} onClick={addDraft}>
							Agregar
						</Button>
					</div>

					<div className="text-[11px] text-ink-3 mb-5 flex items-center gap-1.5">
						Tip: presiona <KeyHint>Enter</KeyHint> para agregar rápido
					</div>

					{error && (
						<p className="mb-3 text-[12px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-md px-3 py-2">
							{error}
						</p>
					)}

					{/* Team list */}
					<ul className="flex flex-col">
						{drafts.map((t, i) => (
							<li
								key={i}
								className="flex items-center gap-3 py-2.5 border-t border-line first:border-t-0"
							>
								<span
									className="w-8 h-8 rounded-md grid place-items-center text-pitch font-display font-bold text-[13px] shrink-0"
									style={{ background: t.color }}
								>
									{t.name.slice(0, 1).toUpperCase()}
								</span>
								<span className="flex-1 text-[14px] font-medium text-ink truncate">{t.name}</span>
								<button
									onClick={() => removeDraft(i)}
									className="w-7 h-7 grid place-items-center rounded-md text-ink-3 hover:text-red-400 hover:bg-red-500/10 transition"
								>
									<X size={14} strokeWidth={2} />
								</button>
							</li>
						))}
						{drafts.length === 0 && (
							<li className="text-center py-8 text-sm text-ink-3">
								Aún sin equipos. Agrega el primero arriba.
							</li>
						)}
					</ul>
				</Card>

				{/* Tips sidebar */}
				<div className="flex flex-col gap-4">
					<Card className="p-5">
						<SectionLabel className="mb-3">Consejos</SectionLabel>
						<ul className="flex flex-col gap-3 text-[13px] text-ink-2 leading-snug">
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">01</span>
								Usa el nombre real del equipo, sin abreviar.
							</li>
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">02</span>
								Si dudas del nombre, créalo y edítalo después.
							</li>
							<li className="flex gap-2">
								<span className="text-ink-3 shrink-0">03</span>
								No hace falta logo aún — lo subes desde el detalle del equipo.
							</li>
						</ul>
					</Card>
				</div>
			</div>

			{/* Footer */}
			<WizardFooter
				leftHint={
					drafts.length === 0
						? "Agrega al menos 2 equipos para continuar."
						: `${drafts.length} equipo${drafts.length !== 1 ? "s" : ""} listos`
				}
				primary={
					<Button
						variant="primary"
						size="md"
						iconRight={ArrowRight}
						onClick={handleNext}
						disabled={drafts.length < 2 || saving}
					>
						{saving ? "Guardando…" : "Siguiente: registrar jugadores"}
					</Button>
				}
			/>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// Paso 1 — Jugadores
// ════════════════════════════════════════════════════════════════════════════

function StepPlayers({
	league,
	teams,
	onBack,
	onNext,
}: {
	league: League;
	teams: CreatedTeam[];
	onBack: () => void;
	onNext: () => void;
}) {
	return (
		<div className="flex flex-col gap-6">
			<Card className="p-6">
				<h3 className="font-display text-[22px] font-bold tracking-tight">
					Registra jugadores en ventanilla
				</h3>
				<p className="text-sm text-ink-2 mt-1 mb-5 max-w-[640px]">
					Abre la ventanilla de registro y captura jugadores con su CURP. Cada jugador queda
					asignado a un equipo.
				</p>

				<div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
					<div className="flex-1 grid grid-cols-2 sm:grid-cols-2 gap-3">
						<MiniStat label="Equipos" value={teams.length} />
						<MiniStat label="Jugadores registrados" value={0} brand />
					</div>
					<a
						href={`/admin/registro?leagueId=${league.id}`}
						target="_blank"
						rel="noopener noreferrer"
						className="inline-flex items-center gap-2 h-11 px-5 text-sm font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition shrink-0"
					>
						<UserPlus size={16} strokeWidth={1.75} />
						Abrir ventanilla
						<ArrowRight size={14} strokeWidth={2} />
					</a>
				</div>
			</Card>

			{/* Teams overview */}
			<Card className="overflow-hidden">
				<div className="px-6 py-3 border-b border-line flex items-center justify-between bg-surface-2/40">
					<SectionLabel>Avance por equipo</SectionLabel>
					<span className="text-[11px] text-ink-3">{teams.length} equipos · 0 jugadores</span>
				</div>
				<ul>
					{teams.map((t) => (
						<li
							key={t.id}
							className="flex items-center gap-4 px-6 py-3.5 border-b border-line last:border-b-0"
						>
							<span
								className="w-8 h-8 rounded-md grid place-items-center text-pitch font-display font-bold text-[13px] shrink-0"
								style={{ background: t.color ?? "#00E676" }}
							>
								{t.name.slice(0, 1).toUpperCase()}
							</span>
							<div className="flex-1 min-w-0">
								<div className="flex items-center justify-between gap-3">
									<span className="text-[14px] font-medium text-ink truncate">{t.name}</span>
									<span className="text-[12px] font-mono text-ink-3">0 jug.</span>
								</div>
								<div className="mt-2 h-1 bg-surface-2 rounded-full overflow-hidden">
									<div className="h-full bg-brand" style={{ width: "0%" }} />
								</div>
							</div>
							<a
								href={`/admin/registro?leagueId=${league.id}&teamId=${t.id}`}
								target="_blank"
								rel="noopener noreferrer"
								className="inline-flex items-center gap-1 h-7 px-3 text-[12px] font-medium rounded-md text-ink-2 border border-line hover:border-ink-3 hover:text-ink transition"
							>
								Registrar <ArrowRight size={12} strokeWidth={2} />
							</a>
						</li>
					))}
				</ul>
			</Card>

			<WizardFooter
				leftHint="Cuando termines de registrar los jugadores, continúa."
				secondary={
					<Button variant="secondary" size="md" icon={ArrowLeft} onClick={onBack}>
						Atrás
					</Button>
				}
				primary={
					<Button variant="primary" size="md" iconRight={ArrowRight} onClick={onNext}>
						Ya registré los jugadores
					</Button>
				}
			/>
		</div>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// Paso 2 — Listo
// ════════════════════════════════════════════════════════════════════════════

function StepDone({ league, teams }: { league: League; teams: CreatedTeam[] }) {
	return (
		<Card className="p-10 sm:p-12 text-center relative overflow-hidden">
			{/* Glow */}
			<div
				className="absolute inset-0 -z-10 opacity-[0.07] pointer-events-none"
				style={{
					background: "radial-gradient(500px 200px at 50% 0%, #00E676 0%, transparent 70%)",
				}}
			/>

			<div className="w-14 h-14 rounded-full bg-brand/15 border border-brand/30 grid place-items-center mx-auto mb-5">
				<Check size={26} strokeWidth={2.5} className="text-brand" />
			</div>

			<h2 className="font-display text-[36px] sm:text-[44px] leading-[0.95] font-black tracking-tight">
				Liga lista.
			</h2>
			<p className="text-[15px] text-ink-2 mt-3 max-w-md mx-auto">
				<strong className="text-ink">{league.name}</strong> está configurada con{" "}
				<strong className="text-ink">{teams.length} equipos</strong>. Ya puedes capturar tu primera
				jornada.
			</p>

			<div className="mt-7 flex flex-wrap items-center justify-center gap-3">
				<Link
					href={`/admin/imports?leagueId=${league.id}`}
					className="inline-flex items-center gap-2 h-11 px-6 text-sm font-semibold rounded-md bg-brand text-pitch hover:bg-brand-dim transition"
				>
					<Upload size={16} strokeWidth={1.75} />
					Capturar primera jornada
					<ArrowRight size={14} strokeWidth={2} />
				</Link>
				<Link
					href={`/admin/leagues/${league.id}`}
					className="inline-flex items-center gap-2 h-11 px-5 text-sm font-semibold rounded-md bg-surface-2 border border-line text-ink hover:border-ink-3 transition"
				>
					Ver liga
				</Link>
			</div>

			<div className="mt-8 pt-8 border-t border-line max-w-md mx-auto">
				<p className="text-[11px] text-ink-3 mb-4">¿Qué puedes hacer ahora?</p>
				<div className="flex flex-col gap-2 text-left">
					{[
						{
							href: `/admin/registro?leagueId=${league.id}`,
							label: "Registrar más jugadores",
							desc: "Agrega más participantes cuando se inscriban.",
						},
						{
							href: `/admin/teams?leagueId=${league.id}`,
							label: "Ver plantillas de equipos",
							desc: "Revisa los jugadores inscritos por equipo.",
						},
					].map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className="flex items-center justify-between p-3 rounded-md border border-line hover:bg-surface-2 transition group"
						>
							<div>
								<p className="text-[13px] font-medium text-ink group-hover:text-brand transition">
									{item.label}
								</p>
								<p className="text-[11px] text-ink-3 mt-0.5">{item.desc}</p>
							</div>
							<ArrowRight
								size={13}
								strokeWidth={2}
								className="text-ink-3 group-hover:text-brand transition"
							/>
						</Link>
					))}
				</div>
			</div>
		</Card>
	);
}

// ════════════════════════════════════════════════════════════════════════════
// Shared primitives
// ════════════════════════════════════════════════════════════════════════════

function WizardFooter({
	leftHint,
	secondary,
	primary,
}: {
	leftHint: string;
	secondary?: React.ReactNode;
	primary: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3 pt-2">
			<span className="text-[12px] text-ink-3">{leftHint}</span>
			<div className="flex items-center gap-2">
				{secondary}
				{primary}
			</div>
		</div>
	);
}

function MiniStat({ label, value, brand }: { label: string; value: number; brand?: boolean }) {
	return (
		<div className="bg-surface-2/60 border border-line rounded-md px-3 py-2.5">
			<div className="text-[10px] font-semibold tracking-[0.14em] uppercase text-ink-3">
				{label}
			</div>
			<div
				className={`font-display text-2xl font-black leading-none mt-1 ${brand ? "text-brand" : "text-ink"}`}
			>
				{value}
			</div>
		</div>
	);
}
