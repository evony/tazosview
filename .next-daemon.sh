#!/bin/bash
cd /home/z/my-project
while true; do
  echo "[$(date)] Starting Next.js dev server..." >> /tmp/next-daemon.log
  npx next dev -p 3000 --turbopack 2>&1 >> /tmp/next-daemon.log
  EXIT_CODE=$?
  echo "[$(date)] Server exited with code $EXIT_CODE, restarting in 3s..." >> /tmp/next-daemon.log
  sleep 3
done
