/**
 * shared/test/react-query.tsx
 *
 * Utilidades para testear hooks de TanStack Query. Solo para tests
 * (no se importa desde código de app).
 *
 * Uso típico con renderHook (el archivo de test debe declarar entorno DOM:
 *   // @vitest-environment jsdom
 * ):
 *
 *   const { wrapper } = createQueryWrapper();
 *   const { result } = renderHook(() => useLeagueTeams("L"), { wrapper });
 *   await waitFor(() => expect(result.current.isSuccess).toBe(true));
 */

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/** QueryClient aislado por test: sin reintentos, sin caché entre tests. */
export function createTestQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: { retry: false, gcTime: 0, staleTime: 0 },
			mutations: { retry: false },
		},
	});
}

/** Devuelve un wrapper ligado a un client fresco, más el client para aserciones. */
export function createQueryWrapper(): {
	client: QueryClient;
	wrapper: (props: { children: ReactNode }) => ReactNode;
} {
	const client = createTestQueryClient();
	const wrapper = ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
	return { client, wrapper };
}
