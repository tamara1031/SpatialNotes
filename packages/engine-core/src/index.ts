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

const REQUEST_TIMEOUT_MS = 30_000;

/**
 * Reusable base for classes that communicate with a dedicated Web Worker via a
 * request/response RPC protocol.
 *
 * Each outgoing message carries a numeric `id`; the worker echoes the same `id`
 * back so that `request<T>()` can resolve the correct pending Promise.
 *
 * Subclasses pass their worker URL to `super()` and call `request<T>()` to make
 * typed RPC calls without reimplementing the pending-map bookkeeping.
 *
 * Crash and lifecycle handling:
 * - Every pending request is guarded by a timeout (REQUEST_TIMEOUT_MS).
 * - If the underlying Worker fires an `onerror` event (uncaught throw inside
 *   the worker, module load failure, etc.) every pending caller is rejected
 *   immediately so they don't hang until the per-request timeout fires.
 * - `terminate()` drains the pending map for the same reason on intentional
 *   teardown.
 */
export abstract class WorkerRpcClient {
	private worker?: Worker;
	private nextId = 0;
	private readonly pending = new Map<
		number,
		{
			resolve: (value: unknown) => void;
			reject: (reason: Error) => void;
			timer: ReturnType<typeof setTimeout>;
		}
	>();

	protected constructor(workerUrl: URL) {
		if (typeof Worker !== "undefined") {
			this.worker = new Worker(workerUrl, { type: "module" });
			this.worker.onmessage = this.handleMessage.bind(this);
			this.worker.onerror = (event) => {
				// Surface the raw ErrorEvent first so devtools still see
				// filename/lineno and the stack the browser attached to it;
				// rejection-only would swallow that context.
				console.error("Worker onerror:", event);
				// Duck-typed read of event.message: in browsers this is an
				// ErrorEvent, but the global ErrorEvent constructor is not
				// available in every test environment, so we avoid the
				// instanceof check.
				const message =
					typeof (event as { message?: unknown }).message === "string"
						? (event as { message: string }).message
						: "worker crashed";
				this.rejectAllPending(new Error(`Worker crashed: ${message}`));
			};
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
			const timer = setTimeout(() => {
				this.pending.delete(id);
				reject(
					new Error(
						`Worker request "${type}" timed out after ${REQUEST_TIMEOUT_MS}ms`,
					),
				);
			}, REQUEST_TIMEOUT_MS);
			this.pending.set(id, {
				resolve: (v) => resolve(v as T),
				reject,
				timer,
			});
			this.worker?.postMessage({ type, payload, id }, transfer ?? []);
		});
	}

	private handleMessage(e: MessageEvent): void {
		const { type, id, payload, error } = e.data as WorkerResponse;
		const entry = this.pending.get(id);
		if (!entry) return;
		clearTimeout(entry.timer);
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
		this.rejectAllPending(new Error("Worker terminated"));
	}

	private rejectAllPending(reason: Error): void {
		for (const entry of this.pending.values()) {
			clearTimeout(entry.timer);
			entry.reject(reason);
		}
		this.pending.clear();
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
	onAction?(
		callback: (action: { type: string; payload?: unknown }) => void,
	): void;
}
