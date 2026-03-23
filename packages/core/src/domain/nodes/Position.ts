/**
 * Represents a point in a 2D coordinate system.
 * This class is immutable.
 */
export class Position {
	constructor(
		public readonly x: number,
		public readonly y: number,
	) {
		Object.freeze(this);
	}

	/**
	 * Checks if two positions are equal.
	 */
	equals(other: Position): boolean {
		return this.x === other.x && this.y === other.y;
	}
}
