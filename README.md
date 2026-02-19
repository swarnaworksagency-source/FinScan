# FinScan

## Project Setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment to Netlify

This project includes a `netlify.toml` file for easy deployment.

### Steps:
1. Push your code to a Git repository (GitHub/GitLab/Bitbucket).
2. Log in to Netlify and click **"Add new site"** > **"Import an existing project"**.
3. Select your provider and repository.
4. Netlify will detect the settings from `netlify.toml` automatically:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
5. Click **"Deploy"**.

### Environment Variables
If your `.env` contains secrets (e.g., Supabase keys):
1. Go to **Site Configuration** > **Environment variables** on Netlify.
2. Click **"Add a variable"** (or "Import from .env").
3. Add the same Key-Value pairs found in your local `.env`.
   - *Note*: Ensure client-side variables start with `VITE_` (e.g., `VITE_SUPABASE_URL`).

<!-- Deployment trigger: 2026-02-20 -->
