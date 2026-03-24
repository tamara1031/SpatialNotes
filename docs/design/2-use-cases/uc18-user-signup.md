# Use Case UC18: User Sign-up

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Guest (Prospective User) |
| **Preconditions** | User is on the Landing Page; No existing account for the provided email. |
| **Basic Flow** | 1. **Guest** (Actor) clicks "Sign Up" on the **Landing Page** (Boundary).<br>2. **Sign-up Page** (Boundary) opens with a dedicated layout.<br>3. **Guest** enters Email and a strong Password.<br>4. System triggers **RegisterVaultUseCase** (Control) in the background.<br>5. **Crypto Worker** (Control) derives salts and Master keys (E2EE bits).<br>6. **Auth Gateway** (Boundary) registers the user on the **Go Backend** (Infrastructure).<br>7. System stores the **Session Token** and redirects to `/vault/`.<br>8. **Guest** (now User) sees an empty personal notebook ready for creation. |
| **Alternative Flow (Email already exists)** | 1. **Auth Gateway** returns error "Email already registered".<br>2. **Sign-up Page** displays error and suggests "Sign In" instead. |
| **Business Rules** | **Rule 18.1**: Password MUST NEVER reach the server in plain text (Derived Auth Token used).<br>**Rule 18.2**: Registration flow MUST include visual progress (loading state).<br>**Rule 18.3**: Redirection to `/vault/` MUST occur only after successful vault initialization. |
| **Post-condition** | New user account created; E2EE Vault initialized; User redirected to workspace. |
