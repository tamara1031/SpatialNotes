/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InteractionManager } from "../src/InteractionManager";
import type { InteractionContext } from "../src/tools/Tool";

describe("InteractionManager - Stylus Input", () => {
	let manager: InteractionManager;
	let mockCtx: InteractionContext;
	let container: HTMLElement;

	beforeEach(() => {
		container = document.createElement("div");
		// Mock getBoundingClientRect for coordinate conversion
		container.getBoundingClientRect = vi.fn().mockReturnValue({
			left: 0,
			top: 0,
			width: 1000,
			height: 1000,
		});

		mockCtx = {
			store: {
				getState: vi.fn().mockReturnValue({
					viewport: { pan: { x: 0, y: 0 }, scale: 1 },
					isPanning: false,
				}),
				update: vi.fn(),
				dispatch: vi.fn(),
			},
			gateway: {
				pointerDown: vi.fn(),
				pointerMove: vi.fn(),
				pointerUp: vi.fn(),
			},
			services: {},
		} as any;

		manager = new InteractionManager(mockCtx);
		manager.mount(container);
	});

	it("should capture pressure and tilt from pointermove and pass to gateway", async () => {
		const event = new PointerEvent("pointermove", {
			clientX: 100,
			clientY: 100,
			pressure: 0.8,
			tiltX: 15,
			tiltY: 25,
		});

		await manager.handlePointerMove(event);

		// MM conversion: (100 - 0 - 0) / (1 * 3.78) = 26.455...
		const call = (mockCtx.gateway.pointerMove as any).mock.calls[0];
		expect(call[0]).toBeCloseTo(26.455, 2);
		expect(call[1]).toBeCloseTo(26.455, 2);
		expect(call[2]).toBeCloseTo(0.8, 5);
		expect(call[3]).toBe(15);
		expect(call[4]).toBe(25);
	});
});
