import { Schema, type NodeSpec, type MarkSpec } from "prosemirror-model";
import { addListNodes } from "prosemirror-schema-list";
import { tableNodes } from "prosemirror-tables";
import OrderedMap from "orderedmap";

const baseNodes: { [name: string]: NodeSpec } = {
	doc: {
		content: "block+",
	},
	paragraph: {
		content: "inline*",
		group: "block",
		attrs: { id: { default: null } },
		parseDOM: [{ tag: "p" }],
		toDOM() {
			return ["p", 0];
		},
	},
	blockquote: {
		content: "block+",
		group: "block",
		parseDOM: [{ tag: "blockquote" }],
		toDOM() {
			return ["blockquote", 0];
		},
	},
	horizontal_rule: {
		group: "block",
		parseDOM: [{ tag: "hr" }],
		toDOM() {
			return ["hr"];
		},
	},
	heading: {
		attrs: { level: { default: 1 }, id: { default: null } },
		content: "inline*",
		group: "block",
		defining: true,
		parseDOM: [
			{ tag: "h1", attrs: { level: 1 } },
			{ tag: "h2", attrs: { level: 2 } },
			{ tag: "h3", attrs: { level: 3 } },
			{ tag: "h4", attrs: { level: 4 } },
			{ tag: "h5", attrs: { level: 5 } },
			{ tag: "h6", attrs: { level: 6 } },
		],
		toDOM(node) {
			return [`h${node.attrs.level}`, 0];
		},
	},
	code_block: {
		content: "text*",
		marks: "",
		group: "block",
		code: true,
		defining: true,
		attrs: { id: { default: null } },
		parseDOM: [{ tag: "pre", preserveWhitespace: "full" }],
		toDOM() {
			return ["pre", ["code", 0]];
		},
	},
	text: {
		group: "inline",
	},
	image: {
		inline: true,
		attrs: {
			src: {},
			alt: { default: null },
			title: { default: null },
		},
		group: "inline",
		draggable: true,
		parseDOM: [
			{
				tag: "img[src]",
				getAttrs(dom: HTMLElement | string) {
					if (typeof dom === "string") return {};
					return {
						src: dom.getAttribute("src"),
						title: dom.getAttribute("title"),
						alt: dom.getAttribute("alt"),
					};
				},
			},
		],
		toDOM(node) {
			const { src, alt, title } = node.attrs;
			return ["img", { src, alt, title }];
		},
	},
	hard_break: {
		inline: true,
		group: "inline",
		selectable: false,
		parseDOM: [{ tag: "br" }],
		toDOM() {
			return ["br"];
		},
	},
	latex: {
		group: "block",
		content: "text*",
		attrs: {
			id: { default: null },
			equation: { default: "" },
			isRendered: { default: true },
		},
		parseDOM: [{ tag: "div[data-latex]" }],
		toDOM() {
			return ["div", { "data-latex": "" }, 0];
		},
	},
};

const marks: { [name: string]: MarkSpec } = {
	link: {
		attrs: {
			href: {},
			title: { default: null },
		},
		inclusive: false,
		parseDOM: [
			{
				tag: "a[href]",
				getAttrs(dom: HTMLElement | string) {
					if (typeof dom === "string") return {};
					return {
						href: dom.getAttribute("href"),
						title: dom.getAttribute("title"),
					};
				},
			},
		],
		toDOM(node) {
			const { href, title } = node.attrs;
			return ["a", { href, title }, 0];
		},
	},
	em: {
		parseDOM: [{ tag: "i" }, { tag: "em" }, { style: "font-style=italic" }],
		toDOM() {
			return ["em", 0];
		},
	},
	strong: {
		parseDOM: [
			{ tag: "strong" },
			{
				tag: "b",
				getAttrs: (node: HTMLElement | string) =>
					typeof node !== "string" &&
					node.style.fontWeight !== "normal" &&
					null,
			},
			{
				style: "font-weight",
				getAttrs: (value: string | HTMLElement) =>
					typeof value === "string" &&
					/^(bold(er)?|[5-9]\d{2,})$/.test(value) &&
					null,
			},
		],
		toDOM() {
			return ["strong", 0];
		},
	},
	code: {
		parseDOM: [{ tag: "code" }],
		toDOM() {
			return ["code", 0];
		},
	},
};

const listNodes = addListNodes(
	OrderedMap.from(baseNodes),
	"paragraph block*",
	"block",
);

const allNodes = listNodes.append(
	tableNodes({
		tableGroup: "block",
		cellContent: "block+",
		cellAttributes: {
			background: {
				default: null,
				getFromDOM(dom) {
					return dom.style.backgroundColor || null;
				},
				setDOMAttr(value, attrs) {
					if (value)
						attrs.style = (attrs.style || "") + `background-color: ${value};`;
				},
			},
		},
	}),
);

export const schema = new Schema({
	nodes: allNodes,
	marks,
});
