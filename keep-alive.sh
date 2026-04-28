#!/bin/bash
while true; do
  cd /home/z/my-project
  if ! curl -s -o /dev/null http://localhost:3000/ 2>/dev/null; then
    nohup bun run dev > /home/z/my-project/dev.log 2>&1 &
  fi
  sleep 10
done
