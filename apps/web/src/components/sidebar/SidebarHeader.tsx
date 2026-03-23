import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useState } from "react";
import { lockVault } from "../../store/vaultStore";
import { ChapterIcon, FileIcon, PlusIcon, SearchIcon } from "../shared/Icons";

export const SidebarHeader: React.FC<{
	onCreateNode: (type: "CHAPTER" | "NOTEBOOK") => void;
	onSearch: (query: string) => void;
	searchQuery: string;
}> = ({ onCreateNode, onSearch, searchQuery }) => {
	const [showCreateMenu, setShowCreateMenu] = useState(false);

	return (
		<div
			style={{
				padding: "16px 16px 12px",
				display: "flex",
				flexDirection: "column",
				gap: "12px",
				borderBottom: "1px solid var(--glass-border)",
			}}
		>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<span
					style={{
						fontSize: "14px",
						fontWeight: 600,
						letterSpacing: "0.02em",
						color: "var(--text-primary)",
					}}
				>
					Notebooks
				</span>
				<div style={{ display: "flex", gap: "8px" }}>
					<button
						onClick={() => lockVault()}
						title="Lock Vault"
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: "28px",
							height: "28px",
							border: "1px solid var(--glass-border)",
							background: "var(--surface-raised)",
							color: "var(--text-secondary)",
							borderRadius: "var(--radius-sm)",
							cursor: "pointer",
							transition: "color 0.15s, border-color 0.15s",
						}}
					>
						🔒
					</button>
					<div style={{ position: "relative" }}>
						<button
							onClick={() => setShowCreateMenu(!showCreateMenu)}
							title="Create new"
							style={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								width: "28px",
								height: "28px",
								border: "1px solid var(--glass-border)",
								background: "var(--surface-raised)",
								color: "var(--text-secondary)",
								borderRadius: "var(--radius-sm)",
								cursor: "pointer",
								transition: "color 0.15s, border-color 0.15s",
							}}
						>
							<PlusIcon size={16} />
						</button>
						<AnimatePresence>
							{showCreateMenu && (
								<motion.div
									initial={{ opacity: 0, y: -4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: -4 }}
									style={{
										position: "absolute",
										top: "100%",
										right: 0,
										marginTop: "4px",
										background: "var(--surface-overlay)",
										backdropFilter: "blur(20px)",
										border: "1px solid var(--glass-border)",
										borderRadius: "var(--radius-md)",
										padding: "4px",
										minWidth: "160px",
										zIndex: 200,
										boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
									}}
								>
									{[
										{
											type: "CHAPTER" as const,
											icon: <ChapterIcon size={14} />,
											label: "New Chapter",
										},
										{
											type: "NOTEBOOK" as const,
											icon: <FileIcon size={14} />,
											label: "New Notebook",
										},
									].map((item) => (
										<button
											key={item.type}
											onClick={() => {
												onCreateNode(item.type);
												setShowCreateMenu(false);
											}}
											style={{
												display: "flex",
												alignItems: "center",
												gap: "8px",
												width: "100%",
												padding: "8px 12px",
												background: "none",
												border: "none",
												color: "var(--text-primary)",
												fontSize: "13px",
												cursor: "pointer",
												borderRadius: "var(--radius-sm)",
												transition: "background 0.15s",
											}}
											onMouseOver={(e) => {
												(e.currentTarget as HTMLElement).style.background =
													"var(--accent-subtle)";
											}}
											onMouseOut={(e) => {
												(e.currentTarget as HTMLElement).style.background =
													"none";
											}}
										>
											{item.icon}
											{item.label}
										</button>
									))}
								</motion.div>
							)}
						</AnimatePresence>
					</div>
				</div>
			</div>

			<div style={{ position: "relative" }}>
				<div
					style={{
						position: "absolute",
						left: "10px",
						top: "50%",
						transform: "translateY(-50%)",
						color: "var(--text-muted)",
						pointerEvents: "none",
						display: "flex",
					}}
				>
					<SearchIcon size={14} />
				</div>
				<input
					type="text"
					placeholder="Search notes..."
					value={searchQuery}
					onChange={(e) => onSearch(e.target.value)}
					style={{
						width: "100%",
						padding: "8px 12px 8px 32px",
						fontSize: "13px",
						background: "var(--surface-sunken)",
						border: "1px solid var(--glass-border)",
						borderRadius: "var(--radius-md)",
						color: "var(--text-primary)",
						outline: "none",
						transition: "border-color 0.2s",
					}}
					onFocus={(e) => {
						e.currentTarget.style.borderColor = "var(--accent-primary)";
					}}
					onBlur={(e) => {
						e.currentTarget.style.borderColor = "var(--glass-border)";
					}}
				/>
			</div>
		</div>
	);
};
