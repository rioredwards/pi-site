Jan 14, 2026:

- Docker/BuildKit was resolving Docker Hub to an IPv6 address and trying to connect over IPv6 even though your network/host couldn’t actually route IPv6, and you fixed it by disabling IPv6 at the kernel level with ipv6.disable=1 in /boot/firmware/cmdline.txt (then rebooting) so it could only use IPv4. (also needed to add sysctl to Pi's PATH: `echo 'export PATH="/usr/sbin:/sbin:$PATH"' >> ~/.zshrc` `source ~/.zshrc` `command -v sysctl`)
