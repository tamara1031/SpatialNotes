import { atom } from "nanostores";

export type NotificationType =
	| "info"
	| "success"
	| "warning"
	| "error"
	| "loading";

export interface Notification {
	id: string;
	message: string;
	type: NotificationType;
	progress?: number; // 0-100
	onUndo?: () => void;
}

export const $notifications = atom<Notification[]>([]);

export const removeNotification = (id: string) => {
	$notifications.set($notifications.get().filter((n) => n.id !== id));
};

export const showNotification = (
	message: string,
	type: NotificationType = "info",
	options?: { onUndo?: () => void; duration?: number },
) => {
	const id = Math.random().toString(36).substring(7);
	$notifications.set([
		...$notifications.get(),
		{ id, message, type, onUndo: options?.onUndo },
	]);

	if (type !== "loading" && options?.duration !== 0) {
		const duration = options?.duration || 5000;
		setTimeout(() => {
			removeNotification(id);
		}, duration);
	}
	return id;
};

export const updateNotificationProgress = (id: string, progress: number) => {
	const current = $notifications.get();
	const index = current.findIndex((n) => n.id === id);
	if (index !== -1) {
		const updated = [...current];
		updated[index] = { ...updated[index], progress };
		$notifications.set(updated);
	}
};
