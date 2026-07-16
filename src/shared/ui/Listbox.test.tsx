// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Listbox } from "./Listbox";

const options = [
	{ value: "domingo", label: "Domingo" },
	{ value: "jueves", label: "Jueves" },
	{ value: "martes", label: "Martes" },
];

function setup(value = "") {
	const onChange = vi.fn();
	render(
		<Listbox
			value={value}
			onChange={onChange}
			options={options}
			placeholder="Todas las ligas"
			aria-label="Liga"
		/>,
	);
	return { onChange };
}

describe("Listbox", () => {
	it("muestra el placeholder cuando no hay valor seleccionado", () => {
		setup();
		expect(screen.getByRole("combobox")).toHaveTextContent("Todas las ligas");
	});

	it("abre el panel al hacer click en el trigger y lista las opciones", () => {
		setup();
		fireEvent.click(screen.getByRole("combobox"));
		expect(screen.getByRole("listbox")).toBeInTheDocument();
		expect(screen.getAllByRole("option")).toHaveLength(options.length + 1); // + placeholder
	});

	it("llama a onChange y cierra el panel al elegir una opción", () => {
		const { onChange } = setup();
		fireEvent.click(screen.getByRole("combobox"));
		fireEvent.click(screen.getByRole("option", { name: "Jueves" }));
		expect(onChange).toHaveBeenCalledWith("jueves");
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("cierra el panel al hacer click fuera", () => {
		setup();
		fireEvent.click(screen.getByRole("combobox"));
		expect(screen.getByRole("listbox")).toBeInTheDocument();
		fireEvent.mouseDown(document.body);
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});

	it("navega con flechas y selecciona con Enter", () => {
		const { onChange } = setup();
		const trigger = screen.getByRole("combobox");
		fireEvent.click(trigger);
		fireEvent.keyDown(trigger, { key: "ArrowDown" }); // placeholder -> Domingo
		fireEvent.keyDown(trigger, { key: "ArrowDown" }); // Domingo -> Jueves
		fireEvent.keyDown(trigger, { key: "Enter" });
		expect(onChange).toHaveBeenCalledWith("jueves");
	});

	it("cierra el panel con Escape", () => {
		setup();
		const trigger = screen.getByRole("combobox");
		fireEvent.click(trigger);
		fireEvent.keyDown(trigger, { key: "Escape" });
		expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
	});
});
