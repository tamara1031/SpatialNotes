import { useStore } from "@nanostores/react";
import {
	CreateNodeUseCase,
	DeleteNodeUseCase,
	MoveNodeUseCase,
	RenameNodeUseCase,
	YjsNodeRepository,
} from "@spatial-notes/core";
import type React from "react";
import { useMemo, useState } from "react";
import { useSync } from "../../hooks/useSync";
import { $activeNodeId, $nodeTree, type TreeNode } from "../../store/nodes";
import { showNotification } from "../../store/notificationStore";
import { $currentUser, vaultManager } from "../../store/vaultStore";
import { SidebarHeader } from "./SidebarHeader";
import { SidebarNodeItem } from "./SidebarNodeItem";

/* ─── SidebarView ─── */
export const SidebarView: React.FC = () => {
	const activeNodeId = useStore($activeNodeId);
	const tree = useStore($nodeTree);
	const [searchQuery, setSearchQuery] = useState("");

	const { doc } = useSync();
	const currentUser = useStore($currentUser as any);

	const filteredTree = useMemo(() => {
		if (!searchQuery) return tree;

		const filterTree = (items: TreeNode[]): TreeNode[] => {
			return items.reduce((acc: TreeNode[], item) => {
				const matches = (item.name || "")
					.toLowerCase()
					.includes(searchQuery.toLowerCase());
				const filteredChildren = filterTree(item.children || []);

				if (matches || filteredChildren.length > 0) {
					acc.push({ ...item, children: filteredChildren });
				}
				return acc;
			}, []);
		};

		return filterTree(tree);
	}, [tree, searchQuery]);

	const handleCreateNode = async (
		type: "CHAPTER" | "NOTEBOOK",
		metadata: any = {},
	) => {
		const name =
			type === "CHAPTER"
				? "New Chapter"
				: `New ${metadata.engineType === "MARKDOWN" ? "Markdown" : "Notebook"}`;

		const repository = new YjsNodeRepository(doc);
		const useCase = new CreateNodeUseCase(repository, vaultManager);

		const findNodeInTree = (
			nodes: TreeNode[],
			id: string,
		): TreeNode | undefined => {
			for (const node of nodes) {
				if (node.id === id) return node;
				if (node.children) {
					const found = findNodeInTree(node.children, id);
					if (found) return found;
				}
			}
			return undefined;
		};

		const activeNode = activeNodeId ? findNodeInTree(tree, activeNodeId) : null;
		const parentId = activeNode?.type === "CHAPTER" ? activeNodeId : null;

		try {
			await useCase.execute({
				name,
				type: type.toLowerCase() as "chapter" | "notebook",
				parentId,
				userId: currentUser?.id || "anonymous",
				metadata,
			});
			// Give the local nanostores a chance to update
			await new Promise((resolve) => setTimeout(resolve, 50));
		} catch (e) {
			showNotification(
				`Failed to create ${type.toLowerCase()}: ${e instanceof Error ? e.message : "Unknown error"}`,
			);
		}
	};

	const handleDeleteNode = async (id: string) => {
		if (!currentUser) return;
		const repository = new YjsNodeRepository(doc);
		const useCase = new DeleteNodeUseCase(repository);
		try {
			await useCase.execute({ id, userId: currentUser.id });
		} catch (e) {
			showNotification(
				`Failed to delete node: ${e instanceof Error ? e.message : "Unknown error"}`,
			);
		}
	};

	const handleRenameNode = async (id: string, name: string) => {
		const repository = new YjsNodeRepository(doc);
		const useCase = new RenameNodeUseCase(repository);
		try {
			await useCase.execute({ id, newName: name });
		} catch (e) {
			showNotification(
				`Failed to rename node: ${e instanceof Error ? e.message : "Unknown error"}`,
			);
		}
	};

	const handleMoveNode = async (id: string, targetParentId: string | null) => {
		const repository = new YjsNodeRepository(doc);
		const useCase = new MoveNodeUseCase(repository);
		try {
			await useCase.execute({ id, newParentId: targetParentId });
		} catch (e) {
			showNotification(
				`Failed to move node: ${e instanceof Error ? e.message : "Unknown error"}`,
			);
		}
	};

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<SidebarHeader
				onCreateNode={handleCreateNode}
				onSearch={setSearchQuery}
				searchQuery={searchQuery}
			/>

			<div
				role="group"
				aria-label="Notes list drop zone"
				style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}
				onDragOver={(e) => {
					e.preventDefault();
					e.dataTransfer.dropEffect = "move";
				}}
				onDrop={(e) => {
					e.preventDefault();
					const draggedId = e.dataTransfer.getData(
						"application/spatial-node-id",
					);
					if (draggedId) handleMoveNode(draggedId, null);
				}}
			>
				{filteredTree.length === 0 ? (
					<div
						style={{
							padding: "40px 20px",
							color: "var(--text-muted)",
							fontSize: "13px",
							textAlign: "center",
						}}
					>
						{searchQuery
							? "No matching notes found."
							: "No notebooks yet.\nClick + to create one."}
					</div>
				) : (
					filteredTree.map((node) => (
						<SidebarNodeItem
							key={node.id}
							node={node}
							level={0}
							activeId={activeNodeId}
							onSelect={(id) => $activeNodeId.set(id)}
							onDelete={handleDeleteNode}
							onRename={handleRenameNode}
							onMove={handleMoveNode}
						/>
					))
				)}
			</div>
		</div>
	);
};
