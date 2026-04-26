import type { IDomainEvent } from "../events/DomainEventBus.js";
import {
	type BoundedElementMetadata,
	type CanvasElementVisitor,
	CircularReferenceError,
	type EncryptionStrategy,
	type ImageMetadata,
	type NodeRecord,
	type StrokeMetadata,
	type TextMetadata,
} from "../types.js";
import {
	NodeDeletedEvent,
	NodeMovedEvent,
	NodeRenamedEvent,
} from "./events.js";

export abstract class Node {
	protected parent: Node | null = null;
	private _domainEvents: IDomainEvent[] = [];

	constructor(protected record: NodeRecord) {}

	get domainEvents(): IDomainEvent[] {
		return [...this._domainEvents];
	}

	clearDomainEvents(): void {
		this._domainEvents = [];
	}

	protected addDomainEvent(event: IDomainEvent): void {
		this._domainEvents.push(event);
	}

	get id(): string {
		return this.record.id;
	}
	get parentId(): string | null {
		return this.record.parentId;
	}
	get userId(): string {
		return this.record.userId;
	}
	get name(): string {
		return this.record.name || "";
	}

	get type(): string {
		return this.record.type;
	}
	get createdAt(): number {
		return this.record.createdAt;
	}
	get updatedAt(): number {
		return this.record.updatedAt;
	}
	get position(): { x: number; y: number } | null {
		return this.record.position || null;
	}

	get encryptionStrategy(): EncryptionStrategy {
		return this.record.encryptionStrategy;
	}
	set encryptionStrategy(strategy: EncryptionStrategy) {
		this.record.encryptionStrategy = strategy;
		this.record.updatedAt = Date.now();
	}

	get isDeleted(): boolean {
		return !!this.record.isDeleted;
	}

	setParent(newParent: Node | null): void {
		const newParentId = newParent ? newParent.id : null;

		if (newParentId === this.id) {
			throw new CircularReferenceError();
		}

		if (newParent?.isDescendantOf(this.id)) {
			throw new CircularReferenceError();
		}

		this.parent = newParent;
		this.record.parentId = newParentId;
		this.record.updatedAt = Date.now();
	}

	isDescendantOf(potentialAncestorId: string): boolean {
		if (this.parentId === potentialAncestorId) return true;
		if (this.parent) return this.parent.isDescendantOf(potentialAncestorId);
		return false;
	}

	abstract accept(visitor: CanvasElementVisitor): void;

	rename(newName: string): void {
		this.record.name = newName;
		this.record.updatedAt = Date.now();
		this.addDomainEvent(new NodeRenamedEvent({ id: this.id, name: newName }));
	}

	move(newParentId: string | null): void {
		this.record.parentId = newParentId;
		this.record.updatedAt = Date.now();
		this.addDomainEvent(
			new NodeMovedEvent({ id: this.id, parentId: newParentId }),
		);
	}

	delete(): void {
		this.record.isDeleted = true;
		this.record.updatedAt = Date.now();
		this.addDomainEvent(new NodeDeletedEvent({ id: this.id }));
	}

	toRecord(): NodeRecord {
		return JSON.parse(JSON.stringify(this.record));
	}
}

export class Chapter extends Node {
	private children: Node[] = [];

	addChild(node: Node): void {
		node.setParent(this);
		this.children.push(node);
	}

	getChildren(): Node[] {
		return [...this.children];
	}

	accept(visitor: CanvasElementVisitor): void {
		visitor.visitChapter?.(this);
		for (const child of this.children) {
			child.accept(visitor);
		}
	}
}

export class Notebook extends Node {
	private elements: CanvasElement[] = [];

	addElement(element: CanvasElement): void {
		element.setParent(this);
		this.elements.push(element);
	}

	getElements(): CanvasElement[] {
		return [...this.elements];
	}

	accept(visitor: CanvasElementVisitor): void {
		visitor.visitNotebook?.(this);
		for (const element of this.elements) {
			element.accept(visitor);
		}
	}
}

export abstract class CanvasElement extends Node {
	// Every canvas element carries a z-index and an optional bounding box from
	// the WASM engine; narrowing the record here surfaces typed accessors in all
	// subclasses without repeating them.
	protected declare record: NodeRecord & { metadata: BoundedElementMetadata };

	get zIndex(): number {
		return this.record.metadata.z_index;
	}

	get minX(): number {
		return this.record.metadata.min_x ?? 0;
	}

	get minY(): number {
		return this.record.metadata.min_y ?? 0;
	}

	get maxX(): number {
		return this.record.metadata.max_x ?? 0;
	}

	get maxY(): number {
		return this.record.metadata.max_y ?? 0;
	}

	accept(visitor: CanvasElementVisitor): void {
		visitor.visitElement(this);
	}
}

export class StrokeElement extends CanvasElement {
	protected declare record: NodeRecord & { metadata: StrokeMetadata };

	get points(): number[] {
		return this.record.metadata.points;
	}
}

export class ImageElement extends CanvasElement {
	protected declare record: NodeRecord & { metadata: ImageMetadata };

	get src(): string {
		return this.record.metadata.src;
	}
}

export class TextElement extends CanvasElement {
	protected declare record: NodeRecord & { metadata: TextMetadata };

	get content(): string {
		return this.record.metadata.content;
	}
}
