import type React from "react";
import { useState } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";

export interface AuthFormProps {
	/** Prefix used for `id` attributes to keep duplicated forms accessible. */
	idPrefix: string;
	submitLabel: string;
	loadingMessage: string;
	successMessage: string;
	errorMessage: string;
	onSubmit: (email: string, password: string) => Promise<void>;
	onSuccess: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({
	idPrefix,
	submitLabel,
	loadingMessage,
	successMessage,
	errorMessage,
	onSubmit,
	onSuccess,
}) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const { execute, isLoading, error } = useAsyncAction(onSubmit, {
		loadingMessage,
		successMessage,
		errorMessage,
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const result = await execute(email, password);
		if (result !== undefined) {
			onSuccess();
		}
	};

	const emailId = `${idPrefix}-email`;
	const passwordId = `${idPrefix}-password`;

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
				<label
					htmlFor={emailId}
					style={{
						fontSize: "0.875rem",
						fontWeight: 600,
						color: "var(--text-secondary)",
					}}
				>
					Email
				</label>
				<input
					id={emailId}
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					placeholder="name@example.com"
					style={{
						background: "var(--surface)",
						border: "1px solid var(--glass-border)",
						borderRadius: "var(--radius-md)",
						padding: "0.75rem 1rem",
						color: "var(--text-primary)",
						outline: "none",
					}}
				/>
			</div>

			<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
				<label
					htmlFor={passwordId}
					style={{
						fontSize: "0.875rem",
						fontWeight: 600,
						color: "var(--text-secondary)",
					}}
				>
					Password
				</label>
				<div style={{ position: "relative" }}>
					<input
						id={passwordId}
						type={showPassword ? "text" : "password"}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						required
						placeholder="••••••••"
						style={{
							width: "100%",
							background: "var(--surface)",
							border: "1px solid var(--glass-border)",
							borderRadius: "var(--radius-md)",
							padding: "0.75rem 3rem 0.75rem 1rem",
							color: "var(--text-primary)",
							outline: "none",
						}}
					/>
					<button
						type="button"
						onClick={() => setShowPassword(!showPassword)}
						style={{
							position: "absolute",
							right: "1rem",
							top: "50%",
							transform: "translateY(-50%)",
							background: "none",
							border: "none",
							color: "var(--text-secondary)",
							cursor: "pointer",
							fontSize: "0.875rem",
							fontWeight: 600,
						}}
					>
						{showPassword ? "Hide" : "Show"}
					</button>
				</div>
			</div>

			{error && (
				<div
					style={{
						color: "var(--danger)",
						fontSize: "0.875rem",
						textAlign: "center",
						marginTop: "0.5rem",
					}}
				>
					{error.message}
				</div>
			)}

			<button
				type="submit"
				disabled={isLoading}
				style={{
					background: "var(--accent)",
					color: "white",
					border: "none",
					padding: "1rem",
					borderRadius: "var(--radius-md)",
					fontWeight: 700,
					fontSize: "1rem",
					marginTop: "1rem",
					cursor: isLoading ? "wait" : "pointer",
					opacity: isLoading ? 0.7 : 1,
				}}
			>
				{isLoading ? "Processing..." : submitLabel}
			</button>
		</form>
	);
};
