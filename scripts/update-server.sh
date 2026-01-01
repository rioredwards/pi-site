#!/bin/bash

echo "Changing directory to ~/pi-site..." && \
cd ~/pi-site && \
echo "Pulling the latest changes from the main branch..." && \
git pull origin main && \
echo "Installing npm dependencies..." && \
npm i && \
echo "Building the project..." && \
npm run build
