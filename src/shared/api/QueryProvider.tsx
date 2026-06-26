"use client";

/**
 * shared/api/QueryProvider.tsx
 *
 * Provider de TanStack Query (estado-de-servidor) para toda la app.
 * Se monta una sola vez en el RootLayout. El QueryClient vive en estado para
 * que no se recree en cada render (patrón recomendado para App Router).
 *
 * Los datos se siguen pidiendo con apiFetch (transporte) dentro de los
 * queryFn/mutationFn — Query solo añade caché, estados y invalidación.
 */

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
	const [client] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 30_000,
						retry: 1,
						refetchOnWindowFocus: false,
					},
				},
			}),
	);

	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
