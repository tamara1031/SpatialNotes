/* ─── Generic Note Engine Types ─── */

export interface BaseElement {
	id: string;
	type: string;
	parentId: string | null;
	metadata: Record<string, unknown>;
	updatedAt: number;
	isDeleted?: boolean;
}

export type ElementFactory<E extends BaseElement = BaseElement> = (
	type: string,
	parentId: string,
	metadata: Record<string, unknown>,
) => E;

// ── WorkerRpcClient ───────────────────────────────────────────────────────────

interface WorkerResponse {
	type: string;
	id: number;
	payload: unknown;
	error?: string;
}

/**
 * Reusable base for classes that communicate with a dedicated Web Worker via a
 * request/response RPC protocol.
 *
 * Each outgoing message carries a numeric `id`; the worker echoes the same `id`
 * back so that `request<T>()` can resolve the correct pending Promise.
 *
 * Subclasses pass their worker URL to `super()` and call `request<T>()` to make
 * typed RPC calls without reimplementing the pending-map bookkeeping.
 */
export abstract class WorkerRpcClient {
	private worker?: Worker;
	private nextId = 0;
	private readonly pending = new Map<
		number,
		{ resolve: (value: unknown) => void; reject: (reason: Error) => void }
	>();

	protected constructor(workerUrl: URL) {
		if (typeof Worker !== "undefined") {
			this.worker = new Worker(workerUrl, { type: "module" });
			this.worker.onmessage = this.handleMessage.bind(this);
		}
	}

	protected request<T = void>(
		type: string,
		payload?: unknown,
		transfer?: Transferable[],
	): Promise<T> {
		if (!this.worker) return Promise.resolve(undefined as T);
		const id = this.nextId++;
		return new Promise<T>((resolve, reject) => {
			this.pending.set(id, {
				resolve: (v) => resolve(v as T),
				reject,
			});
			this.worker?.postMessage({ type, payload, id }, transfer ?? []);
		});
	}

	private handleMessage(e: MessageEvent): void {
		const { type, id, payload, error } = e.data as WorkerResponse;
		const entry = this.pending.get(id);
		if (!entry) return;
		this.pending.delete(id);
		if (type === "ERROR" || error) {
			entry.reject(new Error(error ?? `Worker error in ${type}`));
		} else {
			entry.resolve(payload);
		}
	}

	terminate(): void {
		this.worker?.terminate();
		this.worker = undefined;
	}
}

/* ─── Granular Engine Interfaces (ISP compliant) ─── */

export interface LifecycleHooks {
	mount(container: HTMLElement): void;
	unmount(): void;
	destroy(): void;
}

export interface DataSyncable<E extends BaseElement, V> {
	/**
	 * Update the engine state with new data from the store.
	 */
	update(patch: Partial<{ elements: E[]; viewport: V }>): void;

	/**
	 * Retrieve the current engine state for saving.
	 */
	getState(): { elements: E[]; viewport: V };
}

export interface Interactable<C> {
	/**
	 * Update the interaction context (e.g., active tool, read-only mode).
	 */
	updateContext(context: C): void;

	/**
	 * Handle global keyboard events.
	 * Returns true if the event was handled by the engine.
	 */
	handleKeyDown?(e: KeyboardEvent): boolean;
}

/**
 * Unified Engine Interface.
 */
export interface EngineInterface<E extends BaseElement, V, C>
	extends LifecycleHooks,
		DataSyncable<E, V>,
		Interactable<C> {
	/**
	 * Register a callback for actions emitted by the engine (status, commands, etc.)
	 */
	onAction?(callback: (action: { type: string; payload?: any }) => void): void;
}
