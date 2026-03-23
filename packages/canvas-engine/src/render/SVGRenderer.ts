import katex from "katex";
import type { WorkerGateway } from "../bridge/WorkerGateway";
import type { CanvasState } from "../store/CanvasStore";
import { type CanvasElement, CanvasTool } from "../types";
import { ElementUtils } from "../utils/ElementUtils";
import { pointsToCatmullRomPath } from "../utils/path-smoothing";
import type { CanvasRenderer } from "./Renderer";

const MM_TO_PX = 96 / 25.4;

export class SVGRenderer implements CanvasRenderer {
	private container: HTMLElement | null = null;
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
		this.container = null;
		this.gateway = null; // Added this line
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
					return `<image x="${b.minX}" y="${b.minY}" width="${w}" height="${h}" href="${el.metadata.src}" />`;
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
			(state.activeTool === "PEN" || state.activeTool === "HIGHLIGHTER")
		) {
			this.gateway.getStrokePath().then((d) => {
				if (!d || !this.interactionPath) {
					if (this.interactionPath) this.interactionPath.style.display = "none";
					return;
				}
				this.interactionPath.setAttribute("d", d);
				const config =
					state.activeTool === "HIGHLIGHTER"
						? state.highlighterConfig
						: state.penConfig;
				const opacity = state.activeTool === "HIGHLIGHTER" ? 0.4 : 1.0;

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

	private renderElements(state: CanvasState) {
		if (!this.elementsGroup || !this.htmlElementsLayer) return;

		// Clear layers
		while (this.elementsGroup.firstChild)
			this.elementsGroup.removeChild(this.elementsGroup.firstChild);
		while (this.htmlElementsLayer.firstChild)
			this.htmlElementsLayer.removeChild(this.htmlElementsLayer.firstChild);

		const sortedElements = [...state.elements].sort((a, b) => {
			const az = (a.metadata.z_index as number) || 0;
			const bz = (b.metadata.z_index as number) || 0;
			return az - bz;
		});

		sortedElements.forEach((el) => {
			if (el.isDeleted) return;

			const isSelected = state.selectedElementIds.includes(el.id);
			const dx =
				isSelected && state.isDraggingSelection
					? state.selectionOffsetMm.dx
					: 0;
			const dy =
				isSelected && state.isDraggingSelection
					? state.selectionOffsetMm.dy
					: 0;

			if (el.type === "ELEMENT_STROKE") {
				this.renderStroke(el, isSelected, dx, dy);
			} else if (el.type === "ELEMENT_IMAGE") {
				this.renderImage(el, isSelected, dx, dy);
			} else if (el.type === "ELEMENT_TEXT") {
				this.renderText(el, isSelected, dx, dy, state);
			}
		});
	}

	private renderStroke(
		el: CanvasElement,
		isSelected: boolean,
		dx: number,
		dy: number,
	) {
		const points = el.metadata.points as number[];
		if (!points || points.length < 4) return;

		const shiftedPoints =
			dx !== 0 || dy !== 0
				? points.map((p, i) => (i % 2 === 0 ? p + dx : p + dy))
				: points;

		const d = pointsToCatmullRomPath(shiftedPoints);
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("d", d);
		path.setAttribute("fill", "none");
		path.setAttribute("stroke", el.metadata.color || "#fff");
		path.setAttribute("stroke-width", (el.metadata.width || 1.2).toString());
		path.setAttribute("stroke-linecap", "round");
		path.setAttribute("stroke-linejoin", "round");

		let styleStr = "";
		if (isSelected) {
			styleStr += ` filter: drop-shadow(0 0 3px var(--accent, #0078ff)); opacity: 0.8;`;
			path.setAttribute("stroke", "var(--accent, #0078ff)");
		}
		if (styleStr) path.setAttribute("style", styleStr);

		this.elementsGroup!.appendChild(path);
	}

	private renderImage(
		el: CanvasElement,
		isSelected: boolean,
		dx: number,
		dy: number,
	) {
		const img = document.createElement("img");
		img.src = el.metadata.src;
		img.style.position = "absolute";
		img.style.left = `${((el.metadata.min_x as number) + dx) * MM_TO_PX}px`;
		img.style.top = `${((el.metadata.min_y as number) + dy) * MM_TO_PX}px`;
		img.style.width = `${((el.metadata.width as number) || 60) * MM_TO_PX}px`;
		img.style.height = `${((el.metadata.height as number) || 45) * MM_TO_PX}px`;
		img.style.objectFit = "cover";
		img.style.borderRadius = "var(--radius-sm)";
		img.style.border = isSelected
			? "2px solid var(--accent, #0078ff)"
			: "1px solid rgba(255,255,255,0.06)";
		if (isSelected) img.style.opacity = "0.8";
		this.htmlElementsLayer!.appendChild(img);
	}

	private renderText(
		el: CanvasElement,
		isSelected: boolean,
		dx: number,
		dy: number,
		state: CanvasState,
	) {
		const div = document.createElement("div");
		div.style.position = "absolute";
		div.style.left = `${((el.metadata.min_x as number) + dx) * MM_TO_PX}px`;
		div.style.top = `${((el.metadata.min_y as number) + dy) * MM_TO_PX}px`;
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
		if (isSelected) div.style.opacity = "0.8";
		div.style.maxWidth = "400px";
		div.style.pointerEvents = "auto";

		const content = el.metadata.content || "";
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

		if (state.editingElementId === el.id) {
			this.setupTextarea(el, div, content);
		}

		this.htmlElementsLayer!.appendChild(div);
	}

	private setupTextarea(
		el: CanvasElement,
		div: HTMLDivElement,
		content: string,
	) {
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

		this.htmlElementsLayer!.appendChild(textarea);
		setTimeout(() => {
			textarea.focus();
			textarea.select();
		}, 0);
		div.style.visibility = "hidden";
	}
}
