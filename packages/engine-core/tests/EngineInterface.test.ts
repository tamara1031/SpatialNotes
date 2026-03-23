import { describe, expect, it } from "vitest";
import type { BaseElement, EngineInterface } from "../src/index";

describe("EngineInterface", () => {
	it("should be implementable with custom types", () => {
		interface MockElement extends BaseElement {
			customData: string;
		}
		type MockTool = "PEN" | "ERASER";
		interface MockViewport {
			zoom: number;
		}
		interface MockContext {
			theme: string;
		}

		class MockEngine
			implements
				EngineInterface<MockElement, MockTool, MockViewport, MockContext>
		{
			mount() {}
			unmount() {}
			init() {}
			updateContext() {}
			updateElements() {}
			setTool() {}
			sendCommand() {}
			onCommand() {}
			destroy() {}
		}

		const engine = new MockEngine();
		expect(engine).toBeDefined();
		expect(typeof engine.mount).toBe("function");
	});
});
