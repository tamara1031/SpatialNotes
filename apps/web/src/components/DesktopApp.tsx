import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { $appState, checkVaultStatus } from "../store/vaultStore";
import { NoteViewShell } from "./NoteViewShell";
import { VaultSetupOverlay } from "./setup/VaultSetupOverlay";
import { SidebarView } from "./sidebar/SidebarView";
import { UserSelector } from "./UserSelector";
import { VaultEmailOverlay } from "./VaultEmailOverlay";
import { VaultUnlockOverlay } from "./VaultUnlockOverlay";

export const DesktopApp: React.FC = () => {
	const appState = useStore($appState);
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		checkVaultStatus().finally(() => {
			setIsInitialized(true);
		});
	}, []);

	if (!isInitialized) {
		return (
			<div style={{
				position: "fixed",
				inset: 0,
				background: "var(--surface)",
				color: "var(--text-muted)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center"
			}}>
				Connecting to Vault...
			</div>
		);
	}

	return (
		<div
			style={{
				width: "100vw",
				height: "100vh",
				overflow: "hidden",
				position: "relative",
				display: "flex",
				background: "var(--surface-base)",
			}}
		>
			<VaultEmailOverlay />
			<VaultSetupOverlay />
			<VaultUnlockOverlay />
			<UserSelector />

			<AnimatePresence>
				{!isInitialized && (
					<motion.div
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						style={{
							position: "fixed",
							inset: 0,
							zIndex: 2000,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							background: "var(--surface)",
							color: "var(--text-muted)",
						}}
					>
						Connecting to Vault...
					</motion.div>
				)}
			</AnimatePresence>

			<div
				className="main-shell"
				style={{ flex: 1, display: "flex", height: "100%" }}
			>
				<aside
					className="sidebar"
					style={{
						width: "280px",
						borderRight: "1px solid var(--glass-border)",
					}}
				>
					<SidebarView />
				</aside>
				<main className="content" style={{ flex: 1 }}>
					<NoteViewShell />
				</main>
			</div>
		</div>
	);
};
