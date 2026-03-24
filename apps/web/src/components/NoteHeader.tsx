import type { EncryptionStrategy } from "@spatial-notes/core";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";

export type SyncStatus = "saved" | "unsaved" | "saving";

export interface NoteHeaderProps {
	name: string | null;
	updatedAt: number | null;
	syncStatus: SyncStatus;
	encryptionStrategy: EncryptionStrategy;
	onSave: () => void;
	onEncryptionChange: (strategy: EncryptionStrategy) => void;
}

export const NoteHeader: React.FC<NoteHeaderProps> = ({
	name,
	updatedAt,
	syncStatus,
	encryptionStrategy,
	onSave,
	onEncryptionChange,
}) => {
	const formatTime = (ts: number | null) => {
		if (!ts) return "";
		const d = new Date(ts);
		return (
			d.toLocaleDateString("en", { month: "short", day: "numeric" }) +
			" " +
			d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })
		);
	};

	return (
		<div
			style={{
				height: "var(--header-height)",
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				padding: "0 16px",
				borderBottom: "1px solid var(--glass-border)",
				flexShrink: 0,
				background: "var(--surface)",
				backdropFilter: "blur(20px)",
				zIndex: 100,
			}}
		>
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "8px",
					fontSize: "13px",
				}}
			>
				<span style={{ color: "var(--text-muted)" }}>Notebooks</span>
				<span style={{ color: "var(--text-muted)" }}>/</span>
				<span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
					{name || "Untitled"}
				</span>

				<AnimatePresence mode="wait">
					<motion.span
						key={syncStatus}
						initial={{ opacity: 0, y: -4 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: 4 }}
						transition={{ duration: 0.2 }}
						style={{
							fontSize: "11px",
							marginLeft: "12px",
							padding: "2px 8px",
							borderRadius: "4px",
							background:
								syncStatus === "unsaved"
									? "rgba(255, 152, 0, 0.1)"
									: syncStatus === "saving"
										? "rgba(33, 150, 243, 0.1)"
										: "rgba(76, 175, 80, 0.1)",
							color:
								syncStatus === "unsaved"
									? "#ff9800"
									: syncStatus === "saving"
										? "#2196f3"
										: "#4caf50",
						}}
					>
						{syncStatus === "unsaved"
							? "Unsaved changes"
							: syncStatus === "saving"
								? "Saving to Cloud..."
								: "Saved to Cloud"}
					</motion.span>
				</AnimatePresence>
			</div>
			<div
				style={{
					fontSize: "11px",
					color: "var(--text-muted)",
					display: "flex",
					alignItems: "center",
					gap: "16px",
				}}
			>
				{updatedAt && (
					<span style={{ opacity: 0.7 }}>
						Last edited {formatTime(updatedAt)}
					</span>
				)}

				<div
					style={{
						display: "flex",
						alignItems: "center",
						background: "rgba(255,255,255,0.05)",
						borderRadius: "6px",
						padding: "2px",
						border: "1px solid var(--glass-border)",
					}}
				>
					<button
						type="button"
						onClick={() => onEncryptionChange("STANDARD")}
						style={{
							padding: "4px 8px",
							background:
								encryptionStrategy === "STANDARD"
									? "var(--accent)"
									: "transparent",
							color:
								encryptionStrategy === "STANDARD"
									? "#fff"
									: "var(--text-muted)",
							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "10px",
							fontWeight: 600,
							transition: "all 0.2s",
						}}
					>
						STANDARD
					</button>
					<button
						type="button"
						onClick={() => onEncryptionChange("E2EE")}
						style={{
							padding: "4px 8px",
							background:
								encryptionStrategy === "E2EE" ? "#4caf50" : "transparent",
							color:
								encryptionStrategy === "E2EE" ? "#fff" : "var(--text-muted)",

							border: "none",
							borderRadius: "4px",
							cursor: "pointer",
							fontSize: "10px",
							fontWeight: 600,
							display: "flex",
							alignItems: "center",
							gap: "4px",
							transition: "all 0.2s",
						}}
					>
						{encryptionStrategy === "E2EE" && (
							<svg
								width="10"
								height="10"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="3"
								strokeLinecap="round"
								strokeLinejoin="round"
								role="img"
								aria-labelledby="lock-icon-title"
							>
								<title id="lock-icon-title">End-to-End Encryption Active</title>
								<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
								<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
							</svg>
						)}
						E2EE
					</button>
				</div>

				<button
					type="button"
					onClick={onSave}
					disabled={syncStatus === "saved" || syncStatus === "saving"}
					style={{
						padding: "6px 12px",
						background:
							syncStatus === "saved" || syncStatus === "saving"
								? "rgba(255,255,255,0.1)"
								: "var(--accent)",
						color:
							syncStatus === "saved" || syncStatus === "saving"
								? "rgba(255,255,255,0.5)"
								: "#fff",
						border: "none",
						borderRadius: "4px",
						cursor:
							syncStatus === "saved" || syncStatus === "saving"
								? "not-allowed"
								: "pointer",
						fontSize: "12px",
						fontWeight: 500,
						transition: "all 0.2s ease",
					}}
				>
					Save
				</button>
			</div>
		</div>
	);
};
