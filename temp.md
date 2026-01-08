okay, I have this site here and it's basically a proof-of-concept/simplified version of an app that I was developing already. I wanted to start from a working example and then slowly re-introduce the features that were giving me headaches one by one. Doing this isolated the issues and made it a lot easier to wrap my head around it. At the current state, I'm ready to re-introduce the parts of the app that were stripped out. I'd like you to help me do that. Please take special care to abide by the following guidelines though:

- This whole app feels like it's very delecate and any little change threatens to break everything and send me down a 10 hour debugging rabbit-hole. Therefore, do your best to modify the code as little as possible in order to achieve the intended result. I wan to be slow and careful about introducting changes.
- The goal was to have a fullstack next.js application hosted on my raspberry pi, that also includes a backend service which uses ai to validate images. In my previous version of the codebase which I want to slowly re-introduce, I had a slightly different tech-stack, but I want to adapt it as necessary to fit the current stack.

## The new stack is:

### Meta stuff (process management/networking/infra/deployment-tooling):

- Raspberry Pi running Raspberry Pi OS (a Debian-based OS, ARM64 architecture)
- Docker
- Nginx
- Cloudflare Tunnels

### Web app frontend:

- Next.js

### Web app backend:

- PosgreSQL
- Drizzle

### Image validator backend:

- fastapi
- other python/ai libraries I know next-to-nothing about

## The old stack was:

### Meta stuff (process management/networking/infra/deployment-tooling):

- Raspberry Pi running Raspberry Pi OS (a Debian-based OS, ARM64 architecture)
- PM2
- Cloudflare Tunnels
- GitHub Actions
- many awful scripts that should be thrown in the trash

### Web app frontend:

- Next.js
- ShadCN UI
- Tailwind CSS

### Web app backend:

- NextAuth.js
- Prisma ORM
- SQLite

### Image validator backend:

- fastapi
- other python/ai libraries I know next-to-nothing about

My goal is to re-introduce the parts of the old app that were stripped out, but adapting it to work with the new stack.

The end result should be visually and functionally almost identical to the old app, but using the tech stack/infrastructure/deployment setup of the new stack. There is one feature that the new app introduced that the old app didn't have which I want to keep, which is the ai image validator backend. I attempted a version of it in the old app and the complications in that process were what led me to want to start from scratch.

The old app was a dog photo gallery app, so the new app should be a dog photo gallery app, but using the new stack.

Here's a step-by-step plan for how to achieve this:

- Strip out parts of the new app that are leftover from the demo... (this app is a modified version of the self-hosted next.js app demo). The features that I want to keep are:
  - The deployment process
  - Using docker/docker-compose to manage the app and its dependencies
  - Using nginx as a reverse proxy
  - Using cloudflare tunnels for public access (stayed the same between the old and new app)
  - The ai image validator backend
  - Using drizzle/postgres for the database
  - General next.js/react/typescript/npm config files
    (In summary: the new app has a tooling/infrastructure/deployment setup that I want to keep as well as the foundation for a good backend. Any of the actual UI code in the new app should be stripped out. None of the UI in the new app is important... mostly just the tooling/infrastructure/deployment setup and the backend foundation that I want to keep.)
- Start pulling parts of the old app into the new app:
  - Adapt the web-app backend of the old app to work with the new stack (CRUD for images... was using prisma/sqlite, now using drizzle/postgres)
  - Pull in the NextAuth.js code from the old app. This probably won't need to be modified much if at all.
  - Will need to re-introduce ShadCN, and Tailwind CSS.
  - Pull in the UI code... This is the biggest part of the old app that I want to keep. It should basically be a copy/paste of the old app's UI code. The only parts that should change are parts that interact with the backend.
  - Only after the website is visually and functionally identical to the old app, I want to introduce the new ai image validator backend into the UI code. It should be fairly straightforward to do this as I already have the image uploading logic in the old app and a working demo with backend/frontend linked up in the new app.
  - Eventually, I want to re-introduce the github actions workflow from the old app. This will be a bit more involved as it will require adapting the github actions workflow to work with the new stack.

Things from the old app that I definitely DO NOT WANT TO KEEP:

- DO NOT WANT: any attempted tooling/infrastructure/deployment setup... it's a mess
- DO NOT WANT: any attempted ai/image validation code (under app/lib/moderation)
- DO NOT WANT: any of the scripts that were used to deploy the old app... they are a mess
- DO NOT WANT: PM2... We are using Docker and nginx now...
- DO NOT WANT: Prisma ORM or SQLite... we are using drizzle/postgres now...
- DO NOT WANT: documentation... There's a lot of it and much of it is outdated and wrong at this point...

Now, some specifics:

- We are working in a cursor project, setup as a workspace with the old app and the new app. The old app is @pi-site-old and the new app is @pi-site. The old one is actually a git worktree (same repo, but earlier state).
- I have a raspberry pi running the new app. It's currently accessible at pi.rioedwards.com.
- If you want to access the raspberry pi, you can use the following command:
  ```bash
  # My ssh config allows for this... if it doesn't work for you, let me know what you need to do to make it work.
  ssh rioredwards@raspberrypi
  ```
- I want to be able to run the app on my raspberry pi locally. that's the (prod) server. (this whole things is just a fun personal project, so don't worry about uptime. the app has been down most of the year anyways.). I want to be able to develop the app on my mac mini locally. that's my dev machine and where you will be (you're in cursor, on my mac mini).
