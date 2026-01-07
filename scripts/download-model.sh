#!/usr/bin/env zsh
# Download NSFWJS model files locally
# Run this once: zsh scripts/download-model.sh


### DIDN"T WORK>>>> JUST USE THE INSTRUCTIONS HERE: https://github.com/infinitered/nsfwjs?tab=readme-ov-file#host-your-own-model


set -e

# Get the absolute path to the project root (where package.json is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
MODEL_DIR="${PROJECT_DIR}/public/models/nsfwjs"

echo "📥 Downloading NSFWJS model files..."
echo "Project directory: ${PROJECT_DIR}"
echo "Model directory: ${MODEL_DIR}"
echo ""

# Create model directory
mkdir -p "${MODEL_DIR}"

# Download model files from nsfwjs CDN
# The model consists of model.json and shard files
cd "${MODEL_DIR}" || {
  echo "❌ Failed to change to model directory: ${MODEL_DIR}"
  exit 1
}

echo "Downloading model.json..."
curl -L -o model.json "https://nsfwjs.com/model/model.json" || {
  echo "❌ Failed to download model.json"
  exit 1
}

# Extract shard file names from model.json
SHARD_FILES=$(node -e "
  const fs = require('fs');
  const model = JSON.parse(fs.readFileSync('model.json', 'utf8'));
  const weights = model.weightsManifest[0].paths || [];
  weights.forEach(f => console.log(f));
" 2>/dev/null || echo "group1-shard1of1.bin")

echo "Downloading shard files..."
for shard in $SHARD_FILES; do
  echo "  Downloading $shard..."
  curl -L -o "$shard" "https://nsfwjs.com/model/$shard" || {
    echo "❌ Failed to download $shard"
    exit 1
  }
done

echo ""
echo "✅ Model files downloaded to ${MODEL_DIR}"
echo ""
echo "Model files:"
ls -lh "${MODEL_DIR}"

