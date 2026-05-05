import katex from "katex";
import type { WorkerGateway } from "../bridge/WorkerGateway";
import {
	getNumber,
	getNumberArray,
	getString,
	MetadataKey,
} from "../metadata/ElementMetadata";
import type { CanvasState } from "../store/CanvasStore";
import { type CanvasElement, CanvasTool } from "../types";
import { ElementUtils } from "../utils/ElementUtils";
import { pointsToCatmullRomPath } from "../utils/path-smoothing";
import type { CanvasRenderer } from "./Renderer";

const MM_TO_PX = 96 / 25.4;

/**
 * Per-element DOM node cache entry.
 * Exactly one of svgNode / htmlNode is non-null depending on element type.
 * textareaNode is non-null only for ELEMENT_TEXT while in editing mode.
 */
interface CachedNode {
	fingerprint: string;
	svgNode: SVGPathElement | null;
	htmlNode: HTMLElement | null;
	textareaNode: HTMLTextAreaElement | null;
}

export class SVGRenderer implements CanvasRenderer {
	container: HTMLElement | null = null;
	private lastState: CanvasState | null = null;
	private viewportRoot: HTMLDivElement | null = null;
	private paperSurface: HTMLDivElement | null = null;
	private svgElement: SVGSVGElement | null = null;
	private gateway: WorkerGateway | null = null;
	private elementsGroup: SVGGElement | null = null;
	private htmlElementsLayer: HTMLDivElement | null = null;
	private interactionPath: SVGPathElement | null = null;
	private selectionRectPath: SVGRectElement | null = null;

	private lastScale = 1.0;
	private onTextEdit?: (id: string, newContent: string) => void;
	private onTextEditCancel?: () => void;

	// Keyed DOM reconciliation state
	private nodeCache = new Map<string, CachedNode>();
	private lastElementsRef: CanvasElement[] | null = null;
	private lastSortedVisible: CanvasElement[] = [];

	constructor(callbacks?: {
		onTextEdit?: (id: string, newContent: string) => void;
		onTextEditCancel?: () => void;
	}) {
		this.onTextEdit = callbacks?.onTextEdit;
		this.onTextEditCancel = callbacks?.onTextEditCancel;
	}

	mount(container: HTMLElement, gateway: WorkerGateway) {
		this.container = container;
		this.gateway = gateway;
		this.container.style.overflow = "hidden";
		this.container.style.position = "relative";
		this.container.style.background = "var(--surface-felt)";

		this.viewportRoot = document.createElement("div");
		this.viewportRoot.className = "engine-viewport-root";
		this.viewportRoot.style.position = "absolute";
		this.viewportRoot.style.left = "0";
		this.viewportRoot.style.top = "0";
		this.viewportRoot.style.transformOrigin = "0 0";
		this.viewportRoot.style.touchAction = "none";

		this.paperSurface = document.createElement("div");
		this.paperSurface.className = "engine-paper-surface";
		this.paperSurface.style.position = "absolute";
		this.paperSurface.style.backgroundColor = "#262626";
		this.paperSurface.style.boxShadow = "0 2px 20px rgba(0,0,0,0.3)";
		this.paperSurface.style.borderRadius = "var(--radius-sm)";
		this.paperSurface.style.pointerEvents = "none";
		this.viewportRoot.appendChild(this.paperSurface);

		this.svgElement = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"svg",
		);
		this.svgElement.setAttribute("class", "canvas-surface");
		this.svgElement.setAttribute(
			"style",
			"position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: auto;",
		);

		this.elementsGroup = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"g",
		);
		this.svgElement.appendChild(this.elementsGroup);

		this.interactionPath = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"path",
		);
		this.interactionPath.setAttribute("fill", "none");
		this.interactionPath.setAttribute("stroke-linecap", "round");
		this.interactionPath.setAttribute("stroke-linejoin", "round");
		this.svgElement.appendChild(this.interactionPath);

		this.selectionRectPath = document.createElementNS(
			"http://www.w3.org/2000/svg",
			"rect",
		);
		this.selectionRectPath.setAttribute("fill", "rgba(0, 120, 255, 0.1)");
		this.selectionRectPath.setAttribute("stroke", "#0078ff");
		this.selectionRectPath.setAttribute("stroke-width", "1");
		this.selectionRectPath.setAttribute("stroke-dasharray", "4 4");
		this.selectionRectPath.style.display = "none";
		this.svgElement.appendChild(this.selectionRectPath);

		this.viewportRoot.appendChild(this.svgElement);

		this.htmlElementsLayer = document.createElement("div");
		this.htmlElementsLayer.style.position = "absolute";
		this.htmlElementsLayer.style.inset = "0";
		this.htmlElementsLayer.style.pointerEvents = "none";
		this.viewportRoot.appendChild(this.htmlElementsLayer);

		this.container.appendChild(this.viewportRoot);
	}

	unmount() {
		if (this.viewportRoot && this.container) {
			this.container.removeChild(this.viewportRoot);
		}
		this.nodeCache.clear();
		this.lastElementsRef = null;
		this.lastSortedVisible = [];
		this.container = null;
		this.gateway = null;
		this.viewportRoot = null;
		this.paperSurface = null;
		this.svgElement = null;
		this.htmlElementsLayer = null;
	}

	render(state: CanvasState) {
		this.lastState = state;
		this.lastScale = state.viewport.scale;
		this.updateViewportStyles(state);
		this.updatePaperStyles(state);
		this.renderElements(state);
	}

	renderInteraction(state: CanvasState) {
		this.renderSelectionRect(state);
		this.renderCurrentStroke(state);
	}

	getMmCoords(e: PointerEvent | MouseEvent): { x: number; y: number } {
		if (!this.svgElement) return { x: 0, y: 0 };
		const rect = this.svgElement.getBoundingClientRect();
		let x = (e.clientX - rect.left) / (MM_TO_PX * this.lastScale);
		let y = (e.clientY - rect.top) / (MM_TO_PX * this.lastScale);

		// INFINITE mode shift: logical 0,0 is at the center of the 10000mm viewBox
		if (this.lastState && this.lastState.layoutMode === "INFINITE") {
			x -= 5000;
			y -= 5000;
		}

		return { x, y };
	}

	updateCursor(cursor: string) {
		if (this.svgElement) {
			this.svgElement.style.cursor = cursor;
		}
	}

	/**
	 * Exports the current canvas state to a full SVG string.
	 * Elements like images are embedded as data URLs to ensure self-contained files.
	 */
	async exportToSVG(state: CanvasState): Promise<string> {
		if (!this.gateway) return "";
		let svg = await this.gateway.exportSVG();

		// Post-process SVG to inject images if present
		const images = state.elements.filter(
			(el) => el.type === "ELEMENT_IMAGE" && !el.isDeleted,
		);
		if (images.length > 0) {
			const imageTags = images
				.map((el) => {
					const b = ElementUtils.getBounds(el);
					const w = b.maxX - b.minX;
					const h = b.maxY - b.minY;
					return `<image x="${b.minX}" y="${b.minY}" width="${w}" height="${h}" href="${getString(el.metadata, MetadataKey.SRC)}" />`;
				})
				.join("\n");

			// Inject before closing </svg>
			svg = svg.replace("</svg>", `${imageTags}\n</svg>`);
		}

		return svg;
	}

	// --- Private Rendering Logic ---

	private updateViewportStyles(state: CanvasState) {
		if (!this.viewportRoot) return;
		const { pan, scale } = state.viewport;
		this.viewportRoot.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
	}

	private updatePaperStyles(state: CanvasState) {
		if (!this.paperSurface || !this.svgElement) return;
		const { width: w, height: h } = state.pageSize;
		const isInfinite = state.layoutMode === "INFINITE";

		const viewW = w;

		// Mode specific visuals
		if (isInfinite) {
			// Truly infinite feel: large area, no borders/shadows, just a grid
			// We shift it so that (0,0) is in the middle of a huge grid
			this.paperSurface.style.width = "10000mm";
			this.paperSurface.style.height = "10000mm";
			this.paperSurface.style.left = "-5000mm";
			this.paperSurface.style.top = "-5000mm";
			this.paperSurface.style.backgroundColor = "transparent";
			this.paperSurface.style.boxShadow = "none";
			this.paperSurface.style.borderRadius = "0";
			this.paperSurface.style.backgroundImage =
				"radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)";
			this.paperSurface.style.backgroundSize = "20px 20px";

			// For infinite, the SVG should also be large or overflow visible
			this.svgElement.setAttribute("viewBox", `-5000 -5000 10000 10000`);
			this.svgElement.style.width = "10000mm";
			this.svgElement.style.height = "10000mm";
			this.svgElement.style.left = "-5000mm";
			this.svgElement.style.top = "-5000mm";
			this.svgElement.style.overflow = "visible";
		} else {
			this.paperSurface.style.width = `${viewW}mm`;
			this.paperSurface.style.height = `${h}mm`;
			this.paperSurface.style.left = "0";
			this.paperSurface.style.top = "0";
			this.paperSurface.style.backgroundColor = "#262626";

			this.paperSurface.style.boxShadow = "0 2px 20px rgba(0,0,0,0.3)";
			this.paperSurface.style.borderRadius = "var(--radius-sm)";
			this.paperSurface.style.backgroundImage = "none";

			this.svgElement.setAttribute("viewBox", `0 0 ${viewW} ${h}`);
			this.svgElement.style.width = `${viewW}mm`;
			this.svgElement.style.height = `${h}mm`;
			this.svgElement.style.left = "0";
			this.svgElement.style.top = "0";
			this.svgElement.style.overflow = "hidden";
		}

		this.paperSurface.style.display = "block";
	}

	private renderSelectionRect(state: CanvasState) {
		if (!this.selectionRectPath) return;
		if (state.isSelecting && state.selectionStart && state.selectionEnd) {
			const minX = Math.min(state.selectionStart.x, state.selectionEnd.x);
			const minY = Math.min(state.selectionStart.y, state.selectionEnd.y);
			const w = Math.abs(state.selectionEnd.x - state.selectionStart.x);
			const h = Math.abs(state.selectionEnd.y - state.selectionStart.y);
			this.selectionRectPath.setAttribute("x", minX.toString());
			this.selectionRectPath.setAttribute("y", minY.toString());
			this.selectionRectPath.setAttribute("width", w.toString());
			this.selectionRectPath.setAttribute("height", h.toString());
			this.selectionRectPath.style.display = "block";
		} else {
			this.selectionRectPath.style.display = "none";
		}
	}

	private renderCurrentStroke(state: CanvasState) {
		if (!this.interactionPath || !this.gateway) return;

		if (
			state.isInteracting &&
			(state.activeTool === CanvasTool.PEN ||
				state.activeTool === CanvasTool.HIGHLIGHTER)
		) {
			this.gateway.getStrokePath().then((d) => {
				if (!d || !this.interactionPath) {
					if (this.interactionPath) this.interactionPath.style.display = "none";
					return;
				}
				this.interactionPath.setAttribute("d", d);
				const config =
					state.activeTool === CanvasTool.HIGHLIGHTER
						? state.highlighterConfig
						: state.penConfig;
				const opacity = state.activeTool === CanvasTool.HIGHLIGHTER ? 0.4 : 1.0;

				this.interactionPath.setAttribute("stroke", config.color);
				this.interactionPath.setAttribute(
					"stroke-width",
					config.width.toString(),
				);
				this.interactionPath.style.opacity = opacity.toString();
				this.interactionPath.style.display = "block";
			});
		} else {
			this.interactionPath.style.display = "none";
		}
	}

	/**
	 * Incrementally reconciles element DOM nodes using a per-element visual
	 * fingerprint.  On each call:
	 *   1. When elements array changed: purge stale nodes, recompute sorted list.
	 *   2. For each visible element: skip if fingerprint unchanged; otherwise
	 *      update in-place or create a new node.
	 *   3. When elements array changed: re-append in z-index order so DOM order
	 *      matches the visual stacking.
	 *
	 * During active drawing or panning the elements array reference is stable,
	 * so only step 2 runs — and every fingerprint matches → zero DOM work.
	 */
	private renderElements(state: CanvasState) {
		if (!this.elementsGroup || !this.htmlElementsLayer) return;

		const {
			elements,
			selectedElementIds,
			isDraggingSelection,
			selectionOffsetMm,
			editingElementId,
		} = state;

		const elementsChanged = elements !== this.lastElementsRef;
		this.lastElementsRef = elements;

		if (elementsChanged) {
			// Recompute the sorted visible set
			this.lastSortedVisible = [...elements]
				.filter((el) => !el.isDeleted)
				.sort(
					(a, b) =>
						getNumber(a.metadata, MetadataKey.Z_INDEX) -
						getNumber(b.metadata, MetadataKey.Z_INDEX),
				);

			// Purge cached nodes for elements no longer present
			const currentIds = new Set(this.lastSortedVisible.map((e) => e.id));
			for (const [id, cached] of this.nodeCache) {
				if (!currentIds.has(id)) {
					cached.svgNode?.parentNode?.removeChild(cached.svgNode);
					cached.htmlNode?.parentNode?.removeChild(cached.htmlNode);
					cached.textareaNode?.parentNode?.removeChild(cached.textareaNode);
					this.nodeCache.delete(id);
				}
			}
		}

		// Create or update each visible element's DOM node
		for (const el of this.lastSortedVisible) {
			const isSelected = selectedElementIds.includes(el.id);
			const dx = isSelected && isDraggingSelection ? selectionOffsetMm.dx : 0;
			const dy = isSelected && isDraggingSelection ? selectionOffsetMm.dy : 0;
			const isEditing = editingElementId === el.id;
			const fingerprint = `${el.updatedAt}:${isSelected ? 1 : 0}:${dx.toFixed(3)}:${dy.toFixed(3)}:${isEditing ? 1 : 0}`;

			const cached = this.nodeCache.get(el.id);
			if (cached) {
				if (cached.fingerprint !== fingerprint) {
					this.updateElementNode(cached, el, isSelected, dx, dy, isEditing);
					cached.fingerprint = fingerprint;
				}
			} else {
				const newCached: CachedNode = {
					fingerprint,
					svgNode: null,
					htmlNode: null,
					textareaNode: null,
				};
				this.createElementNodeInto(
					newCached,
					el,
					isSelected,
					dx,
					dy,
					isEditing,
				);
				this.nodeCache.set(el.id, newCached);
			}
		}

		// Re-establish DOM order to match z-index sort (only when elements changed)
		if (elementsChanged) {
			for (const el of this.lastSortedVisible) {
				const cached = this.nodeCache.get(el.id);
				if (!cached) continue;
				if (cached.svgNode) this.elementsGroup.appendChild(cached.svgNode);
				if (cached.htmlNode)
					this.htmlElementsLayer.appendChild(cached.htmlNode);
				if (cached.textareaNode)
					this.htmlElementsLayer.appendChild(cached.textareaNode);
			}
		}
	}

	/**
	 * Populates a fresh CachedNode by creating and configuring the appropriate
	 * DOM node(s) for the given element.  Does NOT append to the DOM — the
	 * caller's DOM-order reconciliation pass handles that.
	 */
	private createElementNodeInto(
		cached: CachedNode,
		el: CanvasElement,
		isSelected: boolean,
		dx: number,
		dy: number,
		isEditing: boolean,
	) {
		if (el.type === "ELEMENT_STROKE") {
			const path = document.createElementNS(
				"http://www.w3.org/2000/svg",
				"path",
			);
			this.applyStrokeAttrs(path, el, isSelected, dx, dy);
			cached.svgNode = path;
		} else if (el.type === "ELEMENT_IMAGE") {
			const img = document.createElement("img") as HTMLImageElement;
			this.applyImageAttrs(img, el, isSelected, dx, dy);
			cached.htmlNode = img;
		} else if (el.type === "ELEMENT_TEXT") {
			const div = document.createElement("div") as HTMLDivElement;
			this.applyTextAttrs(div, el, isSelected, dx, dy);
			cached.htmlNode = div;
			if (isEditing) {
				const content = getString(el.metadata, MetadataKey.CONTENT);
				cached.textareaNode = this.createTextarea(el, div, content);
			}
		}
	}

	/**
	 * Applies the latest visual state to an already-mounted DOM node.
	 * For text elements, also manages the textarea lifecycle as editing mode
	 * transitions in and out.
	 */
	private updateElementNode(
		cached: CachedNode,
		el: CanvasElement,
		isSelected: boolean,
		dx: number,
		dy: number,
		isEditing: boolean,
	) {
		if (el.type === "ELEMENT_STROKE" && cached.svgNode) {
			this.applyStrokeAttrs(cached.svgNode, el, isSelected, dx, dy);
		} else if (el.type === "ELEMENT_IMAGE" && cached.htmlNode) {
			this.applyImageAttrs(
				cached.htmlNode as HTMLImageElement,
				el,
				isSelected,
				dx,
				dy,
			);
		} else if (el.type === "ELEMENT_TEXT" && cached.htmlNode) {
			const wasEditing = cached.textareaNode !== null;

			if (wasEditing && !isEditing) {
				// Editing ended: remove textarea, restore div visibility
				cached.textareaNode?.parentNode?.removeChild(cached.textareaNode);
				cached.textareaNode = null;
				(cached.htmlNode as HTMLDivElement).style.visibility = "";
			} else if (!wasEditing && isEditing) {
				// Editing started: create textarea overlay
				const content = getString(el.metadata, MetadataKey.CONTENT);
				const textarea = this.createTextarea(
					el,
					cached.htmlNode as HTMLDivElement,
					content,
				);
				this.htmlElementsLayer?.appendChild(textarea);
				cached.textareaNode = textarea;
			}

			// Only update div content/attrs when not editing (div is hidden while editing)
			if (!isEditing) {
				this.applyTextAttrs(
					cached.htmlNode as HTMLDivElement,
					el,
					isSelected,
					dx,
					dy,
				);
			}
		}
	}

	private applyStrokeAttrs(
		path: SVGPathElement,
		el: CanvasElement,
		isSelected: boolean,
		dx: number,
		dy: number,
	) {
		const points = getNumberArray(el.metadata, MetadataKey.POINTS);
		if (points.length < 4) return;

		const shiftedPoints =
			dx !== 0 || dy !== 0
				? points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy))
				: points;

		path.setAttribute("d", pointsToCatmullRomPath(shiftedPoints));
		path.setAttribute("fill", "none");
		path.setAttribute(
			"stroke",
			isSelected
				? "var(--accent, #0078ff)"
				: getString(el.metadata, MetadataKey.COLOR, "#fff"),
		);
		path.setAttribute(
			"stroke-width",
			getNumber(el.metadata, MetadataKey.WIDTH, 1.2).toString(),
		);
		path.setAttribute("stroke-linecap", "round");
		path.setAttribute("stroke-linejoin", "round");
		if (isSelected) {
			path.setAttribute(
				"style",
				"filter: drop-shadow(0 0 3px var(--accent, #0078ff)); opacity: 0.8;",
			);
		} else {
			path.removeAttribute("style");
		}
	}

	private applyImageAttrs(
		img: HTMLImageElement,
		el: CanvasElement,
		isSelected: boolean,
		dx: number,
		dy: number,
	) {
		img.src = getString(el.metadata, MetadataKey.SRC);
		img.style.position = "absolute";
		img.style.left = `${(getNumber(el.metadata, MetadataKey.MIN_X) + dx) * MM_TO_PX}px`;
		img.style.top = `${(getNumber(el.metadata, MetadataKey.MIN_Y) + dy) * MM_TO_PX}px`;
		img.style.width = `${getNumber(el.metadata, MetadataKey.WIDTH, 60) * MM_TO_PX}px`;
		img.style.height = `${getNumber(el.metadata, MetadataKey.HEIGHT, 45) * MM_TO_PX}px`;
		img.style.objectFit = "cover";
		img.style.borderRadius = "var(--radius-sm)";
		img.style.border = isSelected
			? "2px solid var(--accent, #0078ff)"
			: "1px solid rgba(255,255,255,0.06)";
		img.style.opacity = isSelected ? "0.8" : "";
	}

	private applyTextAttrs(
		div: HTMLDivElement,
		el: CanvasElement,
		isSelected: boolean,
		dx: number,
		dy: number,
	) {
		div.style.position = "absolute";
		div.style.left = `${(getNumber(el.metadata, MetadataKey.MIN_X) + dx) * MM_TO_PX}px`;
		div.style.top = `${(getNumber(el.metadata, MetadataKey.MIN_Y) + dy) * MM_TO_PX}px`;
		div.style.color = "white";
		div.style.padding = "12px 16px";
		div.style.fontSize = "15px";
		div.style.fontFamily = "var(--font-core)";
		div.style.backgroundColor = "rgba(255,255,255,0.03)";
		div.style.backdropFilter = "blur(8px)";
		div.style.borderRadius = "12px";
		div.style.border = isSelected
			? "2px solid var(--accent, #0078ff)"
			: "1px solid rgba(255,255,255,0.1)";
		div.style.opacity = isSelected ? "0.8" : "";
		div.style.maxWidth = "400px";
		div.style.pointerEvents = "auto";

		const content = getString(el.metadata, MetadataKey.CONTENT);
		if (content.includes("$")) {
			const parts = content.split(/(\$.*?\$)/);
			div.innerHTML = parts
				.map((part: string) => {
					if (part.startsWith("$") && part.endsWith("$")) {
						return katex.renderToString(part.slice(1, -1), {
							throwOnError: false,
						});
					}
					return part;
				})
				.join("");
		} else {
			div.innerText = content;
		}
	}

	private createTextarea(
		el: CanvasElement,
		div: HTMLElement,
		content: string,
	): HTMLTextAreaElement {
		const textarea = document.createElement("textarea");
		textarea.value = content;
		textarea.style.position = "absolute";
		textarea.style.left = div.style.left;
		textarea.style.top = div.style.top;
		textarea.style.width = div.style.width || "200px";
		textarea.style.minHeight = "40px";
		textarea.style.border = "2px solid var(--accent, #0078ff)";
		textarea.style.background = "var(--surface-felt, #262626)";
		textarea.style.color = "white";
		textarea.style.padding = div.style.padding;
		textarea.style.fontSize = div.style.fontSize;
		textarea.style.fontFamily = div.style.fontFamily;
		textarea.style.borderRadius = div.style.borderRadius;
		textarea.style.zIndex = "1000";
		textarea.style.resize = "both";
		textarea.style.outline = "none";
		textarea.style.pointerEvents = "auto";

		textarea.addEventListener("blur", () => {
			this.onTextEdit?.(el.id, textarea.value);
		});

		textarea.addEventListener("keydown", (ke) => {
			if (ke.key === "Enter" && (ke.ctrlKey || ke.metaKey)) {
				textarea.blur();
			} else if (ke.key === "Escape") {
				this.onTextEditCancel?.();
			}
		});

		div.style.visibility = "hidden";
		setTimeout(() => {
			textarea.focus();
			textarea.select();
		}, 0);

		return textarea;
	}
}
