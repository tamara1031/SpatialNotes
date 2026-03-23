import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import { $currentUser, authService } from "../store/vaultStore";

export const UserSelector: React.FC = () => {
	const currentUser = useStore($currentUser);
	const [isExpanded, setIsExpanded] = useState(false);
	const [email, setEmail] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		if (email.trim()) {
			await authService.login(email.trim());
			setEmail("");
			setIsExpanded(false);
		}
	};

	const handleLogout = () => {
		authService.logout();
		setIsExpanded(false);
	};

	return (
		<div style={{ position: "relative" }}>
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				style={{
					padding: "8px 12px",
					borderRadius: "var(--radius-md)",
					background: "var(--glass-bg)",
					border: "1px solid var(--glass-border)",
					color: "var(--text-primary)",
					fontSize: "14px",
					display: "flex",
					alignItems: "center",
					gap: "8px",
					cursor: "pointer",
				}}
			>
				<div
					style={{
						width: 8,
						height: 8,
						borderRadius: "50%",
						background: currentUser ? "#4ade80" : "#94a3b8",
					}}
				/>
				{currentUser?.username || "Guest"}
			</button>

			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 10 }}
						style={{
							position: "absolute",
							top: "100%",
							right: 0,
							marginTop: "8px",
							background: "var(--surface-base)",
							border: "1px solid var(--border-subtle)",
							borderRadius: "var(--radius-md)",
							padding: "12px",
							boxShadow: "var(--shadow-lg)",
							zIndex: 1000,
							minWidth: "200px",
						}}
					>
						{!currentUser ? (
							<form
								onSubmit={handleLogin}
								style={{ display: "flex", flexDirection: "column", gap: "8px" }}
							>
								<input
									type="email"
									placeholder="Enter Email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									style={{
										padding: "8px",
										background: "var(--surface-raised)",
										border: "1px solid var(--border-subtle)",
										borderRadius: "var(--radius-sm)",
										color: "var(--text-primary)",
									}}
								/>
								<button
									type="submit"
									style={{
										padding: "8px",
										background: "var(--accent)",
										color: "white",
										border: "none",
										borderRadius: "var(--radius-sm)",
										cursor: "pointer",
									}}
								>
									Login
								</button>
							</form>
						) : (
							<div
								style={{ display: "flex", flexDirection: "column", gap: "8px" }}
							>
								<div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
									Logged in as
								</div>
								<div style={{ fontWeight: 500, color: "var(--text-primary)" }}>
									{currentUser.username}
								</div>
								<button
									type="button"
									onClick={handleLogout}
									style={{
										marginTop: "8px",
										padding: "8px",
										background: "var(--surface-raised)",
										color: "var(--danger)",
										border: "1px solid var(--border-subtle)",
										borderRadius: "var(--radius-sm)",
										cursor: "pointer",
									}}
								>
									Logout
								</button>
							</div>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
};
