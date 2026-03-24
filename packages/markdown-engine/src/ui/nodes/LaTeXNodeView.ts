import type { Node } from "prosemirror-model";
import type { EditorView, NodeView } from "prosemirror-view";
import katex from "katex";
import "katex/dist/katex.min.css";

export class LaTeXNodeView implements NodeView {
	dom: HTMLElement;
	contentDOM?: HTMLElement;
	node: Node;
	view: EditorView;
	getPos: () => number | undefined;
	isRendered: boolean;

	constructor(node: Node, view: EditorView, getPos: () => number | undefined) {
		this.node = node;
		this.view = view;
		this.getPos = getPos;
		this.isRendered = node.attrs.isRendered;

		this.dom = document.createElement("div");
		this.dom.className = "latex-node-view py-2 my-2 cursor-pointer transition-colors hover:bg-zinc-800/50 rounded";
		
		this.render();
		
		this.dom.addEventListener("click", () => {
			this.toggle();
		});
	}

	render() {
		this.dom.innerHTML = "";
		if (this.isRendered && this.node.textContent.trim()) {
			const container = document.createElement("div");
			container.className = "flex justify-center p-4";
			try {
				katex.render(this.node.textContent, container, {
					displayMode: true,
					throwOnError: false,
				});
			} catch (e) {
				container.textContent = this.node.textContent;
				container.classList.add("text-red-500");
			}
			this.dom.appendChild(container);
		} else {
			const editor = document.createElement("div");
			editor.className = "p-4 font-mono text-sm text-emerald-400 bg-zinc-950/50 rounded border border-zinc-700/50";
			editor.innerHTML = `<span class="text-zinc-500">$$</span><br/>${this.node.textContent || '<span class="text-zinc-600 italic">type equation...</span>'}<br/><span class="text-zinc-500">$$</span>`;
			this.dom.appendChild(editor);
			
			// If not rendered, we want ProseMirror to handle content editing
			this.contentDOM = document.createElement("div");
			this.contentDOM.style.display = "none"; // Hidden but available for PM
			this.dom.appendChild(this.contentDOM);
		}
	}

	toggle() {
		const pos = this.getPos();
		if (pos === undefined) return;
		
		this.isRendered = !this.isRendered;
		const tr = this.view.state.tr.setNodeMarkup(pos, undefined, {
			...this.node.attrs,
			isRendered: this.isRendered
		});
		this.view.dispatch(tr);
	}

	update(node: Node) {
		if (node.type !== this.node.type) return false;
		this.node = node;
		this.isRendered = node.attrs.isRendered;
		this.render();
		return true;
	}

	selectNode() {
		this.dom.classList.add("ring-2", "ring-emerald-500/50");
	}

	deselectNode() {
		this.dom.classList.remove("ring-2", "ring-emerald-500/50");
	}

	stopEvent(event: Event) {
		return false;
	}

	ignoreMutation() {
		return true;
	}
}
