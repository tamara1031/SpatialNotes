import type { IStore } from "@spatial-notes/core";
import type { Map as YMap } from "yjs";

export class YjsStoreAdapter<T = any> implements IStore<T> {
    constructor(private readonly yMap: YMap<T>) { }

    get(key: string): T | undefined {
        return this.yMap.get(key);
    }

    set(key: string, value: T): void {
        this.yMap.set(key, value);
    }

    delete(key: string): void {
        this.yMap.delete(key);
    }

    has(key: string): boolean {
        return this.yMap.has(key);
    }

    keys(): string[] {
        return Array.from(this.yMap.keys());
    }

    transact(action: () => void, origin?: any): void {
        if (this.yMap.doc) {
            this.yMap.doc.transact(action, origin);
        } else {
            action();
        }
    }
}
