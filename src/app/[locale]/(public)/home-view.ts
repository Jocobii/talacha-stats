export const HOME_VIEWS = ["jugador", "organizador"] as const;

export type HomeView = (typeof HOME_VIEWS)[number];

export const DEFAULT_HOME_VIEW: HomeView = "jugador";
export const HOME_VIEW_COOKIE = "ts_home_view";
export const HOME_VIEW_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;
export const HOME_VIEW_QUERY_PARAM = "vista";

function isHomeView(value: string | undefined): value is HomeView {
	return HOME_VIEWS.includes(value as HomeView);
}

/** Prioridad: query param (`?vista=`) > cookie persistida > default jugador. */
export function resolveHomeView(
	queryParam: string | undefined,
	cookieValue: string | undefined,
): HomeView {
	if (isHomeView(queryParam)) return queryParam;
	if (isHomeView(cookieValue)) return cookieValue;
	return DEFAULT_HOME_VIEW;
}
