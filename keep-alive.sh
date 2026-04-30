#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_epghiw6q0vVa@ep-red-lab-a174k45q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
cd /home/z/my-project
while true; do
  node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  echo "Server crashed, restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
