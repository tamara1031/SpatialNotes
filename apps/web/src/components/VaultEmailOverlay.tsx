import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import { $appState, identifyUser } from "../store/vaultStore";

export const VaultEmailOverlay: React.FC = () => {
	const appState = useStore($appState);
	const [email, setEmail] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (appState !== "email") return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		console.log("[VaultEmailOverlay] Submitting email:", email);
		if (!email.includes("@")) return;
		setIsLoading(true);
		setError(null);
		try {
			await identifyUser(email);
		} catch (err: any) {
			console.error("[VaultEmailOverlay] Error:", err);
			setError(err.message || "Failed to identify user");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			style={{
				position: "fixed",
				inset: 0,
				zIndex: 1100, // Higher than loading screen
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
				<div style={{ marginBottom: "1.5rem", fontSize: "3rem" }}>✨</div>
				<h2 style={{ color: "#fff", marginBottom: "0.5rem" }}>SpatialNotes</h2>
				<p
					style={{
						color: "rgba(255,255,255,0.5)",
						marginBottom: "2rem",
						fontSize: "0.9rem",
					}}
				>
					Enter your email to continue.
				</p>

				<form onSubmit={handleSubmit} data-testid="email-form">
					<input
						type="email"
						placeholder="Email Address"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
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
						disabled={isLoading}
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
							opacity: isLoading ? 0.5 : 1,
							transition: "opacity 0.2s",
						}}
					>
						{isLoading ? "Checking..." : "Continue"}
					</button>
				</form>
			</motion.div>
		</div>
	);
};
