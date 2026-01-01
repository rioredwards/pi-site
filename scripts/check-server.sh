#!/bin/bash

ps aux | grep -E "(node|next|npm|start-server)" | grep -v grep
