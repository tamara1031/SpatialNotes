// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MarkdownView } from "../src/ui/MarkdownView";

describe("MarkdownView", () => {
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

		const editor = screen.getByRole("textbox");
		await user.type(editor, "/");

		// Should find the slash menu (we'll implement this)
		await waitFor(
			() => {
				const menu = screen.queryByRole("menu");
				expect(menu).not.toBeNull();
			},
			{ timeout: 3000 },
		);
	});
});
