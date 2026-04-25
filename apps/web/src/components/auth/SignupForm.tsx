import type React from "react";
import { signup } from "../../store/vaultStore";
import { AuthForm } from "./AuthForm";

interface SignupFormProps {
	redirectPath?: string;
}

export const SignupForm: React.FC<SignupFormProps> = ({ redirectPath }) => (
	<AuthForm
		idPrefix="signup"
		submitLabel="Get Started"
		loadingMessage="Creating account..."
		successMessage="Account created successfully!"
		errorMessage="Registration failed"
		onSubmit={async (email, password) => {
			await signup(email, password);
		}}
		onSuccess={() => {
			window.location.href = redirectPath || "/notes/";
		}}
	/>
);
