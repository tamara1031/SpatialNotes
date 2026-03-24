import type React from "react";
import { useState } from "react";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { signup } from "../../store/vaultStore";

interface SignupFormProps {
	redirectPath?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({ redirectPath }) => {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);

	const { execute, isLoading, error } = useAsyncAction(
		async (email: string, pass: string) => {
			await signup(email, pass);
			return true;
		},
		{
			loadingMessage: "Creating account...",
			successMessage: "Account created successfully!",
			errorMessage: "Registration failed",
		},
	);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const success = await execute(email, password);
		if (success !== undefined) {
			window.location.href = redirectPath || "/notes/";
		}
	};

	return (
		<form
			onSubmit={handleSubmit}
			style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
		>
			<div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
				<label
					style={{
						fontSize: "0.875rem",
						fontWeight: 600,
						color: "var(--text-secondary)",
					}}
				>
					Email
				</label>
				<input
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
				{isLoading ? "Processing..." : "Get Started"}
			</button>
		</form>
	);
};
