# Host containment

The origin accepts HTTP only on loopback behind the tunnel. Public HTTP redirects to HTTPS using the scheme header from the trusted loopback tunnel; local health requests without that header remain HTTP 200. SSH is reachable through Tailscale with verified host keys. Password, keyboard-interactive and root SSH logins are disabled. Host and Docker egress to private networks is denied except DNS, NTP, DHCP, Tailscale transport, internal container traffic and replies to incoming maintenance sessions.

## Apply or recover

Keep an independent SSH maintenance session open. Verify the host fingerprint against a trusted prior connection, never a fresh unverified scan.

```sh
sudo install -o root -g root -m 750 scripts/contain-host.sh /usr/local/sbin/dogtown-containment
sudo /usr/local/sbin/dogtown-containment apply
# From both maintenance Macs: establish fresh, nonmultiplexed SSH sessions.
# Check public HTTPS, origin, container dependencies and denied personal-network ports.
# Exercise the rollback service once before applying again and confirming.
sudo /usr/local/sbin/dogtown-containment confirm
```

`apply` arms a five-minute automatic rollback. `confirm` cancels it and installs the boot service. `rollback` removes only this table and disables its boot service. Docker and Tailscale rules remain intact. Never confirm without fresh maintenance and public-site checks.

## Secrets and backups

- Cloudflared reads `/etc/cloudflared/tunnel-token`, root-owned mode 600. Its unit contains only the token-file path.
- Production environment files are mode 600. Never print environment values or secret-bearing units.
- Before service or OS updates, stop only web and analytics briefly, with a guaranteed restart trap. Stream the database dump and uploads archive to a private directory on another machine.
- Verify archive readability, checksums, database dump completion, a disposable database restore and restored photo counts. Restart both services and check public HTTPS.
- Keep root-only rollback copies outside the checkout. Never prune uploads, database volumes, runner files or images to make room without checking ownership and rollback needs.

## Deployment

The workflow pins upstream actions and the verified public Pi host key in `.github/pi_known_hosts`. A host-key change must be independently verified and updated deliberately. Deployments fail on a dirty server checkout, fetch the exact workflow commit, and use `.env.prod` for Compose interpolation. No account SSH key is needed on the Pi because repository reads use public HTTPS.

Uploaded images pass through the application raster validator, including older extensionless files; the image location adds a sandbox CSP and nosniff. Nginx configuration changes require `nginx -t` plus runtime probes. Changing a shared-memory zone key requires a new zone name. Moving a wildcard listener to loopback requires a brief restart; a successful reload command alone does not prove the master accepted the new configuration.

Full OS upgrades and reboots need a separate checkpoint after verified off-host backups and a disk-space estimate. Include download cache, unpacking, new images and rollback headroom in that estimate.
