"use client";

/**
 * features/league-onboarding/ui/QuickCreateLeagueForm.tsx
 *
 * Alta rápida de liga en UNA pantalla (A2). Refactor sobre el stack estándar:
 *   - React Hook Form + zodResolver → validación declarativa con el MISMO Zod
 *     schema que valida el server (league-form-schema.ts), sin setState a mano.
 *   - TanStack Query (useCreateLeague) → mutación con loading/error.
 *   - Borrador en localStorage vía form.watch (solo escribe, no llama setState).
 *
 * UX (NN/g): una columna, día en chips de un toque, temporada con default
 * inteligente, categoría opcional colapsada, equipos en campo de fichas, y
 * confirmación ligera antes de escribir. Jugadores se registran aparte (CURP).
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	QuickCreateLeagueSchema,
	type QuickCreateLeagueInput,
	type DayValue,
	DAYS,
	defaultSeason,
} from "../model/league-form-schema";
import { useToast } from "@/shared/hooks/use-toast";
import { useCreateLeague, type CreatedLeague } from "../model/useCreateLeague";

type Organization = { id: string; name: string; city: string };

type Props = {
	organizations: Organization[];
	defaultOrganizationId?: string;
};

const DRAFT_KEY = "ts:new-league-draft";

type DraftValues = {
	name: string;
	dayOfWeek?: DayValue;
	season: string;
	category: string;
	organizationId?: string;
};

/**
 * Lee el borrador de localStorage UNA vez, síncronamente, para sembrar
 * defaultValues de RHF (no se restaura con setState en un efecto).
 * En el servidor no hay window → defaults.
 */
function readInitialDraft(): DraftValues {
	const base: DraftValues = {
		name: "",
		dayOfWeek: undefined,
		season: defaultSeason(),
		category: "",
		organizationId: undefined,
	};
	if (typeof window === "undefined") return base;
	try {
		const raw = window.localStorage.getItem(DRAFT_KEY);
		if (!raw) return base;
		const d = JSON.parse(raw) as Partial<DraftValues>;
		return {
			name: typeof d.name === "string" ? d.name : base.name,
			dayOfWeek: DAYS.some((x) => x.value === d.dayOfWeek) ? (d.dayOfWeek as DayValue) : undefined,
			season: typeof d.season === "string" && d.season ? d.season : base.season,
			category: typeof d.category === "string" ? d.category : "",
			organizationId: typeof d.organizationId === "string" ? d.organizationId : undefined,
		};
	} catch {
		return base;
	}
}

export function QuickCreateLeagueForm({ organizations, defaultOrganizationId }: Props) {
	const router = useRouter();
	const createLeague = useCreateLeague();
	const toast = useToast();

	// defaultValues calculados una sola vez (lazy) — incluye borrador + org.
	const [defaults] = useState(() => {
		const draft = readInitialDraft();
		return {
			...draft,
			organizationId: draft.organizationId ?? defaultOrganizationId ?? organizations[0]?.id,
		};
	});

	const {
		register,
		handleSubmit,
		control,
		watch,
		getValues,
		setError,
		formState: { errors },
	} = useForm<QuickCreateLeagueInput>({
		resolver: zodResolver(QuickCreateLeagueSchema),
		mode: "onBlur",
		defaultValues: defaults as Partial<QuickCreateLeagueInput>,
	});

	const [showCategory, setShowCategory] = useState(defaults.category.length > 0);
	const [confirming, setConfirming] = useState(false);
	// Liga ya creada, en espera del paso de cancha/horario (StepVenueSchedule).
	// Null mientras se llena el formulario o se confirma.
	const [createdLeague, setCreatedLeague] = useState<CreatedLeague | null>(null);

	// Autosave del borrador: solo escribe a localStorage (sin setState).
	useEffect(() => {
		const sub = watch((values) => {
			try {
				window.localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
			} catch {
				/* sin localStorage — no bloquear */
			}
		});
		return () => sub.unsubscribe();
	}, [watch]);

	const dayOfWeek = watch("dayOfWeek");
	const dayLabel = DAYS.find((d) => d.value === dayOfWeek)?.label ?? "";

	// handleSubmit valida con Zod; si pasa, abrimos la confirmación.
	function onValid() {
		if (organizations.length > 1 && !getValues("organizationId")) {
			setError("organizationId", { message: "Selecciona una organización." });
			return;
		}
		setConfirming(true);
	}

	function doCreate() {
		createLeague.mutate(getValues(), {
			onSuccess: (data) => {
				try {
					window.localStorage.removeItem(DRAFT_KEY);
				} catch {
					/* no-op */
				}
				setConfirming(false);
				toast.success(`Liga "${data.league.name}" creada.`);
				router.push(`/admin/leagues/${data.league.id}`);
			},
		});
	}

	return (
		<div className="max-w-lg">
			<div className="mb-6">
				<Link href="/admin/leagues" className="text-sm text-ink-2 hover:underline">
					← Ligas
				</Link>
				<h1 className="text-2xl font-bold text-ink mt-1">Crear tu liga</h1>
				<p className="text-sm text-ink-2 mt-1">
					Después crea tus equipos desde el módulo de Equipos, eligiendo esta liga.
				</p>
			</div>

			<form onSubmit={handleSubmit(onValid)} className="bg-surface rounded-xl shadow p-6 space-y-5">
				{/* Organización — solo si el owner puede escoger entre varias */}
				{organizations.length > 1 && (
					<div>
						<label className="block text-sm font-medium text-ink mb-1">Organización</label>
						<select
							{...register("organizationId", {
								setValueAs: (v) => (v === "" ? undefined : v),
							})}
							className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-brand"
						>
							<option value="">— Seleccionar organización —</option>
							{organizations.map((o) => (
								<option key={o.id} value={o.id}>
									{o.name} · {o.city}
								</option>
							))}
						</select>
						{errors.organizationId && (
							<p className="text-xs text-red-400 mt-1">{errors.organizationId.message}</p>
						)}
					</div>
				)}

				{/* Nombre */}
				<div>
					<label className="block text-sm font-medium text-ink mb-1">Nombre de la liga</label>
					<input
						autoFocus
						{...register("name")}
						placeholder="Liga Brillante"
						className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
					/>
					{errors.name && <p className="text-xs text-red-400 mt-1">{errors.name.message}</p>}
				</div>

				{/* Día — chips de un toque */}
				<div>
					<label className="block text-sm font-medium text-ink mb-1">Día de juego</label>
					<Controller
						control={control}
						name="dayOfWeek"
						render={({ field }) => (
							<div className="flex gap-1.5">
								{DAYS.map((d) => {
									const active = field.value === d.value;
									return (
										<button
											key={d.value}
											type="button"
											onClick={() => field.onChange(d.value)}
											aria-pressed={active}
											className={[
												"flex-1 text-sm py-2 rounded-lg border transition-colors",
												active
													? "bg-brand/15 border-brand/40 text-brand-ink font-semibold"
													: "border-line text-ink-2 hover:border-brand/30",
											].join(" ")}
										>
											{d.label}
										</button>
									);
								})}
							</div>
						)}
					/>
					{errors.dayOfWeek && <p className="text-xs text-red-400 mt-1">Elige el día de juego.</p>}
				</div>

				{/* Temporada — default inteligente */}
				<div>
					<label className="block text-sm font-medium text-ink mb-1">Temporada</label>
					<input
						{...register("season")}
						placeholder="Apertura 2026"
						className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
					/>
					{errors.season ? (
						<p className="text-xs text-red-400 mt-1">{errors.season.message}</p>
					) : (
						<p className="text-xs text-ink-3 mt-1">Lo llenamos por ti, cámbialo si quieres.</p>
					)}
				</div>

				{/* Categoría — opcional, colapsada */}
				{!showCategory ? (
					<button
						type="button"
						onClick={() => setShowCategory(true)}
						className="text-sm text-brand-ink hover:underline"
					>
						+ Agregar categoría
					</button>
				) : (
					<div>
						<label className="block text-sm font-medium text-ink mb-1">Categoría</label>
						<input
							{...register("category")}
							placeholder="Libre, Femenil, Mixto…"
							className="w-full border border-line rounded-lg px-3 py-2 text-sm text-ink bg-surface focus:outline-none focus:ring-2 focus:ring-brand"
						/>
					</div>
				)}

				<button
					type="submit"
					className="w-full bg-brand text-pitch px-6 py-3 rounded-lg text-sm font-bold hover:bg-brand-dim"
				>
					Crear liga y continuar
				</button>
			</form>

			{/* Confirmación ligera — nunca escribe a ciegas */}
			{confirming && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
					role="dialog"
					aria-modal="true"
				>
					<div className="bg-surface rounded-2xl border border-line p-6 w-full max-w-sm">
						<h2 className="text-lg font-bold text-ink mb-3">¿Todo bien?</h2>
						<dl className="text-sm space-y-1.5 mb-4">
							<div className="flex justify-between gap-3">
								<dt className="text-ink-3">Liga</dt>
								<dd className="text-ink font-medium text-right">{getValues("name").trim()}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-3">Día</dt>
								<dd className="text-ink text-right">{dayLabel}</dd>
							</div>
							<div className="flex justify-between gap-3">
								<dt className="text-ink-3">Temporada</dt>
								<dd className="text-ink text-right">{getValues("season").trim()}</dd>
							</div>
						</dl>
						<p className="text-xs text-ink-3 mb-5">
							Después crea tus equipos desde el módulo de Equipos, eligiendo esta liga.
						</p>
						{createLeague.isError && (
							<p className="text-red-400 text-sm bg-red-950/40 px-3 py-2 rounded-lg mb-4">
								{createLeague.error.message}
							</p>
						)}
						<div className="flex gap-3">
							<button
								type="button"
								onClick={() => setConfirming(false)}
								disabled={createLeague.isPending}
								className="flex-1 bg-surface-2 text-ink px-4 py-2.5 rounded-lg text-sm hover:opacity-80"
							>
								Volver
							</button>
							<button
								type="button"
								onClick={doCreate}
								disabled={createLeague.isPending}
								className="flex-1 bg-brand text-pitch px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-brand-dim disabled:opacity-50"
							>
								{createLeague.isPending ? "Creando…" : "Sí, crear"}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
