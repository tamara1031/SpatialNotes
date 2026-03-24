import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import {
	$appState,
	$currentUserEmail,
	logout,
	signin,
} from "../store/vaultStore";

export const VaultUnlockOverlay: React.FC = () => {
	const appState = useStore($appState);
	const email = useStore($currentUserEmail);
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (appState !== "locked") return null;

	const handleUnlock = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		try {
			await signin(password);
		} catch (err) {
			const error = err as Error;
			setError(error.message || "Failed to unlock vault");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<AnimatePresence>
			<motion.div
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				exit={{ opacity: 0 }}
				style={{
					position: "fixed",
					inset: 0,
					zIndex: 1000,
					background: "rgba(10, 10, 10, 0.85)",
					backdropFilter: "blur(10px)",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<motion.div
					initial={{ scale: 0.9, opacity: 0 }}
					animate={{ scale: 1, opacity: 1 }}
					style={{
						background: "rgba(255, 255, 255, 0.05)",
						border: "1px solid rgba(255, 255, 255, 0.1)",
						padding: "2.5rem",
						borderRadius: "1.5rem",
						width: "100%",
						maxWidth: "400px",
						textAlign: "center",
					}}
				>
					<div style={{ marginBottom: "1.5rem", fontSize: "3rem" }}>🔒</div>
					<h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>
						Vault Locked
					</h2>
					<p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "2rem" }}>
						Welcome back, <strong>{email}</strong>.
						<br />
						Enter your master password to decrypt your notes.
					</p>

					<form onSubmit={handleUnlock}>
						<input
							type="password"
							placeholder="Master Password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							style={{
								width: "100%",
								background: "rgba(0,0,0,0.3)",
								border: "1px solid rgba(255,255,255,0.1)",
								padding: "1rem",
								borderRadius: "0.75rem",
								color: "#fff",
								marginBottom: "1rem",
								fontSize: "1rem",
								outline: "none",
							}}
						/>

						{error && (
							<div
								style={{
									color: "#ff4b4b",
									marginBottom: "1rem",
									fontSize: "0.9rem",
								}}
							>
								{error}
							</div>
						)}

						<button
							type="submit"
							disabled={isLoading || !password}
							style={{
								width: "100%",
								background: "#fff",
								color: "#000",
								border: "none",
								padding: "1rem",
								borderRadius: "0.75rem",
								fontWeight: "bold",
								fontSize: "1rem",
								cursor: "pointer",
								opacity: isLoading || !password ? 0.5 : 1,
								transition: "opacity 0.2s",
							}}
						>
							{isLoading ? "Decrypting..." : "Unlock Vault"}
						</button>
					</form>

					<button
						type="button"
						onClick={() => logout()}
						style={{
							marginTop: "1.5rem",
							background: "none",
							border: "none",
							color: "var(--text-muted)",
							fontSize: "0.85rem",
							cursor: "pointer",
							textDecoration: "underline",
						}}
					>
						Sign out / Use another account
					</button>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};
