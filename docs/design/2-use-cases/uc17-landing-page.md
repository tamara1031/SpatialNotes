# Use Case UC17: Browse Landing Page

| Item | Description |
| :--- | :--- |
| **Primary Actor** | Guest (Prospective User) |
| **Preconditions** | User is not authenticated; Browser is at the root `/` path. |
| **Basic Flow** | 1. **Guest** (Actor) navigates to the **Root URL** (Boundary).<br>2. **Landing Page** (Boundary) displays the **Hero Section** with product vision.<br>3. System presents **Features Section** (Entity) showcasing E2EE, Canvas, and Markdown integration.<br>4. System displays **Pricing/Dummy Pro Sections** to communicate value.<br>5. **Guest** scrolls through premium visuals (Glassmorphism) and micro-animations.<br>6. **Guest** sees "Sign In" and "Sign Up" actions in the **Header** and **Hero CTA**. |
| **Alternative Flow** | 1. If Guest is already authenticated (session token in localStorage exists), **System** automatically redirects to `/vault`. |
| **Business Rules** | **Rule 17.1**: Initial load MUST be fast (<500ms for FCP) using Astro's static/server-islands.<br>**Rule 17.2**: Visual identity MUST follow ADR-037 (Glassmorphism, Outfit font).<br>**Rule 17.3**: SEO meta-tags MUST be present (Title, Description). |
| **Post-condition** | Guest is informed about the product value and presented with entry points. |
