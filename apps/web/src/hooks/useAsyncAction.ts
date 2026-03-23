import { useState } from "react";
import { removeNotification, showNotification } from "../store/notificationStore";

export function useAsyncAction<T extends (...args: any[]) => Promise<any>>(
    action: T,
    options: {
        loadingMessage?: string;
        successMessage?: string;
        errorMessage?: string;
    } = {},
) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = async (...args: Parameters<T>): Promise<ReturnType<T> | undefined> => {
        setIsLoading(true);
        setError(null);

        let loadingId: string | undefined;
        if (options.loadingMessage) {
            loadingId = showNotification(options.loadingMessage, "loading");
        }

        try {
            const result = await action(...args);
            if (options.successMessage) {
                showNotification(options.successMessage, "success");
            }
            return result;
        } catch (err: any) {
            const msg = options.errorMessage || err.message || "Action failed";
            showNotification(msg, "error");
            setError(err);
            throw err;
        } finally {
            setIsLoading(false);
            if (loadingId) {
                removeNotification(loadingId);
            }
        }
    };

    return { execute, isLoading, error };
}
