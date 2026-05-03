import {
	type CanvasElement,
	type CanvasElementUpdate,
	type CanvasLayoutMode,
	type CanvasStoreCommand,
	CanvasTool,
	type CanvasViewport,
} from "../types";

export interface CanvasState {
	// Persistent State (Synced via App)
	elements: CanvasElement[];
	activeNodeId: string | null;

	// View State
	viewport: CanvasViewport;
	activeTool: CanvasTool;

	// Selection State
	selectedElementIds: string[];
	editingElementId: string | null;

	// Interaction State (Transient)
	isInteracting: boolean;
	isSelecting: boolean;
	selectionStart: { x: number; y: number } | null;
	selectionEnd: { x: number; y: number } | null;
	isDraggingSelection: boolean;
	dragStartMm: { x: number; y: number } | null;
	selectionOffsetMm: { dx: number; dy: number };
	isPanning: boolean;
	lastPanPos: { x: number; y: number } | null;

	// Config
	penConfig: { color: string; width: number };
	highlighterConfig: { color: string; width: number };

	// Layout Context (ADR-030)
	layoutMode: CanvasLayoutMode;
	pageSize: { width: number; height: number };

	// Lifecycle Status
	status: "LOADING" | "READY" | "ERROR";
}

export type CanvasEvent =
	| { type: "ELEMENTS_CHANGED"; payload: CanvasElement[] }
	| { type: "VIEWPORT_CHANGED"; payload: CanvasViewport }
	| { type: "SELECTION_CHANGED"; payload: string[] }
	| { type: "TOOL_CHANGED"; payload: CanvasTool }
	| { type: "COMMAND_EMITTED"; payload: CanvasStoreCommand }
	| {
			type: "STATUS_CHANGED";
			payload: { status: "LOADING" | "READY" | "ERROR"; message?: string };
	  };

export type CanvasAction =
	| { type: "CREATE_ELEMENT"; payload: CanvasElement }
	| { type: "UPDATE_ELEMENTS"; payload: CanvasElementUpdate[] }
	| { type: "DELETE_ELEMENTS"; payload: string[] }
	| { type: "SET_VIEWPORT"; payload: CanvasViewport }
	| { type: "SET_TOOL"; payload: CanvasTool }
	| { type: "UNDO" }
	| { type: "REDO" }
	| { type: "BATCH"; payload: CanvasAction[] };

export class CanvasStore {
	private state: CanvasState;
	private listeners: Set<() => void> = new Set();
	private eventListeners: Map<string, Set<(payload: any) => void>> = new Map();
	private actionListeners: Set<(command: CanvasStoreCommand) => void> =
		new Set();
	// Tracks nesting depth of BATCH dispatch calls. notify() is suppressed
	// while > 0; a single consolidated flush happens when depth returns to 0.
	private batchDepth = 0;

	constructor(initialState?: Partial<CanvasState>) {
		this.state = {
			elements: [],
			activeNodeId: null,
			viewport: { pan: { x: 0, y: 0 }, scale: 1.0 },
			activeTool: CanvasTool.PEN,
			selectedElementIds: [],
			editingElementId: null,
			isInteracting: false,
			isSelecting: false,
			selectionStart: null,
			selectionEnd: null,
			isDraggingSelection: false,
			dragStartMm: null,
			selectionOffsetMm: { dx: 0, dy: 0 },
			isPanning: false,
			lastPanPos: null,
			penConfig: { color: "#ffffff", width: 1.2 },
			highlighterConfig: { color: "rgba(255, 235, 59, 0.3)", width: 8 },
			layoutMode: "INFINITE",
			pageSize: { width: 210, height: 297 },
			status: "LOADING",
			...initialState,
		};
	}

	getState(): CanvasState {
		return this.state;
	}

	getSnapshot(): CanvasState {
		return {
			...this.state,
			elements: this.state.elements.map((el) => ({
				...el,
				metadata: { ...el.metadata },
			})),
			viewport: { ...this.state.viewport },
		};
	}

	applySnapshot(snapshot: CanvasState) {
		this.state = {
			...snapshot,
			elements: snapshot.elements.map((el) => ({
				...el,
				metadata: { ...el.metadata },
			})),
			viewport: { ...snapshot.viewport },
		};
		this.notify();
		this.emit("ELEMENTS_CHANGED", this.state.elements);
	}

	update(patch: Partial<CanvasState>) {
		const oldState = this.state;
		this.state = { ...this.state, ...patch };

		// Semantic event emission
		if (patch.elements && patch.elements !== oldState.elements) {
			this.emit("ELEMENTS_CHANGED", this.state.elements);
		}
		if (patch.viewport && patch.viewport !== oldState.viewport) {
			this.emit("VIEWPORT_CHANGED", this.state.viewport);
		}
		if (
			patch.selectedElementIds &&
			patch.selectedElementIds !== oldState.selectedElementIds
		) {
			this.emit("SELECTION_CHANGED", this.state.selectedElementIds);
		}
		if (patch.activeTool && patch.activeTool !== oldState.activeTool) {
			this.emit("TOOL_CHANGED", this.state.activeTool);
		}

		this.notify();
	}

	dispatch(action: CanvasAction) {
		switch (action.type) {
			case "CREATE_ELEMENT":
				this.update({ elements: [...this.state.elements, action.payload] });
				this.emitCommand({ type: "CREATE", payload: action.payload });
				break;
			case "UPDATE_ELEMENTS": {
				const nextElements = this.state.elements.map((el) => {
					const update = action.payload.find((u) => u.id === el.id);
					if (update)
						return {
							...el,
							...update.changes,
							metadata: { ...el.metadata, ...update.changes.metadata },
							updatedAt: Date.now(),
						};
					return el;
				});
				this.update({ elements: nextElements });
				this.emitCommand({ type: "UPDATE_ELEMENTS", payload: action.payload });
				break;
			}
			case "DELETE_ELEMENTS":
				this.update({
					elements: this.state.elements.filter(
						(el) => !action.payload.includes(el.id),
					),
					selectedElementIds: this.state.selectedElementIds.filter(
						(id) => !action.payload.includes(id),
					),
				});
				this.emitCommand({
					type: "BATCH",
					payload: action.payload.map(
						(id): { type: "DELETE"; payload: { id: string } } => ({
							type: "DELETE",
							payload: { id },
						}),
					),
				});
				break;
			case "SET_VIEWPORT":
				this.update({ viewport: action.payload });
				break;
			case "SET_TOOL":
				this.update({ activeTool: action.payload });
				break;
			case "UNDO":
				this.emitCommand({ type: "UNDO" });
				break;
			case "REDO":
				this.emitCommand({ type: "REDO" });
				break;
			case "BATCH":
				this.batchDepth++;
				try {
					action.payload.forEach((a) => this.dispatch(a));
				} finally {
					this.batchDepth--;
					if (this.batchDepth === 0) {
						this.notify();
					}
				}
				break;
		}
	}

	/**
	 * Dispatch a domain event that doesn't necessarily change the state
	 * but needs to be broadcast (replaces CommandBus)
	 */
	emitCommand(command: CanvasStoreCommand): void {
		this.emit("COMMAND_EMITTED", command);
		this.actionListeners.forEach((l) => {
			l(command);
		});
	}

	subscribe(listener: () => void) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	onAction(listener: (command: CanvasStoreCommand) => void): () => void {
		this.actionListeners.add(listener);
		return () => this.actionListeners.delete(listener);
	}

	on<T extends CanvasEvent["type"]>(
		type: T,
		listener: (payload: Extract<CanvasEvent, { type: T }>["payload"]) => void,
	) {
		if (!this.eventListeners.has(type)) {
			this.eventListeners.set(type, new Set());
		}
		this.eventListeners.get(type)?.add(listener);
		return () => this.eventListeners.get(type)?.delete(listener);
	}

	private notify() {
		if (this.batchDepth > 0) return;
		this.listeners.forEach((l) => {
			l();
		});
	}

	private emit(type: string, payload: any) {
		this.eventListeners.get(type)?.forEach((l) => {
			l(payload);
		});
	}
}
