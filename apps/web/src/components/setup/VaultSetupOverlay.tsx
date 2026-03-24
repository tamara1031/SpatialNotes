import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import { $appState, $currentUserEmail, signup } from "../../store/vaultStore";

export const VaultSetupOverlay: React.FC = () => {
	const appState = useStore($appState);
	const email = useStore($currentUserEmail);
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (appState !== "setup") return null;

	const handleSetup = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) return;
		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters long");
			return;
		}

		setIsLoading(true);
		setError(null);
		try {
			await signup(email, password);
		} catch (err: any) {
			setError(err.message || "Failed to setup vault");
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
					<div style={{ marginBottom: "1.5rem", fontSize: "3rem" }}>🗝️</div>
					<h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>
						Setup your Vault
					</h2>
					<p
						style={{
							color: "rgba(255,255,255,0.5)",
							marginBottom: "2rem",
							fontSize: "0.9rem",
						}}
					>
						Creating account for <strong>{email}</strong>.
						<br />
						Set a strong master password.{" "}
						<strong>
							If you lose this password, your data cannot be recovered.
						</strong>
					</p>

					<form onSubmit={handleSetup}>
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
						<input
							type="password"
							placeholder="Confirm Password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
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
							disabled={isLoading || !password || !confirmPassword}
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
								opacity: isLoading || !password || !confirmPassword ? 0.5 : 1,
								transition: "opacity 0.2s",
							}}
						>
							{isLoading ? "Setting up..." : "Create Account"}
						</button>
					</form>
				</motion.div>
			</motion.div>
		</AnimatePresence>
	);
};
