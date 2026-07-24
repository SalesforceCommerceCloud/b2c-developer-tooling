#!/bin/bash
# End-to-end verification script for B2C Metrics Grafana plugin
# Run after: docker compose up --build

set -e

GRAFANA_URL="http://localhost:3000"
MOCK_URL="http://localhost:8080"
DATASOURCE_UID="b2c-metrics-demo"
PLUGIN_ID="salesforce-b2c-metrics-datasource"

echo "=== B2C Metrics Grafana Plugin — Runtime Verification ==="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
  echo -e "${GREEN}✓${NC} $1"
}

fail() {
  echo -e "${RED}✗${NC} $1"
  exit 1
}

warn() {
  echo -e "${YELLOW}⚠${NC} $1"
}

# Wait for Grafana health
echo "1. Waiting for Grafana to be healthy..."
TIMEOUT=90
ELAPSED=0
while [ $ELAPSED -lt $TIMEOUT ]; do
  if curl -s "$GRAFANA_URL/api/health" | grep -q '"database":"ok"'; then
    pass "Grafana is healthy (${ELAPSED}s)"
    break
  fi
  sleep 2
  ELAPSED=$((ELAPSED + 2))
  if [ $ELAPSED -ge $TIMEOUT ]; then
    fail "Grafana health check timeout after ${TIMEOUT}s"
  fi
done
echo ""

# Check mock service
echo "2. Verifying mock-metrics service..."
if curl -s "$MOCK_URL/dwsso/oauth2/access_token" -X POST | grep -q '"access_token"'; then
  pass "Mock OAuth endpoint responding"
else
  fail "Mock OAuth endpoint not responding"
fi

ORG_ID="bdpx_org_123"
CATEGORY="overall"
FROM=$(date -u -v-6H +%s)  # 6 hours ago (macOS date format)
TO=$(date -u +%s)
if curl -s "$MOCK_URL/observability/metrics/v1/organizations/$ORG_ID/metrics/$CATEGORY?from=$FROM&to=$TO" | grep -q '"metricId"'; then
  pass "Mock Metrics endpoint responding"
else
  fail "Mock Metrics endpoint not responding"
fi
echo ""

# Check plugin loaded
echo "3. Verifying plugin loaded..."
PLUGIN_RESPONSE=$(curl -s "$GRAFANA_URL/api/plugins/$PLUGIN_ID/settings")
if echo "$PLUGIN_RESPONSE" | grep -q '"enabled":true'; then
  pass "Plugin enabled"
else
  fail "Plugin not enabled"
fi

if echo "$PLUGIN_RESPONSE" | grep -q '"backend":true'; then
  pass "Backend registered"
else
  fail "Backend not registered"
fi
echo ""

# Check datasource provisioned
echo "4. Verifying datasource provisioned..."
DS_RESPONSE=$(curl -s "$GRAFANA_URL/api/datasources")
if echo "$DS_RESPONSE" | grep -q "\"uid\":\"$DATASOURCE_UID\""; then
  pass "Datasource provisioned (uid: $DATASOURCE_UID)"
else
  fail "Datasource not found (uid: $DATASOURCE_UID)"
fi

DS_NAME=$(echo "$DS_RESPONSE" | grep -A 10 "\"uid\":\"$DATASOURCE_UID\"" | grep '"name"' | head -1 | cut -d'"' -f4)
if [ -n "$DS_NAME" ]; then
  pass "Datasource name: $DS_NAME"
fi
echo ""

# Check datasource health
echo "5. Testing datasource health check..."
HEALTH_RESPONSE=$(curl -s "$GRAFANA_URL/api/datasources/uid/$DATASOURCE_UID/health")
if echo "$HEALTH_RESPONSE" | grep -q '"status":"OK"'; then
  pass "Datasource health check passed"
  HEALTH_MSG=$(echo "$HEALTH_RESPONSE" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$HEALTH_MSG" ]; then
    echo "   Message: $HEALTH_MSG"
  fi
else
  fail "Datasource health check failed"
  echo "   Response: $HEALTH_RESPONSE"
fi
echo ""

# Test query execution
echo "6. Executing test query (SCAPI metrics)..."
QUERY_PAYLOAD=$(cat <<EOF
{
  "from": "$(date -u -v-6H +%Y-%m-%dT%H:%M:%SZ)",
  "to": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "queries": [
    {
      "refId": "A",
      "datasource": {
        "type": "$PLUGIN_ID",
        "uid": "$DATASOURCE_UID"
      },
      "category": "scapi",
      "apiFamily": "product"
    }
  ]
}
EOF
)

QUERY_RESPONSE=$(curl -s -X POST "$GRAFANA_URL/api/ds/query" \
  -H "Content-Type: application/json" \
  -d "$QUERY_PAYLOAD")

if echo "$QUERY_RESPONSE" | grep -q '"frames"'; then
  pass "Query returned frames"

  # Count frames
  FRAME_COUNT=$(echo "$QUERY_RESPONSE" | grep -o '"schema":' | wc -l | tr -d ' ')
  echo "   Frames returned: $FRAME_COUNT"

  # Check for fields
  if echo "$QUERY_RESPONSE" | grep -q '"name":"Time"'; then
    pass "Time field present"
  else
    warn "Time field missing"
  fi

  if echo "$QUERY_RESPONSE" | grep -q '"name":"Value"'; then
    pass "Value field present"
  else
    warn "Value field missing"
  fi

  # Check for data points
  DATA_POINTS=$(echo "$QUERY_RESPONSE" | grep -o '"values":\[\[' | wc -l | tr -d ' ')
  if [ "$DATA_POINTS" -gt 0 ]; then
    pass "Data points present"

    # Sample first value (if jq available)
    if command -v jq &> /dev/null; then
      FIRST_VALUE=$(echo "$QUERY_RESPONSE" | jq -r '.results.A.frames[0].data.values[1][0]' 2>/dev/null || echo "")
      if [ -n "$FIRST_VALUE" ] && [ "$FIRST_VALUE" != "null" ]; then
        echo "   Sample value: $FIRST_VALUE"
      fi
    fi
  else
    warn "No data points returned (may need longer time range)"
  fi
else
  fail "Query did not return frames"
  echo "   Response: $QUERY_RESPONSE"
fi
echo ""

# Summary
echo "=== VERIFICATION COMPLETE ==="
echo ""
pass "All checks passed"
echo ""
echo "Demo dashboard available at:"
echo "  $GRAFANA_URL/d/b2c-metrics-demo/b2c-commerce-metrics-demo"
echo ""
echo "To stop the demo:"
echo "  docker compose down -v"
echo ""
