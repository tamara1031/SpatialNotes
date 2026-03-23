import { $sessionToken } from "../store/vaultStore";

export const api = {
	async pushUpdate(nodeId: string, payload: Uint8Array) {
		const chunk_size = 0x8000;
		let binary = "";
		for (let i = 0; i < payload.length; i += chunk_size) {
			binary += String.fromCharCode.apply(
				null,
				payload.subarray(i, i + chunk_size) as unknown as number[],
			);
		}
		const base64Payload = btoa(binary);

		const token = $sessionToken.get();
		const resp = await fetch(`/api/nodes/${nodeId}/updates`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
			body: JSON.stringify({
				payload: base64Payload,
			}),
		});

		if (!resp.ok) {
			throw new Error(`Failed to push update: ${resp.statusText}`);
		}
	},

	async listNodes(): Promise<any[]> {
		const token = $sessionToken.get();
		const resp = await fetch("/api/nodes", {
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});
		if (!resp.ok) {
			throw new Error(`Failed to list nodes: ${resp.statusText}`);
		}
		return resp.json();
	},

	async getUpdates(nodeId: string): Promise<Uint8Array[]> {
		const token = $sessionToken.get();
		const resp = await fetch(`/api/nodes/${nodeId}/updates`, {
			headers: {
				...(token ? { Authorization: `Bearer ${token}` } : {}),
			},
		});
		if (!resp.ok) {
			throw new Error(`Failed to get updates: ${resp.statusText}`);
		}

		const updates: { payload: string }[] = await resp.json();
		return updates.map((u) => {
			const binary = atob(u.payload);
			return Uint8Array.from(binary, (c) => c.charCodeAt(0));
		});
	},
};
