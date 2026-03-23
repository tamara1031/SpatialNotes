// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownView } from "../src/ui/MarkdownView";

describe("MarkdownView", () => {
	afterEach(() => {
		cleanup();
	});

	it("should render the editor container", () => {
		render(
			<MarkdownView
				activeNodeId="test-node"
				elements={[]}
				onCommand={vi.fn()}
				canUndo={false}
				canRedo={false}
				elementFactory={vi.fn()}
			/>,
		);

		const editor = screen.getByRole("textbox");
		expect(editor).toBeDefined();
	});

	it("should display initial elements", () => {
		const testElements = [
			{
				id: "1",
				type: "PARAGRAPH",
				parentId: "node-1",
				metadata: { content: "Hello" },
				updatedAt: 123,
			},
		];

		render(
			<MarkdownView
				activeNodeId="test-node"
				elements={testElements as any}
				onCommand={vi.fn()}
				canUndo={false}
				canRedo={false}
				elementFactory={vi.fn()}
			/>,
		);

		const editor = screen.getByRole("textbox");
		expect(editor.textContent).toContain("Hello");
	});

	it("should render heading elements", () => {
		const testElements = [
			{
				id: "1",
				type: "HEADING",
				parentId: "node-1",
				metadata: { content: "Main Title", level: 1 },
				updatedAt: 123,
			},
		];

		render(
			<MarkdownView
				activeNodeId="test-node"
				elements={testElements as any}
				onCommand={vi.fn()}
				canUndo={false}
				canRedo={false}
				elementFactory={vi.fn()}
			/>,
		);

		const heading = screen.getByRole("heading", { level: 1 });
		expect(heading.textContent).toBe("Main Title");
	});

	it("should render list elements", () => {
		const testElements = [
			{
				id: "1",
				type: "LIST",
				parentId: "node-1",
				metadata: { content: "Item 1", listType: "bullet" },
				updatedAt: 123,
			},
		];

		render(
			<MarkdownView
				activeNodeId="test-node"
				elements={testElements as any}
				onCommand={vi.fn()}
				canUndo={false}
				canRedo={false}
				elementFactory={vi.fn()}
			/>,
		);

		const list = screen.getByRole("list");
		expect(list).toBeDefined();
	});

	it("should render image elements", () => {
		const testElements = [
			{
				id: "1",
				type: "IMAGE",
				parentId: "node-1",
				metadata: { src: "https://example.com/image.png", alt: "Test Image" },
				updatedAt: 123,
			},
		];

		render(
			<MarkdownView
				activeNodeId="test-node"
				elements={testElements as any}
				onCommand={vi.fn()}
				canUndo={false}
				canRedo={false}
				elementFactory={vi.fn()}
			/>,
		);

		const img = screen.getByRole("img");
		expect(img).toBeDefined();
		expect(img.getAttribute("src")).toBe("https://example.com/image.png");
	});

	it("should render table elements", () => {
		const testElements = [
			{
				id: "1",
				type: "TABLE",
				parentId: "node-1",
				metadata: { rows: [["Cell 1", "Cell 2"]] },
				updatedAt: 123,
			},
		];

		render(
			<MarkdownView
				activeNodeId="test-node"
				elements={testElements as any}
				onCommand={vi.fn()}
				canUndo={false}
				canRedo={false}
				elementFactory={vi.fn()}
			/>,
		);

		const table = screen.getByRole("table");
		expect(table).toBeDefined();
	});

	it("should render LaTeX elements", async () => {
		const testElements = [
			{
				id: "1",
				type: "LATEX",
				parentId: "node-1",
				metadata: { content: "\\sum_{i=0}^n i^2", isRendered: true },
				updatedAt: 123,
			},
		];

		render(
			<MarkdownView
				activeNodeId="test-node"
				elements={testElements as any}
				onCommand={vi.fn()}
				canUndo={false}
				canRedo={false}
				elementFactory={vi.fn()}
			/>,
		);

		await waitFor(
			() => {
				const katexContainer = document.querySelector(".katex");
				expect(katexContainer).not.toBeNull();
			},
			{ timeout: 3000 },
		);
	});
});
