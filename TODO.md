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

### Improve UIs

- [x] Dog card info panel has a place to display the use's profile picture, but it's not being displayed
- [x] When a user first uploads a photo, the card for that photo currently shows that the user is anonymous. This should be fixed.
- [x] The sequence for uploading a photo could be improved. Specifically, the "processing", "success", and "failure" states should be adjusted in the following ways:
  - [x] All these three states should have a new modal style that's distinct from the previous states to inform the user that the form was submitted. The screens are primarily decorative/informational, and fun from this point forward.
  - [x] Each state should show their dog photo, but with a processing/success/failure overlay. This overlay should consist of multiple elements all stacked on the z-axis. 1. the dog photo, 2. the status overlay (for the "processing" state, this should be a translucent "scanning" visual over the dog photo made with an animated linear gradient. The error and success states should just have a green or red overlay here. There should also be a significant decrease in the brightness of the dog photo to acocunt for the overlay) 3. Ovelayed on the very top should be the "Dog Bot" elements. The Dog bot elements should be 1. a status pill on the top right, 2. the "DogBot" logotype on the bottom left, 3. The DogBot message, which appears like a text message bubble with the dog bot's message. There are designs for these in the temp folder in the project root.
  - [x] The dog bot screens should progress automatically. Each screen should be displayed for 5 seconds, then proceed to the next screen. (either processing>success or processing>failure).
  - [x] When the user is returned to the main gallery, if they successfully uploaded a photo, their new dog card should be added to the top of the gallery (already implemented). They should then see confetti raining down from the top of the screen (already implemented, but it happens at the wrong time. it should wait until the modal is fully dismissed).
  


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
