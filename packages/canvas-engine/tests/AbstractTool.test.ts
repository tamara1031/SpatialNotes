import { describe, expect, it, vi } from "vitest";
import { AbstractTool } from "../src/tools/AbstractTool";
import type { InteractionContext } from "../src/tools/Tool";

/** Minimal stub that delegates to injectable async functions. */
class StubTool extends AbstractTool {
	constructor(
		private readonly handlers: {
			down?: () => Promise<void>;
			move?: () => Promise<void>;
			up?: () => Promise<void>;
			dblclick?: () => Promise<void>;
		} = {},
	) {
		super();
		if (handlers.dblclick) {
			this._onDoubleClick = async () => handlers.dblclick!();
		}
	}

	protected async _onPointerDown(): Promise<void> {
		await this.handlers.down?.();
	}
	protected async _onPointerMove(): Promise<void> {
		await this.handlers.move?.();
	}
	protected async _onPointerUp(): Promise<void> {
		await this.handlers.up?.();
	}

	getCursor() {
		return "default";
	}
}

const fakeCtx = {} as InteractionContext;
const fakeCoords = { x: 0, y: 0 };
const fakeEvent = {} as PointerEvent;
const fakeMouseEvent = {} as MouseEvent;

describe("AbstractTool — error boundary (SC-U20)", () => {
	it("does not throw when _onPointerDown rejects", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const tool = new StubTool({
			down: async () => {
				throw new Error("rpc failure");
			},
		});

		await expect(
			tool.onPointerDown(fakeEvent, fakeCtx, fakeCoords),
		).resolves.toBeUndefined();

		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining("StubTool"),
			expect.any(Error),
		);
		spy.mockRestore();
	});

	it("does not throw when _onPointerMove rejects", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const tool = new StubTool({
			move: async () => {
				throw new Error("move failure");
			},
		});

		await expect(
			tool.onPointerMove(fakeEvent, fakeCtx, fakeCoords),
		).resolves.toBeUndefined();

		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining("StubTool"),
			expect.any(Error),
		);
		spy.mockRestore();
	});

	it("does not throw when _onPointerUp rejects", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const tool = new StubTool({
			up: async () => {
				throw new Error("up failure");
			},
		});

		await expect(
			tool.onPointerUp(fakeEvent, fakeCtx, fakeCoords),
		).resolves.toBeUndefined();

		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining("StubTool"),
			expect.any(Error),
		);
		spy.mockRestore();
	});

	it("does not throw when _onDoubleClick rejects", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const tool = new StubTool({
			dblclick: async () => {
				throw new Error("dblclick failure");
			},
		});

		await expect(
			tool.onDoubleClick(fakeMouseEvent, fakeCtx, fakeCoords),
		).resolves.toBeUndefined();

		expect(spy).toHaveBeenCalledWith(
			expect.stringContaining("StubTool"),
			expect.any(Error),
		);
		spy.mockRestore();
	});

	it("onDoubleClick is a no-op when _onDoubleClick is not defined", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const tool = new StubTool();

		await expect(
			tool.onDoubleClick(fakeMouseEvent, fakeCtx, fakeCoords),
		).resolves.toBeUndefined();

		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
	});

	it("error log includes the concrete class name", async () => {
		const spy = vi.spyOn(console, "error").mockImplementation(() => {});
		const tool = new StubTool({
			down: async () => {
				throw new Error("boom");
			},
		});
		await tool.onPointerDown(fakeEvent, fakeCtx, fakeCoords);

		const [message] = spy.mock.calls[0];
		expect(message).toMatch(/StubTool: onPointerDown failed/);
		spy.mockRestore();
	});
});
