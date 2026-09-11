#!/usr/bin/env bash
# b2c-cli e2e cli tests
#
# Required environment variables:
# SFCC_CLIENT_ID      - Account Manager API client ID
# SFCC_CLIENT_SECRET  - Account Manager API client secret
# SFCC_SHORTCODE      - SCAPI short code
# TEST_REALM          - Realm ID for sandbox creation (four-letter ID)
#
# Optional environment variables:
# SFCC_ACCOUNT_MANAGER_HOST - Account Manager hostname (default: account.demandware.com)
# SFCC_SANDBOX_API_HOST     - Sandbox API hostname (default: admin.dx.commercecloud.salesforce.com)

set -e
export SFCC_LOG_LEVEL="${SFCC_LOG_LEVEL:-debug}"

# Script directory for relative paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI="$SCRIPT_DIR/../../bin/run.js"

# Fixtures paths
CARTRIDGE_PATH="$SCRIPT_DIR/fixtures/cartridges"
SITE_ARCHIVE_PATH="$SCRIPT_DIR/fixtures/site_archive"

# Test configuration
SITE_ID="TestSite"
TTL_HOURS=4  # 4 hours in case test fails and needs manual cleanup
HTTP_DIAGNOSTICS_DIR=$(mktemp -d)

# Keep response bodies on stdout for callers; log status and safe tracing headers on stderr.
curl_with_diagnostics() {
    local http_status curl_exit=0
    : > "$HTTP_DIAGNOSTICS_DIR/headers"
    : > "$HTTP_DIAGNOSTICS_DIR/body"
    http_status=$(curl --silent --show-error \
        --dump-header "$HTTP_DIAGNOSTICS_DIR/headers" \
        --output "$HTTP_DIAGNOSTICS_DIR/body" \
        --write-out '%{http_code}' "$@") || curl_exit=$?

    echo "DEBUG: curl exit=$curl_exit HTTP status=$http_status" >&2
    if [ -f "$HTTP_DIAGNOSTICS_DIR/headers" ]; then
        # Allowlist diagnostic headers so Set-Cookie and other credentials stay private.
        awk 'tolower($0) ~ /^(http\/|date:|server:|content-type:|www-authenticate:|[a-z0-9-]*request-id:|[a-z0-9-]*correlation-id:|sfdc_correlation_id:|x-dw-request-base-id:|traceparent:|tracestate:|x-amzn-trace-id:)/' \
            "$HTTP_DIAGNOSTICS_DIR/headers" >&2
    fi
    if [ -f "$HTTP_DIAGNOSTICS_DIR/body" ]; then
        cat "$HTTP_DIAGNOSTICS_DIR/body"
    fi
    return "$curl_exit"
}

# Cleanup function for error handling
cleanup() {
    local exit_code=$?
    echo ""
    echo "========================================="
    echo "Cleanup (exit code: $exit_code)"
    echo "========================================="

    # Delete SLAS client if it was created
    if [ -n "$SLAS_CLIENT_ID" ] && [ -n "$TENANT_ID" ]; then
        echo "Deleting SLAS client: $SLAS_CLIENT_ID"
        $CLI slas client delete "$SLAS_CLIENT_ID" --tenant-id "$TENANT_ID" || true
    fi

    # Delete sandbox if it was created
    if [ -n "$ODS_ID" ]; then
        echo "Deleting sandbox: $ODS_ID"
        $CLI ods delete "$ODS_ID" --force || true
    fi

    rm -rf "$HTTP_DIAGNOSTICS_DIR"
    exit $exit_code
}

# Set up cleanup trap
trap cleanup EXIT

echo "========================================="
echo "B2C CLI E2E Test Suite"
echo "========================================="
echo "Realm: $TEST_REALM"
echo "Short Code: $SFCC_SHORTCODE"
echo ""

################################################################################
# 1. Create On-Demand Sandbox
################################################################################
echo "Step 1: Creating on-demand sandbox..."

ODS_CREATE_RESULT=$($CLI ods create \
    --realm "$TEST_REALM" \
    --ttl "$TTL_HOURS" \
    --wait \
    --json)

echo "DEBUG: ODS create result:"
echo "$ODS_CREATE_RESULT" | jq .

# The JSON output is the sandbox object directly (not an array)
ODS_ID=$(echo "$ODS_CREATE_RESULT" | jq -r '.id')
SERVER=$(echo "$ODS_CREATE_RESULT" | jq -r '.hostName')
INSTANCE_NUM=$(echo "$ODS_CREATE_RESULT" | jq -r '.instance')

if [ -z "$ODS_ID" ] || [ "$ODS_ID" == "null" ]; then
    echo "FAILED: Could not create on-demand sandbox"
    exit 1
fi

echo "SUCCESS: Created sandbox"
echo "  ID: $ODS_ID"
echo "  Server: $SERVER"
echo "  Instance: $INSTANCE_NUM"
echo ""

################################################################################
# 2. List and Verify Sandbox
################################################################################
echo "Step 2: Verifying sandbox in list..."

ODS_LIST_RESULT=$($CLI ods list --realm "$TEST_REALM" --json)

echo "DEBUG: ODS list result:"
echo "$ODS_LIST_RESULT" | jq .

# The JSON output is { count: number, data: SandboxModel[] }
ODS_PRESENT=$(echo "$ODS_LIST_RESULT" | jq -r --arg ODS_ID "$ODS_ID" '.data[] | select(.id == $ODS_ID) | .id')

if [ "$ODS_PRESENT" != "$ODS_ID" ]; then
    echo "FAILED: Created sandbox not found in list"
    exit 1
fi

echo "SUCCESS: Sandbox verified in list"
echo ""

################################################################################
# 3. Deploy Code
################################################################################
echo "Step 3: Deploying code to sandbox..."

$CLI code deploy "$CARTRIDGE_PATH" \
    --server "$SERVER" \
    --code-version "e2e-test-version" --json

echo "SUCCESS: Code deployed"
echo ""

################################################################################
# 4. Import Site Data
################################################################################
echo "Step 4: Importing site data..."

$CLI job import "$SITE_ARCHIVE_PATH" \
    --server "$SERVER" \
    --timeout 300

echo "SUCCESS: Site data imported"
echo ""

################################################################################
# 5. Run Search Index Job
################################################################################
sleep 4
echo "Step 5: Running search index job..."

$CLI job run sfcc-search-index-product-full-update \
    --server "$SERVER" \
    --wait \
    --timeout 300 \
    --body "{\"site_scope\":[\"$SITE_ID\"]}"

echo "SUCCESS: Search index job completed"
echo ""

################################################################################
# 6. Create SLAS Client
################################################################################
echo "Step 6: Creating SLAS client..."

# Construct tenant ID from realm and instance number
TENANT_ID="${TEST_REALM}_${INSTANCE_NUM}"

# Let the CLI auto-generate a UUID4 client ID
SLAS_CREATE_RESULT=$($CLI slas client create \
    --tenant-id "$TENANT_ID" \
    --channels "$SITE_ID" \
    --default-scopes \
    --redirect-uri "http://localhost:3000/callback" \
    --json)

echo "DEBUG: SLAS create result:"
echo "$SLAS_CREATE_RESULT" | jq 'del(.secret)'

# Extract client ID and secret from response
SLAS_CLIENT_ID=$(echo "$SLAS_CREATE_RESULT" | jq -r '.clientId')
SLAS_SECRET=$(echo "$SLAS_CREATE_RESULT" | jq -r '.secret')

if [ -z "$SLAS_SECRET" ] || [ "$SLAS_SECRET" == "null" ]; then
    echo "FAILED: Could not create SLAS client"
    echo "$SLAS_CREATE_RESULT" | jq 'del(.secret)'
    exit 1
fi

echo "SUCCESS: SLAS client created"
echo "  Client ID: $SLAS_CLIENT_ID"
echo "  Tenant ID: $TENANT_ID"
echo ""

################################################################################
# 7. Test SLAS Guest Login
################################################################################
echo "Step 7: Testing SLAS guest login..."

# Wait a moment for SLAS client to be ready and search index to be available
sleep 10

# Organization ID format for SLAS
ORG_ID="f_ecom_${TEST_REALM}_${INSTANCE_NUM}"
SLAS_BASE="https://${SFCC_SHORTCODE}.api.commercecloud.salesforce.com"

echo "  ORG ID: $ORG_ID"
echo "  SLAS Base: $SLAS_BASE"

# Exercise the CLI's private-client guest flow; keep the secret out of process arguments.
if ! TOKEN_RESPONSE=$(SFCC_SLAS_CLIENT_SECRET="$SLAS_SECRET" "$CLI" slas token \
    --slas-client-id "$SLAS_CLIENT_ID" \
    --tenant-id "$TENANT_ID" \
    --short-code "$SFCC_SHORTCODE" \
    --site-id "$SITE_ID" \
    --json); then
    echo "FAILED: Could not obtain shopper token"
    exit 1
fi

if ! SHOPPER_TOKEN=$(echo "$TOKEN_RESPONSE" | jq -er \
    --arg clientId "$SLAS_CLIENT_ID" --arg siteId "$SITE_ID" \
    'select(.isGuest == true and .clientId == $clientId and .siteId == $siteId)
     | .response.accessToken | select(type == "string" and length > 0)'); then
    echo "FAILED: SLAS token command did not return a guest token for the requested client and site"
    exit 1
fi

echo "SUCCESS: Obtained shopper access token"
echo ""

################################################################################
# 8. Test Shopper Search
################################################################################
echo "Step 8: Testing shopper product search..."

# Extra curl headers apply only to this direct shopper-search request.
CURL_HEADER_ARGS=()
if [ -n "$CURL_EXTRA_HEADERS" ]; then
    while IFS= read -r header; do
        [ -n "$header" ] && CURL_HEADER_ARGS+=(-H "$header")
    done <<< "$CURL_EXTRA_HEADERS"
fi

SEARCH_RESPONSE=$(curl_with_diagnostics "${SLAS_BASE}/search/shopper-search/v1/organizations/${ORG_ID}/product-search?siteId=${SITE_ID}&limit=5&q=sample" \
    "${CURL_HEADER_ARGS[@]}" \
    -H "Authorization: Bearer ${SHOPPER_TOKEN}")

# Require the current Shopper Search response shape; zero results are valid.
if ! SEARCH_TOTAL=$(echo "$SEARCH_RESPONSE" | jq -er '.total | select(type == "number" and . >= 0)'); then
    echo "FAILED: Search returned unexpected response format"
    echo "$SEARCH_RESPONSE" | jq
    exit 1
else
    echo "SUCCESS: Shopper search returned results"
    echo "  Total results: $SEARCH_TOTAL"
fi
echo ""

################################################################################
# 9. Delete SLAS Client
################################################################################
echo "Step 9: Deleting SLAS client..."

$CLI slas client delete "$SLAS_CLIENT_ID" --tenant-id "$TENANT_ID"

# Clear SLAS_CLIENT_ID so cleanup doesn't try to delete again
SLAS_CLIENT_ID=""

echo "SUCCESS: SLAS client deleted"
echo ""

################################################################################
# 10. Delete Sandbox
################################################################################
echo "Step 10: Deleting sandbox..."

$CLI ods delete "$ODS_ID" --force

# Clear ODS_ID so cleanup doesn't try to delete again
ODS_ID=""

echo "SUCCESS: Sandbox deleted"
echo ""

################################################################################
# Complete
################################################################################
echo "========================================="
echo "All E2E tests passed!"
echo "========================================="
