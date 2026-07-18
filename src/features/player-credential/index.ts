/**
 * features/player-credential/index.ts
 * Exportaciones públicas — único punto de import externo (AGENTS.md §3.6).
 */
export {
	issuePlayerCredential,
	type IssueCredentialResult,
	type IssueCredentialError,
} from "./issue-credential";
export { ANNUAL_PASS_DURATION_YEARS } from "@/entities/player-credential/lib/issue-credential";
export { IssueCredentialModal } from "./ui/IssueCredentialModal";
export { useIssueCredential } from "./model/useIssueCredential";
