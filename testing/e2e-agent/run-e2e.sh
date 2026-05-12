#!/bin/bash
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
AGENT_DIR="$PROJECT_ROOT/testing/e2e-agent"
RESULTS_DIR="$AGENT_DIR/results"

# Clean previous results
rm -rf "$RESULTS_DIR"
mkdir -p "$RESULTS_DIR"

# Default config (override with env vars)
MAX_ITERATIONS=${MAX_ITERATIONS:-3}
BASE_URL=${BASE_URL:-"http://localhost:4200"}
AUTH_EMAIL=${AUTH_EMAIL:-"admin@gmail.com"}
AUTH_PASSWORD=${AUTH_PASSWORD:-"password123"}

# Priority and area filtering
# Usage: PRIORITY="P0,P1" AREAS="auth,catalog" ./run-e2e.sh
# Empty = run all
RUN_PRIORITIES=${PRIORITY:-'""'}
RUN_AREAS=${AREAS:-'""'}

# Build priority JSON array
if [ -z "$PRIORITY" ]; then
  PRIORITIES_JSON="[]"
else
  PRIORITIES_JSON=$(echo "$PRIORITY" | tr ',' '\n' | sed 's/^/"/' | sed 's/$/"/' | paste -sd ',' | sed 's/^/[/;s/$/]/')
fi

# Build areas JSON array
if [ -z "$AREAS" ]; then
  AREAS_JSON="[]"
else
  AREAS_JSON=$(echo "$AREAS" | tr ',' '\n' | sed 's/^/"/' | sed 's/$/"/' | paste -sd ',' | sed 's/^/[/;s/$/]/')
fi

# Write run config
cat > "$AGENT_DIR/run-config.json" << EOF
{
  "maxIterations": $MAX_ITERATIONS,
  "baseUrl": "$BASE_URL",
  "auth": {
    "email": "$AUTH_EMAIL",
    "password": "$AUTH_PASSWORD"
  },
  "playbooksDir": "testing/e2e-agent/playbooks",
  "resultsDir": "testing/e2e-agent/results",
  "screenshotOnFailure": true,
  "discoverNewTests": true,
  "priority": {
    "runPriorities": $PRIORITIES_JSON,
    "runAreas": $AREAS_JSON
  }
}
EOF

echo "========================================="
echo "  Shop App E2E Test Orchestrator"
echo "========================================="
echo ""
echo "  Base URL:        $BASE_URL"
echo "  Max iterations:  $MAX_ITERATIONS"
echo "  Auth account:    $AUTH_EMAIL"
echo "  Priority filter: ${PRIORITY:-all}"
echo "  Area filter:     ${AREAS:-all}"
echo "  Results dir:     $RESULTS_DIR"
echo ""

# Count playbooks
PB_COUNT=$(find "$AGENT_DIR/playbooks" -name "*.pb.json" | wc -l | tr -d ' ')
echo "  Playbooks found: $PB_COUNT"
echo ""

if [ "$PB_COUNT" -eq 0 ]; then
  echo "ERROR: No playbooks found in $AGENT_DIR/playbooks/"
  exit 1
fi

echo "Starting orchestrator..."
echo ""

# Launch the orchestrator agent via claude CLI
cd "$PROJECT_ROOT"
claude --agent e2e-orchestrator --print "Run the E2E testing loop. Config is at testing/e2e-agent/run-config.json. Discover playbooks, apply priority/area filters from config, run them via e2e-runner agents, analyze failures via e2e-failure-analyzer, fix cat2 bugs via e2e-fixer, and loop until all pass or max iterations reached. Write summary.json and spawn e2e-reporter for HTML report when done."

echo ""
echo "========================================="
echo "  E2E Testing Complete"
echo "========================================="
echo ""
echo "Results: $RESULTS_DIR/summary.json"
echo "Report:  $RESULTS_DIR/report.html"
echo ""

# Show summary if it exists
if [ -f "$RESULTS_DIR/summary.json" ]; then
  cat "$RESULTS_DIR/summary.json"
  echo ""
fi

# Open HTML report if it exists
if [ -f "$RESULTS_DIR/report.html" ]; then
  echo "Opening report in browser..."
  open "$RESULTS_DIR/report.html" 2>/dev/null || xdg-open "$RESULTS_DIR/report.html" 2>/dev/null || true
fi
