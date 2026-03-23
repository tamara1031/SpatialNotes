import { $sessionToken } from "../store/vaultStore";

export const api = {
	async pushUpdate(nodeId: string, payload: Uint8Array) {
		const base64Payload = btoa(
			Array.from(payload)
				.map((b) => String.fromCharCode(b))
				.join(""),
		);

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
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) {
				bytes[i] = binary.charCodeAt(i);
			}
			return bytes;
		});
	},
};
