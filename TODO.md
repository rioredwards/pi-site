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

- [x] Dog card info panel has a place to display the use's profile picture, but it's not being displayed
- [x] When a user first uploads a photo, the card for that photo currently shows that the user is anonymous. This should be fixed.
- [x] The sequence for uploading a photo could be improved. Specifically, the "processing", "success", and "failure" states should be adjusted in the following ways:
  - [x] All these three states should have a new modal style that's distinct from the previous states to inform the user that the form was submitted. The screens are primarily decorative/informational, and fun from this point forward.
  - [x] Each state should show their dog photo, but with a processing/success/failure overlay. This overlay should consist of multiple elements all stacked on the z-axis. 1. the dog photo, 2. the status overlay (for the "processing" state, this should be a translucent "scanning" visual over the dog photo made with an animated linear gradient. The error and success states should just have a green or red overlay here. There should also be a significant decrease in the brightness of the dog photo to acocunt for the overlay) 3. Ovelayed on the very top should be the "Dog Bot" elements. The Dog bot elements should be 1. a status pill on the top right, 2. the "DogBot" logotype on the bottom left, 3. The DogBot message, which appears like a text message bubble with the dog bot's message. There are designs for these in the temp folder in the project root.
  - [x] The dog bot screens should progress automatically. Each screen should be displayed for 5 seconds, then proceed to the next screen. (either processing>success or processing>failure).
  - [x] When the user is returned to the main gallery, if they successfully uploaded a photo, their new dog card should be added to the top of the gallery (already implemented). They should then see confetti raining down from the top of the screen (already implemented, but it happens at the wrong time. it should wait until the modal is fully dismissed).

## In Progress 🚧

### Improve Stats page

- [ ] Fix text wrapping occasionally causing layout shifts in the header section. Because the data is dynamic, the text sometimes jumps back and forth between the two lines which is annoying. This is mostly a problem with the sections in project-root/components/live-stats/header-section.tsx on lines 40-70.
- [ ] The data charts are throwing a warning (see below).
- [ ] Some of the charts contain extra "ai fluff"... text that AI left for me, but it should be removed. e.g. "Hint: this can spike under build/deploy, so it's a great "realtime flex"."
- [ ] The data that's displayed could be a little more concise and thought out. Basically, I want it to be a little more approachable and friendly. The first piece of data is "host", which appears to just be a string of random numbers and letters. This isn't interesting or useful to display. I would prefer to put some static data in there about the host machine. I put some more info on this topic towards the bottom of this file.
- [ ] The data could generally be more "simple" and "friendly". Also, the distinct services should be featured in a more prominent way. Each service should get their own card with some simple stats and a little bit of text about what the service is and what it does as well as the tech used to build it. All of these ideas are outlined in a little mockup I made in the temp folder in the project root. Please use this mockup as a rough idea of what a simplified version of the stats page could look like. It's a wireframe, so don't try to match the colors and details too closely, just maybe meet somewhere in the middle of that wireframe and what is currently displayed. Feel free to use your own judgement on how to best implement these ideas as well as how the data should be displayed.
- [ ] Some of the stats data seems like it might be a security risk. I could be wrong, this isn't my area of expertise. But i just want verification that we aren't leaking any sensitive information.
- [ ] The "disk usage by mount" section only displays 2 directories and they seem to contain basically the same data. It's not really an interesting graph, so I'm hoping we can make the data more interesting and relevant. We can always source more data in the system-profiler service if needed. There's a section in the mockup that looks similar the iPhone "Storage" page, and I think that's a good reference point for how to display the data.
- [ ] This section almost works on mobile, but there are a couple graphs that are too wide and cause the page to scroll horizontally. We should make sure that the graphs are responsive and don't cause the page to scroll horizontally on mobile. The problem charts are the bottom 3, "Disk usage by mount", "Top containers by cpu", and "Services health and latency".
- [ ] The "top containers by cpu" section generally reports the web service as "unhealthy"... I don't know why, but this seems inaccurate unless I'm misinterpreting the data.
- [ ] There is some strange bug on mobile, where the user can't tap normally on any buttons/links/etc.. on the stats page. Even more strange, is that double tapping works... Unheard of behavior... I think it's something to do with the canvas? I'm not sure why this is happening, but it's causing the page to be unusable on mobile.

## Other

- [ ] Currently, new user's display names seem to turn up as "anonymous". I'd prefer if we could use the name we get from the OAuth provider instead of "anonymous" as their default display name. They can always change it later if they want to, but it would be nice to have a more personalized default.
- [ ] The sidebar doesn't close when the user clicks on a link in the sidebar or taps out of the sidebar. It should dismiss the sidebar when the user clicks outside of it or taps on a link in the sidebar.
- [ ] The about page needs some work. I'd like to redo it using MDX in a way that's more standard because it's currently just a big JSX file, mostly copy/pasted from before it was migrated to MDX. I'd like to keep a lot of the text content and some of the components, but try to implement it in a more idiomatic way.

## Backlog 📋

### Features

- [ ] Use existing dog images as seed data
- [ ] Add photo captions/descriptions
- [ ] Add sorting/filtering options
- [ ] Add pagination for gallery
- [ ] Add photo search functionality
- [ ] Add user profile page
- [ ] There's apparently opengraph metadata, but it's not working. I'm getting a warning in the console about it. So, we should fix that.

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

## Bug Reports

```
`web-1               | 🔴 [stream/server] polling exception: TypeError: fetch failed
web-1               |     at async fetchStats (app/api/stats/route.ts:74:15)
web-1               |     at async pollOnce (app/api/stats/route.ts:102:18)
web-1               |   72 |   // devLog("🔵 [stream/server] polling url:", url);
web-1               |   73 |
web-1               | > 74 |   const res = await fetch(url, {
web-1               |      |               ^
web-1               |   75 |     headers: { "X-Profiler-Token": authToken },
web-1               |   76 |   });
web-1               |   77 | {
web-1               |   [cause]: [Error [SocketError]: other side closed] {
web-1               |     code: 'UND_ERR_SOCKET',
web-1               |     socket: {
web-1               |       localAddress: '172.20.0.5',
web-1               |       localPort: 40838,
web-1               |       remoteAddress: undefined,
web-1               |       remotePort: undefined,
web-1               |       remoteFamily: undefined,
web-1               |       timeout: undefined,
web-1               |       bytesWritten: 8151,
web-1               |       bytesRead: 88540
web-1               |     }
web-1               |   }
web-1               | }`
```

```
installHook.js:1 The width(-1) and height(-1) of chart should be greater than 0,
       please check the style of container, or the props width(100%) and height(100%),
       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the
       height and width.
```

Here's an example of some static data that might be nice to display:

```
Host: Raspberry Pi 4 Model B Rev 1.1
CPU: Quad-core 1.5GHz Cortex-A72
Memory: 4GB LPDDR4 SDRAM
Disk: 32GB eMMC
```

Here's some data about my machine that I'd like help parsing out and getting the "good parts":
CPU(s): 4
Model name: Cortex-A76
CPU max MHz: 2400.0000
Model: Raspberry Pi 5 Model B Rev 1.0
Current CPU frequency: 2400.0000 MHz
Static hostname: rio-raspberry-pi
Icon name: computer
Machine ID: a9183e3172d2413f8b447b08abf482c1
Boot ID: 7cbe37b43c7249efbd27fcbad9e2febc
Operating System: Debian GNU/Linux 13 (trixie)
Kernel: Linux 6.12.62+rpt-rpi-2712
Architecture: arm64
So, , arm64 architecture, Running Debian GNU/Linux 13 (trixie)
CPU(s): 4
On-line CPU(s) list: 0-3
Model name: Cortex-A76
Thread(s) per core: 1
Core(s) per cluster: 4
Socket(s): -
CPU(s) scaling MHz: 62%
CPU max MHz: 2400.0000
CPU min MHz: 1500.0000
NUMA node0 CPU(s): 0-3
NUMA node1 CPU(s): 0-3
NUMA node2 CPU(s): 0-3
NUMA node3 CPU(s): 0-3
NUMA node4 CPU(s): 0-3
NUMA node5 CPU(s): 0-3
NUMA node6 CPU(s): 0-3
NUMA node7 CPU(s): 0-3
so, 4 cores, 2400MHz.

> grep -i MemTotal /proc/meminfo
> total used free shared buff/cache available
> Mem: 7.9Gi 1.7Gi 1.8Gi 48Mi 4.8Gi 6.2Gi
> Swap: 3.0Gi 32Mi 3.0Gi
> MemTotal: 8256464 kB
> so, 8GB of memory.

▶ lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL,TRAN
NAME SIZE TYPE FSTYPE MOUNTPOINT MODEL TRAN
loop0 2G loop swap
mmcblk0 29.7G disk mmc
├─mmcblk0p1 512M part vfat /boot/firmware mmc
└─mmcblk0p2 29.2G part ext4 / mmc
zram0 2G disk swap [SWAP]
so, 29.2GB of disk space.

▶ lsblk -d -o NAME,SIZE,MODEL,TRAN
udevadm info -q property -n /dev/mmcblk0 | egrep 'ID_MODEL=|ID_SERIAL=|ID_BUS='
NAME SIZE MODEL TRAN
loop0 2G
mmcblk0 29.7G mmc
zram0 2G
ID_SERIAL=<redacted>

▶ echo "Host: $(tr -d '\0' </sys/firmware/devicetree/base/model)"
Host:   Raspberry Pi 5 Model B Rev 1.0
▶ echo "CPU:    $(lscpu | awk -F: '/Model name/ {gsub(/^ +/,"",$2); print $2}')"
CPU:    Cortex-A76
▶ echo "Cores:  $(nproc)"
Cores:  4
▶ echo "Memory: $(free -h | awk '/Mem:/ {print $2}')"
Memory: 7.9Gi
▶ echo "Disk:   $(lsblk -d -b -n -o SIZE /dev/mmcblk0 2>/dev/null | awk '{printf "%.0fGB\n", $1/1024/1024/1024}') ($(lsblk -d -n -o MODEL /dev/mmcblk0 2>/dev/null | sed 's/^ \*//'))"
Disk: 30GB ()
