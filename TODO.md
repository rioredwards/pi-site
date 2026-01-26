# TODO

## Completed ✅

- [x] Rebased self-hosted-nextjs app onto this app
- [x] Created new branch
- [x] Cleared out repo and copied over files
- [x] Sanity checked docker/scripts/etc
- [x] Switched Cloudflare tunnel from hello.rioedwards.com to pi.rioedwards.com
- [x] Ensured everything runs
- [x] Merged back frontend components/pages (photo gallery UI)
- [x] Merged back server actions (uploadPhoto, getPhotos, deletePhoto)
- [x] Replaced Prisma/SQLite with Drizzle/Postgres
- [x] Got app deployed and running on Raspberry Pi
- [x] Fixed database healthcheck configuration
- [x] Fixed TypeScript build errors
- [x] Fixed standalone build issues (postgres package)
- [x] Configured NextAuth with GitHub and Google OAuth
- [x] Got photo upload working with AI validation
- [x] Add user profile page
- [x] There's apparently opengraph metadata, but it's not working. I'm getting a warning in the console about it. So, we should fix that.
- [x] Optimize Docker image sizes
- [x] Add monitoring/alerting
- [x] Fix themeColor metadata warning (move to viewport export)
- [x] Add infinite scroll pagination for gallery
- [x] Populate user profiles with OAuth data (name and profile picture) on sign-in
- [x] Move Google sign-in button above GitHub
- [x] Display user's posts on their profile page
- [x] Add profile links to dog cards for navigating to user profiles

## In Progress 🚧
- [ ] User’s should be able to delete their posts from their profile page
- [ ] Update docs (readme and claude.md)
- [ ] Remove any sensitive info from git history (e.g. I had some detailed info about the raspberry pi in the TODO.md file that may or may not have been sensitive)

## Backlog 📋

- [ ] Add all original dogs back to the database
- [ ] Re-introduce github actions workflow
- [ ] Get staging environment working again
- [ ] Figure out how to access the DrizzleKit UI

### Features

- [ ] Use existing dog images as seed data
- [ ] Add photo captions/descriptions
- [ ] Add sorting/filtering options
- [ ] Add photo search functionality

### DevOps

- [ ] Reintroduce GitHub Actions workflow
- [ ] Add automated backups for database
- [ ] Fix staging environment

### Documentation

- [ ] Add architecture diagrams
- [ ] Document deployment process in more detail
- [ ] Create troubleshooting guide
- [ ] Add API documentation

## Notes
