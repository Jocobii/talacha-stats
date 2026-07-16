// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectControl } from "./SelectControl";

const options = [
	{ value: "1", label: "Liga Uno" },
	{ value: "2", label: "Liga Dos" },
];

describe("SelectControl", () => {
	it("delega la selección a onApply", () => {
		const onApply = vi.fn();
		render(
			<SelectControl value="" onApply={onApply} options={options} placeholder="Todas las ligas" />,
		);
		fireEvent.click(screen.getByRole("combobox"));
		fireEvent.click(screen.getByRole("option", { name: "Liga Dos" }));
		expect(onApply).toHaveBeenCalledWith("2");
	});

	it("deshabilita el trigger cuando loading=true", () => {
		render(<SelectControl value="" onApply={vi.fn()} options={options} loading />);
		expect(screen.getByRole("combobox")).toBeDisabled();
	});

	it("deshabilita el trigger cuando disabled=true", () => {
		render(<SelectControl value="" onApply={vi.fn()} options={options} disabled />);
		expect(screen.getByRole("combobox")).toBeDisabled();
	});
});
