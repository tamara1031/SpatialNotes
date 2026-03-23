import init, { markdown_to_html, parse_to_blocks } from "markdown-wasm";

self.onmessage = async (e: MessageEvent) => {
	const { type, payload, id } = e.data;

	try {
		switch (type) {
			case "INIT":
				await init();
				self.postMessage({ type: "DONE", id });
				break;

			case "PARSE_MARKDOWN": {
				const blocks = parse_to_blocks(payload.markdown);
				self.postMessage({ type: "DONE", id, payload: blocks });
				break;
			}

			case "RENDER_HTML": {
				const html = markdown_to_html(payload.markdown);
				self.postMessage({ type: "DONE", id, payload: html });
				break;
			}
		}
	} catch (error) {
		self.postMessage({ type: "ERROR", id, error: (error as Error).message });
	}
};
