import { baseKeymap } from "prosemirror-commands";
import { dropCursor } from "prosemirror-dropcursor";
import { gapCursor } from "prosemirror-gapcursor";
import { history, redo, undo } from "prosemirror-history";
import {
	ellipsis,
	emDash,
	inputRules,
	smartQuotes,
	textblockTypeInputRule,
	wrappingInputRule,
} from "prosemirror-inputrules";
import { keymap } from "prosemirror-keymap";
import { EditorState } from "prosemirror-state";
import { columnResizing, tableEditing } from "prosemirror-tables";
import { EditorView } from "prosemirror-view";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { blockIdPlugin } from "../index";
import type { MarkdownElement } from "../types";
import { LaTeXNodeView } from "./nodes/LaTeXNodeView";
import { schema } from "./schema";

import "prosemirror-view/style/prosemirror.css";
import "prosemirror-tables/style/tables.css";
import "prosemirror-gapcursor/style/gapcursor.css";
import "./styles.css";

export interface MarkdownViewProps {
	activeNodeId: string;
	elements: MarkdownElement[];
	onCommand: (cmd: any) => void;
	canUndo: boolean;
	canRedo: boolean;
	elementFactory: any;
}

const markdownInputRules = inputRules({
	rules: [
		...smartQuotes,
		ellipsis,
		emDash,
		textblockTypeInputRule(/^#\s$/, schema.nodes.heading, { level: 1 }),
		textblockTypeInputRule(/^##\s$/, schema.nodes.heading, { level: 2 }),
		textblockTypeInputRule(/^###\s$/, schema.nodes.heading, { level: 3 }),
		wrappingInputRule(/^\s*>\s$/, schema.nodes.blockquote),
		wrappingInputRule(/^(\d+)\.\s$/, schema.nodes.ordered_list),
		wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes.bullet_list),
		textblockTypeInputRule(/^```$/, schema.nodes.code_block),
	],
});

export const MarkdownView: React.FC<MarkdownViewProps> = ({
	elements,
	onCommand,
}) => {
	const editorRef = useRef<HTMLDivElement>(null);
	const viewRef = useRef<EditorView | null>(null);
	const [showSlashMenu, setShowSlashMenu] = useState(false);
	const [slashMenuPos, setSlashMenuPos] = useState({ top: 0, left: 0 });

	const createInitialDoc = useCallback((initialElements: MarkdownElement[]) => {
		if (initialElements.length === 0) {
			return schema.nodes.doc.createAndFill(null, [
				schema.nodes.paragraph.createAndFill()!,
			])!;
		}
		const nodes = initialElements.map((el) => {
			const typeName = el.metadata.kind?.toLowerCase() || "paragraph";
			const nodeType = schema.nodes[typeName] || schema.nodes.paragraph;
			const content = el.content ? [schema.text(el.content)] : [];
			return nodeType.createAndFill(el.metadata, content)!;
		});
		return schema.nodes.doc.createAndFill(null, nodes)!;
	}, []);

	const mapProseMirrorTypeToElement = useCallback((pmType: string): string => {
		switch (pmType) {
			case "paragraph":
				return "PARAGRAPH";
			case "heading":
				return "HEADING";
			case "table":
				return "TABLE";
			case "image":
				return "IMAGE";
			case "latex":
				return "LATEX";
			case "code_block":
				return "CODE";
			default:
				return "PARAGRAPH";
		}
	}, []);

	const mapDocToElements = useCallback(
		(doc: any): MarkdownElement[] => {
			const elements: MarkdownElement[] = [];
			doc.forEach((node: any) => {
				elements.push({
					id: node.attrs.id,
					type: mapProseMirrorTypeToElement(node.type.name) as any,
					parentId: null,
					content: node.textContent,
					metadata: {
						...node.attrs,
						kind: node.type.name.toUpperCase(),
					},
					updatedAt: Date.now(),
				});
			});
			return elements;
		},
		[mapProseMirrorTypeToElement],
	);

	useEffect(() => {
		if (!editorRef.current || viewRef.current) return;

		const state = EditorState.create({
			doc: createInitialDoc(elements),
			plugins: [
				blockIdPlugin,
				markdownInputRules,
				keymap(baseKeymap),
				keymap({
					"Mod-z": undo,
					"Mod-y": redo,
					"Mod-Shift-z": redo,
				}),
				history(),
				dropCursor(),
				gapCursor(),
				columnResizing(),
				tableEditing(),
				keymap({
					"/": (state, _dispatch) => {
						const { from, to } = state.selection;
						if (from !== to) return false;

						const coords = viewRef.current?.coordsAtPos(from);
						if (coords) {
							setSlashMenuPos({ top: coords.bottom, left: coords.left });
							setShowSlashMenu(true);
						}
						return false;
					},
					Escape: () => {
						setShowSlashMenu(false);
						return false;
					},
				}),
			],
		});

		const view = new EditorView(editorRef.current, {
			state,
			nodeViews: {
				latex(node, view, getPos) {
					return new LaTeXNodeView(node, view, getPos);
				},
			},
			dispatchTransaction(tr) {
				const newState = view.state.apply(tr);
				view.updateState(newState);

				if (tr.docChanged) {
					const updatedElements = mapDocToElements(newState.doc);
					onCommand({ type: "UPDATE_ELEMENTS", payload: updatedElements });
				}
			},
		});

		viewRef.current = view;

		return () => {
			view.destroy();
			viewRef.current = null;
		};
	}, [createInitialDoc, elements, mapDocToElements, onCommand]);

	const insertBlock = (type: string) => {
		if (!viewRef.current) return;
		const { state, dispatch } = viewRef.current;
		const { tr } = state;

		let node;
		switch (type) {
			case "h1":
				node = schema.nodes.heading.createAndFill({ level: 1 });
				break;
			case "h2":
				node = schema.nodes.heading.createAndFill({ level: 2 });
				break;
			case "table":
				node = schema.nodes.table.createAndFill();
				break;
			case "latex":
				node = schema.nodes.latex.createAndFill();
				break;
			default:
				node = schema.nodes.paragraph.createAndFill();
		}

		if (node) {
			dispatch(tr.replaceSelectionWith(node).scrollIntoView());
		}
		setShowSlashMenu(false);
		viewRef.current.focus();
	};

	return (
		<div className="editor-container relative overflow-auto h-full">
			<div
				ref={editorRef}
				className="ProseMirror-editor focus:outline-none min-h-full"
			/>

			{showSlashMenu && (
				<div
					className="slash-menu absolute z-50"
					style={{
						top: slashMenuPos.top + 5,
						left: Math.min(slashMenuPos.left, window.innerWidth - 220),
					}}
				>
					<div className="slash-menu-header">Insert Block</div>
					<div className="slash-menu-item" onClick={() => insertBlock("h1")}>
						<span className="slash-menu-icon">#</span> Heading 1
					</div>
					<div className="slash-menu-item" onClick={() => insertBlock("h2")}>
						<span className="slash-menu-icon">##</span> Heading 2
					</div>
					<div className="slash-menu-item" onClick={() => insertBlock("table")}>
						<span className="slash-menu-icon">田</span> Table
					</div>
					<div className="slash-menu-item" onClick={() => insertBlock("latex")}>
						<span className="slash-menu-icon">Σ</span> LaTeX
					</div>
				</div>
			)}
		</div>
	);
};
