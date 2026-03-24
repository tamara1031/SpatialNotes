// @vitest-environment jsdom

import "./setup";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
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

		const editor = document.querySelector(".ProseMirror") as HTMLElement;
		expect(editor).toBeDefined();
	});

	it("should display initial elements", () => {
		const testElements = [
			{
				id: "1",
				type: "PARAGRAPH",
				parentId: "node-1",
				content: "Hello",
				metadata: { kind: "PARAGRAPH" },
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

		const editor = document.querySelector(".ProseMirror") as HTMLElement;
		expect(editor.textContent).toContain("Hello");
	});

	it("should render heading elements", () => {
		const testElements = [
			{
				id: "1",
				type: "HEADING",
				parentId: "node-1",
				content: "Main Title",
				metadata: { kind: "HEADING", level: 1 },
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

	it("should render table elements", () => {
		const testElements = [
			{
				id: "1",
				type: "TABLE",
				parentId: "node-1",
				content: "",
				metadata: { kind: "TABLE" },
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
				content: "\\sum_{i=0}^n i^2",
				metadata: { kind: "LATEX", isRendered: true },
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
