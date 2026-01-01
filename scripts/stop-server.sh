#!/bin/bash

echo "Stopping the application..." && \
pkill -f "start-server.sh" && \
pkill -f "npm run start" && \
pkill -f "next-server"
