#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Prepare standalone build for local testing (mimics Dockerfile operations)
 * This script replicates what the Dockerfile does in lines 20-22:
 * - COPY --from=builder /app/public ./public
 * - COPY --from=builder /app/.next/standalone ./
 * - COPY --from=builder /app/.next/static ./.next/static
 */

const rootDir = path.join(__dirname, '..');
const nextDir = path.join(rootDir, '.next');
const publicDir = path.join(rootDir, 'public');

console.log('🔧 Preparing standalone build for local testing...');

// Check if standalone build exists
const standaloneDir = path.join(nextDir, 'standalone');
const staticDir = path.join(nextDir, 'static');

if (!fs.existsSync(standaloneDir)) {
  console.error('❌ .next/standalone directory not found. Make sure you ran "npm run build" first.');
  process.exit(1);
}

// 1. Ensure public directory exists (it's already there, but let's verify)
if (!fs.existsSync(publicDir)) {
  console.warn('⚠️  Public directory not found, creating it...');
  fs.mkdirSync(publicDir, { recursive: true });
}

// 2. Copy contents of .next/standalone to root directory (mimics Dockerfile line 21)
console.log('📁 Copying standalone server files...');
const standaloneFiles = fs.readdirSync(standaloneDir);

for (const file of standaloneFiles) {
  const srcPath = path.join(standaloneDir, file);
  const destPath = path.join(rootDir, file);

  // Skip if it's a directory that already exists in root (like node_modules)
  if (fs.statSync(srcPath).isDirectory() && fs.existsSync(destPath)) {
    console.log(`⏭️  Skipping ${file} (already exists in root)`);
    continue;
  }

  // For files, copy them
  if (fs.statSync(srcPath).isFile()) {
    fs.copyFileSync(srcPath, destPath);
    console.log(`✅ Copied ${file} to root`);
  }
}

// 3. Copy .next/static to .next/static in root (mimics Dockerfile line 22)
if (fs.existsSync(staticDir)) {
  const destStaticDir = path.join(rootDir, '.next', 'static');
  console.log('📁 Copying static files...');

  // Ensure destination directory exists
  fs.mkdirSync(destStaticDir, { recursive: true });

  // Copy all files from .next/static to .next/static
  copyDirectoryRecursive(staticDir, destStaticDir);
  console.log('✅ Copied static files');
}

console.log('🎉 Standalone build prepared! Run "npm run start" to test locally.');

function copyDirectoryRecursive(src, dest) {
  const entries = fs.readdirSync(src);

  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);

    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDirectoryRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
