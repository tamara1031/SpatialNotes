import {
	DecoratorNode,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
	type Spread,
} from "lexical";

export type SerializedImageNode = Spread<
	{
		src: string;
		altText: string;
	},
	SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<JSX.Element> {
	__src: string;
	__altText: string;

	static getType(): string {
		return "image";
	}

	static clone(node: ImageNode): ImageNode {
		return new ImageNode(node.__src, node.__altText, node.__key);
	}

	constructor(src: string, altText: string, key?: NodeKey) {
		super(key);
		this.__src = src;
		this.__altText = altText;
	}

	static importJSON(serializedNode: SerializedImageNode): ImageNode {
		const node = $createImageNode(serializedNode.src, serializedNode.altText);
		return node;
	}

	exportJSON(): SerializedImageNode {
		return {
			...super.exportJSON(),
			src: this.__src,
			altText: this.__altText,
			type: "image",
			version: 1,
		};
	}

	createDOM(): HTMLElement {
		const span = document.createElement("span");
		return span;
	}

	updateDOM(): boolean {
		return false;
	}

	decorate(): JSX.Element {
		return <img src={this.__src} alt={this.__altText} />;
	}
}

export function $createImageNode(src: string, altText: string): ImageNode {
	return new ImageNode(src, altText);
}

export function $isImageNode(
	node: LexicalNode | null | undefined,
): node is ImageNode {
	return node instanceof ImageNode;
}
