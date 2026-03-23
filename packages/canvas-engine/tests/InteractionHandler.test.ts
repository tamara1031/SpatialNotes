/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InteractionHandler } from "../src/InteractionHandler";
import type { InteractionManager } from "../src/InteractionManager";
import { CanvasStore } from "../src/store/CanvasStore";

describe("InteractionHandler", () => {
	let store: CanvasStore;
	let manager: InteractionManager;
	let handler: InteractionHandler;
	let container: HTMLElement;

	beforeEach(() => {
		store = new CanvasStore();
		manager = {
			mount: vi.fn(),
			handlePointerDown: vi.fn(),
			handlePointerMove: vi.fn(),
			handlePointerUp: vi.fn(),
			handleDoubleClick: vi.fn(),
		} as any;
		handler = new InteractionHandler(manager, store);
		container = document.createElement("div");
	});

	it("should attach and detach listeners", () => {
		const addSpy = vi.spyOn(container, "addEventListener");
		const removeSpy = vi.spyOn(container, "removeEventListener");

		handler.attach(container);
		expect(addSpy).toHaveBeenCalled();
		expect(manager.mount).toHaveBeenCalledWith(container);

		handler.detach();
		expect(removeSpy).toHaveBeenCalled();
	});

	it("should handle wheel zoom", () => {
		handler.attach(container);
		const event = new WheelEvent("wheel", { deltaY: 100 });
		container.dispatchEvent(event);

		expect(store.getState().viewport.scale).toBeLessThan(1.0);
	});

	it("should handle keyboard UNDO", () => {
		handler.attach(container);
		const emitSpy = vi.spyOn(store, "emitCommand");
		const event = new KeyboardEvent("keydown", { key: "z", ctrlKey: true });
		handler.handleKeyDown(event);

		expect(emitSpy).toHaveBeenCalledWith("UNDO");
	});
});
