// @vitest-environment jsdom

import "./setup";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownView } from "../src/ui/MarkdownView";

describe("MarkdownView Slash Command", () => {
	afterEach(() => {
		cleanup();
	});

	it("should show slash command menu when / is typed", async () => {
		const user = userEvent.setup();
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
		await user.click(editor);
		await user.keyboard("/");

		// Should find the slash menu by class name or text
		await waitFor(
			() => {
				const menuHeader = screen.queryByText("Insert Block");
				expect(menuHeader).not.toBeNull();
			},
			{ timeout: 3000 },
		);
	});

	it("should move selection and insert with keyboard navigation", async () => {
		const user = userEvent.setup();
		const onCommand = vi.fn();
		render(
			<MarkdownView
				activeNodeId="test-node"
				elements={[]}
				onCommand={onCommand}
				canUndo={false}
				canRedo={false}
				elementFactory={vi.fn()}
			/>,
		);

		const editor = document.querySelector(".ProseMirror") as HTMLElement;
		await user.click(editor);
		await user.keyboard("/");
		await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");

		await waitFor(() => {
			expect(onCommand).toHaveBeenCalled();
		});
	});
});
