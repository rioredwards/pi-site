# Setting Up Production-Like Environment on Mac Mini

This guide will help you set up your Next.js app on your Mac Mini to simulate production as closely as possible, using PM2 just like on your Raspberry Pi.

## Prerequisites

- macOS (you're on macOS 25.2.0)
- Homebrew (recommended for package management)
- Node.js 20+ and npm 10+

## Step-by-Step Setup

### 1. Check/Install Node.js

Check if you have Node.js 20+ installed:

```bash
node --version  # Should show v20.x or higher
npm --version   # Should show v10.x or higher
```

If not installed or wrong version, install via Homebrew:

```bash
brew install node@20
```

Or download from [nodejs.org](https://nodejs.org/).

### 2. Install PM2 Globally

```bash
npm install -g pm2
```

Verify installation:

```bash
pm2 --version
```

### 3. Install System Dependencies for Canvas

The `canvas` package (used for content moderation) requires native dependencies. On macOS, install via Homebrew:

```bash
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman
```

**Note**: These are macOS equivalents of the Linux packages used on the Pi:

- `libcairo2-dev` → `cairo`
- `libpango1.0-dev` → `pango`
- `libjpeg-dev` → `jpeg`
- `libgif-dev` → `giflib`
- `librsvg2-dev` → `librsvg`
- `build-essential` → Xcode Command Line Tools (should already be installed)

### 4. Create Environment File

Create a `.env` file in the project root with your production-like environment variables:

```bash
cd /Users/rioredwards/Coding/pi-site
cp .env.local .env 2>/dev/null || touch .env
```

Edit `.env` with your production values (or use your existing `.env.local` values):

```env
NODE_ENV=production
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your-secret-here
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
ADMIN_USER_IDS=github-your_github_id
DATABASE_URL=file:./prisma/dev.db
```

**Important**: For local testing, you can use `http://localhost:3000` for `NEXTAUTH_URL`, but make sure your OAuth apps have this callback URL configured (see `OAUTH_SETUP.md`).

### 5. Install Project Dependencies

```bash
npm install
```

This will install all npm packages. The native modules (canvas, better-sqlite3) will compile during this step.

### 6. Set Up Database

Generate Prisma client and run migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

Or if you want to reset and start fresh:

```bash
npx prisma migrate reset
```

### 7. Create Required Directories

```bash
mkdir -p public/images
mkdir -p logs
chmod 755 public/images
```

### 8. Build the Application

Build the Next.js app in production mode:

```bash
npm run build
```

This creates the `.next/standalone` directory that PM2 will use.

### 9. Update PM2 Config for macOS

The `ecosystem.config.js` uses a hardcoded path. For macOS, you'll need to update it or use an absolute path. The current config should work, but verify the path is correct:

```bash
# Check what the path resolves to
echo "$HOME/pi-site"
```

If your project is in `/Users/rioredwards/Coding/pi-site`, you may want to update the `cwd` in `ecosystem.config.js` to use an absolute path or `process.cwd()`.

### 10. Start with PM2

Start the application using PM2:

```bash
pm2 start ecosystem.config.js
```

Save the PM2 configuration so it persists:

```bash
pm2 save
```

### 11. Verify It's Running

Check PM2 status:

```bash
pm2 status
```

View logs:

```bash
pm2 logs pi-site
```

Or view real-time logs:

```bash
pm2 logs pi-site --lines 50
```

### 12. Access the Application

Open your browser and navigate to:

```
http://localhost:3000
```

## Daily Workflow

### Making Changes and Testing

1. **Make your code changes**
2. **Test build locally**:
   ```bash
   npm run build
   ```
3. **Restart PM2**:
   ```bash
   pm2 restart pi-site
   ```

### Viewing Logs

```bash
# Real-time logs
pm2 logs pi-site

# Last 100 lines
pm2 logs pi-site --lines 100

# Error logs only
pm2 logs pi-site --err
```

### Stopping/Starting

```bash
# Stop
pm2 stop pi-site

# Start
pm2 start pi-site

# Restart
pm2 restart pi-site

# Delete (to start fresh)
pm2 delete pi-site
pm2 start ecosystem.config.js
```

## Differences from Raspberry Pi

1. **System Dependencies**: macOS uses Homebrew packages instead of `apt-get`
2. **Path Differences**: macOS uses `/Users/username` instead of `/home/username`
3. **No Startup Script**: PM2 startup script setup is different on macOS (uses `launchd` instead of `systemd`)

## Troubleshooting

### Canvas Build Fails

If `canvas` fails to build, make sure you have Xcode Command Line Tools:

```bash
xcode-select --install
```

Then reinstall canvas:

```bash
npm rebuild canvas
```

### PM2 Can't Find the App

Check the `cwd` path in `ecosystem.config.js`. You may need to update it to use an absolute path:

```javascript
cwd: "/Users/rioredwards/Coding/pi-site",
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find what's using it
lsof -i :3000

# Kill the process or change PORT in ecosystem.config.js
```

### Database Issues

If you get database errors:

```bash
# Check if database exists
ls -la prisma/dev.db

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or just regenerate client
npx prisma generate
```

## Optional: PM2 Startup on macOS

To have PM2 start on system boot (like on the Pi), you can set up a launchd service, but this is usually not necessary for development. If you want it:

```bash
pm2 startup
# Follow the instructions it provides
```

## Summary

You now have a production-like environment running on your Mac Mini! The workflow is:

1. Make changes
2. `npm run build`
3. `pm2 restart pi-site`
4. Test at `http://localhost:3000`

This should closely mirror your Raspberry Pi production environment, making it easier to catch issues before deploying.
