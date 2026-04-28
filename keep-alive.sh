#!/bin/bash
# Auto-restart dev server
cd /home/z/my-project
while true; do
  unset DATABASE_URL
  echo "[$(date)] Starting dev server..." >> dev.log
  bun run dev >> dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> dev.log
  sleep 3
done
