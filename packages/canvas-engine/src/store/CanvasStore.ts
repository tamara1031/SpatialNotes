import { type CanvasElement, CanvasTool, type CanvasViewport } from "../types";

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
	layoutMode: string;
	pageSize: { width: number; height: number };

	// Lifecycle Status
	status: "LOADING" | "READY" | "ERROR";
}

export type CanvasEvent =
	| { type: "ELEMENTS_CHANGED"; payload: CanvasElement[] }
	| { type: "VIEWPORT_CHANGED"; payload: CanvasViewport }
	| { type: "SELECTION_CHANGED"; payload: string[] }
	| { type: "TOOL_CHANGED"; payload: CanvasTool }
	| { type: "COMMAND_EMITTED"; payload: { type: string; payload?: any } }
	| {
			type: "STATUS_CHANGED";
			payload: { status: "LOADING" | "READY" | "ERROR"; message?: string };
	  };

export type CanvasAction =
	| { type: "CREATE_ELEMENT"; payload: CanvasElement }
	| { type: "UPDATE_ELEMENTS"; payload: { id: string; changes: any }[] }
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
	private actionListeners: Set<
		(action: { type: string; payload?: any }) => void
	> = new Set();

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
				this.emitCommand("CREATE", action.payload);
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
				this.emitCommand("UPDATE_ELEMENTS", action.payload);
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
				this.emitCommand(
					"BATCH",
					action.payload.map((id) => ({ type: "DELETE", payload: { id } })),
				);
				break;
			case "SET_VIEWPORT":
				this.update({ viewport: action.payload });
				break;
			case "SET_TOOL":
				this.update({ activeTool: action.payload });
				break;
			case "UNDO":
				this.emitCommand("UNDO");
				break;
			case "REDO":
				this.emitCommand("REDO");
				break;
			case "BATCH":
				action.payload.forEach((a) => this.dispatch(a));
				break;
		}
	}

	/**
	 * Dispatch a domain event that doesn't necessarily change the state
	 * but needs to be broadcast (replaces CommandBus)
	 */
	emitCommand(type: string, payload?: any) {
		const action = { type, payload };
		this.emit("COMMAND_EMITTED", action);
		this.actionListeners.forEach((l) => l(action));
	}

	subscribe(listener: () => void) {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	onAction(listener: (action: { type: string; payload?: any }) => void) {
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
		this.listeners.forEach((l) => l());
	}

	private emit(type: string, payload: any) {
		this.eventListeners.get(type)?.forEach((l) => l(payload));
	}
}
