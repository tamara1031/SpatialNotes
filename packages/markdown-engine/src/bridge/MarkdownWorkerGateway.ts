import { WorkerRpcClient } from "engine-core";

export class MarkdownWorkerGateway extends WorkerRpcClient {
	constructor() {
		super(new URL("./MarkdownWorker.ts", import.meta.url));
	}

	async init(): Promise<void> {
		return this.request("INIT");
	}

	async parseMarkdown(markdown: string): Promise<unknown[]> {
		return this.request<unknown[]>("PARSE_MARKDOWN", { markdown });
	}

	async renderHtml(markdown: string): Promise<string> {
		return this.request<string>("RENDER_HTML", { markdown });
	}
}
