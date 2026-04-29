#!/bin/bash
export DATABASE_URL="postgresql://neondb_owner:npg_epghiw6q0vVa@ep-red-lab-a174k45q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
cd /home/z/my-project
exec node node_modules/.bin/next dev -p 3000
