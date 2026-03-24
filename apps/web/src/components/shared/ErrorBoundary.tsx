import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
	children?: ReactNode;
	fallback?: ReactNode;
}

interface State {
	hasError: boolean;
	error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
	public state: State = {
		hasError: false,
		error: null,
	};

	public static getDerivedStateFromError(error: Error): State {
		return { hasError: true, error };
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
		console.error("Uncaught error:", error, errorInfo);
	}

	public render() {
		if (this.state.hasError) {
			return (
				this.props.fallback || (
					<div
						style={{
							padding: "2rem",
							color: "var(--text-primary)",
							background: "var(--surface)",
							height: "100vh",
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<h2>Something went wrong.</h2>
						<details
							style={{
								whiteSpace: "pre-wrap",
								marginTop: "1rem",
								color: "var(--text-muted)",
							}}
						>
							{this.state.error?.toString()}
						</details>
						<button
							onClick={() => window.location.reload()}
							style={{
								marginTop: "2rem",
								padding: "0.5rem 1rem",
								background: "var(--accent)",
								color: "white",
								border: "none",
								borderRadius: "4px",
								cursor: "pointer",
							}}
						>
							Reload Application
						</button>
					</div>
				)
			);
		}

		return this.props.children;
	}
}
