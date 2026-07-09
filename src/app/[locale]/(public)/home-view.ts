export const HOME_VIEWS = ["jugador", "organizador"] as const;

export type HomeView = (typeof HOME_VIEWS)[number];

export const DEFAULT_HOME_VIEW: HomeView = "jugador";
export const HOME_VIEW_COOKIE = "ts_home_view";
export const HOME_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const HOME_VIEW_QUERY_PARAM = "vista";
/** `?ref=organizador` — para links de campaña (FB, WhatsApp, ads) sin pisar el toggle manual `?vista=`. */
export const HOME_VIEW_REF_PARAM = "ref";

function isHomeView(value: string | undefined): value is HomeView {
	return HOME_VIEWS.includes(value as HomeView);
}

/** Prioridad: query param (`?vista=`) > `?ref=` de campaña > cookie persistida > default jugador. */
export function resolveHomeView(
	queryParam: string | undefined,
	refParam: string | undefined,
	cookieValue: string | undefined,
): HomeView {
	if (isHomeView(queryParam)) return queryParam;
	if (isHomeView(refParam)) return refParam;
	if (isHomeView(cookieValue)) return cookieValue;
	return DEFAULT_HOME_VIEW;
}
