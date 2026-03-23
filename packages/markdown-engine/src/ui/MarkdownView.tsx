import { CodeHighlightNode, CodeNode } from "@lexical/code";
import { AutoLinkNode, LinkNode } from "@lexical/link";
import {
	$createListItemNode,
	$createListNode,
	ListItemNode,
	ListNode,
} from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { HorizontalRuleNode } from "@lexical/react/LexicalHorizontalRuleNode";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { TablePlugin } from "@lexical/react/LexicalTablePlugin";
import {
	$createHeadingNode,
	$createQuoteNode,
	HeadingNode,
	QuoteNode,
} from "@lexical/rich-text";
import {
	$createTableCellNode,
	$createTableNode,
	$createTableRowNode,
	TableCellNode,
	TableNode,
	TableRowNode,
} from "@lexical/table";
import {
	$createParagraphNode,
	$createTextNode,
	$getRoot,
	type EditorState,
} from "lexical";
import type React from "react";
import { useCallback, useMemo } from "react";
import { $createImageNode, ImageNode } from "../nodes/ImageNode";
import { $createLaTeXNode, LaTeXNode } from "../nodes/LaTeXNode";
import { SlashCommandPlugin } from "../plugins/SlashCommandPlugin";
import type { MarkdownElement } from "../types";

export interface MarkdownViewProps {
	activeNodeId: string;
	elements: MarkdownElement[];
	onCommand: (cmd: any) => void;
	canUndo: boolean;
	canRedo: boolean;
	elementFactory: any;
}

const theme = {
	paragraph: "editor-paragraph",
	heading: {
		h1: "editor-heading-h1",
		h2: "editor-heading-h2",
		h3: "editor-heading-h3",
	},
	list: {
		ul: "editor-list-ul",
		ol: "editor-list-ol",
	},
	table: "editor-table",
	tableRow: "editor-table-row",
	tableCell: "editor-table-cell",
	code: "editor-code",
};

import { showNotification } from "../../../../apps/web/src/store/notificationStore";

function onError(error: Error) {
	console.error(error);
	showNotification(`Editor Error: ${error.message}`, "error");
}

export const MarkdownView: React.FC<MarkdownViewProps> = ({
	elements,
	onCommand,
}) => {
	const initialConfig = useMemo(
		() => ({
			namespace: "MarkdownEditor",
			theme,
			onError,
			nodes: [
				LaTeXNode,
				ImageNode,
				HeadingNode,
				QuoteNode,
				ListNode,
				ListItemNode,
				TableNode,
				TableRowNode,
				TableCellNode,
				LinkNode,
				AutoLinkNode,
				CodeNode,
				CodeHighlightNode,
				HorizontalRuleNode,
			],
			editorState: () => {
				const root = $getRoot();
				if (root.getFirstChild() === null) {
					if (elements.length === 0) {
						const paragraph = $createParagraphNode();
						paragraph.append($createTextNode(""));
						root.append(paragraph);
					} else {
						for (const el of elements) {
							switch (el.type) {
								case "HEADING": {
									const heading = $createHeadingNode(
										`h${el.metadata.level || 1}` as any,
									);
									heading.append($createTextNode(el.metadata.content || ""));
									root.append(heading);
									break;
								}
								case "LIST": {
									const list = $createListNode(
										el.metadata.listType === "bullet" ? "bullet" : "number",
									);
									const listItem = $createListItemNode();
									listItem.append($createTextNode(el.metadata.content || ""));
									list.append(listItem);
									root.append(list);
									break;
								}
								case "IMAGE": {
									const imageNode = $createImageNode(
										el.metadata.src || "",
										el.metadata.alt || "",
									);
									root.append(imageNode);
									break;
								}
								case "TABLE": {
									const tableNode = $createTableNode();
									const rows = el.metadata.rows || [[]];
									for (const row of rows) {
										const tableRow = $createTableRowNode();
										for (const cell of row) {
											const tableCell = $createTableCellNode(0);
											tableCell.append($createTextNode(cell));
											tableRow.append(tableCell);
										}
										tableNode.append(tableRow);
									}
									root.append(tableNode);
									break;
								}
								case "LATEX": {
									const latexNode = $createLaTeXNode(
										el.metadata.content || "",
										false,
									);
									root.append(latexNode);
									break;
								}
								default: {
									const paragraph = $createParagraphNode();
									paragraph.append($createTextNode(el.metadata.content || ""));
									root.append(paragraph);
								}
							}
						}
					}
				}
			},
		}),
		[elements],
	);

	const onChange = useCallback(
		(editorState: EditorState) => {
			editorState.read(() => {
				const root = $getRoot();
				const children = root.getChildren();
				// Map children to MarkdownElements
				const updatedElements: MarkdownElement[] = children.map(
					(node, index) => {
						// This is a simplified mapping for now
						return {
							id: `node-${index}`, // Ideally we'd use stable IDs
							type: "PARAGRAPH",
							parentId: null,
							metadata: { content: node.getTextContent() },
							updatedAt: Date.now(),
						} as MarkdownElement;
					},
				);
				onCommand({ type: "UPDATE_ELEMENTS", payload: updatedElements });
			});
		},
		[onCommand],
	);

	return (
		<LexicalComposer initialConfig={initialConfig}>
			<div className="editor-container">
				<RichTextPlugin
					contentEditable={<ContentEditable className="editor-input" />}
					placeholder={
						<div className="editor-placeholder">Enter some text...</div>
					}
					ErrorBoundary={LexicalErrorBoundary}
				/>
				<ListPlugin />
				<TablePlugin />
				<HistoryPlugin />
				<MarkdownShortcutPlugin />
				<SlashCommandPlugin />
				<OnChangePlugin onChange={onChange} />
			</div>
		</LexicalComposer>
	);
};
