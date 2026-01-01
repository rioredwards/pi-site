# Pi-Site

A self-hosted Next.js website running on a Raspberry Pi, featuring a dog photo gallery. This is my first self-hosted project, built to learn about self-hosting, Raspberry Pi management, and Cloudflare Tunnels.

## Project Overview

This project is a personal portfolio/gallery site that:

- Allows users to upload and view dog photos
- Uses file-based storage (no database)
- Implements simple cookie-based session management
- Runs on a Raspberry Pi and is accessible via Cloudflare Tunnels

**Tech Stack:**

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- ShadCN UI
- Node.js

## SSH Setup (run on dev machine)

```bash
ssh raspberrypi # Assuming ssh config and hostname are set up correctly on dev machine
```

## Development Workflow (run on dev machine)

### Local Development

Just the regular Next.js dev flow:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### Deploy

Just deploy to main branch on GitHub and then run the update-server.sh script on the pi.

## Deployment Workflow (run on pi)

### Server Scripts

```bash
./update-server.sh # Updates the server with the latest code from GitHub
```

```bash
./start-server.sh # Starts the production server (note, this uses nohup to run in the background)
```

```bash
./stop-server.sh # Stops the production server
```

```bash
./check-server.sh # Checks the server status
```

## Architecture Notes

- **No Database**: Images stored as files, metadata in JSON files
- **Simple Auth**: Cookie-based session management with UUID
- **Self-Hosted**: Runs on Raspberry Pi via Cloudflare Tunnels
- **File-Based**: No external database dependencies

## Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Cloudflare Tunnels](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [Raspberry Pi Documentation](https://www.raspberrypi.com/documentation/)
