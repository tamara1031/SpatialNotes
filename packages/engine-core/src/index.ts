/* ─── Generic Note Engine Types ─── */

export interface BaseElement {
	id: string;
	type: string;
	parentId: string | null;
	metadata: Record<string, any>;
	updatedAt: number;
	isDeleted?: boolean;
}

export type ElementFactory<E extends BaseElement = BaseElement> = (
	type: string,
	parentId: string,
	metadata: any,
) => E;

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
