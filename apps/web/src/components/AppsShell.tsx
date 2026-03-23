import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import { useEffect, useState } from "react";
import { checkVaultStatus } from "../store/vaultStore";
import { VaultSetupOverlay } from "./setup/VaultSetupOverlay";
import { VaultEmailOverlay } from "./VaultEmailOverlay";
import { VaultUnlockOverlay } from "./VaultUnlockOverlay";

export const AppsShell: React.FC<{
	sidebar?: React.ReactNode;
	content?: React.ReactNode;
}> = ({ sidebar, content }) => {
	const [isInitialized, setIsInitialized] = useState(false);

	useEffect(() => {
		checkVaultStatus().finally(() => {
			setIsInitialized(true);
		});
	}, []);

	return (
		<>
			<VaultEmailOverlay />
			<VaultSetupOverlay />
			<VaultUnlockOverlay />
			<AnimatePresence>
				{!isInitialized && (
					<motion.div
						initial={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						style={{
							position: "fixed",
							inset: 0,
							zIndex: 1000,
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
			<div className="main-shell">
				<aside className="sidebar">{sidebar}</aside>
				<main className="content">{content}</main>
			</div>
		</>
	);
};
