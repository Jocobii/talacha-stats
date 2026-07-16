/**
 * features/cedula/index.ts
 * Barrel público — solo piezas client-safe (view-model puro + componentes
 * presentacionales). El data-fetcher (getCedulaDataForMatch/Matchday) vive en
 * entities/match/queries.ts y se importa por ruta directa desde los server
 * components de app/(print)/cedula/* (regla de split cliente/servidor).
 */
export {
	buildCedulaViewModel,
	type CedulaSheetVM,
	type CedulaTeamVM,
	type CedulaRowVM,
	type CedulaPlayerRowVM,
	type CedulaBlankRowVM,
	type CedulaDensity,
} from "./lib/build-cedula-view-model";
export { CedulaSheet } from "./ui/CedulaSheet";
export { CedulaBatch } from "./ui/CedulaBatch";
