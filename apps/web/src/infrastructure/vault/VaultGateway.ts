import type { IVaultAuthGateway, IVaultRegistryGateway } from "@spatial-notes/core";

export class VaultGateway implements IVaultRegistryGateway, IVaultAuthGateway {
    async register(data: any) {
        const res = await fetch("/api/auth/register/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                throw new Error(json.message || "Registration failed");
            } catch {
                throw new Error(text || "Registration failed");
            }
        }
        return await res.json();
    }

    async login(data: any) {
        const res = await fetch("/api/auth/login/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            const text = await res.text();
            try {
                const json = JSON.parse(text);
                throw new Error(json.message || "Login failed");
            } catch {
                throw new Error(text || "Login failed");
            }
        }
        return await res.json();
    }

    async getSalt(email: string) {
        const res = await fetch(
            `/api/auth/salt/?email=${encodeURIComponent(email)}`,
        );
        if (!res.ok) {
            const text = await res.text();
            throw new Error(text || `Server error: ${res.statusText}`);
        }
        return await res.json();
    }
}
