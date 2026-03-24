# Use Case UC19: User Sign-in

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Returning User |
| **Preconditions** | User is on the Landing Page; Account already exists. |
| **Basic Flow** | 1. **Returning User** (Actor) clicks "Sign In" on the **Landing Page** (Boundary).<br>2. **Sign-in Page** (Boundary) opens with dedicated layout.<br>3. **User** enters Email; System fetches Salts (Control) from server.<br>4. **User** enters Password; System triggers **UnlockVaultUseCase** (Control).<br>5. **Auth Gateway** (Boundary) verifies credentials with **Go Backend** (Infrastructure).<br>6. **Crypto Worker** (Control) unwraps the Data Encryption Key (DEK).<br>7. System stores the **Session Token** and redirects to `/vault/`.<br>8. **User** workspace is loaded and synchronized. |
| **Alternative Flow (Wrong Credentials)** | 1. System displays error message "Invalid email or password".<br>2. User may retry or use "Forgot Password" (dummy placeholder). |
| **Business Rules** | **Rule 19.1**: Session token MUST be stored securely (localStorage for now, following ADR-039).<br>**Rule 19.2**: UI MUST reflect loading state during auth derivation. |
| **Post-condition** | Vault is unlocked; User session active; Redirected to workspace. |
