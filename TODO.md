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

## In Progress 🚧

None

## Backlog 📋

### Features
- [ ] Use existing dog images as seed data
- [ ] Add photo captions/descriptions
- [ ] Add sorting/filtering options
- [ ] Add pagination for gallery
- [ ] Add photo search functionality
- [ ] Add user profile page

### DevOps
- [ ] Reintroduce GitHub Actions workflow
- [ ] Add automated backups for database
- [ ] Add monitoring/alerting
- [ ] Optimize Docker image sizes
- [ ] Add staging environment

### Documentation
- [ ] Add architecture diagrams
- [ ] Document deployment process in more detail
- [ ] Create troubleshooting guide
- [ ] Add API documentation

## Notes

- Admin system is working (configurable via ADMIN_USER_IDS)
- OAuth redirect URLs need to be configured for production domain
- Database schema is synced and working
- AI image validation (NSFW + dog detection) is functional
