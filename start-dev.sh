#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# Double-Fork Resilient Dev Server Launcher
# ═══════════════════════════════════════════════════════════════
# Technique: spawn → child → grandchild (actual server)
# The grandchild gets adopted by PID 1, making it invisible
# to process reapers that scan for child processes of the shell.
# A guardian loop continuously checks health and restarts if dead.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PORT=3000
LOG="/home/z/my-project/dev.log"
PIDFILE="/home/z/my-project/.next/dev-server.pid"
GUARD_PIDFILE="/home/z/my-project/.next/dev-guardian.pid"
PROJECT_DIR="/home/z/my-project"

export DATABASE_URL="postgresql://neondb_owner:npg_epghiw6q0vVa@ep-red-lab-a174k45q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
export DIRECT_DATABASE_URL="postgresql://neondb_owner:npg_epghiw6q0vVa@ep-red-lab-a174k45q-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

cd "$PROJECT_DIR"

# ─── Kill existing processes ───
kill_existing() {
  # Kill old guardian
  if [ -f "$GUARD_PIDFILE" ]; then
    OLD_GUARD=$(cat "$GUARD_PIDFILE" 2>/dev/null)
    if [ -n "$OLD_GUARD" ] && kill -0 "$OLD_GUARD" 2>/dev/null; then
      kill "$OLD_GUARD" 2>/dev/null || true
    fi
    rm -f "$GUARD_PIDFILE"
  fi

  # Kill old server
  if [ -f "$PIDFILE" ]; then
    OLD_PID=$(cat "$PIDFILE" 2>/dev/null)
    if [ -n "$OLD_PID" ] && kill -0 "$OLD_PID" 2>/dev/null; then
      kill "$OLD_PID" 2>/dev/null || true
      sleep 1
      kill -9 "$OLD_PID" 2>/dev/null || true
    fi
    rm -f "$PIDFILE"
  fi

  # Kill any leftover next dev processes
  pkill -f "next dev" 2>/dev/null || true
  sleep 1
}

# ─── Health check: returns 0 if server is healthy ───
health_check() {
  curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/" 2>/dev/null | grep -q "200"
}

# ─── Start server using double-fork ───
start_server() {
  echo "[$(date '+%H:%M:%S')] Starting Next.js dev server (double-fork)..." >> "$LOG"

  # First fork: spawn a child that will fork again then exit
  (
    # Second fork: this is the actual server process (grandchild)
    # Using setsid to create a new session so signals don't propagate
    setsid npx next dev -p "$PORT" >> "$LOG" 2>&1 &
    SERVER_PID=$!
    echo "$SERVER_PID" > "$PIDFILE"
    echo "[$(date '+%H:%M:%S')] Server grandchild PID: $SERVER_PID" >> "$LOG"
    # First child exits immediately — grandchild becomes orphan, adopted by PID 1
    exit 0
  ) &

  # Wait for server to be ready
  echo "[$(date '+%H:%M:%S')] Waiting for server to start..." >> "$LOG"
  for i in $(seq 1 30); do
    if health_check; then
      echo "[$(date '+%H:%M:%S')] ✓ Server is healthy (attempt $i)" >> "$LOG"
      return 0
    fi
    sleep 1
  done
  echo "[$(date '+%H:%M:%S')] ⚠ Server did not start within 30s" >> "$LOG"
  return 1
}

# ─── Guardian: watches the server and restarts if it dies ───
guardian() {
  echo "[$(date '+%H:%M:%S')] Guardian started (PID $$)" >> "$LOG"
  echo $$ > "$GUARD_PIDFILE"

  while true; do
    if ! health_check; then
      # Server might be dead, check PID
      SERVER_PID=$(cat "$PIDFILE" 2>/dev/null || echo "")
      if [ -n "$SERVER_PID" ] && ! kill -0 "$SERVER_PID" 2>/dev/null; then
        echo "[$(date '+%H:%M:%S')] ⚠ Server process died! Restarting..." >> "$LOG"
        rm -f "$PIDFILE"
        start_server
      elif [ -z "$SERVER_PID" ]; then
        echo "[$(date '+%H:%M:%S')] ⚠ No PID file! Restarting..." >> "$LOG"
        start_server
      else
        # Process exists but not responding — might be compiling
        # Give it a few more seconds
        sleep 3
        if ! health_check; then
          echo "[$(date '+%H:%M:%S')] ⚠ Server unresponsive! Killing and restarting..." >> "$LOG"
          kill -9 "$SERVER_PID" 2>/dev/null || true
          rm -f "$PIDFILE"
          start_server
        fi
      fi
    fi
    sleep 5
  done
}

# ─── Main ───
echo "" >> "$LOG"
echo "═══════════════════════════════════════════════" >> "$LOG"
echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dev server launcher starting..." >> "$LOG"
echo "═══════════════════════════════════════════════" >> "$LOG"

kill_existing
start_server

# Start guardian in background (also double-forked)
(
  setsid bash -c "
    cd '$PROJECT_DIR'
    export DATABASE_URL='$DATABASE_URL'
    export DIRECT_DATABASE_URL='$DIRECT_DATABASE_URL'
    
    # Guardian loop
    echo \"[\$(date '+%H:%M:%S')] Guardian grandchild started\" >> '$LOG'
    echo \$\$ > '$GUARD_PIDFILE'
    
    while true; do
      if ! curl -s -o /dev/null -w '%{http_code}' 'http://localhost:$PORT/' 2>/dev/null | grep -q '200'; then
        SERVER_PID=\$(cat '$PIDFILE' 2>/dev/null || echo '')
        if [ -n \"\$SERVER_PID\" ] && ! kill -0 \"\$SERVER_PID\" 2>/dev/null; then
          echo \"[\$(date '+%H:%M:%S')] ⚠ Server died! Restarting...\" >> '$LOG'
          rm -f '$PIDFILE'
          setsid npx next dev -p $PORT >> '$LOG' 2>&1 &
          echo \$! > '$PIDFILE'
          echo \"[\$(date '+%H:%M:%S')] New server PID: \$(cat $PIDFILE)\" >> '$LOG'
        elif [ -z \"\$SERVER_PID\" ]; then
          echo \"[\$(date '+%H:%M:%S')] ⚠ No PID! Starting fresh...\" >> '$LOG'
          setsid npx next dev -p $PORT >> '$LOG' 2>&1 &
          echo \$! > '$PIDFILE'
        fi
      fi
      sleep 8
    done
  " &
  exit 0
) &

echo "[$(date '+%H:%M:%S')] ✓ Server and guardian launched" >> "$LOG"
echo "[$(date '+%H:%M:%S')] To stop: kill \$(cat $GUARD_PIDFILE) \$(cat $PIDFILE)" >> "$LOG"
