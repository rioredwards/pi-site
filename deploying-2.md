# Deployment Success! ✅

It's all working!

## Summary of what's set up:

- ✅ Next.js app running in Docker on your Pi
- ✅ Nginx proxying `localhost:80` → `localhost:3000`
- ✅ Cloudflare Tunnel routing to your domain
- ✅ Nginx rate limiting configured correctly
- ✅ Configuration validation before nginx restart

Your Next.js app should now be accessible via your configured domain.

The deployment is complete. The site is accessible from anywhere via the Cloudflare Tunnel, and SSL is handled automatically by Cloudflare.

---

# What went wrong and how we solved it

Refer to these next time, so that you don't run into the same issues again:

## Issues and Solutions

### 1. Nginx duplicate `limit_req_zone` configuration error

**Issue:** Nginx failed to start with error:
```
limit_req_zone "mylimit" is already bound to key "$binary_remote_addr"
```

- The `limit_req_zone` directive was defined in site-specific config files (`/etc/nginx/sites-available/pi-site` and `/etc/nginx/sites-enabled/dogtownUSA`)
- `limit_req_zone` directives must be defined in the `http` context (in `/etc/nginx/nginx.conf`), not in server blocks or site-specific configs
- When nginx loaded all config files, it found the same zone defined multiple times, causing a conflict
- The script was only removing the zone from `pi-site` config, but other site configs (like `dogtownUSA`) also had it defined

**Solution:**

1. **Stop nginx before making configuration changes** to prevent conflicts:
   ```bash
   sudo systemctl stop nginx
   ```

2. **Remove `limit_req_zone` from nginx.conf** to clear any existing definitions:
   ```bash
   sudo sed -i '/limit_req_zone.*zone=mylimit/d' /etc/nginx/nginx.conf
   ```

3. **Remove `limit_req_zone` from ALL site configs** (not just the pi-site config):
   ```bash
   find /etc/nginx/sites-available /etc/nginx/sites-enabled -type f 2>/dev/null | while read config_file; do
       sudo sed -i '/limit_req_zone.*zone=mylimit/d' "$config_file"
   done
   ```
   Using `find` instead of a `for` loop is more robust because it:
   - Handles empty directories gracefully
   - Works with files that have spaces or special characters
   - Doesn't fail if glob patterns don't match anything

4. **Add the zone definition to nginx.conf in the `http` block** (where it belongs):
   ```bash
   if ! grep -q "limit_req_zone.*zone=mylimit" /etc/nginx/nginx.conf; then
       sudo sed -i '/^http {/a\    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;' /etc/nginx/nginx.conf
   fi
   ```

5. **Test configuration before restarting** to catch errors early:
   ```bash
   sudo nginx -t
   if [ $? -ne 0 ]; then
       echo "Nginx configuration test failed. Please check the configuration."
       exit 1
   fi
   ```

6. **Start nginx** only after configuration test passes:
   ```bash
   sudo systemctl start nginx
   ```

**Key takeaway:** `limit_req_zone` directives must be in the `http` context in `/etc/nginx/nginx.conf`, not in server blocks. Site-specific configs should only use `limit_req zone=mylimit` to reference the zone.

### 2. Git repository URL typo

**Issue:** Script had incorrect repository URL:
- `git@github.com:rioedwards/pi-site.git` (incorrect)
- Should be: `git@github.com:rioredwards/pi-site.git` (correct)

**Solution:**
Fixed the `REPO_URL` variable in `deploy.sh`:
```bash
REPO_URL="git@github.com:rioredwards/pi-site.git"
```

---

## Prevention Checklist for Next Deployment

### Before running deploy script:

- [ ] Verify repository URL is correct in the script
- [ ] Check if other nginx site configs exist that might conflict
- [ ] Review nginx configuration structure if deploying to a server with existing sites

### After nginx configuration:

- [ ] Verify `limit_req_zone` is only in `/etc/nginx/nginx.conf` (not in site configs)
- [ ] Check for duplicate zone definitions: `grep -r "limit_req_zone.*zone=mylimit" /etc/nginx/`
- [ ] Test configuration: `sudo nginx -t`
- [ ] Verify nginx starts successfully: `sudo systemctl status nginx`
- [ ] Test locally: `curl http://localhost:80`

### If nginx fails to start:

- [ ] Check error message: `sudo systemctl status nginx`
- [ ] View detailed logs: `sudo journalctl -xeu nginx.service`
- [ ] Test configuration: `sudo nginx -t`
- [ ] Look for duplicate `limit_req_zone` definitions in all config files
- [ ] Verify zone is defined in `http` context in `nginx.conf`, not in server blocks

### Manual fix commands (if needed):

If you encounter the duplicate zone error, run these commands:

```bash
# Stop nginx
sudo systemctl stop nginx

# Remove limit_req_zone from nginx.conf
sudo sed -i '/limit_req_zone.*zone=mylimit/d' /etc/nginx/nginx.conf

# Remove limit_req_zone from ALL site configs
sudo find /etc/nginx/sites-available /etc/nginx/sites-enabled -type f -exec sed -i '/limit_req_zone.*zone=mylimit/d' {} \;

# Verify it's removed from all configs
sudo grep -r "limit_req_zone.*zone=mylimit" /etc/nginx/ || echo "Confirmed: removed from all configs"

# Add the zone definition to nginx.conf in the http block (only if not already there)
if ! sudo grep -q "limit_req_zone.*zone=mylimit" /etc/nginx/nginx.conf; then
    sudo sed -i '/^http {/a\    limit_req_zone $binary_remote_addr zone=mylimit:10m rate=10r/s;' /etc/nginx/nginx.conf
fi

# Test the configuration
sudo nginx -t

# If test passes, start nginx
sudo systemctl start nginx
```

---

## Key Changes Made to deploy.sh

1. **Added nginx stop before configuration changes** (line 136)
   - Prevents conflicts when modifying config files

2. **Removed `limit_req_zone` from all site configs** (lines 145-147)
   - Uses `find` for robust file handling
   - Cleans up any existing zone definitions in site-specific configs

3. **Moved `limit_req_zone` to nginx.conf** (lines 140, 151-153)
   - Zone definition now in the correct location (`http` context)
   - Only added if it doesn't already exist

4. **Added configuration testing** (lines 181-185)
   - Tests nginx config before starting
   - Fails fast if configuration is invalid

5. **Changed from `restart` to `start`** (line 188)
   - Since we stopped nginx earlier, we only need to start it
   - More explicit about the intended state

6. **Fixed repository URL** (line 13)
   - Corrected typo: `rioedwards` → `rioredwards`

---

**Note:** These fixes are now in the deploy script, so future deployments should avoid these issues. The script now properly handles nginx configuration by:
- Stopping nginx before changes
- Cleaning up duplicate zone definitions from all configs
- Placing zone definitions in the correct location (http context)
- Testing configuration before starting

