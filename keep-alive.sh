#!/bin/bash
# Keep-alive watchdog for Next.js dev server
cd /home/z/my-project
while true; do
  if ! ss -tlnp | grep -q ':3000'; then
    echo "[$(date)] Starting Next.js..." >> /tmp/next-watchdog.log
    npx next dev -p 3000 >> /tmp/next-out.log 2>> /tmp/next-err.log &
    sleep 12
    if ss -tlnp | grep -q ':3000'; then
      echo "[$(date)] Server started successfully" >> /tmp/next-watchdog.log
    else
      echo "[$(date)] Server failed to start, retrying..." >> /tmp/next-watchdog.log
    fi
  fi
  sleep 5
done
