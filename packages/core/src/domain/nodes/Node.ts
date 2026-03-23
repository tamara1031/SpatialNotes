import {
	type CanvasElementVisitor,
	CircularReferenceError,
	type EncryptionStrategy,
	type NodeRecord,
} from "../types";
import { NodeDeletedEvent, NodeRenamedEvent } from "./events";

export abstract class Node {
	protected parent: Node | null = null;
	private _domainEvents: any[] = [];

	constructor(protected record: NodeRecord) {}

	get domainEvents(): any[] {
		return [...this._domainEvents];
	}

	clearDomainEvents(): void {
		this._domainEvents = [];
	}

	protected addDomainEvent(event: any): void {
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
		// Note: Validation should be done in UseCase or via a domain service if complex
		this.record.parentId = newParentId;
		this.record.updatedAt = Date.now();
	}

	delete(): void {
		this.record.isDeleted = true;
		this.record.updatedAt = Date.now();
		this.addDomainEvent(new NodeDeletedEvent({ id: this.id }));
	}

	markDeleted(): void {
		this.delete();
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
	get zIndex(): number {
		return this.record.metadata.z_index || 0;
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
	get points(): number[] {
		return this.record.metadata.points || [];
	}
}

export class ImageElement extends CanvasElement {
	get src(): string {
		return this.record.metadata.src || "";
	}
}

export class TextElement extends CanvasElement {
	get content(): string {
		return this.record.metadata.content || "";
	}
}
