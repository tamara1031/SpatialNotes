import type React from "react";
import { identifyUser, signin } from "../../store/vaultStore";
import { AuthForm } from "./AuthForm";

interface SigninFormProps {
	onSuccess: () => void;
}

export const SigninForm: React.FC<SigninFormProps> = ({ onSuccess }) => (
	<AuthForm
		idPrefix="signin"
		submitLabel="Sign In"
		loadingMessage="Signing in..."
		successMessage="Welcome back!"
		errorMessage="Sign in failed"
		onSubmit={async (email, password) => {
			await identifyUser(email);
			await signin(password);
		}}
		onSuccess={onSuccess}
	/>
);
