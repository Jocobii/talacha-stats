"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeMode = "dark" | "light";
export type ThemeTone = "cal" | "papel" | "cancha";

type ThemeCtx = {
	mode: ThemeMode;
	tone: ThemeTone;
	setMode: (m: ThemeMode) => void;
	setTone: (t: ThemeTone) => void;
	toggle: () => void;
};

const Ctx = createContext<ThemeCtx | null>(null);

const KEY_MODE = "ts.theme.mode";
const KEY_TONE = "ts.theme.tone";
const DEFAULT_MODE: ThemeMode = "dark";
const DEFAULT_TONE: ThemeTone = "cal";

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);
	const [tone, setToneState] = useState<ThemeTone>(DEFAULT_TONE);

	// Hidratar desde localStorage tras el primer render (evita hidration mismatch)
	useEffect(() => {
		const m = (localStorage.getItem(KEY_MODE) as ThemeMode) ?? DEFAULT_MODE;
		const t = (localStorage.getItem(KEY_TONE) as ThemeTone) ?? DEFAULT_TONE;
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setModeState(m);
		setToneState(t);
	}, []);

	// Aplicar al <html> cuando cambia mode o tone
	useEffect(() => {
		document.documentElement.dataset.theme = mode;
		document.documentElement.dataset.tone = tone;
	}, [mode, tone]);

	const setMode = (m: ThemeMode): void => {
		setModeState(m);
		localStorage.setItem(KEY_MODE, m);
	};

	const setTone = (t: ThemeTone): void => {
		setToneState(t);
		localStorage.setItem(KEY_TONE, t);
	};

	const toggle = (): void => setMode(mode === "dark" ? "light" : "dark");

	return <Ctx.Provider value={{ mode, tone, setMode, setTone, toggle }}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
	const v = useContext(Ctx);
	if (!v) throw new Error("useTheme must be used inside ThemeProvider");
	return v;
}
