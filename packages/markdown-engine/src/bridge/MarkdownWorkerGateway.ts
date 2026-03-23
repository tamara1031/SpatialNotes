export class MarkdownWorkerGateway {
	private worker?: Worker;
	private nextId = 0;
	private pendingRequests = new Map<
		number,
		{ resolve: (val: any) => void; reject: (err: any) => void }
	>();

	constructor() {
		if (typeof Worker !== "undefined") {
			this.worker = new Worker(
				new URL("./MarkdownWorker.ts", import.meta.url),
				{ type: "module" },
			);
			this.worker.onmessage = this.handleMessage.bind(this);
		}
	}

	private handleMessage(e: MessageEvent) {
		const { type, id, payload, error } = e.data;
		const request = this.pendingRequests.get(id);
		if (!request) return;

		if (type === "ERROR") {
			request.reject(new Error(error));
		} else {
			request.resolve(payload);
		}
		this.pendingRequests.delete(id);
	}

	private request(type: string, payload?: any): Promise<any> {
		if (!this.worker) {
			return Promise.resolve();
		}
		const id = this.nextId++;
		return new Promise((resolve, reject) => {
			this.pendingRequests.set(id, { resolve, reject });
			this.worker!.postMessage({ type, payload, id });
		});
	}

	async init(): Promise<void> {
		return this.request("INIT");
	}

	async parseMarkdown(markdown: string): Promise<any[]> {
		return this.request("PARSE_MARKDOWN", { markdown });
	}

	async renderHtml(markdown: string): Promise<string> {
		return this.request("RENDER_HTML", { markdown });
	}

	terminate(): void {
		this.worker?.terminate();
		this.worker = undefined;
	}
}
