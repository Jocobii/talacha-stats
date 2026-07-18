// Sistema de diseno - componentes base
export { Typography } from "./Typography";
export type { TypographyProps } from "./Typography";
export { TYPOGRAPHY_VARIANTS, WEIGHT, TONE } from "./typography-scales";
export type { TypographyVariant, Weight, Tone } from "./typography-scales";
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
export { SaveButton } from "./SaveButton";
export type { SaveStatus } from "./SaveButton";
export { Field } from "./Field";
export { Input } from "./Input";
export type { InputProps } from "./Input";
export { Select } from "./Select";
export { Listbox } from "./Listbox";
export type { FilterOption } from "./Listbox";
export { Card } from "./Card";
export type { CardProps } from "./Card";
export type { CardHeaderProps } from "./CardHeader";
export type { CardBodyProps } from "./CardBody";
export type { CardFooterProps } from "./CardFooter";
export { Badge } from "./Badge";
export { StatusDot } from "./StatusDot";
export { Avatar } from "./Avatar";
export { PageHeader } from "./PageHeader";
export { PageShell } from "./PageShell";
export type { PageShellProps } from "./PageShell";
export { SectionLabel } from "./SectionLabel";
export { KeyHint } from "./KeyHint";
export { EmptyState } from "./EmptyState";
export { ErrorState } from "./ErrorState";
export { NoOrganizationView } from "./NoOrganizationView";
export { ListSkeleton } from "./ListSkeleton";
export { Modal } from "./Modal";
export { Stepper } from "./Stepper";
export { StatTile } from "./StatTile";
export { Section } from "./Section";
export type { SectionProps } from "./Section";
export { Panel } from "./Panel";
export type { PanelProps } from "./Panel";

// Sorteo Cockpit atoms
export { TeamBadge } from "./TeamBadge";
export { StatusPill } from "./StatusPill";
export { CheckPill } from "./CheckPill";
export { TeamPicker } from "./TeamPicker";

// Navegacion de liga
export { LeagueTabBar } from "./LeagueTabBar";

// Navegacion del hub de organizacion (docs/ORG-PROFILE-HUB.md)
export { OrgTabBar } from "./OrgTabBar";

// Notificaciones (sileo) — montar una vez en el root layout
export { Toaster } from "./Toaster";

// Primitivos de layout (Fase 1 — docs/FRONTEND-UI-REFACTOR-PLAN.md)
export * from "./layout";

// Componentes existentes
export { AdminTable } from "./AdminTable";
export type {
	AdminTableColumn,
	AdminTableProps,
	AdminTableSort,
	AdminTableSortConfig,
} from "./AdminTable";
export type { AdminTablePagination } from "./admin-table.helpers";
export { DEFAULT_PAGE_SIZE, buildPagination } from "./admin-table.helpers";
