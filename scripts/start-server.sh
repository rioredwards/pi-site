#!/bin/bash

echo "Changing directory to ~/pi-site..." && \
cd ~/pi-site && \
echo "Starting the application..." && \
echo "To stop the process: run the ~/stop-server.sh script" && \
nohup npm run start &
