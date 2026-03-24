import type { NodeRecord } from "@spatial-notes/core";
import type React from "react";
import { memo, useState } from "react";
import {
	ChapterIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	FileIcon,
	TrashIcon,
} from "../shared/Icons";

export interface TreeNode extends NodeRecord {
	children: TreeNode[];
}

/* ─── Drop Indicator ─── */
const DropIndicator: React.FC<{ isVisible: boolean }> = ({ isVisible }) => (
	<div
		style={{
			height: "2px",
			background: isVisible ? "var(--accent)" : "transparent",
			borderRadius: "1px",
			margin: "0 12px",
			transition: "background 0.15s",
		}}
	/>
);

/* ─── NodeItem ─── */
export const SidebarNodeItem = memo<{
	node: TreeNode;
	level: number;
	activeId: string | null;
	onSelect: (id: string) => void;
	onDelete: (id: string) => void;
	onRename: (id: string, name: string) => void;
	onMove: (id: string, targetParentId: string | null) => void;
}>(({ node, level, activeId, onSelect, onDelete, onRename, onMove }) => {
	const isSelected = activeId === node.id;
	const isChapter = node.type === "CHAPTER";
	const isNotebook = node.type === "NOTEBOOK";
	const canHaveChildren = isChapter || isNotebook;
	const [isEditing, setIsEditing] = useState(false);
	const [editedName, setEditedName] = useState(node.name || "");
	const [isDragOver, setIsDragOver] = useState(false);
	const [dropPosition, setDropPosition] = useState<
		"above" | "inside" | "below" | null
	>(null);
	const [isExpanded, setIsExpanded] = useState(true);

	const handleCommit = () => {
		const name = (editedName || "").trim();
		if (name && name !== node.name) {
			onRename(node.id, name);
		}
		setIsEditing(false);
	};

	const handleDragStart = (e: React.DragEvent) => {
		if (isEditing) {
			e.preventDefault();
			return;
		}
		e.dataTransfer.setData("application/spatial-node-id", node.id);
		e.dataTransfer.effectAllowed = "move";
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		e.dataTransfer.dropEffect = "move";

		const rect = e.currentTarget.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const height = rect.height;

		if (canHaveChildren) {
			if (y < height * 0.25) setDropPosition("above");
			else if (y > height * 0.75) setDropPosition("below");
			else setDropPosition("inside");
		} else {
			setDropPosition(y < height * 0.5 ? "above" : "below");
		}
		setIsDragOver(true);
	};

	const handleDragLeave = () => {
		setIsDragOver(false);
		setDropPosition(null);
	};

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragOver(false);
		const draggedId = e.dataTransfer.getData("application/spatial-node-id");
		if (!draggedId || draggedId === node.id) {
			setDropPosition(null);
			return;
		}

		if (dropPosition === "inside" && canHaveChildren) {
			onMove(draggedId, node.id);
		} else {
			onMove(draggedId, node.parentId);
		}
		setDropPosition(null);
	};

	const toggleExpand = (e: React.MouseEvent) => {
		e.stopPropagation();
		setIsExpanded(!isExpanded);
	};

	return (
		<div>
			{isDragOver && dropPosition === "above" && <DropIndicator isVisible />}
			<button
				type="button"
				draggable={!isEditing}
				onDragStart={handleDragStart}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				onClick={() => onSelect(node.id)}
				onDoubleClick={(e) => {
					e.stopPropagation();
					setIsEditing(true);
					setEditedName(node.name || "");
				}}
				style={{
					display: "flex",
					width: "calc(100% - 12px)",
					border: "none",
					textAlign: "left",
					alignItems: "center",
					gap: "8px",
					padding: "7px 12px",
					paddingLeft: `${12 + level * 20}px`,
					borderRadius: "var(--radius-sm)",
					cursor: isEditing ? "text" : "pointer",
					backgroundColor:
						isDragOver && dropPosition === "inside"
							? "var(--accent-subtle)"
							: isSelected
								? "var(--accent-subtle)"
								: "transparent",
					color: isSelected ? "var(--accent)" : "var(--text-primary)",
					transition: "background 0.15s, color 0.15s",
					margin: "1px 6px",
					userSelect: isEditing ? "text" : "none",
					position: "relative",
				}}
			>
				{canHaveChildren ? (
					<button
						type="button"
						onClick={toggleExpand}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								toggleExpand(e as any);
							}
						}}
						style={{
							display: "flex",
							border: "none",
							background: "none",
							padding: 0,
							cursor: "pointer",
							opacity: 0.5,
							flexShrink: 0,
						}}
					>
						{isExpanded ? (
							<ChevronDownIcon size={14} />
						) : (
							<ChevronRightIcon size={14} />
						)}
					</button>
				) : (
					<span style={{ width: "14px", flexShrink: 0 }} />
				)}

				<span
					style={{
						display: "flex",
						flexShrink: 0,
						opacity: isSelected ? 1 : 0.6,
					}}
				>
					{isChapter ? <ChapterIcon size={16} /> : <FileIcon size={16} />}
				</span>

				{isEditing ? (
					<input
						value={editedName}
						onChange={(e) => setEditedName(e.target.value)}
						onBlur={handleCommit}
						onKeyDown={(e) => {
							if (e.key === "Enter") handleCommit();
							if (e.key === "Escape") {
								setIsEditing(false);
								setEditedName(node.name || "");
							}
						}}
						onClick={(e) => e.stopPropagation()}
						style={{
							flex: 1,
							minWidth: 0,
							background: "var(--surface-raised)",
							color: "var(--text-primary)",
							border: "1px solid var(--accent)",
							borderRadius: "var(--radius-sm)",
							padding: "2px 6px",
							fontSize: "13px",
							outline: "none",
						}}
					/>
				) : (
					<span
						style={{
							flex: 1,
							minWidth: 0,
							fontSize: "13px",
							fontWeight: isSelected ? 500 : 400,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
							color: "inherit",
						}}
					>
						{node.name}
					</span>
				)}

				{isSelected && !isEditing && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation();
							onDelete(node.id);
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								e.stopPropagation();
								onDelete(node.id);
							}
						}}
						title="Delete node"
						style={{
							display: "flex",
							border: "none",
							background: "none",
							padding: 0,
							cursor: "pointer",
							opacity: 0.4,
							transition: "opacity 0.15s",
							flexShrink: 0,
						}}
						onMouseOver={(e) => {
							(e.currentTarget as HTMLElement).style.opacity = "0.8";
						}}
						onMouseOut={(e) => {
							(e.currentTarget as HTMLElement).style.opacity = "0.4";
						}}
						onFocus={(e) => {
							(e.currentTarget as HTMLElement).style.opacity = "0.8";
						}}
						onBlur={(e) => {
							(e.currentTarget as HTMLElement).style.opacity = "0.4";
						}}
					>
						<TrashIcon size={14} color="var(--danger)" />
					</button>
				)}
			</button>

			{isDragOver && dropPosition === "below" && <DropIndicator isVisible />}

			{canHaveChildren &&
				isExpanded &&
				node.children.map((child) => (
					<SidebarNodeItem
						key={child.id}
						node={child}
						level={level + 1}
						activeId={activeId}
						onSelect={onSelect}
						onDelete={onDelete}
						onRename={onRename}
						onMove={onMove}
					/>
				))}
		</div>
	);
});
