import katex from "katex";
import {
	DecoratorNode,
	type LexicalNode,
	type NodeKey,
	type SerializedLexicalNode,
	type Spread,
} from "lexical";
import { useEffect, useRef } from "react";
import "katex/dist/katex.min.css";

export type SerializedLaTeXNode = Spread<
	{
		equation: string;
		inline: boolean;
	},
	SerializedLexicalNode
>;

export class LaTeXNode extends DecoratorNode<JSX.Element> {
	__equation: string;
	__inline: boolean;

	static getType(): string {
		return "latex";
	}

	static clone(node: LaTeXNode): LaTeXNode {
		return new LaTeXNode(node.__equation, node.__inline, node.__key);
	}

	constructor(equation: string, inline: boolean, key?: NodeKey) {
		super(key);
		this.__equation = equation;
		this.__inline = inline;
	}

	static importJSON(serializedNode: SerializedLaTeXNode): LaTeXNode {
		const node = $createLaTeXNode(
			serializedNode.equation,
			serializedNode.inline,
		);
		return node;
	}

	exportJSON(): SerializedLaTeXNode {
		return {
			...super.exportJSON(),
			equation: this.__equation,
			inline: this.__inline,
			type: "latex",
			version: 1,
		};
	}

	createDOM(): HTMLElement {
		const span = document.createElement("span");
		span.style.display = this.__inline ? "inline-block" : "block";
		return span;
	}

	updateDOM(): boolean {
		return false;
	}

	decorate(): JSX.Element {
		return (
			<LaTeXComponent
				equation={this.__equation}
				inline={this.__inline}
				nodeKey={this.getKey()}
			/>
		);
	}
}

function LaTeXComponent({
	equation,
	inline,
}: {
	equation: string;
	inline: boolean;
	nodeKey: NodeKey;
}) {
	const containerRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (containerRef.current) {
			katex.render(equation, containerRef.current, {
				displayMode: !inline,
				throwOnError: false,
			});
		}
	}, [equation, inline]);

	return <span ref={containerRef} className="katex-container" />;
}

export function $createLaTeXNode(equation: string, inline: boolean): LaTeXNode {
	return new LaTeXNode(equation, inline);
}

export function $isLaTeXNode(
	node: LexicalNode | null | undefined,
): node is LaTeXNode {
	return node instanceof LaTeXNode;
}
