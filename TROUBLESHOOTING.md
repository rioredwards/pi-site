Jan 14, 2026:

- Docker/BuildKit was resolving Docker Hub to an IPv6 address and trying to connect over IPv6 even though your network/host couldn’t actually route IPv6, and you fixed it by disabling IPv6 at the kernel level with ipv6.disable=1 in /boot/firmware/cmdline.txt (then rebooting) so it could only use IPv4. (also needed to add sysctl to Pi's PATH: `echo 'export PATH="/usr/sbin:/sbin:$PATH"' >> ~/.zshrc` `source ~/.zshrc` `command -v sysctl`)

- Okay, so that's not the whole story... turns out we need to get the ipv4 domains from docker... claude helped make a script for this. Use ./scripts/fix-docker-ipv6.sh.
  OR do it manually like this:

# Get IPv4 for <domain>

getent ahosts <domain>| grep STREAM | head -1

# Add to /etc/hosts

echo "$(getent ahosts <domain>| grep STREAM | head -1 | awk '{print $1}') <domain>" | sudo tee -a /etc/hosts

# Retry deploy

./deploy.sh

Jan 17, 2026:

- **Database migration fails with "CREATE SCHEMA" error**: PostgreSQL 15+ requires superuser privileges to create schemas. Make your user a superuser:
  ```bash
  export POSTGRES_USER=$(grep POSTGRES_USER .env.local | cut -d '=' -f2) && \
  docker compose exec db psql -U $POSTGRES_USER -d postgres -c "ALTER USER $POSTGRES_USER WITH SUPERUSER;"
  ```
