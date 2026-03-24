import type { ElementFactory, EngineInterface } from "engine-core";
import { motion } from "framer-motion";
import type React from "react";
import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import { CanvasEngine } from "../index";
import {
	type CanvasElement,
	type CanvasEngineContext,
	type CanvasLayoutMode,
	type CanvasOrientation,
	CanvasTool,
	type CanvasViewport,
} from "../types";
import {
	EraserIcon,
	ExportIcon,
	LassoIcon,
	MarkerIcon,
	PenIcon,
	PickerIcon,
	RedoIcon,
	SettingsIcon,
	UndoIcon,
} from "./Icons";

/* ─── Sub-Components ─── */

const ToolButton: React.FC<{
	active: boolean;
	onClick: () => void;
	title: string;
	children: React.ReactNode;
	disabled?: boolean;
}> = ({ active, onClick, title, children, disabled }) => (
	<button
		onClick={onClick}
		title={title}
		disabled={disabled}
		style={{
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			width: "32px",
			height: "32px",
			border: "none",
			borderRadius: "8px",
			background: active ? "rgba(255,255,255,0.1)" : "transparent",
			color: active ? "white" : "rgba(255,255,255,0.5)",
			cursor: disabled ? "not-allowed" : "pointer",
			transition: "all 0.2s",
			opacity: disabled ? 0.3 : 1,
		}}
	>
		{children}
	</button>
);

const Sep: React.FC = () => (
	<div
		style={{
			width: 1,
			height: 16,
			background: "rgba(255,255,255,0.1)",
			margin: "0 4px",
		}}
	/>
);

/* ─── Main Component ─── */

const TOOL_CONFIG = [
	{ id: CanvasTool.PEN, icon: PenIcon, title: "Pen (P)" },
	{ id: CanvasTool.HIGHLIGHTER, icon: MarkerIcon, title: "Highlighter (H)" },
	{ id: CanvasTool.ERASER, icon: EraserIcon, title: "Eraser (E)" },
	{ id: CanvasTool.PICKER, icon: PickerIcon, title: "Picker (V)" },
	{ id: CanvasTool.SELECTOR, icon: LassoIcon, title: "Lasso (L)" },
];

export interface CanvasEngineUIProps {
	activeNodeId: string;
	elements: CanvasElement[];
	onCommand: (cmd: any) => void;
	onUndo?: () => void;
	onRedo?: () => void;
	canUndo: boolean;
	canRedo: boolean;
	elementFactory: ElementFactory;
}

export const CanvasEngineUI = forwardRef<HTMLDivElement, CanvasEngineUIProps>(
	(
		{
			activeNodeId,
			elements,
			onCommand,
			onUndo,
			onRedo,
			canUndo,
			canRedo,
			elementFactory,
		},
		ref,
	) => {
		const containerRef = useRef<HTMLDivElement>(null);
		const engineRef = useRef<EngineInterface<
			CanvasElement,
			CanvasTool,
			CanvasViewport,
			CanvasEngineContext
		> | null>(null);
		const [engineReady, setEngineReady] = useState(false);

		// Internal UI State
		const [activeTool, setActiveTool] = useState<CanvasTool>(CanvasTool.PEN);
		const [penConfig, setPenConfig] = useState({
			color: "#ffffff",
			width: 2.0,
		});
		const [highlighterConfig, setHighlighterConfig] = useState({
			color: "rgba(255,235,59,0.3)",
			width: 10.0,
		});
		const [layoutMode, _setLayoutMode] = useState<CanvasLayoutMode>("SINGLE");
		const [orientation, _setOrientation] =
			useState<CanvasOrientation>("PORTRAIT");
		const [showSettings, setShowSettings] = useState(false);

		useImperativeHandle(
			ref,
			() =>
				({
					handleKeyDown: (e: KeyboardEvent) => {
						return engineRef.current?.handleKeyDown?.(e) ?? false;
					},
					getState: () => {
						return engineRef.current?.getState?.();
					},
				}) as any,
		);

		// Keep stable references for callbacks
		const depsRef = useRef({ onCommand, onUndo, onRedo, elementFactory });
		useEffect(() => {
			depsRef.current = { onCommand, onUndo, onRedo, elementFactory };
		}, [onCommand, onUndo, onRedo, elementFactory]);

		// --- Engine Lifecycle ---
		useEffect(() => {
			if (!engineRef.current) {
				const PAGE_WIDTH_MM = 210;
				const PAGE_HEIGHT_MM = 297;
				const isLandscape = orientation === "LANDSCAPE";
				const totalWidthMm =
					layoutMode === "INFINITE"
						? 2000
						: isLandscape
							? PAGE_HEIGHT_MM
							: PAGE_WIDTH_MM;
				const totalHeightMm =
					layoutMode === "INFINITE"
						? 2000
						: isLandscape
							? PAGE_WIDTH_MM
							: PAGE_HEIGHT_MM;

				const engine = new CanvasEngine(
					totalWidthMm,
					totalHeightMm,
					depsRef.current.elementFactory,
				);
				engineRef.current = engine;

				engine.onAction?.((action: any) => {
					const { onCommand, onUndo, onRedo } = depsRef.current;
					if (action.type === "STATUS") {
						if (action.payload === "READY") setEngineReady(true);
						else setEngineReady(false);
					} else if (action.type === "UNDO") {
						onUndo?.();
					} else if (action.type === "REDO") {
						onRedo?.();
					} else {
						onCommand(action);
					}
				});
			}
		}, [layoutMode, orientation]);

		useEffect(() => {
			if (engineReady && engineRef.current && containerRef.current) {
				engineRef.current.mount(containerRef.current);
				return () => {
					engineRef.current?.destroy();
					engineRef.current = null;
					setEngineReady(false);
				};
			}
		}, [engineReady]);

		// --- Sync State to Engine ---
		useEffect(() => {
			if (engineReady && engineRef.current) {
				const isLandscape = orientation === "LANDSCAPE";
				const PAGE_WIDTH_MM = 210;
				const PAGE_HEIGHT_MM = 297;
				const totalWidthMm =
					layoutMode === "INFINITE"
						? 2000
						: isLandscape
							? PAGE_HEIGHT_MM
							: PAGE_WIDTH_MM;
				const totalHeightMm =
					layoutMode === "INFINITE"
						? 2000
						: isLandscape
							? PAGE_WIDTH_MM
							: PAGE_HEIGHT_MM;

				engineRef.current.update({
					context: {
						activeNodeId,
						pageSize: { width: totalWidthMm, height: totalHeightMm },
						layoutMode,
						penConfig,
						highlighterConfig,
						activeTool,
					} as any,
					elements: elements.filter((el) => el.parentId === activeNodeId),
				});
			}
		}, [
			engineReady,
			activeNodeId,
			elements,
			activeTool,
			penConfig,
			highlighterConfig,
			layoutMode,
			orientation,
		]);

		// --- Handlers ---
		const handleExport = () => {
			engineRef.current?.update({
				context: { command: "EXPORT_SVG" } as any,
			});
		};

		const renderPalette = () => {
			if (
				activeTool !== CanvasTool.PEN &&
				activeTool !== CanvasTool.HIGHLIGHTER
			)
				return null;
			const config =
				activeTool === CanvasTool.PEN ? penConfig : highlighterConfig;
			const setConfig =
				activeTool === CanvasTool.PEN ? setPenConfig : setHighlighterConfig;
			const colors =
				activeTool === CanvasTool.PEN
					? ["#ffffff", "#ff4a4a", "#4a9eff", "#76ff03", "#ffd600", "#ff6ec7"]
					: [
							"rgba(255,235,59,0.3)",
							"rgba(0,255,0,0.2)",
							"rgba(0,191,255,0.2)",
							"rgba(255,20,147,0.2)",
						];

			return (
				<motion.div
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "6px 12px",
						background: "rgba(30,30,30,0.8)",
						backdropFilter: "blur(20px)",
						borderRadius: "12px",
						border: "1px solid rgba(255,255,255,0.1)",
						position: "absolute",
						top: "56px",
						left: "50%",
						transform: "translateX(-50%)",
						boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
						zIndex: 200,
					}}
				>
					{colors.map((c) => (
						<div
							key={c}
							onClick={() => setConfig({ ...config, color: c })}
							style={{
								width: 14,
								height: 14,
								borderRadius: "50%",
								backgroundColor: c,
								outline:
									config.color === c
										? "2px solid rgba(255,255,255,0.8)"
										: "1px solid rgba(255,255,255,0.2)",
								cursor: "pointer",
								transform: config.color === c ? "scale(1.2)" : "scale(1)",
								transition: "all 0.15s",
								outlineOffset: "2px",
							}}
						/>
					))}
				</motion.div>
			);
		};

		const renderEraserOptions = () => {
			if (
				activeTool !== CanvasTool.ERASER &&
				activeTool !== CanvasTool.ERASER_PRECISION
			)
				return null;
			return (
				<motion.div
					initial={{ opacity: 0, y: -4 }}
					animate={{ opacity: 1, y: 0 }}
					style={{
						display: "flex",
						alignItems: "center",
						gap: "4px",
						padding: "4px 8px",
						background: "rgba(30,30,30,0.8)",
						backdropFilter: "blur(20px)",
						borderRadius: "12px",
						border: "1px solid rgba(255,255,255,0.1)",
						position: "absolute",
						top: "56px",
						left: "50%",
						transform: "translateX(-50%)",
						boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
						zIndex: 200,
					}}
				>
					<button
						onClick={() => setActiveTool(CanvasTool.ERASER)}
						style={{
							padding: "4px 8px",
							fontSize: "11px",
							border: "none",
							borderRadius: "6px",
							background:
								activeTool === CanvasTool.ERASER
									? "rgba(255,255,255,0.1)"
									: "transparent",
							color: "white",
							cursor: "pointer",
						}}
					>
						Standard
					</button>
					<button
						onClick={() => setActiveTool(CanvasTool.ERASER_PRECISION)}
						style={{
							padding: "4px 8px",
							fontSize: "11px",
							border: "none",
							borderRadius: "6px",
							background:
								activeTool === CanvasTool.ERASER_PRECISION
									? "rgba(255,255,255,0.1)"
									: "transparent",
							color: "white",
							cursor: "pointer",
						}}
					>
						Precision
					</button>
				</motion.div>
			);
		};

		return (
			<div
				ref={ref}
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "column",
					height: "100%",
					overflow: "hidden",
					background: "#121212",
					color: "white",
				}}
			>
				{/* Toolbar */}
				<div
					style={{
						height: "48px",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						gap: "2px",
						padding: "0 12px",
						borderBottom: "1px solid rgba(255,255,255,0.05)",
						position: "relative",
						zIndex: 100,
					}}
				>
					<div
						style={{
							display: "flex",
							background: "rgba(255,255,255,0.03)",
							borderRadius: "10px",
							padding: "4px",
							gap: "2px",
							border: "1px solid rgba(255,255,255,0.05)",
						}}
					>
						{TOOL_CONFIG.map((t) => (
							<ToolButton
								key={t.id}
								active={
									activeTool === t.id ||
									(t.id === CanvasTool.ERASER &&
										activeTool === CanvasTool.ERASER_PRECISION)
								}
								onClick={() => setActiveTool(t.id)}
								title={t.title}
							>
								<t.icon size={18} />
							</ToolButton>
						))}
					</div>

					<Sep />

					<div style={{ display: "flex", gap: "2px" }}>
						<ToolButton
							active={false}
							onClick={() => onUndo?.()}
							title="Undo"
							disabled={!canUndo}
						>
							<UndoIcon size={18} />
						</ToolButton>
						<ToolButton
							active={false}
							onClick={() => onRedo?.()}
							title="Redo"
							disabled={!canRedo}
						>
							<RedoIcon size={18} />
						</ToolButton>
					</div>

					<Sep />

					<ToolButton active={false} onClick={handleExport} title="Export">
						<ExportIcon size={18} />
					</ToolButton>

					<ToolButton
						active={showSettings}
						onClick={() => setShowSettings(!showSettings)}
						title="Settings"
					>
						<SettingsIcon size={18} />
					</ToolButton>
				</div>

				{renderPalette()}
				{renderEraserOptions()}

				{/* Board Area */}
				<div
					ref={containerRef}
					className="canvas-surface"
					style={{ flex: 1, overflow: "hidden", position: "relative" }}
				>
					{!activeNodeId && (
						<div
							style={{
								position: "absolute",
								inset: 0,
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								color: "rgba(255,255,255,0.2)",
								gap: 12,
							}}
						>
							<PenIcon size={48} />
							<span>Select a notebook to start writing</span>
						</div>
					)}
				</div>
			</div>
		);
	},
);

CanvasEngineUI.displayName = "CanvasEngineUI";
