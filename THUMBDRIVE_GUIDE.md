# Thumbdrive Transfer Guide

This guide explains how to use a thumbdrive to transfer Docker images to your Raspberry Pi.

## Quick Answer

**You only need ONE file on the thumbdrive:**

- The Docker image file: `pi-site-XXXXX.tar` (where XXXXX is a git commit hash or timestamp)

**Where it goes:**

- Just copy it to the **root** of your thumbdrive (not in any subfolder)

**Thumbdrive name:**

- **Any name works!** You don't need to name it "pi-site"
- The script will auto-detect it or you can specify the path

## Step-by-Step Process

### Step 1: Build and Copy to Thumbdrive (on your Mac)

1. **Insert your thumbdrive** into your Mac
2. **Note the thumbdrive name** (it will appear in Finder, usually something like "USB Drive" or "NO NAME")
3. **Run the build script:**

```bash
# Option A: Let the script find your thumbdrive automatically
./scripts/build-and-transfer.sh --thumbdrive

# Option B: Specify the exact path (recommended if you have multiple drives)
./scripts/build-and-transfer.sh --thumbdrive /Volumes/YOUR_DRIVE_NAME
```

4. The script will:
   - Build the Docker image
   - Copy the `.tar` file to your thumbdrive
   - Show you the file location

**Example output:**

```
✅ Image built successfully! Size: 115M
💾 Copying image to thumbdrive...
✅ Image copied to thumbdrive!

📁 Image file location: /Volumes/USB_DRIVE/pi-site-d5a56d9.tar
```

5. **Safely eject the thumbdrive** from your Mac

### Step 2: Load on Raspberry Pi

1. **Insert the thumbdrive** into your Raspberry Pi
2. **The Pi will usually auto-mount it** at `/media/pi/USB_DRIVE` or similar
3. **Run the load script:**

```bash
cd ~/pi-site

# Option A: Let the script find your thumbdrive automatically
bash scripts/load-from-thumbdrive.sh

# Option B: Specify the exact path
bash scripts/load-from-thumbdrive.sh /media/pi/USB_DRIVE
```

4. The script will:
   - Find the image file automatically
   - Load it into Docker
   - Restart your container

**That's it!** Your app should now be running.

## Finding Your Thumbdrive Path

### On Mac (before copying):

```bash
# List all mounted volumes
ls /Volumes/

# Your thumbdrive will be listed here, e.g.:
# /Volumes/USB_DRIVE
# /Volumes/NO NAME
# /Volumes/pi-site
```

### On Raspberry Pi (after inserting):

```bash
# List mounted USB devices
lsblk

# Or check mount points
df -h | grep -i usb

# Common locations:
# /media/pi/USB_DRIVE
# /media/pi/USB
# /mnt/usb
```

## Troubleshooting

### "Could not find thumbdrive"

- Make sure the thumbdrive is mounted
- On Mac: Check Finder to see if it's mounted
- On Pi: Run `lsblk` to see if it's detected
- Specify the path explicitly: `--thumbdrive /Volumes/EXACT_NAME`

### "No pi-site image file found"

- Make sure you copied the `.tar` file (not the `.tar.gz`)
- Check the file is in the root of the thumbdrive (not in a subfolder)
- The file should be named like `pi-site-d5a56d9.tar`

### "Permission denied" on Pi

- Make sure the thumbdrive is mounted with proper permissions
- Try: `sudo bash scripts/load-from-thumbdrive.sh`

## File Structure on Thumbdrive

Your thumbdrive should look like this:

```
/Volumes/YOUR_DRIVE/
  └── pi-site-d5a56d9.tar    ← Only this file is needed!
```

That's it - just the one `.tar` file in the root directory.
