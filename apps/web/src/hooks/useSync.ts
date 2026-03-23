import { useStore } from "@nanostores/react";
import { YjsNodeRepository } from "@spatial-notes/core";
import { useEffect, useState } from "react";
import type * as Y from "yjs";
import { elementsMap, nodesMap, undoManager, ydoc } from "../store/noteStore";
import { $currentUser } from "../store/vaultStore";
import { NanostoreNodePresenter } from "./presenters/NanostoreNodePresenter";

export const useSync = () => {
	const currentUser = useStore($currentUser as any);

	useEffect(() => {
		if (!currentUser) return;

		const repository = new YjsNodeRepository(ydoc);
		const presenter = new NanostoreNodePresenter();

		const syncNodes = async () => {
			const nodes = await repository.findAll(currentUser.id);
			presenter.presentNodes(nodes);
		};

		// Initial sync
		syncNodes();

		// Sync on every change
		nodesMap.observe(syncNodes);
		return () => nodesMap.unobserve(syncNodes);
	}, [currentUser]);

	return {
		ydoc: ydoc as any,
		doc: ydoc as any,
		elementsMap,
		nodesMap,
		undoManager,
	};
};

export const useSyncMap = <T>(yMap: Y.Map<T>) => {
	const [state, setState] = useState<Record<string, T>>(() => yMap.toJSON());

	useEffect(() => {
		const observer = () => {
			setState(yMap.toJSON());
		};
		yMap.observe(observer);
		// Sync after mount
		observer();

		return () => yMap.unobserve(observer);
	}, [yMap]);

	return state;
};
