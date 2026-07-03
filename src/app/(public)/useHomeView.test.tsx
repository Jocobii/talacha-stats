// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useHomeView } from "./useHomeView";
import { HOME_VIEW_COOKIE } from "./home-view";

describe("useHomeView", () => {
	it("arranca con la vista inicial resuelta por el server", () => {
		const { result } = renderHook(() => useHomeView("organizador"));
		expect(result.current.view).toBe("organizador");
	});

	it("selectView cambia la vista", () => {
		const { result } = renderHook(() => useHomeView("jugador"));
		act(() => result.current.selectView("organizador"));
		expect(result.current.view).toBe("organizador");
	});

	it("selectView persiste la elección en cookie", () => {
		const { result } = renderHook(() => useHomeView("jugador"));
		act(() => result.current.selectView("organizador"));
		expect(document.cookie).toContain(`${HOME_VIEW_COOKIE}=organizador`);
	});
});
