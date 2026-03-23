import { useStore } from "@nanostores/react";
import { AnimatePresence, motion } from "framer-motion";
import type React from "react";
import {
	$notifications,
	removeNotification,
} from "../../store/notificationStore";

export const NotificationIsland: React.FC = () => {
	const notifications = useStore($notifications);

	const handleUndo = (n: any) => {
		if (n.onUndo) n.onUndo();
		removeNotification(n.id);
	};

	return (
		<div
			style={{
				position: "fixed",
				bottom: "24px",
				left: "50%",
				transform: "translateX(-50%)",
				display: "flex",
				flexDirection: "column",
				gap: "8px",
				zIndex: 1000,
				pointerEvents: "none",
			}}
		>
			<AnimatePresence>
				{notifications.map((n) => (
					<motion.div
						key={n.id}
						initial={{ opacity: 0, y: 20, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, scale: 0.95 }}
						style={{
							background: "var(--surface-overlay)",
							backdropFilter: "blur(20px)",
							border: "1px solid var(--glass-border)",
							borderRadius: "var(--radius-md)",
							padding: "12px 20px",
							display: "flex",
							alignItems: "center",
							gap: "16px",
							boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
							pointerEvents: "auto",
							minWidth: "300px",
						}}
					>
						<span
							style={{
								color: "var(--text-primary)",
								fontSize: "14px",
								flex: 1,
							}}
						>
							{n.message}
						</span>
						{n.onUndo && (
							<button
								onClick={() => handleUndo(n)}
								style={{
									background: "none",
									border: "none",
									color: "var(--accent)",
									fontSize: "13px",
									fontWeight: 600,
									cursor: "pointer",
									padding: "4px 8px",
									borderRadius: "4px",
									transition: "background 0.15s",
								}}
								onMouseOver={(e) =>
									(e.currentTarget.style.background = "var(--accent-subtle)")
								}
								onMouseOut={(e) => (e.currentTarget.style.background = "none")}
							>
								Undo
							</button>
						)}
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
};
