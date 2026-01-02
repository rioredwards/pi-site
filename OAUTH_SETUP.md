# OAuth Setup for Development and Production

## Quick Fix for Local Development

Add this to your `.env.local` file:

NEXTAUTH_URL=http://localhost:3000This tells NextAuth to use localhost for callbacks in development.

## Complete OAuth Provider Setup

### GitHub OAuth App Setup

**IMPORTANT**: GitHub OAuth apps only allow **one callback URL per app**. You **must** create separate OAuth apps for development and production.

#### Development OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. **Application name**: `DEV-DogTownUSA` (or your preferred dev app name)
4. **Homepage URL**: `http://localhost:3000`
5. **Authorization callback URL**: `http://localhost:3000/api/auth/callback/github`
6. Click "Register application"
7. Copy the **Client ID** and **Client Secret** to your `.env.local`

#### Production OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App" (or use your existing production app)
3. **Application name**: Your production app name (e.g., `DogTownUSA`)
4. **Homepage URL**: `https://your-production-domain.com`
5. **Authorization callback URL**: `https://your-production-domain.com/api/auth/callback/github`
6. Click "Register application"
7. Copy the **Client ID** and **Client Secret** for your production environment

**Note**: Keep these apps separate! Use different credentials in `.env.local` (dev) vs your production environment.

### Google OAuth Setup

**Note**: Google allows multiple redirect URIs in a single OAuth client, so you **do not need** to create a separate dev app. Use the same Google OAuth app for both development and production.

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID** (or edit your existing production app)
5. **Application type**: Web application
6. **Name**: Your app name
7. **Authorized JavaScript origins**:
   - `http://localhost:3000` (for dev)
   - `https://your-production-domain.com` (for prod)
8. **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` (for dev)
   - `https://your-production-domain.com/api/auth/callback/google` (for prod)
9. Copy the **Client ID** and **Client Secret** - use the **same credentials** in both `.env.local` (dev) and production environment

**Summary**:

- **GitHub**: Requires separate OAuth apps (dev: `DEV-DogTownUSA`, prod: your production app)
- **Google**: Use the same OAuth app for both dev and prod (just add both redirect URIs)

## Environment Variables

### `.env.local` (Development - Gitignored)

# NextAuth

NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret-here

# GitHub OAuth (Development - separate app required)

GITHUB_CLIENT_ID=your_dev_client_id_from_dev_app
GITHUB_CLIENT_SECRET=your_dev_client_secret_from_dev_app

# Google OAuth (Uses same app for dev and prod - no separate dev app needed)

# Make sure your Google OAuth app has both localhost and production redirect URIs

GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Admin Users (optional)

# Set admin user IDs in format: provider-accountId

# Example: "github-123456,google-789012"

# To find your user ID: sign in, then check browser console or network tab for session data

# Or check the database: SELECT DISTINCT userId FROM Photo WHERE userId LIKE 'github-%' OR userId LIKE 'google-%';

# ADMIN_USER_IDS=github-your_github_id,google-your_google_id

# Database

DATABASE_URL="file:./prisma/dev.db"### Production Environment Variables

On your Raspberry Pi, set these in your production environment:
v
NEXTAUTH_URL=https://your-production-domain.com
AUTH_SECRET=your-secret-here

# GitHub OAuth (Production - separate app required)

GITHUB_CLIENT_ID=your_prod_client_id_from_prod_app
GITHUB_CLIENT_SECRET=your_prod_client_secret_from_prod_app

# Google OAuth (Uses same app for dev and prod - same credentials as dev)

GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

DATABASE_URL="file:./prisma/dev.db"## Testing in Development

1. Make sure `.env.local` has `NEXTAUTH_URL=http://localhost:3000`
2. Ensure you're using the **development** GitHub OAuth app credentials (from `DEV-DogTownUSA`)
   - **Note**: Google OAuth uses the same credentials for dev and prod (no separate dev app needed)
3. Restart your dev server: `npm run dev`
4. Try signing in - it should redirect to localhost instead of production

## Troubleshooting

### Still redirecting to production?

- Check that `.env.local` exists and has `NEXTAUTH_URL=http://localhost:3000`
- Verify you're using the **development** GitHub OAuth app credentials (not production)
- Restart the dev server after changing `.env.local`

### "Redirect URI mismatch" error?

- Make sure the callback URL in your OAuth provider matches exactly:
  - `http://localhost:3000/api/auth/callback/github` (not `https://`)
  - `http://localhost:3000/api/auth/callback/google`
- Verify you're using the correct OAuth app (dev app for dev, prod app for prod)

### "State cookie was missing" error?

- This usually means the callback URL doesn't match what's registered in GitHub
- Verify your GitHub OAuth app has the correct callback URL
- Make sure `NEXTAUTH_URL` matches your actual dev server URL

### Port 3000 already in use?

- Change port: `npm run dev -- -p 3001`
- Update `NEXTAUTH_URL=http://localhost:3001` in `.env.local`
- Update OAuth callback URLs to use port 3001
